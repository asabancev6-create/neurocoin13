
import React, { useState, useMemo, useEffect } from 'react';
import { ShopItem, UserProfile, ShopCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { calculatePrice } from '../constants';

interface PremiumCardProps {
  user: UserProfile;
  onBuyPremium: (duration: number, priceStars: number) => void;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ user, onBuyPremium }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(true);

  // Real-time countdown logic
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expiry = user.premiumExpiry || 0;
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('00d 00h 00m 00s');
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days.toString().padStart(2, '0')}d : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user.premiumExpiry]);

  const premiumOptions = [
    { duration: 7, priceStars: 500, label: '7 Days', tag: 'STARTER' },
    { duration: 30, priceStars: 1500, label: '30 Days', tag: 'POPULAR' },
    { duration: 180, priceStars: 8000, label: '180 Days', tag: 'BEST VALUE' }
  ];

  return (
    <div className="relative w-full mb-8 group">
      {/* Golden Glow Background */}
      <div className="absolute -inset-0.5 bg-gradient-gold rounded-[32px] blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
      
      <div className="relative overflow-hidden rounded-[30px] glass-card shadow-2xl">
        <div className="p-6 relative z-10">
          
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-3xl shadow-[0_0_15px_#FFB800]">
                  👑
                </div>
                <div>
                   <h3 className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-gold uppercase tracking-widest drop-shadow-sm">
                     PREMIUM VIP
                   </h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${!isExpired ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className={`text-[10px] font-bold tracking-widest uppercase ${!isExpired ? 'text-green-400' : 'text-slate-500'}`}>
                        {!isExpired ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE'}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* TIMER DISPLAY */}
          {!isExpired && (
            <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-neuro-gold/30 text-center relative overflow-hidden">
               <p className="text-[10px] text-neuro-gold font-bold uppercase tracking-[0.3em] mb-1">TIME REMAINING</p>
               <p className="text-2xl font-mono font-bold text-white tracking-wider tabular-nums">
                 {timeLeft}
               </p>
            </div>
          )}

          {/* BUY OPTIONS */}
          <div>
            <p className="text-[10px] text-neuro-textSec font-bold uppercase tracking-widest mb-3 ml-1">
               {!isExpired ? 'EXTEND SUBSCRIPTION' : 'CHOOSE PLAN'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {premiumOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => onBuyPremium(opt.duration, opt.priceStars)}
                  className="relative group/btn flex flex-col items-center justify-center py-3 px-2 bg-white/5 hover:bg-neuro-gold/10 border border-white/10 hover:border-neuro-gold/60 rounded-xl transition-all active:scale-95"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black border border-neuro-gold/30 text-[8px] text-neuro-gold font-bold px-2 rounded-full uppercase tracking-wider whitespace-nowrap z-10">
                    {opt.tag}
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover/btn:text-white mt-1">{opt.label}</span>
                  <span className="text-sm font-black text-white mt-0.5 flex items-center gap-1">{opt.priceStars} <span className="text-yellow-400">⭐️</span></span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

interface UpgradesViewProps {
  user: UserProfile;
  items: ShopItem[];
  onBuy: (itemId: string, currency: 'TON' | 'NRC' | 'STARS') => Promise<boolean>;
  onBuyPremium: (duration: number, priceStars: number) => void;
}

export const UpgradesView: React.FC<UpgradesViewProps> = ({ user, items, onBuy, onBuyPremium }) => {
  const { t, language } = useLanguage();
  const [activeCat, setActiveCat] = useState<ShopCategory>('UPGRADES');
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  useEffect(() => {
    setBuyingItemId(null);
  }, [user]);

  const filteredItems = useMemo(() => items.filter(i => i.category === activeCat), [items, activeCat]);

  const categories: { id: ShopCategory; label: string; icon: string }[] = [
    { id: 'UPGRADES', label: t('shop_cat_upgrades'), icon: '⚡' },
    { id: 'MINERS', label: t('shop_cat_miners'), icon: '⛏️' },
    { id: 'FARMS', label: t('shop_cat_farms'), icon: '🏭' },
    { id: 'STORE', label: t('shop_cat_store'), icon: '💎' },
  ];

  const handleBuyClick = async (itemId: string, currency: 'TON' | 'NRC' | 'STARS') => {
    if (buyingItemId) return;
    setBuyingItemId(itemId);
    const success = await onBuy(itemId, currency);
    if (!success) {
      setTimeout(() => setBuyingItemId(null), 500);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER SECTION */}
      <div className="shrink-0 px-4 pt-6 bg-black/90 backdrop-blur-xl z-20 pb-2 border-b border-neuro-primary/20 sticky top-0">
         <div className="flex items-end justify-between mb-6 max-w-md mx-auto w-full">
            <div>
               <h2 className="text-3xl font-display font-black text-white tracking-tighter uppercase drop-shadow-md">
                 {t('shop_title')}
               </h2>
               <div className="h-1 w-12 bg-gradient-primary rounded-full mt-1"></div>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
               <span className="text-[10px] text-neuro-textSec font-bold uppercase">BALANCE</span>
               <span className="text-sm font-mono font-bold text-neuro-cyan drop-shadow-[0_0_5px_#00F0FF]">{Math.floor(user.balanceNRC).toLocaleString()}</span>
            </div>
         </div>
         
         {/* CATEGORY TABS */}
         <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-md mx-auto w-full gap-1 mb-2">
           {categories.map(cat => ( 
             <button 
                key={cat.id} 
                onClick={() => setActiveCat(cat.id)} 
                className={`flex-1 py-3 px-2 rounded-xl transition-all relative overflow-hidden group min-w-[80px] flex flex-col items-center justify-center gap-1 ${activeCat === cat.id ? 'bg-white/10 shadow-lg border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
             >
                <span className={`text-lg transition-transform ${activeCat === cat.id ? 'scale-110' : 'grayscale opacity-60'}`}>{cat.icon}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${activeCat === cat.id ? 'text-white' : 'text-neuro-textSec'}`}>{cat.label}</span>
                {activeCat === cat.id && <div className="absolute bottom-1 w-1 h-1 bg-neuro-primary rounded-full box-shadow-glow"></div>}
             </button>
           ))}
         </div>
      </div>

      {/* ITEMS GRID */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        <div className="max-w-md mx-auto space-y-4">
          
          {activeCat === 'STORE' && <PremiumCard user={user} onBuyPremium={onBuyPremium} />}
          
          {filteredItems.map((item) => {
            const currentLevel = user.inventory[item.id] || 0;
            const isMaxed = currentLevel >= item.maxLevel;
            const isSoldOut = item.globalLimit && (item.globalSold || 0) >= item.globalLimit;
            const isBuying = buyingItemId === item.id;
            
            const priceTON = calculatePrice(item.baseCostTON, item.growthFactorTON, currentLevel);
            const priceNRC = calculatePrice(item.baseCostNRC, item.growthFactorNRC, currentLevel);
            const priceStars = calculatePrice(item.baseCostStars || 0, item.growthFactorStars || 0, currentLevel);
            
            const canAffordNRC = user.balanceNRC >= priceNRC;

            const hasTonPrice = item.baseCostTON > 0;
            const hasNrcPrice = item.baseCostNRC > 0;
            const hasStarPrice = (item.baseCostStars || 0) > 0;

            return (
              <div key={item.id} className={`relative glass-card rounded-[24px] overflow-hidden transition-transform active:scale-[0.99] ${isMaxed ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                 <div className="p-5 flex gap-5">
                    {/* ICON BOX */}
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden group">
                            <span className="relative z-10 drop-shadow-md transform transition-transform group-hover:scale-110">{item.icon}</span>
                            
                            {/* LIMITED BADGE */}
                            {item.globalLimit && (
                              <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg z-20 shadow-md">
                                 SOLD: {item.globalSold || 0}/{item.globalLimit}
                              </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-[9px] font-mono font-bold text-neuro-textSec px-2 py-0.5 rounded border border-white/10 shadow-sm whitespace-nowrap">
                            LVL {currentLevel} <span className="opacity-50">/ {item.maxLevel}</span>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <h3 className="font-sans font-bold text-white text-lg leading-tight mb-1 truncate">{item.name[language]}</h3>
                       <p className="text-[11px] text-neuro-textSec font-medium leading-snug mb-2 line-clamp-2">{item.description[language]}</p>
                       
                       {/* STATS PILLS */}
                       {!isMaxed && !isSoldOut && (
                         <div className="flex flex-wrap gap-2">
                            {item.effectType === 'CLICK' && ( 
                                <div className="flex items-center gap-1 bg-neuro-gold/10 border border-neuro-gold/20 rounded-md px-1.5 py-0.5">
                                    <span className="text-[9px] font-bold text-neuro-gold uppercase">+{item.effectValue} CLICK</span> 
                                </div>
                            )}
                            {(item.effectType === 'PASSIVE' || item.effectType === 'GLOBAL_MINER') && ( 
                                <div className="flex items-center gap-1 bg-neuro-cyan/10 border border-neuro-cyan/20 rounded-md px-1.5 py-0.5">
                                    <span className="text-[9px] font-bold text-neuro-cyan uppercase">+{item.effectValue} AUTO</span> 
                                </div>
                            )}
                         </div>
                       )}
                    </div>
                 </div>

                 {/* ACTION AREA */}
                 <div className="p-5 pt-0 mt-1 flex gap-2 flex-wrap">
                   {!isMaxed && !isSoldOut ? (
                     <>
                      {/* STARS BUTTON */}
                      {hasStarPrice && (
                        <button
                          onClick={() => handleBuyClick(item.id, 'STARS')}
                          disabled={isBuying}
                          className="flex-1 py-3 bg-gradient-gold rounded-xl relative overflow-hidden group shadow-[0_4px_20px_rgba(255,184,0,0.3)] active:shadow-none active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                        >
                             <div className="flex flex-col items-center justify-center leading-none text-black">
                                <span className="text-[10px] font-black uppercase tracking-wider mb-0.5">{isBuying ? '...' : 'STAR'}</span>
                                <span className="text-sm font-black flex items-center gap-1">
                                    {priceStars.toLocaleString('en-US', { maximumFractionDigits: 0 })} ⭐️
                                </span>
                             </div>
                        </button>
                      )}

                      {/* TON BUTTON */}
                      {hasTonPrice && ( 
                          <button 
                            onClick={() => handleBuyClick(item.id, 'TON')} 
                            disabled={isBuying} 
                            className="flex-1 py-3 bg-blue-600 rounded-xl relative overflow-hidden group shadow-lg active:shadow-none active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                          >
                             <div className="flex flex-col items-center justify-center leading-none text-white">
                                <span className="text-[10px] font-black uppercase tracking-wider mb-0.5">{isBuying ? '...' : 'TON'}</span>
                                <span className="text-sm font-black flex items-center gap-1">
                                    {priceTON.toFixed(2)}
                                </span>
                             </div>
                          </button> 
                      )}
                      
                      {/* NRC BUTTON */}
                      {hasNrcPrice && ( 
                          <button 
                            onClick={() => handleBuyClick(item.id, 'NRC')} 
                            disabled={!canAffordNRC || isBuying} 
                            className={`flex-1 py-3 rounded-xl relative overflow-hidden group active:shadow-none active:translate-y-[2px] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed min-w-[80px]
                                ${canAffordNRC ? 'bg-neuro-primary text-white shadow-[0_0_15px_rgba(141,115,255,0.4)]' : 'bg-white/10 text-neuro-textSec'}`}
                          >
                             <div className="flex flex-col items-center justify-center leading-none">
                                <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5`}>{isBuying ? '...' : 'NRC'}</span>
                                <span className={`text-sm font-black flex items-center gap-1`}>
                                    {priceNRC.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </span>
                             </div>
                          </button> 
                      )}
                     </>
                   ) : ( 
                     <div className="w-full py-3 bg-white/5 rounded-xl text-center border border-white/5 flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-black text-neuro-textSec uppercase tracking-[0.2em]">{isSoldOut ? 'SOLD OUT' : 'MAX LEVEL'}</span>
                     </div> 
                   )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
