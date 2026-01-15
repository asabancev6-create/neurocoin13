
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppTheme, UserProfile } from '../types';
import { ADMIN_USER_IDS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currentTheme: AppTheme;
  setTheme: (t: AppTheme) => void;
  onBuyEffect: (type: 'AVATAR' | 'NAME') => void;
  onBuyTheme: (theme: AppTheme, price: number) => void;
  onOpenAdmin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, user, currentTheme, setTheme, onBuyEffect, onBuyTheme, onOpenAdmin
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [adminTapCount, setAdminTapCount] = useState(0);

  if (!isOpen) return null;

  const handleIdClick = () => {
    if (!ADMIN_USER_IDS.includes(user.id)) return;
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      onOpenAdmin();
      setAdminTapCount(0);
      onClose();
    }
  };

  const hasTheme = (theme: AppTheme) => (user.purchasedThemes || ['NEON', 'GOLD', 'MATRIX']).includes(theme);

  const premiumThemes: { id: AppTheme; name: string; price: number; style: string }[] = [
    { id: 'VIOLET', name: 'NEON-VIOLET', price: 5, style: 'border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
    { id: 'LIGHT', name: 'LIGHT', price: 5, style: 'border-sky-500 bg-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]' },
  ];

  // TROPHIES CONFIGURATION
  const trophies = [
    { 
      id: 'lvl1000', 
      title: t('trophy_lvl1000_title'), 
      desc: t('trophy_lvl1000_desc'), 
      progress: Math.min(100, (user.level / 1000) * 100),
      current: user.level,
      target: 1000,
      reward: '3 TON',
      unlocked: user.level >= 1000,
      icon: '🧠'
    },
    { 
      id: 'block', 
      title: t('trophy_block_title'), 
      desc: t('trophy_block_desc'), 
      progress: user.blocksMined > 0 ? 100 : 0,
      current: user.blocksMined,
      target: 1,
      reward: '3 TON',
      unlocked: user.blocksMined > 0,
      icon: '⛏️'
    },
    { 
      id: 'balance', 
      title: t('trophy_balance_title'), 
      desc: t('trophy_balance_desc'), 
      progress: Math.min(100, (user.balanceNRC / 1000) * 100),
      current: Math.floor(user.balanceNRC),
      target: 1000,
      reward: '3 TON',
      unlocked: user.balanceNRC >= 1000,
      icon: '🐋'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1a1d24] to-black border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 relative shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter">{t('settings_title')}</h2>
            <div className="h-1 w-12 bg-cyan-500 rounded-full mt-1"></div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">✕</button>
        </div>

        {/* Language Section */}
        <div className="mb-8">
           <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4 block ml-1">{t('settings_lang')}</label>
           <div className="flex gap-4">
              <button 
                onClick={() => setLanguage('ru')} 
                className={`flex-1 h-14 rounded-2xl font-bold transition-all active:scale-95 relative overflow-hidden group border ${language === 'ru' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'}`}
              >
                <div className="absolute inset-0 bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">🇷🇺 RUSSIAN</span>
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`flex-1 h-14 rounded-2xl font-bold transition-all active:scale-95 relative overflow-hidden group border ${language === 'en' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'}`}
              >
                 <div className="absolute inset-0 bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <span className="relative z-10 flex items-center justify-center gap-2">🇺🇸 ENGLISH</span>
              </button>
           </div>
        </div>

        {/* Theme Section */}
        <div className="mb-8">
           <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4 block ml-1">{t('settings_theme')}</label>
           <div className="grid grid-cols-3 gap-3">
              {[
                  { id: 'NEON', color: 'cyan' }, 
                  { id: 'GOLD', color: 'amber' }, 
                  { id: 'MATRIX', color: 'green' }
              ].map((theme) => (
                  <button 
                    key={theme.id} 
                    onClick={() => setTheme(theme.id as AppTheme)} 
                    className={`h-12 rounded-xl border font-bold text-[10px] tracking-wider transition-all active:scale-95 flex items-center justify-center
                        ${currentTheme === theme.id 
                            ? `border-${theme.color}-500 bg-${theme.color}-500/10 text-${theme.color}-400 shadow-[0_0_15px_rgba(var(--color-${theme.color}-500),0.3)]` 
                            : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                        }`}
                  >
                      {theme.id}
                  </button>
              ))}
           </div>
           
           <div className="grid grid-cols-2 gap-3 mt-3">
              {premiumThemes.map(theme => (
                 hasTheme(theme.id) ? (
                   <button key={theme.id} onClick={() => setTheme(theme.id)} className={`h-12 rounded-xl border font-bold text-[10px] tracking-wider transition-all active:scale-95 ${currentTheme === theme.id ? theme.style : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/20'}`}>{theme.name}</button>
                 ) : (
                   <button key={theme.id} disabled className="h-12 rounded-xl border border-dashed border-white/10 bg-black/20 text-white font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 cursor-not-allowed group">
                       <span className="opacity-60 group-hover:opacity-80 transition-opacity">{theme.name}</span>
                       <span className="text-amber-400 text-[9px] uppercase tracking-wider">СКОРО</span>
                   </button>
                 )
              ))}
           </div>
        </div>
        
        {/* Effects Section */}
        <div className="mb-8">
           <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4 block ml-1">{t('settings_effects')}</label>
           <div className="space-y-3">
              <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-sm text-white">{t('settings_avatar_glow')}</h4>
                    <p className="text-[10px] text-slate-400">{t('settings_avatar_desc')}</p>
                 </div>
                 <button disabled className="px-5 py-2 rounded-lg bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-white/10">
                    СКОРО
                 </button>
              </div>
              <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-sm text-white">{t('settings_name_glow')}</h4>
                    <p className="text-[10px] text-slate-400">{t('settings_avatar_desc')}</p>
                 </div>
                 <button disabled className="px-5 py-2 rounded-lg bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-white/10">
                    СКОРО
                 </button>
              </div>
           </div>
        </div>

        {/* TROPHIES SECTION */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 ml-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{t('settings_trophies')}</label>
                <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-bold">{t('settings_rewards_avail')}</span>
            </div>
            
            <div className="space-y-3">
                {trophies.map((trophy) => (
                    <div key={trophy.id} className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${trophy.unlocked ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${trophy.unlocked ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' : 'bg-slate-800 text-slate-600 grayscale'}`}>
                                {trophy.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={`font-bold text-sm tracking-wide ${trophy.unlocked ? 'text-white' : 'text-slate-500'}`}>{trophy.title}</h4>
                                    {trophy.unlocked && <span className="text-[10px] bg-yellow-500 text-black font-bold px-1.5 rounded">{t('settings_claimed')}</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mb-2">{trophy.desc}</p>
                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${trophy.unlocked ? 'bg-yellow-400' : 'bg-slate-700'}`} style={{ width: `${trophy.progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Reward Tag */}
                        <div className="mt-3 flex justify-end">
                            <div className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${trophy.unlocked ? 'text-yellow-300 border-yellow-500/30 bg-yellow-900/20' : 'text-slate-600 border-white/5 bg-black/20'}`}>
                                {t('settings_reward_label')}: {trophy.reward}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer / User ID */}
        <div className={`text-center pt-6 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity ${ADMIN_USER_IDS.includes(user.id) ? 'cursor-pointer' : 'cursor-default'}`} onClick={handleIdClick}>
           <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">{t('settings_userid')}</div>
           <div className="text-sm font-mono text-white/40 select-none">#{user.id.replace('user_', '').padStart(4, '0')}</div>
           {adminTapCount > 0 && ADMIN_USER_IDS.includes(user.id) && (<div className="text-[9px] text-red-500 mt-1">Dev Mode: {5 - adminTapCount}</div>)}
        </div>

      </div>
      <style>{`
         .custom-scrollbar::-webkit-scrollbar{width:4px}
         .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
         .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
      `}</style>
    </div>
  );
};
