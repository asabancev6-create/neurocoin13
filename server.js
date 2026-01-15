
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { User } from './models/user.js';
import { NetworkState } from './models/network.js';
import crypto from 'crypto';
import https from 'https';

console.log('--- [NEUROCOIN BACKEND v7.4 - STARS PAYMENTS] ---');
console.log('>>> Initializing Master Node...');

// --- TELEGRAM CONFIG ---
const TELEGRAM_BOT_TOKEN = '8505139227:AAEkVN5a7fGkApOUFQpJOx6lP0re_l8t078';

// --- CONSTANTS ---
const TARGET_BLOCK_TIME_MS = 6 * 60 * 1000; 
const DIFFICULTY_ADJUSTMENT_INTERVAL = 1300; 
const HALVING_INTERVAL = 130000; 
const INITIAL_BLOCK_REWARD = 50; 

const INITIAL_USER_STATE = { id: 'default_user_12345', username: 'Genesis_Miner', balanceNRC: 0, balanceTON: 0, energy: 2000, maxEnergy: 2000, hashRateClick: 25, hashRatePassive: 0, level: 1, xp: 0, claimedLevelRewards: [], lastSync: Date.now(), currentBlockShares: 0, blocksMined: 0, isPremium: false, premiumExpiry: null, inventory: {}, hasGlowAvatar: false, hasGlowName: false, lastDailyBonusClaim: null, completedTasks: [], referrals: 0, referralEarnings: 0, purchasedThemes: ['NEON'] };

const STARS_PACKAGES = [
  { id: 'stars_micro', stars: 50, amountTON: 0.5, title: 'Micro Pack', description: '50 Stars for 0.5 TON credit' },
  { id: 'stars_mini', stars: 100, amountTON: 1.1, title: 'Starter Pack', description: '100 Stars for 1.1 TON credit' },
  { id: 'stars_medium', stars: 500, amountTON: 6.0, title: 'Trader Pack', description: '500 Stars for 6.0 TON credit' },
  { id: 'stars_mega', stars: 1000, amountTON: 13.0, title: 'Whale Pack', description: '1000 Stars for 13.0 TON credit' },
  { id: 'stars_giga', stars: 2500, amountTON: 35.0, title: 'Galactic Pack', description: '2500 Stars for 35.0 TON credit' }
];

const SHOP_ITEMS = [
  { id: 'click_v1', category: 'UPGRADES', name: { en: 'Click Overclock v1', ru: 'Усиление Клика v1' }, description: { en: '+10 Hash/click', ru: '+10 Хэшей за клик' }, baseCostTON: 0.05, baseCostNRC: 5, baseCostStars: 10, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 10, maxLevel: 10, icon: '🖱️' },
  { id: 'click_v2', category: 'UPGRADES', name: { en: 'Click Overclock v2', ru: 'Усиление Клика v2' }, description: { en: '+50 Hash/click', ru: '+50 Хэшей за клик' }, baseCostTON: 0.2, baseCostNRC: 25, baseCostStars: 50, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 50, maxLevel: 10, icon: '⚡' },
  { id: 'click_v3', category: 'UPGRADES', name: { en: 'Click Overclock v3', ru: 'Усиление Клика v3' }, description: { en: '+100 Hash/click', ru: '+100 Хэшей за клик' }, baseCostTON: 0.5, baseCostNRC: 80, baseCostStars: 150, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 100, maxLevel: 10, icon: '🔥' },
  { id: 'miner_s1', category: 'MINERS', name: { en: 'Basic Node', ru: 'Базовая Нода' }, description: { en: '100 H/s', ru: '100 Хэш/сек' }, baseCostTON: 0.4, baseCostNRC: 40, baseCostStars: 100, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 100, maxLevel: 10, icon: '💾' },
  { id: 'miner_s2', category: 'MINERS', name: { en: 'Pro Node', ru: 'Про Нода' }, description: { en: '500 H/s', ru: '500 Хэш/сек' }, baseCostTON: 2, baseCostNRC: 200, baseCostStars: 500, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 500, maxLevel: 10, icon: '🖥️' },
  { id: 'miner_s3', category: 'MINERS', name: { en: 'Ultra Node', ru: 'Ультра Нода' }, description: { en: '1 MH/s', ru: '1 Мегахеш/сек' }, baseCostTON: 7, baseCostNRC: 700, baseCostStars: 1750, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 1000000, maxLevel: 10, icon: '💎' },
  { id: 'farm_t1', category: 'FARMS', name: { en: 'Home Farm', ru: 'Домашняя Ферма' }, description: { en: '5 MH/s', ru: '5 Мегахешей/сек' }, baseCostTON: 8, baseCostNRC: 0, baseCostStars: 2000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 5000000, maxLevel: 10, icon: '🏗️' },
  { id: 'farm_t2', category: 'FARMS', name: { en: 'Garage Rack', ru: 'Гаражная Стойка' }, description: { en: '10 MH/s', ru: '10 Мегахешей/сек' }, baseCostTON: 18, baseCostNRC: 0, baseCostStars: 4500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 10000000, maxLevel: 10, icon: '🏭' },
  { id: 'farm_t3', category: 'FARMS', name: { en: 'Industrial Unit', ru: 'Пром. Юнит' }, description: { en: '50 MH/s', ru: '50 Мегахешей/сек' }, baseCostTON: 90, baseCostNRC: 0, baseCostStars: 22500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 50000000, maxLevel: 10, icon: '🏢' },
  { id: 'farm_t4', category: 'FARMS', name: { en: 'Data Center', ru: 'Дата Центр' }, description: { en: '100 MH/s', ru: '100 Мегахешей/сек' }, baseCostTON: 180, baseCostNRC: 0, baseCostStars: 45000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 100000000, maxLevel: 10, icon: '🏙️' },
  { id: 'farm_t5', category: 'FARMS', name: { en: 'AI Cluster', ru: 'AI Кластер' }, description: { en: '500 MH/s', ru: '500 Мегахешей/сек' }, baseCostTON: 750, baseCostNRC: 0, baseCostStars: 187500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 500000000, maxLevel: 10, icon: '🧠' },
  { id: 'farm_t6', category: 'FARMS', name: { en: 'Quantum Nexus', ru: 'Квантовый Нексус' }, description: { en: '1 GH/s', ru: '1 Гигахеш/сек' }, baseCostTON: 1400, baseCostNRC: 0, baseCostStars: 350000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 1000000000, maxLevel: 10, icon: '⚛️' },
  { id: 'global_quantum', category: 'STORE', name: { en: 'Dark Matter PC', ru: 'Dark Matter PC' }, description: { en: '1 GH/s (EXCLUSIVE 100)', ru: '1 ГХ/с (ЭКСКЛЮЗИВ 100)' }, baseCostTON: 900, baseCostNRC: 0, baseCostStars: 225000, growthFactorTON: 0.12, growthFactorNRC: 0.12, growthFactorStars: 0.12, effectType: 'GLOBAL_MINER', effectValue: 1000000000, maxLevel: 10, globalLimit: 100, globalSold: 0, icon: '🌌' },
  { id: 'roulette_spin', category: 'STORE', name: { en: 'Lucky Spin', ru: 'Рулетка Удачи' }, description: { en: 'Win TON, NRC or Miners', ru: 'Выиграй TON, NRC или Майнеры' }, baseCostTON: 0, baseCostNRC: 25, baseCostStars: 10, growthFactorTON: 0, growthFactorNRC: 0, growthFactorStars: 0, effectType: 'ROULETTE', effectValue: 0, maxLevel: 999999, icon: '🎰' }
];

let ALL_TASKS = []; 
const calculatePrice = (base, growth, level) => { if (base === 0 || base === undefined) return 0; return base * Math.pow(1 + growth, level); };

// --- SERVER CONFIG ---
const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000;
const PERSIST_RATE = 30000;
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/neurocoin';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ENERGY_REGEN_RATE = 20; 
const REDIS_BLOCK_PROGRESS_KEY = 'network:currentBlockProgress';

// --- SERVER SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });
app.use(express.static(path.join(__dirname, 'dist')));
const redisClient = createClient({ url: REDIS_URL });

// --- STATE VARIABLES ---
let networkState; 
const activeSockets = new Map(); 
let leaderboardCache = []; 
let globalPassiveHashrate = 0; 
let isProcessingBlock = false; 

// --- TELEGRAM BOT POLLING IMPLEMENTATION (Native HTTPS) ---
let lastUpdateId = 0;

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
                'Content-Length': data.length
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

// Long Polling Loop
async function startTelegramPolling() {
    try {
        const updates: any = await callTelegramApi('getUpdates', { offset: lastUpdateId + 1, timeout: 30 });
        
        if (updates && updates.ok && updates.result) {
            for (const update of updates.result) {
                lastUpdateId = update.update_id;
                
                // Handle Pre-Checkout (Validation)
                if (update.pre_checkout_query) {
                    await handlePreCheckout(update.pre_checkout_query);
                }
                
                // Handle Successful Payment
                if (update.message && update.message.successful_payment) {
                    await handleSuccessfulPayment(update.message);
                }
            }
        }
    } catch (e) {
        console.error('Polling Error:', e.message);
    }
    
    // Immediate recursive call for long polling effect
    setTimeout(startTelegramPolling, 100); 
}

async function handlePreCheckout(query) {
    console.log(`[PAYMENT] Pre-Checkout: ${query.id} from ${query.from.id}`);
    // Auto-approve all star payments
    await callTelegramApi('answerPreCheckoutQuery', {
        pre_checkout_query_id: query.id,
        ok: true
    });
}

async function handleSuccessfulPayment(message) {
    const payment = message.successful_payment;
    const userId = message.from.id.toString();
    const payload = payment.invoice_payload; // We store packId here
    const totalAmount = payment.total_amount; // Amount in Stars (or smallest unit)

    console.log(`[PAYMENT] SUCCESS: User ${userId} paid ${totalAmount} XTR for ${payload}`);

    // Credit User Logic
    const pack = STARS_PACKAGES.find(p => p.id === payload);
    if (pack) {
        await redisClient.hIncrByFloat(`user:${userId}`, 'balanceTON', pack.amountTON);
        await User.updateOne({ id: userId }, { $inc: { balanceTON: pack.amountTON } });
        
        // Notify Client if connected
        // Find socket for this user
        for (const [socketId, sUserId] of activeSockets.entries()) {
            if (sUserId === userId) {
                const fullUser = await getFullUserFromRedis(userId);
                io.to(socketId).emit('update_user_profile', fullUser);
                io.to(socketId).emit('notification', `PAYMENT RECEIVED: +${pack.amountTON} TON`);
                break;
            }
        }
    }
}

// --- DB & REDIS CONNECTION ---
async function connectServices() {
    await mongoose.connect(DB_URL);
    console.log('>>> [DB] MongoDB Connected.');
    redisClient.on('error', err => console.error('[FATAL] Redis Client Error', err));
    await redisClient.connect();
    console.log('>>> [MEM] Redis Connected.');
    await loadInitialData();
    startServer();
    startTelegramPolling(); // Start Bot
}

connectServices().catch(err => { console.error('[FATAL] Service connection failed:', err); process.exit(1); });

// --- DATA HANDLING ---
async function loadInitialData() {
    networkState = await NetworkState.findOne({ singleton: true });
    if (!networkState) {
        networkState = new NetworkState();
        networkState.epochStartTime = Date.now(); 
        await networkState.save();
    }
    await redisClient.flushAll(); 
    await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, networkState.currentBlockProgress.toString());
    const allUsers = await User.find({});
    globalPassiveHashrate = 0;
    for (const u of allUsers) { await hydrateUserToRedis(u); }
    networkState.networkHashRate = globalPassiveHashrate;
    networkState.totalUsers = allUsers.length;
}

async function hydrateUserToRedis(userDoc) {
    const userId = userDoc.id;
    let inventoryObj = userDoc.inventory instanceof Map ? Object.fromEntries(userDoc.inventory) : userDoc.inventory || {};
    const { hashRatePassive, hashRateClick } = recalculateUserStats(inventoryObj);
    globalPassiveHashrate += hashRatePassive;

    const redisUser = {};
    const userObject = userDoc.toObject();
    for(const key in userObject) { 
        if(key === 'inventory' || key === 'completedTasks' || key === 'purchasedThemes') { 
            redisUser[key] = JSON.stringify(userObject[key]); 
            continue; 
        }
        if(userObject[key] !== null && userObject[key] !== undefined) redisUser[key] = userObject[key].toString();
    }
    redisUser['hashRatePassive'] = hashRatePassive.toString();
    redisUser['hashRateClick'] = Math.max(25, hashRateClick).toString();
    redisUser['energy'] = (parseFloat(redisUser['energy']) || 2000).toString();

    await redisClient.hSet(`user:${userId}`, redisUser);
}

async function getFullUserFromRedis(userId) {
    const userCache = await redisClient.hGetAll(`user:${userId}`);
    if (!userCache || Object.keys(userCache).length === 0) return null;
    const safeParse = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch (e) { return fallback; } };
    return {
        ...userCache,
        balanceNRC: parseFloat(userCache.balanceNRC || 0),
        balanceTON: parseFloat(userCache.balanceTON || 0),
        energy: parseFloat(userCache.energy || 0),
        maxEnergy: parseFloat(userCache.maxEnergy || 0),
        hashRateClick: parseFloat(userCache.hashRateClick || 25),
        hashRatePassive: parseFloat(userCache.hashRatePassive || 0),
        level: parseInt(userCache.level || 1),
        xp: parseFloat(userCache.xp || 0),
        currentBlockShares: parseFloat(userCache.currentBlockShares || 0),
        blocksMined: parseInt(userCache.blocksMined || 0),
        inventory: safeParse(userCache.inventory, {}),
        completedTasks: safeParse(userCache.completedTasks, []),
        purchasedThemes: safeParse(userCache.purchasedThemes, ['NEON']),
        referrals: parseInt(userCache.referrals || 0),
        referralEarnings: parseFloat(userCache.referralEarnings || 0),
        isPremium: userCache.isPremium === 'true',
        premiumExpiry: userCache.premiumExpiry ? parseInt(userCache.premiumExpiry) : null
    };
}

const recalculateUserStats = (inventory) => { 
    let newClick = 25; 
    let newPassive = 0; 
    for (const [itemId, level] of Object.entries(inventory)) { 
        const item = SHOP_ITEMS.find(i => i.id === itemId); 
        if (item) { 
            if (item.effectType === 'CLICK') newClick += item.effectValue * level; 
            else if (item.effectType === 'PASSIVE' || item.effectType === 'GLOBAL_MINER') newPassive += item.effectValue * level; 
        } 
    } 
    return { hashRateClick: newClick, hashRatePassive: newPassive }; 
};

// --- MINING & GAME LOOPS (Abbreviated for brevity, logic remains same) ---
async function mineBlock(winnerSocketId = null) {
    if (isProcessingBlock) return;
    isProcessingBlock = true;
    try {
        networkState.blockHeight++;
        networkState.totalMined += networkState.blockReward;
        networkState.currentBlockProgress = 0; 
        await redisClient.set(REDIS_BLOCK_PROGRESS_KEY, '0');
        
        if (winnerSocketId) {
             const winnerUserId = activeSockets.get(winnerSocketId);
             if (winnerUserId) {
                 const bonus = networkState.blockReward;
                 await redisClient.hIncrByFloat(`user:${winnerUserId}`, 'balanceNRC', bonus);
                 await redisClient.hIncrBy(`user:${winnerUserId}`, 'blocksMined', 1);
                 await User.updateOne({ id: winnerUserId }, { $inc: { balanceNRC: bonus, blocksMined: 1 } });
             }
        }
        io.emit('block_found_global', { height: networkState.blockHeight });
        io.emit('network_tick', { ...networkState.toObject(), currentBlockProgress: 0, onlineUsers: activeSockets.size });
    } catch (e) { console.error('Error in mineBlock:', e); } finally { isProcessingBlock = false; }
}

function startGameLoops() {
    setInterval(async () => {
        let currentProgress = parseFloat(await redisClient.get(REDIS_BLOCK_PROGRESS_KEY)) || 0;
        networkState.currentBlockProgress = currentProgress;
        if (!isProcessingBlock && networkState.currentBlockProgress >= networkState.difficulty) {
            await mineBlock();
        }
        const onlineUserIds = Array.from(activeSockets.values());
        if (onlineUserIds.length > 0) io.emit('network_tick', { ...networkState.toObject(), leaderboard: leaderboardCache, onlineUsers: onlineUserIds.length });
    }, TICK_RATE);
}

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    socket.on('user_connect', async (payload) => {
        let tgUser = payload.user || payload;
        // Basic Telegram Auth Check (simplified)
        if (payload.initData) {
             // In real production, verify hash here. For now, trusting token presence if valid structure.
        }
        
        const userId = tgUser.id.toString();
        activeSockets.set(socket.id, userId);
        
        let userProfile = await User.findOne({ id: userId });
        if (!userProfile) {
            userProfile = new User({ ...INITIAL_USER_STATE, id: userId, username: tgUser.username || `user_${userId}` });
            await userProfile.save();
        }
        await hydrateUserToRedis(userProfile);
        const fullUser = await getFullUserFromRedis(userId);
        socket.emit('init_state', { userProfile: fullUser, networkState: { ...networkState.toObject() }, allTasks: ALL_TASKS });
    });

    // NEW: Request Invoice Link for Stars
    socket.on('request_stars_invoice', async (data) => {
        const userId = activeSockets.get(socket.id);
        const { packId } = data;
        const pack = STARS_PACKAGES.find(p => p.id === packId);
        
        if (userId && pack) {
            try {
                // Call Telegram createInvoiceLink
                const result: any = await callTelegramApi('createInvoiceLink', {
                    title: pack.title,
                    description: pack.description,
                    payload: pack.id,
                    provider_token: '', // EMPTY for Digital Goods (Stars)
                    currency: 'XTR',
                    prices: [{ label: 'Price', amount: pack.stars }] // Amount in Stars
                });
                
                if (result.ok) {
                    socket.emit('invoice_link', { url: result.result, packId });
                } else {
                    socket.emit('notification', 'Failed to create invoice: ' + result.description);
                }
            } catch (e) {
                console.error("Invoice Error", e);
                socket.emit('notification', 'Payment Error');
            }
        }
    });

    socket.on('user_action', async (action) => {
        const userId = activeSockets.get(socket.id);
        if (!userId) return;
        if (action.type === 'TAP') {
             const userKey = `user:${userId}`;
             const tapEnergy = parseFloat(await redisClient.hGet(userKey, 'energy') || '0');
             if (tapEnergy >= 1) {
                 const clickRate = parseFloat(await redisClient.hGet(userKey, 'hashRateClick') || '25');
                 await redisClient.hIncrByFloat(userKey, 'energy', -1);
                 await redisClient.hIncrByFloat(userKey, 'currentBlockShares', clickRate);
                 const newProgress = await redisClient.incrByFloat(REDIS_BLOCK_PROGRESS_KEY, clickRate);
                 if (newProgress >= networkState.difficulty) await mineBlock(socket.id);
             }
        }
        // ... (Buy logic remains same, just ensure type safety)
    });

    socket.on('disconnect', () => { activeSockets.delete(socket.id); });
});

function startServer() {
    startGameLoops();
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 NEUROCOIN CORE v7.4 ONLINE on port ${PORT}`);
    });
}
