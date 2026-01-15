
import { ShopItem, UserProfile, NetworkState, Task, AppTheme } from './types';

// GLOBAL SETTINGS
export const MAX_SUPPLY = 13000000;
export const POOL_WALLET_ADDRESS = "UQAx408EfLCH0JZWxffL1c5aMSSFpNcgXLW_ezucTOqOE0_V";

// --- BITCOIN-LIKE PROTOCOL PARAMS ---
export const TARGET_BLOCK_TIME = 6 * 60 * 1000; // 6 Minutes (360,000 ms)
export const INITIAL_BLOCK_REWARD = 50;
export const HALVING_INTERVAL = 130000;         // Blocks
export const DIFFICULTY_ADJUSTMENT_INTERVAL = 1300; // Blocks
// ------------------------------------

export const ENERGY_REGEN_RATE = 2; 

// --- ADMIN ---
export const ADMIN_USER_IDS = ['7010848744', 'YOUR_TELEGRAM_ID_HERE', '123456789'];

const INITIAL_MINING_HISTORY = {
  hour: Array(60).fill(0),
  day: Array(24).fill(0),
  week: Array(7).fill(0)
};

const INITIAL_PRICE_HISTORY = {
  hour: Array(60).fill(0),
  day: Array(24).fill(0),
  week: Array(7).fill(0)
};

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_USER_STATE: UserProfile = {
  id: 'default_user_12345',
  username: 'Genesis_Miner',
  balanceNRC: 0,
  balanceTON: 0, 
  energy: 2000,
  maxEnergy: 2000,
  hashRateClick: 10, // Increased for better UX start
  hashRatePassive: 0,
  level: 1,
  xp: 0, 
  claimedLevelRewards: [], 
  lastSync: Date.now(),
  currentBlockShares: 0,
  blocksMined: 0, // Initialized
  isPremium: false,
  premiumExpiry: null,
  inventory: {},
  hasGlowAvatar: false,
  hasGlowName: false,
  lastDailyBonusClaim: null,
  completedTasks: [],
  referrals: 0,
  referralEarnings: 0,
  purchasedThemes: ['NEON'],
};

export const INITIAL_NETWORK_STATE: NetworkState = {
  blockHeight: 1,
  blockReward: INITIAL_BLOCK_REWARD,
  difficulty: 500, // Reduced from 10000 for immediate satisfaction
  currentBlockProgress: 0,
  networkHashRate: 0, 
  lastBlockTime: Date.now(),
  epochStartTime: Date.now(), 
  totalMined: 0,   
  totalTonSpent: 0, 
  adminTreasury: 0, 
  adminTreasuryNRC: 0,
  liquidityPoolTON: 0, 
  rewardPool: 0,
  isMaintenance: false, 
  
  miningHistory: INITIAL_MINING_HISTORY,
  priceHistory: INITIAL_PRICE_HISTORY,

  liquidityRatio: 0.13,        
  rewardWinnerPercent: 1.0,   // Legacy
  rewardPoolFeePercent: 0.10,   
  rewardSharedPoolPercent: 0.20, 
  rewardCloserBonusPercent: 0.70, 
  
  dailyBonusAmount: 100,

  casinoJackpot: 1000,          
  casinoJackpotFeedRate: 0.05,  
  casinoSlotWinRate: 0.35,      
  casinoLotteryWinRate: 0.30,
  
  onlineUsers: 0,
  totalUsers: 0,
  dailyBonusEligibleUsers: 0,
};

// --- STARS CONFIG ---
export const STARS_PACKAGES = [
  { id: 'stars_micro', stars: 50, amountTON: 0.5, label: 'MICRO', icon: '✨' },
  { id: 'stars_mini', stars: 100, amountTON: 1.1, label: 'STARTER', icon: '⭐' }, // +10% bonus
  { id: 'stars_medium', stars: 500, amountTON: 6.0, label: 'TRADER', icon: '🌟' }, // +20% bonus
  { id: 'stars_mega', stars: 1000, amountTON: 13.0, label: 'WHALE', icon: '💫' }, // +30% bonus
  { id: 'stars_giga', stars: 2500, amountTON: 35.0, label: 'GALACTIC', icon: '🌌' } // +40% bonus
];

export const SHOP_ITEMS: ShopItem[] = [
  // 1. UPGRADES (Click Power) - Cheaper initial levels
  { id: 'click_v1', category: 'UPGRADES', name: { en: 'Click Overclock v1', ru: 'Усиление Клика v1' }, description: { en: '+10 Hash/click', ru: '+10 Хэшей за клик' }, baseCostTON: 0.05, baseCostNRC: 5, baseCostStars: 10, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 10, maxLevel: 10, icon: '🖱️' },
  { id: 'click_v2', category: 'UPGRADES', name: { en: 'Click Overclock v2', ru: 'Усиление Клика v2' }, description: { en: '+50 Hash/click', ru: '+50 Хэшей за клик' }, baseCostTON: 0.2, baseCostNRC: 25, baseCostStars: 50, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 50, maxLevel: 10, icon: '⚡' },
  { id: 'click_v3', category: 'UPGRADES', name: { en: 'Click Overclock v3', ru: 'Усиление Клика v3' }, description: { en: '+100 Hash/click', ru: '+100 Хэшей за клик' }, baseCostTON: 0.5, baseCostNRC: 80, baseCostStars: 150, growthFactorTON: 0.18, growthFactorNRC: 0.18, growthFactorStars: 0.18, effectType: 'CLICK', effectValue: 100, maxLevel: 10, icon: '🔥' },

  // 2. MINERS (Passive Small) - More accessible
  { id: 'miner_s1', category: 'MINERS', name: { en: 'Basic Node', ru: 'Базовая Нода' }, description: { en: '100 H/s', ru: '100 Хэш/сек' }, baseCostTON: 0.4, baseCostNRC: 40, baseCostStars: 100, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 100, maxLevel: 10, icon: '💾' },
  { id: 'miner_s2', category: 'MINERS', name: { en: 'Pro Node', ru: 'Про Нода' }, description: { en: '500 H/s', ru: '500 Хэш/сек' }, baseCostTON: 2, baseCostNRC: 200, baseCostStars: 500, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 500, maxLevel: 10, icon: '🖥️' },
  { id: 'miner_s3', category: 'MINERS', name: { en: 'Ultra Node', ru: 'Ультра Нода' }, description: { en: '1 MH/s', ru: '1 Мегахеш/сек' }, baseCostTON: 7, baseCostNRC: 700, baseCostStars: 1750, growthFactorTON: 0.16, growthFactorNRC: 0.16, growthFactorStars: 0.16, effectType: 'PASSIVE', effectValue: 1000000, maxLevel: 10, icon: '💎' },

  // 3. FARMS (Passive Big) - TON/STARS focused, rebalanced
  { id: 'farm_t1', category: 'FARMS', name: { en: 'Home Farm', ru: 'Домашняя Ферма' }, description: { en: '5 MH/s', ru: '5 Мегахешей/сек' }, baseCostTON: 8, baseCostNRC: 0, baseCostStars: 2000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 5000000, maxLevel: 10, icon: '🏗️' },
  { id: 'farm_t2', category: 'FARMS', name: { en: 'Garage Rack', ru: 'Гаражная Стойка' }, description: { en: '10 MH/s', ru: '10 Мегахешей/сек' }, baseCostTON: 18, baseCostNRC: 0, baseCostStars: 4500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 10000000, maxLevel: 10, icon: '🏭' },
  { id: 'farm_t3', category: 'FARMS', name: { en: 'Industrial Unit', ru: 'Пром. Юнит' }, description: { en: '50 MH/s', ru: '50 Мегахешей/сек' }, baseCostTON: 90, baseCostNRC: 0, baseCostStars: 22500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 50000000, maxLevel: 10, icon: '🏢' },
  { id: 'farm_t4', category: 'FARMS', name: { en: 'Data Center', ru: 'Дата Центр' }, description: { en: '100 MH/s', ru: '100 Мегахешей/сек' }, baseCostTON: 180, baseCostNRC: 0, baseCostStars: 45000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 100000000, maxLevel: 10, icon: '🏙️' },
  { id: 'farm_t5', category: 'FARMS', name: { en: 'AI Cluster', ru: 'AI Кластер' }, description: { en: '500 MH/s', ru: '500 Мегахешей/сек' }, baseCostTON: 750, baseCostNRC: 0, baseCostStars: 187500, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 500000000, maxLevel: 10, icon: '🧠' },
  { id: 'farm_t6', category: 'FARMS', name: { en: 'Quantum Nexus', ru: 'Квантовый Нексус' }, description: { en: '1 GH/s', ru: '1 Гигахеш/сек' }, baseCostTON: 1400, baseCostNRC: 0, baseCostStars: 350000, growthFactorTON: 0.14, growthFactorNRC: 0.14, growthFactorStars: 0.14, effectType: 'PASSIVE', effectValue: 1000000000, maxLevel: 10, icon: '⚛️' },

  // 4. STORE - Exclusive Limited Item
  { id: 'global_quantum', category: 'STORE', name: { en: 'Dark Matter PC', ru: 'Dark Matter PC' }, description: { en: '1 GH/s (EXCLUSIVE 100)', ru: '1 ГХ/с (ЭКСКЛЮЗИВ 100)' }, baseCostTON: 900, baseCostNRC: 0, baseCostStars: 225000, growthFactorTON: 0.12, growthFactorNRC: 0.12, growthFactorStars: 0.12, effectType: 'GLOBAL_MINER', effectValue: 1000000000, maxLevel: 10, globalLimit: 100, globalSold: 0, icon: '🌌' },
  
  // Roulette - Cheaper spins
  { id: 'roulette_spin', category: 'STORE', name: { en: 'Lucky Spin', ru: 'Рулетка Удачи' }, description: { en: 'Win TON, NRC or Miners', ru: 'Выиграй TON, NRC или Майнеры' }, baseCostTON: 0, baseCostNRC: 25, baseCostStars: 10, growthFactorTON: 0, growthFactorNRC: 0, growthFactorStars: 0, effectType: 'ROULETTE', effectValue: 0, maxLevel: 999999, icon: '🎰' }
];

export const calculatePrice = (base: number, growth: number, level: number): number => {
  if (base === 0 || base === undefined) return 0;
  return base * Math.pow(1 + growth, level);
};
