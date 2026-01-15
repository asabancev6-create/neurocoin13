
import { NetworkState } from '../types';

export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  const BASE = 500;
  if (level < 100) return BASE * Math.pow(level - 1, 2);
  if (level < 1000) return BASE * Math.pow(level - 1, 3);
  return BASE * Math.pow(level - 1, 4);
};

export const getLevelFromXP = (xp: number): number => {
  const BASE = 500;
  let level = Math.floor(Math.pow(xp / BASE, 1/2)) + 1;
  if (level < 100) return level;
  level = Math.floor(Math.pow(xp / BASE, 1/3)) + 1;
  if (level < 1000) return level;
  level = Math.floor(Math.pow(xp / BASE, 1/4)) + 1;
  return level;
};

// --- VISUAL SYNC ONLY ---
// We trust the server for actual block mining and difficulty adjustments.
// This function just interpolates progress for smooth UI updates between ticks.

export const syncNetworkState = (
  currentState: NetworkState,
  timeElapsedMs: number
): { newState: NetworkState; blocksMined: number } => {
  
  let tempState = { ...currentState };
  let blocksFound = 0;

  // Calculate Hash Power for this tick
  const networkRate = Math.max(1, tempState.networkHashRate);
  
  // Hashes available to spend in this "tick" (e.g. 200ms)
  let hashesAvailable = networkRate * (timeElapsedMs / 1000);
  
  // Loop as long as we have enough hashes to find the next block
  // NOTE: On client side, we do NOT change difficulty or rewards.
  // We just reset progress visually so the bar loops.
  while (true) {
    const hashesToNextBlock = tempState.difficulty - tempState.currentBlockProgress;

    if (hashesAvailable >= hashesToNextBlock) {
      // Mine the Block (Visually)
      hashesAvailable -= hashesToNextBlock;
      tempState.currentBlockProgress = 0;
      tempState.blockHeight++;
      blocksFound++;
    } else {
      // Not enough hashes to finish this block
      tempState.currentBlockProgress += hashesAvailable;
      hashesAvailable = 0;
      break; 
    }
  }

  tempState.lastBlockTime = Date.now();
  return { newState: tempState, blocksMined: blocksFound };
};

export const formatHashrate = (hashes: number): string => {
  if (!hashes || hashes === 0) return '0 H/s';
  if (hashes >= 1000000000000000) return (hashes / 1000000000000000).toFixed(2) + ' Q+ H/s'; // PetaHash (Deep Quantum)
  if (hashes >= 1000000000000) return (hashes / 1000000000000).toFixed(2) + ' QH/s'; // TeraHash (Quantum)
  if (hashes >= 1000000000) return (hashes / 1000000000).toFixed(2) + ' GH/s';
  if (hashes >= 1000000) return (hashes / 1000000).toFixed(2) + ' MH/s';
  if (hashes >= 1000) return (hashes / 1000).toFixed(2) + ' KH/s';
  return Math.floor(hashes) + ' H/s';
};

export const formatDifficulty = (hashes: number): string => {
  if (!hashes || hashes === 0) return '0 H';
  if (hashes >= 1000000000000000) return (hashes / 1000000000000000).toFixed(2) + ' Q+ H'; 
  if (hashes >= 1000000000000) return (hashes / 1000000000000).toFixed(2) + ' QH'; 
  if (hashes >= 1000000000) return (hashes / 1000000000).toFixed(2) + ' GH';
  if (hashes >= 1000000) return (hashes / 1000000).toFixed(2) + ' MH';
  if (hashes >= 1000) return (hashes / 1000).toFixed(2) + ' KH';
  return Math.floor(hashes) + ' H';
};
