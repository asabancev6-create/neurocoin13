
import React, { useState } from 'react';
import { generateNeuralTask } from '../services/geminiService';
import { AITask, UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AITasksViewProps {
  user: UserProfile;
  onReward: (amount: number) => void;
}

export const AITasksView: React.FC<AITasksViewProps> = ({ user, onReward }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<AITask | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [taskStatus, setTaskStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');

  const fetchTask = async () => {
    setLoading(true);
    setCurrentTask(null);
    setTaskStatus('IDLE');
    setSelectedOption(null);
    
    const task = await generateNeuralTask();
    setCurrentTask(task);
    setLoading(false);
  };

  const handleOptionClick = (index: number) => {
    if (taskStatus !== 'IDLE' || !currentTask) return;
    
    setSelectedOption(index);
    if (index === currentTask.correctAnswerIndex) {
      setTaskStatus('CORRECT');
      onReward(currentTask.reward);
    } else {
      setTaskStatus('WRONG');
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-6 py-8 overflow-y-auto pb-32">
      
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-white mb-2">{t('tasks_title')}</h2>
         <p className="text-slate-400 text-sm leading-relaxed">
            {t('tasks_desc')}
         </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {!currentTask && !loading && (
          <button
            onClick={fetchTask}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-purple-900/20 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 group btn-glass border-blue-500/50"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🧠</span>
            <span className="font-bold text-white tracking-widest text-sm">{t('tasks_generate')}</span>
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-6">
             <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-purple-500 animate-spin"></div>
             <p className="text-purple-400 font-mono text-xs animate-pulse">{t('tasks_decrypting')}</p>
          </div>
        )}

        {currentTask && (
          <div className="w-full glass-panel border border-white/10 p-6 rounded-3xl animate-float">
            <div className="flex justify-between items-center mb-6">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                currentTask.difficulty === 'HARD' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                currentTask.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {currentTask.difficulty}
              </span>
              <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs font-bold">
                 <span>+{currentTask.reward} NRC</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-8 leading-snug">
              {currentTask.question}
            </h3>

            <div className="space-y-3">
              {currentTask.options.map((option, idx) => {
                let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ";
                
                if (taskStatus === 'IDLE') {
                  btnClass += "bg-white/5 border-white/5 hover:bg-white/10 text-slate-200";
                } else if (taskStatus === 'CORRECT' && idx === currentTask.correctAnswerIndex) {
                  btnClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
                } else if (taskStatus === 'WRONG' && idx === selectedOption) {
                  btnClass += "bg-red-500/20 border-red-500/50 text-red-200";
                } else {
                  btnClass += "bg-black/20 border-transparent text-slate-600 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    disabled={taskStatus !== 'IDLE'}
                    onClick={() => handleOptionClick(idx)}
                    className={btnClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {taskStatus !== 'IDLE' && (
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                 {taskStatus === 'CORRECT' ? (
                   <p className="text-emerald-400 font-bold mb-4 text-sm tracking-wide">{t('tasks_success')}</p>
                 ) : (
                   <p className="text-red-400 font-bold mb-4 text-sm tracking-wide">{t('tasks_failed')}</p>
                 )}
                 <button 
                  onClick={fetchTask}
                  className="px-8 py-3 bg-slate-800 rounded-full text-white text-xs font-bold hover:bg-slate-700 transition-colors btn-glass"
                 >
                   {t('tasks_next')}
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
