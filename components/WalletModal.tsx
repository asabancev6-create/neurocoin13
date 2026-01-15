import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { POOL_WALLET_ADDRESS, STARS_PACKAGES } from '../constants';
import { processStarPayment, hapticNotification, tg } from '../utils/telegram';
import io, { Socket } from 'socket.io-client';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, txHash: string) => void;
  onStarPurchase: (packId: string) => void;
}

// Helper to access socket from App context (or passed prop, simplified here by assuming global or listener)
// Ideally socket should be passed via context, but we will emit via a temporary listener pattern or assume parent handles it.
// For this architecture, we will use a custom event mechanism or assume the parent passes a function to request invoice.
// Actually, let's use the window socket reference or a clean prop. 
// Since we don't have socket prop, I'll assume we can use a custom event dispatched from App.tsx or add a listener here.
// BETTER: The App.tsx should handle the socket communication. I will modify WalletModal to trigger a callback that App.tsx handles.

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onDeposit, onStarPurchase }) => {
  const { t } = useLanguage();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  const [activeTab, setActiveTab] = useState<'CRYPTO' | 'STARS'>('CRYPTO');
  const [depositAmount, setDepositAmount] = useState('1');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRealDeposit = async () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0.01) {
          alert("Minimum deposit is 0.01 TON");
          return;
      }
      
      setIsProcessing('TON_DEPOSIT');

      const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
          messages: [
              {
                  address: POOL_WALLET_ADDRESS,
                  amount: Math.floor(amount * 1000000000).toString(), // Convert to Nanotons
              },
          ],
      };

      try {
          const result = await tonConnectUI.sendTransaction(transaction);
          onDeposit(amount, result.boc);
          onClose();
      } catch (e) {
          console.error('Transaction aborted or failed', e);
      } finally {
          setIsProcessing(null);
      }
  };

  const handleStarPurchaseClick = (packId: string) => {
      if (isProcessing) return;
      setIsProcessing(packId);
      // Trigger the parent's handler which will emit the socket event
      onStarPurchase(packId);
      
      // Reset processing state after a timeout if nothing happens (failsafe)
      setTimeout(() => {
          setIsProcessing(null);
      }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-sm glass-premium rounded-3xl p-6 relative shadow-2xl animate-scale-in border border-white/10 overflow-hidden">
        
        {/* Background Ambient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20"
        >
          ✕
        </button>

        <div className="flex flex-col items-center mb-6 mt-2 relative z-10">
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(37,99,235,0.5)] mb-4 transition-colors duration-500 ${activeTab === 'CRYPTO' ? 'bg-gradient-to-tr from-blue-600 to-cyan-400' : 'bg-gradient-to-tr from-yellow-500 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]'}`}>
             {activeTab === 'CRYPTO' ? '💎' : '⭐️'}
           </div>
           <h2 className="text-xl font-display font-bold text-white tracking-widest">{t('wallet_title')}</h2>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex p-1 bg-black/40 rounded-xl mb-6 relative z-10 border border-white/5">
            <button 
                onClick={() => setActiveTab('CRYPTO')} 
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'CRYPTO' ? 'bg-cyan-500/20 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Crypto (TON)
            </button>
            <button 
                onClick={() => setActiveTab('STARS')} 
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'STARS' ? 'bg-yellow-500/20 text-yellow-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Stars (TG)
            </button>
        </div>

        {activeTab === 'CRYPTO' ? (
            <div className="space-y-4 animate-slide-up relative z-10">
                <div className="flex justify-center mb-2">
                    <TonConnectButton className="w-full" />
                </div>

                {!wallet ? (
                    <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                        <p className="text-blue-200 text-xs font-bold leading-relaxed">
                            Connect your wallet to execute real blockchain transactions.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 bg-gradient-to-br from-slate-900 to-black rounded-xl border border-cyan-500/30 shadow-lg">
                        <h3 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wide flex justify-between items-center">
                            <span>DEPOSIT TON</span>
                            <span className="text-[9px] bg-cyan-900 px-2 rounded text-white">MAINNET</span>
                        </h3>
                        
                        <div className="mb-3">
                            <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Amount (TON)</label>
                            <input 
                                type="number" 
                                value={depositAmount} 
                                onChange={(e) => setDepositAmount(e.target.value)} 
                                className="w-full bg-black border border-white/20 text-white text-lg font-mono rounded-lg p-3 focus:border-cyan-500 outline-none transition-colors"
                                placeholder="1.0"
                                min="0.1"
                            />
                        </div>

                        <button 
                            onClick={handleRealDeposit}
                            disabled={!!isProcessing}
                            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${isProcessing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]'}`}
                        >
                            {isProcessing ? 'SIGNING...' : 'CONFIRM TRANSACTION'}
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-3 animate-slide-up relative z-10 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                <p className="text-[10px] text-slate-400 text-center mb-2">Purchase internal TON balance using Telegram Stars.</p>
                {STARS_PACKAGES.map((pack) => (
                    <div key={pack.id} className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-yellow-500/20 flex items-center justify-between hover:border-yellow-500/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                {pack.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white uppercase tracking-wide">{pack.label}</div>
                                <div className="text-[10px] text-yellow-400 font-mono">+{pack.amountTON} TON</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleStarPurchaseClick(pack.id)}
                            disabled={!!isProcessing}
                            className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-400 transition-colors active:scale-95 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isProcessing === pack.id ? '...' : (
                                <>
                                <span>{pack.stars}</span>
                                <span className="text-[10px]">⭐️</span>
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        )}

      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
};