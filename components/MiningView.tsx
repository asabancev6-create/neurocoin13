
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UserProfile, NetworkState } from '../types';
import { formatHashrate, formatDifficulty, getXPForLevel } from '../utils/blockchain';
import { useLanguage } from '../contexts/LanguageContext';
import { hapticFeedback } from '../utils/telegram';

interface MiningViewProps {
  user: UserProfile;
  network: NetworkState;
  onTap: () => void;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  value: number;
  color: string;
}

// --- SKIN CONFIGURATION (NEURO THEME) ---
const getSkinConfig = (level: number) => {
  // Level 20+ (Accent/Magenta)
  if (level >= 20) {
    return {
      name: 'ANTIMATTER',
      glow: 'shadow-[0_0_50px_rgba(255,0,229,0.5)]',
      gradient: 'from-[#FF00E5] via-[#8D73FF] to-black',
      accentColor: 'text-neuro-accent',
      bgGlow: 'bg-neuro-accent',
      particleColor: '#FF00E5',
      ringColor: 'border-neuro-accent',
      icon: (
        <svg className="w-12 h-12 drop-shadow-[0_0_15px_#FF00E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    };
  }
  // Level 10+ (Cyan)
  if (level >= 10) {
    return {
      name: 'PLASMA',
      glow: 'shadow-[0_0_50px_rgba(0,240,255,0.5)]',
      gradient: 'from-[#00F0FF] via-[#0099FF] to-black',
      accentColor: 'text-neuro-cyan',
      bgGlow: 'bg-neuro-cyan',
      particleColor: '#00F0FF',
      ringColor: 'border-neuro-cyan',
      icon: (
        <svg className="w-12 h-12 drop-shadow-[0_0_15px_#00F0FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    };
  }
  // Default (Primary/Purple)
  return {
    name: 'GENESIS',
    glow: 'shadow-[0_0_50px_rgba(141,115,255,0.5)]',
    gradient: 'from-[#8D73FF] via-[#5D3FD3] to-black',
    accentColor: 'text-neuro-primary',
    bgGlow: 'bg-neuro-primary',
    particleColor: '#8D73FF',
    ringColor: 'border-neuro-primary',
    icon: (
       <svg className="w-12 h-12 drop-shadow-[0_0_15px_#8D73FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
       </svg>
    )
  };
};

export const MiningView: React.FC<MiningViewProps> = ({ user, network, onTap, onOpenWallet, onOpenSettings }) => {
  const { t } = useLanguage();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  const reactorRef = useRef<HTMLDivElement>(null);
  const skin = useMemo(() => getSkinConfig(user.level), [user.level]);

  // Derived Values
  const currentPrice = network.totalMined > 0 ? (network.liquidityPoolTON / network.totalMined) : 0;
  const userBalanceInTon = user.balanceNRC * currentPrice;
  const currentLevelXP = getXPForLevel(user.level);
  const nextLevelXP = getXPForLevel(user.level + 1);
  const xpProgress = (user.xp || 0) - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const levelPercent = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));
  const progressPercent = Math.min(100, (network.currentBlockProgress / Math.max(1, network.difficulty)) * 100);

  // Dynamic Speed based on Network Progress
  const spinDuration = Math.max(4, 25 - (progressPercent / 100) * 20);

  const handleInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (reactorRef.current) {
        const rect = reactorRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let clientX, clientY;
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
        else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
        const rotateY = ((clientX - centerX) / (rect.width / 2)) * 25; 
        const rotateX = -((clientY - centerY) / (rect.height / 2)) * 25;
        setRotation({ x: rotateX, y: rotateY });

        // Particles
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: clientX - rect.left,
          y: clientY - rect.top,
          value: user.hashRateClick,
          color: skin.particleColor
        };
        setParticles(prev => [...prev, newParticle]);
        setTimeout(() => setParticles(prev => prev.filter(p => p.id !== newParticle.id)), 800);
    }

    if (user.energy <= 0) {
        hapticFeedback('rigid'); 
        return;
    }
    
    onTap();
    setIsPressed(true);
    hapticFeedback('light'); 
  };
  
  const handleRelease = () => { setIsPressed(false); setRotation({ x: 0, y: 0 }); };

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const element = reactorRef.current;
    if (element) { element.addEventListener('touchstart', preventDefault, { passive: false }); element.addEventListener('touchmove', preventDefault, { passive: false }); }
    return () => { if (element) { element.removeEventListener('touchstart', preventDefault); element.removeEventListener('touchmove', preventDefault); }};
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative px-6 pt-6 pb-24 max-w-md mx-auto select-none overflow-hidden gap-4">
      
      {/* CSS Animations */}
      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        @keyframes orbit-x { 0% { transform: rotateX(0deg) rotateZ(0deg); } 100% { transform: rotateX(360deg) rotateZ(360deg); } }
        @keyframes orbit-y { 0% { transform: rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateY(360deg) rotateZ(-360deg); } }
        @keyframes core-pulse { 0% { box-shadow: 0 0 20px opacity(0.5); transform: scale(0.95); } 50% { box-shadow: 0 0 40px opacity(0.8); transform: scale(1.05); } 100% { box-shadow: 0 0 20px opacity(0.5); transform: scale(0.95); } }
      `}</style>

      {/* HEADER: User Info & Wallet */}
      <div className="shrink-0 z-30">
        <div className="glass-card rounded-2xl p-3 flex items-center justify-between shadow-glow gap-3">
           
           {/* Profile */}
           <button onClick={onOpenSettings} className="flex items-center gap-3 group flex-1 min-w-0">
              <div className="relative shrink-0">
                 <div className={`w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-neuro-primary to-neuro-cyan`}>
                    <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                       {user.photoUrl ? <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-sm font-bold text-white">{user.username.slice(0, 2).toUpperCase()}</div>}
                    </div>
                 </div>
              </div>
              <div className="flex flex-col min-w-0">
                 <span className="text-sm font-bold text-white tracking-wide truncate">{user.username}</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neuro-textSec font-bold tracking-widest">LVL {user.level}</span>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-neuro-primary shadow-[0_0_5px_#8D73FF]" style={{ width: `${levelPercent}%` }}></div>
                    </div>
                 </div>
              </div>
           </button>

           {/* Wallet */}
           <button 
              onClick={onOpenWallet} 
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-white/10 group"
           >
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neuro-cyan group-hover:drop-shadow-[0_0_8px_#00F0FF] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2v-5zm-6 0h6m-6 0H9m6 0a2 2 0 100 4 2 2 0 000-4z" />
               </svg>
           </button>
        </div>
      </div>
      
      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col items-center justify-evenly relative z-20 min-h-0">
        
        {/* Balance */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
             <span className="text-5xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-primary drop-shadow-sm">
                {Math.floor(user.balanceNRC).toLocaleString()}
             </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
             <span className="text-xs font-bold tracking-[0.2em] text-neuro-textSec">NEUROCOIN</span>
             <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-neuro-cyan">
                ≈ {userBalanceInTon.toFixed(4)} TON
             </div>
          </div>
        </div>

        {/* --- QUANTUM SPHERE --- */}
        <div className="relative w-[75vw] h-[75vw] max-w-[280px] max-h-[280px] min-w-[200px] min-h-[200px] flex items-center justify-center perspective-[1000px] aspect-square">
           <div 
              ref={reactorRef} 
              onTouchStart={handleInteraction} 
              onMouseDown={handleInteraction}
              onTouchEnd={handleRelease}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              className="relative w-full h-full flex items-center justify-center transform-style-3d cursor-pointer preserve-3d"
              style={{
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isPressed ? 0.95 : 1})`,
                  transition: isPressed ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
           >
              {/* 1. Glow */}
              <div className={`absolute inset-0 rounded-full blur-[70px] opacity-40 ${skin.bgGlow} animate-pulse duration-[3000ms]`}></div>

              {/* 2. Gyro Rings */}
              <div className={`absolute w-[95%] h-[95%] rounded-full border-[1px] ${skin.ringColor} border-t-transparent border-b-transparent opacity-60 animate-[orbit-x_8s_linear_infinite] shadow-[0_0_10px_currentColor]`} style={{ animationDuration: `${spinDuration}s` }}></div>
              <div className={`absolute w-[85%] h-[85%] rounded-full border-[1px] border-white/30 border-l-transparent border-r-transparent animate-[orbit-y_12s_linear_infinite]`} style={{ animationDuration: `${spinDuration * 1.5}s` }}></div>
              
              {/* 3. The Core */}
              <div className="absolute w-[45%] h-[45%] rounded-full flex items-center justify-center z-10">
                  <div className="absolute inset-0 bg-black rounded-full"></div>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${skin.gradient} opacity-80 animate-[core-pulse_3s_ease-in-out_infinite]`}></div>
                  <div className={`relative z-20 transform transition-all duration-150 ${isPressed ? 'scale-110 brightness-150' : 'scale-100'} ${skin.accentColor}`}>
                      {skin.icon}
                  </div>
              </div>
              
              {/* 4. Particles */}
              {particles.map(p => (<div key={p.id} className="absolute pointer-events-none text-xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[float-up_0.8s_ease-out_forwards] z-50 font-display select-none whitespace-nowrap" style={{ left: p.x, top: p.y, color: p.color }}>+{p.value}</div>))}
           </div>
        </div>
        
        {/* Hashrate Status */}
        <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neuro-textSec">PENDING HASHES</div>
            <div className={`text-lg font-bold tracking-widest ${skin.accentColor} drop-shadow-md font-mono`}>
                {formatHashrate(user.currentBlockShares)}
            </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="shrink-0 z-20 mt-auto">
         <div className="mb-4">
            <div className="flex justify-between items-end mb-2 px-1">
               <span className={`text-[10px] font-bold uppercase tracking-widest ${network.blockHeight === 1 ? 'text-neuro-gold animate-pulse' : 'text-neuro-textSec'}`}>{network.blockHeight === 1 ? 'GENESIS' : `BLOCK #${network.blockHeight}`}</span>
               <span className="text-xs font-mono font-bold text-neuro-cyan drop-shadow-[0_0_5px_#00F0FF]">{formatDifficulty(network.currentBlockProgress)} / {formatDifficulty(network.difficulty)}</span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
               <div className="h-full bg-gradient-primary shadow-[0_0_15px_#8D73FF]" style={{ width: `${progressPercent}%` }}></div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
             {/* Energy Card */}
             <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-neuro-gold/10 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[9px] text-neuro-textSec font-bold uppercase tracking-wider">ENERGY</span>
                   <span className="text-[10px] text-white/50">{user.maxEnergy} MAX</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                   <span className="text-xl font-bold text-white font-mono">{Math.floor(user.energy)}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-gold rounded-full" style={{width: `${(user.energy / user.maxEnergy) * 100}%`}}></div>
                </div>
             </div>
             
             {/* Hashrate Card */}
             <div className="glass-card rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-neuro-primary/10 blur-xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <span className="text-[9px] text-neuro-textSec font-bold uppercase tracking-wider mb-1">TOTAL HASH</span>
                <div className="flex items-center gap-1">
                   <span className="text-xl font-bold text-white font-mono">{formatHashrate(user.hashRatePassive + user.hashRateClick)}</span>
                </div>
             </div>
         </div>
      </div>
       <style>{`
          @keyframes float-up { from { transform: translateY(0) scale(1.2); opacity: 1; } to { transform: translateY(-80px) scale(0.8); opacity: 0; } }
       `}</style>
    </div>
  );
};
