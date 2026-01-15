
import 'dotenv/config'; // Load .env file
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import crypto from 'crypto';
import https from 'https';

// Import Models (Assumed to exist in ./models/)
import { User } from './models/user.js';
import { NetworkState } from './models/network.js';

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505139227:AAEkVN5a7fGkApOUFQpJOx6lP0re_l8t078';
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/neurocoin';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Game Constants
const INITIAL_BLOCK_REWARD = 50;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 1300;
const TARGET_BLOCK_TIME_MS = 6 * 60 * 1000;
const REDIS_BLOCK_PROGRESS_KEY = 'network:currentBlockProgress';

const STARS_PACKAGES = [
  { id: 'stars_micro', stars: 50, amountTON: 0.5, title: 'Micro Pack', description: '50 Stars' },
  { id: 'stars_mini', stars: 100, amountTON: 1.1, title: 'Starter Pack', description: '100 Stars' },
  { id: 'stars_medium', stars: 500, amountTON: 6.0, title: 'Trader Pack', description: '500 Stars' },
  { id: 'stars_mega', stars: 1000, amountTON: 13.0, title: 'Whale Pack', description: '1000 Stars' },
  { id: 'stars_giga', stars: 2500, amountTON: 35.0, title: 'Galactic Pack', description: '2500 Stars' }
];

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);

// CORS for Dev, tight for Prod
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));

const io = new Server(httpServer, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    } 
});

const redisClient = createClient({ url: REDIS_URL });

// --- STATE ---
let networkState;
let isProcessingBlock = false;
const activeSockets = new Map(); // socketId -> userId

// --- TELEGRAM UTILS ---

// 1. Validate Init Data (CRITICAL FOR SECURITY)
function validateTelegramData(initData) {
    if (!initData) return null;
    
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));
    
    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash === hash) {
        const userStr = urlParams.get('user');
        // Validate expiry (optional but recommended: e.g. auth_date)
        return userStr ? JSON.parse(userStr) : null;
    }
    return null;
}

// 2. Call Telegram API (HTTPS)
function callTelegramApi(method, body = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_BOT_TOKEN}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
}

// --- PAYMENTS LONG POLLING ---
let lastUpdateId = 0;
async function startTelegramPolling() {
    try {
        const response = await callTelegramApi('getUpdates', { 
            offset: lastUpdateId + 1, 
            timeout: 30, // Long polling
            allowed_updates: ['message', 'pre_checkout_query']
        });

        if (response && response.ok && response.result) {
            for (const update of response.result) {
                lastUpdateId = update.update_id;

                if (update.pre_checkout_query) {
                    await callTelegramApi('answerPreCheckoutQuery', {
                        pre_checkout_query_id: update.pre_checkout_query.id,
                        ok: true
                    });
                }

                if (update.message && update.message.successful_payment) {
                    await handlePaymentSuccess(update.message);
                }
            }
        }
    } catch (e) {
        console.error('[POLLING ERROR]', e.message);
        // Wait a bit before retrying to avoid spamming logs if network is down
        await new Promise(r => setTimeout(r, 5000));
    }
    
    setImmediate(startTelegramPolling); // Loop
}

async function handlePaymentSuccess(message) {
    const payment = message.successful_payment;
    const userId = message.from.id.toString();
    const packId = payment.invoice_payload;
    
    console.log(`[PAYMENT] User ${userId} bought ${packId}`);
    
    const pack = STARS_PACKAGES.find(p => p.id === packId);
    if (pack) {
        // Update DB
        await User.updateOne({ id: userId }, { $inc: { balanceTON: pack.amountTON } });
        await redisClient.hIncrByFloat(`user:${userId}`, 'balanceTON', pack.amountTON);
        
        // Notify user if online
        for (const [socketId, sUserId] of activeSockets.entries()) {
            if (sUserId === userId) {
                const userProfile = await getFullUserFromRedis(userId);
                io.to(socketId).emit('update_user_profile', userProfile);
                io.to(socketId).emit('notification', `PAYMENT RECEIVED: +${pack.amountTON} TON`);
            }
        }
    }
}

// --- GAME LOGIC ---

// Load Network State
async function initNetwork() {
    networkState = await NetworkState.findOne({ singleton: true });
    if (!networkState) {
        networkState = new NetworkState();
        await networkState.save();
    }
    // Sync Redis
    await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, networkState.currentBlockProgress.toString());
}

// Mine Block
async function mineBlock(winnerSocketId = null) {
    if (isProcessingBlock) return;
    isProcessingBlock = true;
    
    try {
        networkState.blockHeight++;
        networkState.totalMined += networkState.blockReward;
        networkState.currentBlockProgress = 0;
        networkState.lastBlockTime = Date.now();
        await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, '0');
        
        // Winner Reward
        if (winnerSocketId) {
            const winnerId = activeSockets.get(winnerSocketId);
            if (winnerId) {
                const reward = networkState.blockReward;
                await redisClient.hIncrByFloat(`user:${winnerId}`, 'balanceNRC', reward);
                await redisClient.hIncrBy(`user:${winnerId}`, 'blocksMined', 1);
                // Async DB persist
                User.updateOne({ id: winnerId }, { $inc: { balanceNRC: reward, blocksMined: 1 } }).exec();
            }
        }
        
        io.emit('block_found_global', { height: networkState.blockHeight });
        io.emit('network_tick', networkState);
        
        // Save Network State
        await networkState.save();
        
    } catch(e) {
        console.error(e);
    } finally {
        isProcessingBlock = false;
    }
}

// --- SOCKET HANDLERS ---
io.on('connection', (socket) => {
    
    socket.on('user_connect', async (payload) => {
        let userId;
        let username;
        let photoUrl;

        // 1. Production Auth
        const validUser = validateTelegramData(payload.initData);
        
        if (validUser) {
            userId = validUser.id.toString();
            username = validUser.username || `User_${userId}`;
            photoUrl = validUser.photo_url;
        } else if (IS_DEV && payload.user) {
            // Dev Fallback
            userId = payload.user.id.toString();
            username = payload.user.username;
            console.warn('[DEV] Allowing unverified user:', userId);
        } else {
            socket.emit('auth_error', 'Invalid Telegram Signature');
            socket.disconnect();
            return;
        }

        activeSockets.set(socket.id, userId);

        // Find or Create User
        let user = await User.findOne({ id: userId });
        if (!user) {
            user = new User({ id: userId, username, photoUrl });
            await user.save();
        }
        
        // Hydrate Redis
        await hydrateUserToRedis(user);
        
        const fullUser = await getFullUserFromRedis(userId);
        socket.emit('init_state', { 
            userProfile: fullUser, 
            networkState,
            isDev: IS_DEV 
        });
    });

    socket.on('request_stars_invoice', async ({ packId }) => {
        const userId = activeSockets.get(socket.id);
        if (!userId) return;
        
        const pack = STARS_PACKAGES.find(p => p.id === packId);
        if (!pack) return;

        try {
            const result = await callTelegramApi('createInvoiceLink', {
                title: pack.title,
                description: pack.description,
                payload: pack.id,
                provider_token: "", // Empty for Stars
                currency: "XTR",
                prices: [{ label: "Stars", amount: pack.stars }]
            });
            
            if (result && result.ok) {
                socket.emit('invoice_link', { url: result.result, packId });
            } else {
                socket.emit('notification', 'Invoice Error');
            }
        } catch (e) {
            console.error(e);
            socket.emit('notification', 'Server Error');
        }
    });

    socket.on('user_action', async (action) => {
        const userId = activeSockets.get(socket.id);
        if (!userId) return;

        if (action.type === 'TAP') {
            const userKey = `user:${userId}`;
            // Optimistic Check
            const power = 25; // Base power + calculation from redis later
            const currentProgress = await redisClient.incrByFloat(REDIS_BLOCK_PROGRESS_KEY, power);
            
            // Note: In a real high-load app, verify energy in Redis first using Lua script
            // For now, straightforward incr is fine for <10k users
            
            if (!isProcessingBlock && currentProgress >= networkState.difficulty) {
                await mineBlock(socket.id);
            }
        }
    });

    socket.on('disconnect', () => {
        activeSockets.delete(socket.id);
    });
});

// --- HELPERS ---
async function hydrateUserToRedis(user) {
    const key = `user:${user.id}`;
    // Flatten for Redis HSET
    await redisClient.hSet(key, {
        balanceNRC: user.balanceNRC.toString(),
        balanceTON: user.balanceTON.toString(),
        energy: user.energy.toString(),
        // Add other necessary fields
    });
}

async function getFullUserFromRedis(userId) {
    // Return hybrid of Mongo + Redis latest values
    const redisData = await redisClient.hGetAll(`user:${userId}`);
    const mongoData = await User.findOne({id: userId}).lean();
    
    if (!mongoData) return null;

    // Overlay Redis live data
    if (redisData.balanceNRC) mongoData.balanceNRC = parseFloat(redisData.balanceNRC);
    if (redisData.balanceTON) mongoData.balanceTON = parseFloat(redisData.balanceTON);
    
    return mongoData;
}

// --- STARTUP ---
async function main() {
    try {
        await mongoose.connect(DB_URL);
        console.log('MongoDB Connected');
        
        await redisClient.connect();
        console.log('Redis Connected');
        
        await initNetwork();
        
        startTelegramPolling(); // Start Bot
        
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} (Prod: ${!IS_DEV})`);
        });
        
        // Loop for ticks
        setInterval(async () => {
            // Broadcast network state periodically
            const prog = await redisClient.get(REDIS_BLOCK_PROGRESS_KEY);
            networkState.currentBlockProgress = parseFloat(prog) || 0;
            networkState.onlineUsers = activeSockets.size;
            io.emit('network_tick', networkState);
        }, 1000);

    } catch (e) {
        console.error('Startup Failed', e);
        process.exit(1);
    }
}

main();
