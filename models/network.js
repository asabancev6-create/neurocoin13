
import mongoose from 'mongoose';

const historyDataSchema = new mongoose.Schema({
    hour: { type: [Number], default: () => Array(60).fill(0) },
    day: { type: [Number], default: () => Array(24).fill(0) },
    week: { type: [Number], default: () => Array(7).fill(0) },
}, { _id: false });

const networkStateSchema = new mongoose.Schema({
    singleton: { type: Boolean, default: true, unique: true, index: true },

    blockHeight: { type: Number, default: 1 },
    blockReward: { type: Number, default: 50 },
    difficulty: { type: Number, default: 10000 },
    currentBlockProgress: { type: Number, default: 0 },
    networkHashRate: { type: Number, default: 0 },
    lastBlockTime: { type: Number, default: Date.now },
    epochStartTime: { type: Number, default: Date.now },
    totalMined: { type: Number, default: 0 },
    totalTonSpent: { type: Number, default: 0 },
    adminTreasury: { type: Number, default: 0 },
    adminTreasuryNRC: { type: Number, default: 0 },
    liquidityPoolTON: { type: Number, default: 0 },
    rewardPool: { type: Number, default: 0 },
    isMaintenance: { type: Boolean, default: false },
    
    miningHistory: { type: historyDataSchema, default: () => ({}) },
    priceHistory: { type: historyDataSchema, default: () => ({}) },

    liquidityRatio: { type: Number, default: 0.13 },
    rewardPoolFeePercent: { type: Number, default: 0.10 },
    rewardSharedPoolPercent: { type: Number, default: 0.20 },
    rewardCloserBonusPercent: { type: Number, default: 0.70 },
    
    dailyBonusAmount: { type: Number, default: 100 },

    casinoJackpot: { type: Number, default: 1000 },
    casinoJackpotFeedRate: { type: Number, default: 0.05 },
    casinoSlotWinRate: { type: Number, default: 0.35 },
    casinoLotteryWinRate: { type: Number, default: 0.30 },
});

export const NetworkState = mongoose.model('NetworkState', networkStateSchema);
