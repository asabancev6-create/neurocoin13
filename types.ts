
export type Language = 'ru' | 'en';
export type AppTheme = 'NEON' | 'GOLD' | 'MATRIX' | 'VIOLET' | 'LIGHT';

export interface LocalizedString {
  ru: string;
  en: string;
}

export interface Task {
  id: string;
  title: string;
  type: 'SOCIAL' | 'DAILY' | 'PARTNER';
  reward: number;
  link?: string;
  imageUrl?: string;
  isCompleted?: boolean; // Client-side check
}

export interface AITask {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reward: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface UserProfile {
  id: string;
  username: string;
  photoUrl?: string; 
  balanceNRC: number;
  balanceTON: number;
  energy: number;
  maxEnergy: number;
  hashRateClick: number;   
  hashRatePassive: number; 
  level: number;
  xp: number; 
  claimedLevelRewards: number[]; 
  lastSync: number;
  currentBlockShares: number;
  blocksMined: number; // NEW: Track mined blocks for trophies
  isPremium: boolean;
  premiumExpiry: number | null;
  inventory: Record<string, number>; 
  hasGlowAvatar: boolean;
  hasGlowName: boolean;
  
  // NEW EARN FEATURES
  lastDailyBonusClaim: number | null; // Timestamp
  completedTasks: string[]; // IDs of completed tasks
  referrals: number;
  referralEarnings: number;
  purchasedThemes?: AppTheme[];
}

// Structure for chart data points
export interface HistoryData {
  hour: number[]; // 60 points (1 per minute)
  day: number[];  // 24 points (1 per hour)
  week: number[]; // 7 points (1 per day)
}

export interface NetworkState {
  blockHeight: number;
  blockReward: number;
  difficulty: number;
  currentBlockProgress: number;
  networkHashRate: number; // GLOBAL SUM
  lastBlockTime: number;
  epochStartTime: number; 
  totalMined: number; 
  totalTonSpent: number; 
  adminTreasury: number; // TON
  adminTreasuryNRC: number; // NRC
  liquidityPoolTON: number; 
  rewardPool: number; // NRC
  isMaintenance: boolean; 
  
  // STATS (Database ready structure)
  miningHistory: HistoryData;
  priceHistory: HistoryData;

  // CONFIG
  liquidityRatio: number; 
  rewardWinnerPercent: number; // Legacy, can be repurposed
  rewardPoolFeePercent: number; // % of block reward to reward pool
  rewardSharedPoolPercent: number; // % of block reward shared between all miners
  rewardCloserBonusPercent: number; // % of block reward as bonus to closer
  
  // EARN CONFIG
  dailyBonusAmount: number;

  // CASINO CONFIG
  casinoJackpot: number; 
  casinoJackpotFeedRate: number; 
  casinoSlotWinRate: number; 
  casinoLotteryWinRate: number; 

  // ADMIN DASHBOARD
  onlineUsers?: number;
  totalUsers?: number;
  dailyBonusEligibleUsers?: number;
  leaderboard?: LeaderboardEntry[];
}

export type ShopCategory = 'UPGRADES' | 'MINERS' | 'FARMS' | 'STORE';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: LocalizedString;
  description: LocalizedString;
  baseCostTON: number;
  baseCostNRC: number;
  baseCostStars?: number; // Added Stars
  growthFactorTON: number; 
  growthFactorNRC: number;
  growthFactorStars?: number; // Added Stars
  effectType: 'CLICK' | 'PASSIVE' | 'GLOBAL_MINER' | 'ROULETTE';
  effectValue: number; 
  maxLevel: number; 
  globalLimit?: number; 
  globalSold?: number;
  icon: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  hashrate: number;
  balanceNRC: number; 
  isPremium: boolean;
  rank: number;
  isWhale?: boolean; 
}

export enum Tab {
  MINING = 'MINING',
  SHOP = 'SHOP',
  CASINO = 'CASINO',
  EARN = 'EARN', // Renamed from TASKS
  NETWORK = 'NETWORK'
}
