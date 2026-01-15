
import React, { useState, useEffect } from 'react';
import { UserProfile, NetworkState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { hapticFeedback, hapticNotification } from '../utils/telegram';

interface CasinoViewProps {
  user: UserProfile;
  network: NetworkState;
  onAction: (action: { type: string, payload: any }) => void;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🧠'];
const BET_AMOUNTS = [10, 50, 100, 500];

type GameType = 'SLOTS' | 'LOTTERY' | 'ROULETTE' | 'CRASH' | 'EGGS';

export const CasinoView: React.FC<CasinoViewProps> = ({ user, network, onAction }) => {
  const { t } = useLanguage();
  
  const [activeView, setActiveView] = useState<'LOBBY' | GameType>('LOBBY');
  const [activeTab, setActiveTab] = useState<'GAMES' | 'SOCIAL'>('GAMES');
  
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [betIndex, setBetIndex] = useState(0);
  const [isTurbo] = useState(false); // Turbo mode can be implemented later
  const [currency] = useState<'NRC' | 'TON'>('NRC');

  const currentBet = BET_AMOUNTS[betIndex];
  const currentBalance = currency === 'NRC' ? user.balanceNRC : user.balanceTON;

  const handleSpin = () => {
    if (spinning || currentBalance < currentBet) {
        if (currentBalance < currentBet) hapticNotification('error');
        return;
    }
    hapticFeedback('medium');
    setSpinning(true);
    onAction({ type: 'SPIN_SLOT', payload: { bet: currentBet, currency } });
    // This timeout is purely for animation; server will determine the result
    const duration = isTurbo ? 300 : 1500;
    setTimeout(() => {
        setSpinning(false);
        hapticFeedback('light');
    }, duration);
  };

  const SlotsInterface = () => (
    <div className="flex flex-col h-full w-full max-w-md mx-auto animate-fade-in">
      {/* Game Header */}
      <div className="flex items-center justify-between p-4 shrink-0">
        <button onClick={() => setActiveView('LOBBY')} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-sm font-bold tracking-widest uppercase">{t('casino_tab_slots')}</div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 flex flex-col justify-between p-4">
        {/* Jackpot Display */}
        <div className="text-center">
            <div className="text-xs font-bold text-neuro-accent tracking-[0.2em]">{t('casino_jackpot')}</div>
            <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-neuro-accent to-purple-400">
                {Math.floor(network.casinoJackpot).toLocaleString()}
            </div>
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-slate-800 to-black p-1.5 rounded-3xl border-4 border-slate-700 shadow-xl my-6">
            <div className="bg-black rounded-2xl border-2 border-fuchsia-500/50 p-0.5 shadow-inner overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-20 opacity-20"></div>
                <div className="bg-slate-900 h-28 flex items-center gap-[1px] rounded-xl overflow-hidden relative">
                {[0, 1, 2].map(i => ( 
                    <div key={i} className="flex-1 h-full bg-slate-950 flex items-center justify-center relative border-r border-white/5 last:border-0">
                    <div className={`font-display text-4xl transition-all duration-100 z-10 ${spinning ? 'blur-sm translate-y-4 opacity-50' : 'drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'}`}>
                        {reels[i]}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80 z-10 pointer-events-none"></div>
                    </div> 
                ))}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/80 z-20 shadow-[0_0_10px_red]"></div>
                </div>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-t-3xl p-6 border-t border-white/10 shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Balance</span>
                <span className="text-lg font-mono font-bold">{Math.floor(currentBalance).toLocaleString()} {currency}</span>
            </div>
            <div className="flex bg-black/40 rounded-lg p-0.5">
                {BET_AMOUNTS.map((amt, idx) => (
                    <button key={amt} onClick={() => setBetIndex(idx)} className={`w-10 h-8 rounded-md text-xs font-bold ${betIndex === idx ? 'bg-white text-black' : 'text-slate-500'}`}>{amt}</button>
                ))}
            </div>
        </div>
        <button 
            onClick={handleSpin} 
            disabled={spinning || currentBalance < currentBet} 
            className="w-full py-4 rounded-2xl font-display text-xl font-black uppercase tracking-widest text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-[0_5px_20px_rgba(192,38,211,0.4)] active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale"
        >
            {spinning ? '...' : t('casino_spin')}
        </button>
      </div>
    </div>
  );

  const Lobby = () => (
    <div className="flex flex-col gap-6 pb-32 pt-4 px-4 animate-fade-in">
        <div className="flex w-full border-b border-white/10">
            <button onClick={() => setActiveTab('GAMES')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider relative ${activeTab === 'GAMES' ? 'text-white' : 'text-slate-500'}`}>
                {t('tab_games')}
                {activeTab === 'GAMES' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neuro-accent shadow-[0_0_10px_#FF00E5]"></div>}
            </button>
        </div>

        {activeTab === 'GAMES' && (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setActiveView('SLOTS')} className="relative aspect-[4/5] rounded-3xl overflow-hidden group shadow-lg border border-white/10 active:scale-95 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-700"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:opacity-40 transition-opacity">🎰</div>
                        <div className="absolute bottom-4 left-4 text-left">
                            <h3 className="text-white font-bold text-base">Cyber Slots</h3>
                            <p className="text-white/70 text-[10px]">Classic Reels</p>
                        </div>
                    </button>
                     <button onClick={() => setActiveView('ROULETTE')} className="relative aspect-[4/5] rounded-3xl overflow-hidden group shadow-lg border border-white/10 active:scale-95 transition-transform">
                        <div className="absolute inset-0 bg-slate-800"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">🚧</div>
                        <div className="absolute bottom-4 left-4 text-left">
                            <h3 className="text-white font-bold text-base">Roulette</h3>
                            <p className="text-white/70 text-[10px]">Coming Soon</p>
                        </div>
                    </button>
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto overflow-y-auto no-scrollbar">
      {activeView === 'LOBBY' ? <Lobby /> : activeView === 'SLOTS' ? <SlotsInterface /> : (
          <div className="flex flex-col items-center justify-center h-full pb-32">
             <div className="text-4xl mb-4">🚧</div>
             <h2 className="text-xl font-bold mb-2">Under Construction</h2>
             <button onClick={() => setActiveView('LOBBY')} className="px-6 py-2 bg-white/10 rounded-full text-xs font-bold">BACK TO LOBBY</button>
          </div>
      )}
    </div>
  );
};
