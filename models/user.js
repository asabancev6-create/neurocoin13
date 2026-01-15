
import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  photoUrl: String,
  balanceNRC: { type: Number, default: 0 },
  balanceTON: { type: Number, default: 0 },
  energy: { type: Number, default: 2000 },
  maxEnergy: { type: Number, default: 2000 },
  hashRateClick: { type: Number, default: 1 },
  hashRatePassive: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  claimedLevelRewards: [Number],
  lastSync: { type: Number, default: Date.now },
  currentBlockShares: { type: Number, default: 0 },
  blocksMined: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: Number,
  inventory: { type: Map, of: Number, default: {} },
  hasGlowAvatar: { type: Boolean, default: false },
  hasGlowName: { type: Boolean, default: false },
  lastDailyBonusClaim: Number,
  completedTasks: [String],
  referrals: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },
  purchasedThemes: { type: [String], default: ['NEON'] },
}, { timestamps: true }); // timestamps добавляют поля createdAt и updatedAt

export const User = mongoose.model('UserProfile', userProfileSchema);
