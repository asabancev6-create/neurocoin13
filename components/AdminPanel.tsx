
import React, { useState, useEffect } from 'react';
import { NetworkState, Task } from '../types';
import { MAX_SUPPLY } from '../constants';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  network: NetworkState;
  allTasks: Task[];
  onUpdateNetwork: (updates: Partial<NetworkState>) => void;
  onAddTask?: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreditUser: (userId: string, amount: number, currency: 'TON' | 'NRC') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, network, allTasks, onUpdateNetwork, onAddTask, onDeleteTask, onCreditUser }) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [econInputs, setEconInputs] = useState({
      poolFee: (network.rewardPoolFeePercent * 100).toString(),
      sharedPool: (network.rewardSharedPoolPercent * 100).toString(),
      closerBonus: (network.rewardCloserBonusPercent * 100).toString(),
      dailyBonus: network.dailyBonusAmount.toString(),
  });
  
  const [casinoInputs, setCasinoInputs] = useState({
    jackpot: network.casinoJackpot.toString(),
    feedRate: (network.casinoJackpotFeedRate * 100).toString(),
    slotWin: (network.casinoSlotWinRate * 100).toString(),
    lotteryWin: (network.casinoLotteryWinRate * 100).toString(),
  });
  
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  // REMOVED CURRENCY SELECTION STATE - NRC ONLY

  const [newTask, setNewTask] = useState({ title: '', reward: '100', link: '', imageUrl: '' });

  useEffect(() => {
    if (isOpen) {
        setEconInputs({
            poolFee: (network.rewardPoolFeePercent * 100).toFixed(0),
            sharedPool: (network.rewardSharedPoolPercent * 100).toFixed(0),
            closerBonus: (network.rewardCloserBonusPercent * 100).toFixed(0),
            dailyBonus: network.dailyBonusAmount.toString(),
        });
        setCasinoInputs({
            jackpot: network.casinoJackpot.toString(),
            feedRate: (network.casinoJackpotFeedRate * 100).toFixed(1),
            slotWin: (network.casinoSlotWinRate * 100).toFixed(1),
            lotteryWin: (network.casinoLotteryWinRate * 100).toFixed(1),
        });
    }
  }, [isOpen, network]);

  if (!isOpen) return null;

  const percentMined = (network.totalMined / MAX_SUPPLY) * 100;
  
  const totalPercent = parseFloat(econInputs.closerBonus) + parseFloat(econInputs.sharedPool) + parseFloat(econInputs.poolFee);
  const totalPercentColor = totalPercent > 100 ? 'text-red-500' : totalPercent < 100 ? 'text-yellow-500' : 'text-green-500';

  const handleUpdateEconomics = () => {
    const updates = {
      rewardPoolFeePercent: parseFloat(econInputs.poolFee) / 100,
      rewardSharedPoolPercent: parseFloat(econInputs.sharedPool) / 100,
      rewardCloserBonusPercent: parseFloat(econInputs.closerBonus) / 100,
      dailyBonusAmount: parseFloat(econInputs.dailyBonus),
    };

    if (Object.values(updates).some(isNaN)) {
      return alert('Ошибка: все значения экономики должны быть числами.');
    }
    if (updates.rewardPoolFeePercent + updates.rewardSharedPoolPercent + updates.rewardCloserBonusPercent > 1.001) {
      return alert('Ошибка: сумма процентов распределения не может превышать 100%.');
    }
    onUpdateNetwork(updates);
    alert('Экономика обновлена!');
  };

  const handleUpdateCasino = () => {
    const updates = {
        casinoJackpot: parseFloat(casinoInputs.jackpot),
        casinoJackpotFeedRate: parseFloat(casinoInputs.feedRate) / 100,
        casinoSlotWinRate: parseFloat(casinoInputs.slotWin) / 100,
        casinoLotteryWinRate: parseFloat(casinoInputs.lotteryWin) / 100,
    };
    if (Object.values(updates).some(isNaN)) {
      return alert('Ошибка: все значения казино должны быть числами.');
    }
    onUpdateNetwork(updates);
    alert('Настройки казино обновлены!');
  };

  const handleTransferToLP = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || isNaN(amount) || amount <= 0 || amount > network.adminTreasury) {
      alert('Неверная сумма для перевода.');
      return;
    }
    onUpdateNetwork({
      adminTreasury: network.adminTreasury - amount,
      liquidityPoolTON: network.liquidityPoolTON + amount
    });
    setTransferAmount('');
    alert('Средства переведены в пул ликвидности.');
  };
  
  const handleCredit = () => {
      const amount = parseFloat(creditAmount);
      if (!creditUserId || isNaN(amount) || amount <= 0) {
          return alert('Введите корректный ID и сумму.');
      }
      // HARDCODED TO NRC
      onCreditUser(creditUserId, amount, 'NRC');
      setCreditUserId('');
      setCreditAmount('');
  };

  const handleCreateTask = () => {
      if (!newTask.title || !onAddTask) return;
      const reward = parseFloat(newTask.reward);
      const task: Task = {
          id: `task_${Date.now()}`,
          title: newTask.title,
          reward: isNaN(reward) ? 100 : reward,
          type: 'SOCIAL',
          link: newTask.link || undefined,
          imageUrl: newTask.imageUrl || undefined,
      };
      onAddTask(task);
      setNewTask({ title: '', reward: '100', link: '', imageUrl: '' });
      alert('Задание создано!');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black text-green-500 font-mono flex flex-col overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
      <div className="p-4 border-b border-green-500/30 bg-black/90 backdrop-blur-md flex justify-between items-center shrink-0 relative z-10">
        <h1 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2 text-green-400"><span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>АДМИН ПАНЕЛЬ v5.0 (HONEST)</h1>
        <button onClick={onClose} className="px-6 py-2 border border-green-500/50 hover:bg-green-500 hover:text-black transition-all text-xs font-bold tracking-widest uppercase rounded">[ ВЫХОД ]</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10 custom-scrollbar">
        
        <section className="border border-green-500/20 bg-green-900/5 p-5 rounded-xl">
          <h2 className="text-sm font-bold text-green-400 mb-4 uppercase tracking-widest border-b border-green-500/20 pb-2">/// ГЛОБАЛЬНАЯ СТАТИСТИКА</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-black/40 p-3 rounded"><div className="text-[10px] text-green-500">ОНЛАЙН</div><div className="text-lg font-bold text-white">{network.onlineUsers || 0}</div></div>
            <div className="bg-black/40 p-3 rounded"><div className="text-[10px] text-green-500">ВСЕГО ЮЗЕРОВ</div><div className="text-lg font-bold text-white">{network.totalUsers || 0}</div></div>
            <div className="bg-black/40 p-3 rounded"><div className="text-[10px] text-green-500">АКТИВНЫ ЗА 24Ч</div><div className="text-lg font-bold text-white">{network.dailyBonusEligibleUsers || 0}</div></div>
            <div className="bg-black/40 p-3 rounded"><div className="text-[10px] text-green-500">ДОБЫТО</div><div className="text-lg font-bold text-white">{percentMined.toFixed(2)}%</div></div>
          </div>
        </section>

        <section className="border border-cyan-500/20 bg-cyan-900/5 p-5 rounded-xl">
          <h2 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-widest border-b border-cyan-500/20 pb-2 flex justify-between items-center"><span>/// КАЗНА И ЭКОНОМИКА</span><button onClick={handleUpdateEconomics} className="text-[10px] bg-cyan-900 px-3 py-1 rounded text-white border border-cyan-500">СОХР.</button></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">КАЗНА (TON)</label><div className="font-bold text-white text-lg">{network.adminTreasury.toFixed(4)}</div></div>
            <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">ПУЛ ЛИКВ. (TON)</label><div className="font-bold text-white text-lg">{network.liquidityPoolTON.toFixed(4)}</div></div>
            <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">ПУЛ НАГРАД (NRC)</label><div className="font-bold text-white text-lg">{network.rewardPool.toLocaleString()}</div></div>
          </div>
          <div className="flex gap-2 mb-6">
            <input type="number" placeholder="Сумма TON из казны" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="flex-1 bg-black border border-cyan-500/30 p-2 text-white text-xs"/>
            <button onClick={handleTransferToLP} className="bg-cyan-600 text-white px-4 rounded text-xs font-bold">В ПУЛ ЛИКВИДНОСТИ &gt;&gt;</button>
          </div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex justify-between"><span>Распределение награды за блок</span><span className={`font-bold ${totalPercentColor}`}>ИТОГО: {totalPercent.toFixed(0)}%</span></h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">Награда майнеру (%)</label><input type="number" value={econInputs.closerBonus} onChange={e => setEconInputs(p => ({...p, closerBonus: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/><div className="text-[9px] text-slate-500 -mt-1">(Закрывшему блок)</div></div>
             <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">Распределить всем (%)</label><input type="number" value={econInputs.sharedPool} onChange={e => setEconInputs(p => ({...p, sharedPool: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/><div className="text-[9px] text-slate-500 -mt-1">(По доле хэша)</div></div>
             <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">В Пул Наград (%)</label><input type="number" value={econInputs.poolFee} onChange={e => setEconInputs(p => ({...p, poolFee: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/><div className="text-[9px] text-slate-500 -mt-1">(Казино/Бонусы)</div></div>
             <div className="bg-black/40 p-3 rounded"><label className="text-xs text-cyan-400 block">ЕЖЕДНЕВНЫЙ БОНУС (NRC)</label><input type="number" value={econInputs.dailyBonus} onChange={e => setEconInputs(p => ({...p, dailyBonus: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/></div>
          </div>
        </section>
        
        <section className="border border-purple-500/20 bg-purple-900/5 p-5 rounded-xl">
            <h2 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-widest border-b border-purple-500/20 pb-2 flex justify-between items-center"><span>/// УПРАВЛЕНИЕ КАЗИНО</span><button onClick={handleUpdateCasino} className="text-[10px] bg-purple-900 px-3 py-1 rounded text-white border border-purple-500">СОХР.</button></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-black/40 p-3 rounded"><label className="text-xs text-purple-400 block">Джекпот (NRC)</label><input type="number" value={casinoInputs.jackpot} onChange={e => setCasinoInputs(p => ({...p, jackpot: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/></div>
                 <div className="bg-black/40 p-3 rounded"><label className="text-xs text-purple-400 block">Отчисления в Джекпот (%)</label><input type="number" value={casinoInputs.feedRate} onChange={e => setCasinoInputs(p => ({...p, feedRate: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/></div>
                 <div className="bg-black/40 p-3 rounded"><label className="text-xs text-purple-400 block">Шанс в Слотах (%)</label><input type="number" value={casinoInputs.slotWin} onChange={e => setCasinoInputs(p => ({...p, slotWin: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/></div>
                 <div className="bg-black/40 p-3 rounded"><label className="text-xs text-purple-400 block">Шанс в Лотерее (%)</label><input type="number" value={casinoInputs.lotteryWin} onChange={e => setCasinoInputs(p => ({...p, lotteryWin: e.target.value}))} className="w-full bg-transparent p-0 text-white font-bold text-lg"/></div>
            </div>
        </section>

        <section className="border border-fuchsia-500/20 bg-fuchsia-900/5 p-5 rounded-xl">
           <h2 className="text-sm font-bold text-fuchsia-400 mb-4 uppercase tracking-widest border-b border-fuchsia-500/20 pb-2">/// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</h2>
           <div className="flex flex-col md:flex-row gap-2">
              <input placeholder="ID Пользователя" value={creditUserId} onChange={e => setCreditUserId(e.target.value)} className="md:w-1/3 bg-black border border-fuchsia-500/30 p-2 text-white text-xs"/>
              <input type="number" placeholder="Сумма" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} className="md:w-1/3 bg-black border border-fuchsia-500/30 p-2 text-white text-xs"/>
              {/* CURRENCY SELECT REMOVED - HONEST MINING ONLY */}
              <div className="md:w-1/6 bg-black border border-fuchsia-500/30 p-2 text-fuchsia-400 font-bold text-xs flex items-center justify-center">
                  NRC
              </div>
              <button onClick={handleCredit} className="flex-1 bg-fuchsia-600 text-white px-4 rounded text-xs font-bold">ЗАЧИСЛИТЬ (из Пула)</button>
           </div>
           <p className="text-[10px] text-slate-500 mt-3">TON начислять нельзя. NRC списываются строго из Пула Наград.</p>
        </section>

        <section className="border border-amber-500/20 bg-amber-900/5 p-5 rounded-xl">
            <h2 className="text-sm font-bold text-amber-400 mb-4 uppercase tracking-widest border-b border-amber-500/20 pb-2 flex justify-between"><span>/// ПРОТОКОЛЫ ЗАДАНИЙ</span><button onClick={handleCreateTask} className="text-[10px] bg-amber-900 px-3 py-1 rounded text-white border border-amber-500">СОЗДАТЬ</button></h2>
            <div className="space-y-3 mb-4">
                {allTasks.map(task => (
                    <div key={task.id} className="bg-black/40 p-2 rounded flex justify-between items-center">
                        <span className="text-xs text-white truncate flex-1">{task.title} (+{task.reward})</span>
                        <button onClick={() => onDeleteTask(task.id)} className="bg-red-800 text-white px-2 py-1 rounded text-[9px] font-bold hover:bg-red-700">УДАЛИТЬ</button>
                    </div>
                ))}
            </div>
            <div className="border-t border-amber-500/20 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input placeholder="Название" value={newTask.title} onChange={(e) => setNewTask(p => ({...p, title: e.target.value}))} className="w-full bg-black border border-amber-500/30 p-2 text-white text-xs"/>
                <input type="number" placeholder="Награда NRC" value={newTask.reward} onChange={(e) => setNewTask(p => ({...p, reward: e.target.value}))} className="w-full bg-black border border-amber-500/30 p-2 text-white text-xs"/>
                <input placeholder="Ссылка (Необязательно)" value={newTask.link} onChange={(e) => setNewTask(p => ({...p, link: e.target.value}))} className="w-full bg-black border border-amber-500/30 p-2 text-white text-xs"/>
                <input placeholder="URL Картинки (Необязательно)" value={newTask.imageUrl} onChange={(e) => setNewTask(p => ({...p, imageUrl: e.target.value}))} className="w-full bg-black border border-amber-500/30 p-2 text-white text-xs"/>
            </div>
        </section>

      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px;}.custom-scrollbar::-webkit-scrollbar-track{background:#000;}.custom-scrollbar::-webkit-scrollbar-thumb{background:#22c55e;border-radius:2px;}`}</style>
    </div>
  );
};
