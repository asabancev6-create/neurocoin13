
import 'dotenv/config'; 
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

// Import Models
import { User } from './models/user.js';
import { NetworkState } from './models/network.js';

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505139227:AAEkVN5a7fGkApOUFQpJOx6lP0re_l8t078';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://t.me/neurocoin_bot/app'; // Fallback to bot link if domain not set
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/neurocoin';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Game Constants
const INITIAL_BLOCK_REWARD = 50;
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

// CORS & Security Headers
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Serve Static Files (Production Build)
app.use(express.static(path.join(__dirname, 'dist')));

const io = new Server(httpServer, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    } 
});

const redisClient = createClient({ url: REDIS_URL });

// --- TELEGRAM API HELPERS ---

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

function validateTelegramData(initData) {
    if (!initData) return null;
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;
    urlParams.delete('hash');
    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash === hash) {
        const userStr = urlParams.get('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    return null;
}

// --- BOT LOGIC ---

async function sendWelcomeMessage(chatId, firstName) {
    const welcomeText = `
👋 *Welcome to NeuroCoin, ${firstName}!*

The era of Quantum Mining has begun.
💎 Mine **NRC** tokens.
⚡ Upgrade your neural rig.
🌌 Compete in the global leaderboard.

*System Status:* 🟢 ONLINE
*Current Difficulty:* NORMAL

👇 *Tap below to start mining:*
    `;

    await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🚀 LAUNCH NEURO MINER", web_app: { url: WEBAPP_URL } }
                ],
                [
                    { text: "👥 Join Community", url: "https://t.me/neurocoin_community" }
                ]
            ]
        }
    });
}

// --- LONG POLLING ---
let lastUpdateId = 0;
async function startTelegramPolling() {
    try {
        const response = await callTelegramApi('getUpdates', { 
            offset: lastUpdateId + 1, 
            timeout: 30, 
            allowed_updates: ['message', 'pre_checkout_query']
        });

        if (response && response.ok && response.result) {
            for (const update of response.result) {
                lastUpdateId = update.update_id;

                // 1. Handle Messages (Commands)
                if (update.message && update.message.text) {
                    const text = update.message.text;
                    const chatId = update.message.chat.id;
                    
                    if (text.startsWith('/start')) {
                        // Check for referral logic here (e.g., /start ref123)
                        // const refCode = text.split(' ')[1];
                        await sendWelcomeMessage(chatId, update.message.from.first_name || 'Miner');
                    }
                }

                // 2. Handle Payments
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
        if (e.code !== 'ECONNRESET') {
             console.error('[POLLING ERROR]', e.message);
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    setImmediate(startTelegramPolling);
}

async function handlePaymentSuccess(message) {
    const payment = message.successful_payment;
    const userId = message.from.id.toString();
    const packId = payment.invoice_payload;
    
    console.log(`[PAYMENT] User ${userId} bought ${packId}`);
    
    const pack = STARS_PACKAGES.find(p => p.id === packId);
    if (pack) {
        await User.updateOne({ id: userId }, { $inc: { balanceTON: pack.amountTON } });
        await redisClient.hIncrByFloat(`user:${userId}`, 'balanceTON', pack.amountTON);
        
        for (const [socketId, sUserId] of activeSockets.entries()) {
            if (sUserId === userId) {
                const userProfile = await getFullUserFromRedis(userId);
                io.to(socketId).emit('update_user_profile', userProfile);
                io.to(socketId).emit('notification', `PAYMENT RECEIVED: +${pack.amountTON} TON`);
            }
        }
    }
}

// --- STATE MANAGEMENT ---
let networkState;
let isProcessingBlock = false;
const activeSockets = new Map();

async function initNetwork() {
    networkState = await NetworkState.findOne({ singleton: true });
    if (!networkState) {
        networkState = new NetworkState();
        await networkState.save();
    }
    await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, networkState.currentBlockProgress.toString());
}

async function mineBlock(winnerSocketId = null) {
    if (isProcessingBlock) return;
    isProcessingBlock = true;
    try {
        networkState.blockHeight++;
        networkState.totalMined += networkState.blockReward;
        networkState.currentBlockProgress = 0;
        networkState.lastBlockTime = Date.now();
        await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, '0');
        
        if (winnerSocketId) {
            const winnerId = activeSockets.get(winnerSocketId);
            if (winnerId) {
                const reward = networkState.blockReward;
                await redisClient.hIncrByFloat(`user:${winnerId}`, 'balanceNRC', reward);
                await redisClient.hIncrBy(`user:${winnerId}`, 'blocksMined', 1);
                User.updateOne({ id: winnerId }, { $inc: { balanceNRC: reward, blocksMined: 1 } }).exec();
            }
        }
        io.emit('block_found_global', { height: networkState.blockHeight });
        io.emit('network_tick', networkState);
        await networkState.save();
    } catch(e) { console.error(e); } 
    finally { isProcessingBlock = false; }
}

// --- SOCKET IO ---
io.on('connection', (socket) => {
    socket.on('user_connect', async (payload) => {
        let userId;
        let username;
        let photoUrl;

        const validUser = validateTelegramData(payload.initData);
        if (validUser) {
            userId = validUser.id.toString();
            username = validUser.username || `User_${userId}`;
            photoUrl = validUser.photo_url;
        } else if (IS_DEV && payload.user) {
            userId = payload.user.id.toString();
            username = payload.user.username;
        } else {
            socket.emit('auth_error', 'Signature Verification Failed');
            socket.disconnect();
            return;
        }

        activeSockets.set(socket.id, userId);

        let user = await User.findOne({ id: userId });
        if (!user) {
            user = new User({ id: userId, username, photoUrl });
            await user.save();
        }
        await hydrateUserToRedis(user);
        
        const fullUser = await getFullUserFromRedis(userId);
        socket.emit('init_state', { userProfile: fullUser, networkState, isDev: IS_DEV });
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
                provider_token: "",
                currency: "XTR",
                prices: [{ label: "Stars", amount: pack.stars }]
            });
            if (result && result.ok) socket.emit('invoice_link', { url: result.result, packId });
        } catch (e) { console.error(e); }
    });

    socket.on('user_action', async (action) => {
        const userId = activeSockets.get(socket.id);
        if (!userId) return;
        if (action.type === 'TAP') {
            const currentProgress = await redisClient.incrByFloat(REDIS_BLOCK_PROGRESS_KEY, 25);
            if (!isProcessingBlock && currentProgress >= networkState.difficulty) await mineBlock(socket.id);
        }
    });

    socket.on('disconnect', () => { activeSockets.delete(socket.id); });
});

async function hydrateUserToRedis(user) {
    const key = `user:${user.id}`;
    await redisClient.hSet(key, {
        balanceNRC: user.balanceNRC.toString(),
        balanceTON: user.balanceTON.toString(),
        energy: user.energy.toString(),
    });
}

async function getFullUserFromRedis(userId) {
    const redisData = await redisClient.hGetAll(`user:${userId}`);
    const mongoData = await User.findOne({id: userId}).lean();
    if (!mongoData) return null;
    if (redisData.balanceNRC) mongoData.balanceNRC = parseFloat(redisData.balanceNRC);
    if (redisData.balanceTON) mongoData.balanceTON = parseFloat(redisData.balanceTON);
    return mongoData;
}

// --- INIT ---
async function main() {
    try {
        await mongoose.connect(DB_URL);
        console.log('✅ MongoDB Connected');
        await redisClient.connect();
        console.log('✅ Redis Connected');
        await initNetwork();
        
        // Start Bot Polling
        startTelegramPolling();
        console.log('🤖 Telegram Bot Started (Polling Mode)');
        
        // Handle SPA Routing (Always return index.html for unknown routes)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });

        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 NEUROCOIN SERVER ONLINE port ${PORT}`);
        });

        // Network Tick Loop
        setInterval(async () => {
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
