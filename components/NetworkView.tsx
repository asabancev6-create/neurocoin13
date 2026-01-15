
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatHashrate, formatDifficulty } from '../utils/blockchain';
import { NetworkState, LeaderboardEntry, UserProfile } from '../types';
import { MAX_SUPPLY } from '../constants';

interface NetworkViewProps {
  network: NetworkState;
  user: UserProfile;
  onOpenPriceChart: () => void;
}

type TimeFrame = '1H' | '24H' | '7D';

export const NetworkView: React.FC<NetworkViewProps> = ({ network, user, onOpenPriceChart }) => {
  const { t } = useLanguage();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24H');
  
  const leaderboard = network.leaderboard || [];
  const remainingSupply = Math.max(0, MAX_SUPPLY - network.totalMined);
  const percentMined = (network.totalMined / MAX_SUPPLY) * 100;
  
  const getGraphData = (): number[] => {
      const historyKey = network.miningHistory; // Always mining history
      switch(timeFrame) {
          case '1H': return historyKey.hour;
          case '24H': return historyKey.day;
          case '7D': return historyKey.week;
          default: return historyKey.day;
      }
  };

  const renderModernGraph = () => {
    const data = getGraphData();
    const key = `mining-${timeFrame}`;

    if (!data || data.length < 2) return (
        <div key={key} className="h-full w-full flex items-center justify-center text-[10px] text-slate-500 font-mono animate-pulse">
            GATHERING NETWORK DATA...
        </div>
    );
    
    const height = 150;
    const width = 300;
    const padTop = 20;
    const padBottom = 20;
    const drawHeight = height - (padTop + padBottom);

    const maxVal = Math.max(...data, 1);
    const minVal = 0;
    const range = maxVal - minVal;

    const getY = (val: number) => {
        if (range === 0) return height / 2;
        const normalized = (val - minVal) / range;
        return (height - padBottom) - (normalized * drawHeight);
    };

    const getX = (index: number) => (index / (data.length - 1)) * width;

    let pathD = `M ${getX(0)} ${getY(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
        const x_mid = (getX(i) + getX(i + 1)) / 2;
        const y_mid = (getY(data[i]) + getY(data[i + 1])) / 2;
        pathD += ` Q ${getX(i)} ${getY(data[i])}, ${x_mid} ${y_mid}`;
        pathD += ` Q ${getX(i+1)} ${getY(data[i+1])}, ${getX(i+1)} ${getY(data[i+1])}`;
    }

    const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
    const color = '#00F2FF'; // Hardcoded to cyan for mining
    const barWidth = width / (data.length * 2);

    return (
      <svg key={key} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
         <defs>
            <linearGradient id="grad-mining" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
               <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
         </defs>
         
         <g className="grid-lines" opacity="0.1">
            {[...Array(5)].map((_, i) => ( <line key={`h-${i}`} x1="0" y1={(height/4)*i} x2={width} y2={(height/4)*i} stroke={color} strokeWidth="0.5"/> ))}
            {[...Array(10)].map((_, i) => ( <line key={`v-${i}`} x1={(width/9)*i} y1="0" x2={(width/9)*i} y2={height} stroke={color} strokeWidth="0.5"/> ))}
         </g>

         <g className="bars">
           {data.map((val, i) => ( <rect key={`bar-${i}`} x={getX(i) - barWidth/2} y={getY(val)} width={barWidth} height={height - getY(val)} fill={color} opacity="0.1" className="animate-bar-rise" style={{ animationDelay: `${i * 10}ms` }} /> ))}
         </g>

         <path d={fillD} fill="url(#grad-mining)" className="animate-fade-in" />
         <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" filter="url(#glow)" className="animate-draw" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
         <circle cx={getX(data.length - 1)} cy={getY(data[data.length - 1])} r="4" fill="#000" stroke={color} strokeWidth="2" className="animate-pulse" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full w-full px-4 pt-6 pb-32 overflow-y-auto relative no-scrollbar">
      <style>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .animate-draw { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 2s ease-out forwards; }
        @keyframes bar-rise { from { height: 0; y: ${150}; opacity: 0; } to { opacity: 0.1; } }
        .animate-bar-rise { animation: bar-rise 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
      
      <div className="flex justify-between items-center mb-6 z-30 relative">
          <h2 className="text-3xl font-display font-black text-white tracking-tighter uppercase drop-shadow-md">{t('stats_title')}</h2>
      </div>

      <div className="z-20 relative transform transition-transform hover:scale-[1.01] duration-300 mb-8">
          <div className="bg-black/80 backdrop-blur-xl rounded-[28px] p-5 border border-cyan-500/30 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col gap-3 ring-1 ring-white/10">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
             <div className="flex justify-between items-end relative z-10">
                <div className="flex flex-col">
                   <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-1 opacity-90 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee]"></div>
                      {t('stats_supply')}
                   </span>
                   <span className="text-3xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] leading-none mt-1">
                      {Math.floor(network.totalMined).toLocaleString()}
                   </span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">REMAINING</span>
                   <span className="text-base font-mono font-bold text-slate-200 tracking-tight">
                      {Math.floor(remainingSupply).toLocaleString()}
                   </span>
                   <span className="text-[9px] text-cyan-500 font-mono mt-0.5">{percentMined.toFixed(2)}% MINED</span>
                </div>
             </div>
             <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative mt-1 shadow-inner">
                 <div 
                   className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_10px_#22d3ee]"
                   style={{ width: `${percentMined}%` }}
                 ></div>
             </div>
          </div>
      </div>

      <div className="z-10 relative glass-card p-4 rounded-[28px] mb-8 border border-white/10">
         <div className="flex justify-between items-center mb-4 px-2">
             <div className="flex flex-col">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-white">NETWORK ACTIVITY</h3>
                 <p className="text-[10px] text-neuro-textSec font-mono">Global Hashrate</p>
             </div>
             <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                {(['1H', '24H', '7D'] as TimeFrame[]).map(tf => (<button key={tf} onClick={() => setTimeFrame(tf)} className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-colors ${timeFrame === tf ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{tf}</button>))}
             </div>
         </div>
         <div className="h-40 w-full rounded-b-xl relative overflow-hidden">
            <div className="p-0">{renderModernGraph()}</div>
         </div>
         <div className="p-1 mt-4">
            <button onClick={onOpenPriceChart} className="w-full py-3 bg-blue-600/20 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600/40 transition-colors">
                TRADE VIEW
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 z-10 relative">
          <div className="glass-card p-4 rounded-2xl border-l-2 border-emerald-500/80 shadow-lg">
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t('stats_hashrate')} (GLOBAL)</div>
             <div className="text-lg font-mono font-bold text-emerald-400 truncate drop-shadow-md" title={formatHashrate(network.networkHashRate)}>{formatHashrate(network.networkHashRate)}</div>
          </div>
          <div className="glass-card p-4 rounded-2xl border-l-2 border-amber-500/80 shadow-lg">
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t('mining_difficulty')}</div>
             <div className="text-lg font-mono font-bold text-amber-400 truncate drop-shadow-md">{formatDifficulty(network.difficulty)}</div>
          </div>
      </div>

      <div className="z-10 relative">
         <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2 px-2"><span>🏆</span> {t('stats_leaderboard')}</h3>
         <div className="flex flex-col gap-2">
            {leaderboard.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">Scanning network nodes...</div>
            ) : leaderboard.map((entry) => {
               const isMe = entry.id === user.id;
               return (
                 <div key={entry.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all relative overflow-hidden ${entry.isWhale ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : isMe ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}>
                    {entry.isWhale && <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-400 to-transparent opacity-20"></div>}
                    <div className="flex items-center gap-4 relative z-10">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg ${entry.rank === 1 ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-400'}`}>{entry.rank === 1 ? '👑' : entry.rank}</div>
                       <div>
                          <div className={`flex items-center gap-1 font-bold text-sm ${isMe ? 'text-cyan-400' : 'text-white'}`}>
                             <span className="max-w-[120px] truncate">{entry.username}</span>
                             {entry.isPremium && <span className="text-[10px]">💠</span>}
                             {isMe && <span className="text-[8px] bg-cyan-900 px-1 rounded ml-1 border border-cyan-500/30">YOU</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{formatHashrate(entry.hashrate)}/s</div>
                       </div>
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-300 relative z-10">{Math.floor(entry.balanceNRC).toLocaleString()}</div>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};
