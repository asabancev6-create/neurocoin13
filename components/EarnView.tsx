
import React, { useState, useEffect } from 'react';
import { UserProfile, Task, NetworkState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface EarnViewProps {
  user: UserProfile;
  network: NetworkState;
  onClaimDaily: () => void;
  onCompleteTask: (taskId: string) => void;
  onGetTask: () => void;
  currentTask: Task | null;
  dailyBonusAmount: number;
  allTasks?: Task[];
}

export const EarnView: React.FC<EarnViewProps> = ({ user, network, dailyBonusAmount, onClaimDaily, onCompleteTask, allTasks = [] }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'FRIENDS'>('TASKS');
  const [claimableDaily, setClaimableDaily] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Daily Timer Logic
  useEffect(() => {
    const checkDaily = () => {
      const now = Date.now();
      const lastClaim = user.lastDailyBonusClaim || 0;
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastClaim >= oneDay) {
        setClaimableDaily(true);
        setTimeLeft('');
      } else {
        setClaimableDaily(false);
        const diff = oneDay - (now - lastClaim);
        const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft(`${h} : ${m} : ${s}`);
      }
    };
    checkDaily();
    const interval = setInterval(checkDaily, 1000);
    return () => clearInterval(interval);
  }, [user.lastDailyBonusClaim]);
  
  const handleDailyClaimClick = () => {
    if (!claimableDaily || network.rewardPool < dailyBonusAmount) return;
    navigator.vibrate?.(30);
    onClaimDaily();
  };

  const handleTaskClick = (task: Task) => {
    if (user.completedTasks.includes(task.id)) return;
    navigator.vibrate?.(20);
    onCompleteTask(task.id);
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText(`https://t.me/neurocoin_bot?start=${user.id}`);
    alert('Link copied!');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-4 py-4 overflow-y-auto pb-32 no-scrollbar">
       
       {/* HEADER TABS */}
       <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
          <button 
            onClick={() => setActiveTab('TASKS')} 
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'TASKS' ? 'bg-white/10 text-white shadow-lg' : 'text-neuro-textSec'}`}
          >
            {t('earn_tab_tasks')}
          </button>
          <button 
            onClick={() => setActiveTab('FRIENDS')} 
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'FRIENDS' ? 'bg-white/10 text-white shadow-lg' : 'text-neuro-textSec'}`}
          >
            {t('earn_tab_referrals')}
          </button>
       </div>

       {activeTab === 'TASKS' && (
         <div className="space-y-6">
            
            {/* DAILY BONUS CARD */}
            <div className="relative w-full aspect-[16/10] rounded-[32px] overflow-hidden glass-card shadow-glow group cursor-pointer border border-neuro-primary/30" onClick={handleDailyClaimClick}>
               {/* Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-neuro-primary/20 via-transparent to-neuro-cyan/20 opacity-50"></div>
               
               <div className="absolute inset-0 flex flex-col items-center justify-between p-6 relative z-10">
                  <div className="text-center mt-2">
                     <h2 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-primary uppercase tracking-tighter drop-shadow-sm">
                        DAILY NEURO
                     </h2>
                     <p className="text-xs text-neuro-textSec font-bold tracking-widest mt-1">LOGIN REWARD</p>
                  </div>

                  {claimableDaily ? (
                      <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center shadow-[0_0_30px_#FFB800] animate-pulse">
                          <span className="text-4xl">🎁</span>
                      </div>
                  ) : (
                      <div className="text-2xl font-mono font-bold text-white bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                          {timeLeft}
                      </div>
                  )}

                  <button 
                    disabled={!claimableDaily}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${claimableDaily ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_white]' : 'bg-white/10 text-slate-400 cursor-not-allowed'}`}
                  >
                    {claimableDaily ? `CLAIM +${dailyBonusAmount} NRC` : 'LOCKED'}
                  </button>
               </div>
            </div>

            {/* TASKS LIST */}
            <div className="space-y-3">
               <h3 className="text-xs text-neuro-textSec font-bold uppercase tracking-widest px-1 mb-2">{t('earn_tasks_list')}</h3>
               
               {allTasks.length > 0 ? (
                 allTasks.map(task => {
                   const isCompleted = user.completedTasks.includes(task.id);
                   return (
                     <div key={task.id} className="w-full h-[72px] rounded-2xl glass-card flex items-center px-4 gap-4 transition-transform active:scale-98">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isCompleted ? 'bg-white/5 grayscale' : 'bg-neuro-primary/20 text-neuro-primary'}`}>
                           {task.imageUrl ? <img src={task.imageUrl} alt="" className="w-full h-full object-cover rounded-xl"/> : '⚡'}
                         </div>
                         <div className="flex flex-col flex-1 min-w-0">
                            <span className={`text-sm font-bold truncate ${isCompleted ? 'text-neuro-textSec line-through' : 'text-white'}`}>{task.title}</span>
                            <span className="text-[10px] text-neuro-cyan font-mono shadow-[0_0_5px_#00F0FF]">+{task.reward} NRC</span>
                         </div>
                         <button 
                            onClick={() => handleTaskClick(task)} 
                            disabled={isCompleted} 
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                         >
                            {isCompleted ? '✓' : '➜'}
                         </button>
                      </div>
                   )
                 })
               ) : (
                 <div className="w-full p-6 text-center text-neuro-textSec text-xs border border-dashed border-white/10 rounded-2xl">
                    No active tasks
                 </div>
               )}
            </div>
         </div>
       )}

       {activeTab === 'FRIENDS' && (
          <div className="space-y-6">
             <div className="p-6 rounded-[32px] text-center shadow-glow relative overflow-hidden bg-gradient-to-br from-[#00F0FF] to-[#8D73FF]">
                <div className="relative z-10">
                    <div className="text-5xl mb-2">🤝</div>
                    <h3 className="text-xl font-bold text-black mb-1">{t('earn_ref_title')}</h3>
                    <p className="text-xs text-black/70 mb-6 font-medium">{t('earn_ref_desc')}</p>
                    
                    <div className="flex gap-2 justify-center mb-6">
                        <div className="bg-white/30 backdrop-blur-md p-2 rounded-xl min-w-[80px]">
                            <div className="text-[10px] uppercase font-bold text-black/60">{t('earn_ref_friends')}</div>
                            <div className="text-lg font-bold text-black">{user.referrals}</div>
                        </div>
                         <div className="bg-white/30 backdrop-blur-md p-2 rounded-xl min-w-[80px]">
                            <div className="text-[10px] uppercase font-bold text-black/60">{t('earn_ref_earned')}</div>
                            <div className="text-lg font-bold text-black">{user.referralEarnings}</div>
                        </div>
                    </div>

                    <button onClick={copyRefLink} className="w-full py-3 bg-black text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                        Invite Friends
                    </button>
                </div>
             </div>
             
             <div className="space-y-3">
               <h3 className="text-xs text-neuro-textSec font-bold uppercase tracking-widest px-1">Your Network</h3>
               {user.referrals === 0 && (
                   <div className="flex flex-col items-center justify-center p-8 glass-card rounded-2xl">
                       <span className="text-2xl mb-2 grayscale opacity-50">🌱</span>
                       <span className="text-xs text-neuro-textSec">Start growing your network</span>
                   </div>
               )}
             </div>
          </div>
       )}
    </div>
  );
};
