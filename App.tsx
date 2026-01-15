
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, ShopItem, Tab, NetworkState, AppTheme, Task } from './types';
import { 
  INITIAL_USER_STATE, 
  SHOP_ITEMS, 
  INITIAL_NETWORK_STATE, 
  ADMIN_USER_IDS,
  calculatePrice,
  POOL_WALLET_ADDRESS
} from './constants';
import { MiningView } from './components/MiningView';
import { UpgradesView } from './components/UpgradesView';
import { NetworkView } from './components/NetworkView';
import { EarnView } from './components/EarnView';
import { CasinoView } from './components/CasinoView';
import { WalletModal } from './components/WalletModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanel } from './components/AdminPanel';
import { PriceChartView } from './components/PriceChartView';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTonConnectUI } from '@tonconnect/ui-react';
import io, { Socket } from 'socket.io-client';
import { initTelegramApp, getTelegramUser, getTelegramInitData, hapticSelection, tg } from './utils/telegram';

// --- ICONS (Styled for NEURO) ---
const Icons = {
  Mine: ({ active }: { active: boolean }) => ( 
    <svg className={`w-6 h-6 transition-all duration-300 ${active ? "text-neuro-cyan drop-shadow-[0_0_10px_#00F0FF]" : "text-neuro-textSec"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg> 
  ),
  Upgrade: ({ active }: { active: boolean }) => ( 
    <svg className={`w-6 h-6 transition-all duration-300 ${active ? "text-neuro-primary drop-shadow-[0_0_10px_#8D73FF]" : "text-neuro-textSec"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg> 
  ),
  Task: ({ active }: { active: boolean }) => ( 
    <svg className={`w-6 h-6 transition-all duration-300 ${active ? "text-neuro-gold drop-shadow-[0_0_10px_#FFB800]" : "text-neuro-textSec"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg> 
  ),
  Games: ({ active }: { active: boolean }) => ( 
    <svg className={`w-6 h-6 transition-all duration-300 ${active ? "text-neuro-accent drop-shadow-[0_0_10px_#FF00E5]" : "text-neuro-textSec"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
  ),
  Stats: ({ active }: { active: boolean }) => ( 
    <svg className={`w-6 h-6 transition-all duration-300 ${active ? "text-white drop-shadow-[0_0_10px_#FFFFFF]" : "text-neuro-textSec"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg> 
  ),
};

const SystemBoot = ({ onComplete }: { onComplete: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const logs = [
    "INITIALIZING QUANTUM KERNEL...",
    "LOADING NEURO-MODULES [OK]",
    "CONNECTING TO TON RELAY...",
    "RESOLVING PEERS: 128 NODES FOUND",
    "SYNCING BLOCK HEADERS...",
    "VERIFYING GENESIS HASH...",
    "ESTABLISHING SECURE UPLINK...",
    "ACCESS GRANTED."
  ];

  useEffect(() => {
    let delay = 0;
    logs.forEach((log, index) => {
      delay += Math.random() * 300 + 100;
      setTimeout(() => {
        setLines(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col justify-end pb-20 px-6 font-mono text-xs md:text-sm">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1),transparent)]"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-neuro-primary/20 rounded-full border-t-neuro-primary animate-spin"></div>
       <div className="relative z-10 space-y-2">
         {lines.map((line, i) => (
           <div key={i} className="text-neuro-cyan/80 animate-fade-in">
             <span className="text-neuro-primary mr-2">root@neuro-net:~#</span>
             {line}
           </div>
         ))}
         <div className="w-2 h-4 bg-neuro-cyan animate-pulse inline-block"></div>
       </div>
    </div>
  );
};

const NewsTicker = ({ price, pool, mined }: { price: number, pool: number, mined: number }) => {
  const { t } = useLanguage();
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-neuro-primary/20 backdrop-blur-md pointer-events-none"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        height: 'calc(2rem + env(safe-area-inset-top))' 
      }}
    >
      <div className="w-full h-8 overflow-hidden flex items-center">
        <div className="whitespace-nowrap animate-[scroll_40s_linear_infinite] flex gap-12 items-center pl-[100%]">
          {[
            `🟢 SYSTEM: ONLINE`,
            `⚡ MAINNET PING: 14ms`,
            `🔗 NODES: 8,421`,
            `NRC/TON: ${price.toFixed(6)}`,
            `${t('ticker_liquidity')}: ${(pool).toLocaleString()} TON`,
            `${t('ticker_supply')}: ${(mined).toLocaleString()} NRC`,
            `NEURO CHAIN v3.1.0 [STABLE]`
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3 opacity-90">
              <span className="w-1.5 h-1.5 rounded-full bg-neuro-cyan shadow-[0_0_5px_#00F0FF] animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-neuro-textSec tracking-widest uppercase">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }`}</style>
    </div> 
  );
};

const BlockMinedEffect = ({ onEnd }: { onEnd: () => void }) => { useEffect(() => { const timer = setTimeout(onEnd, 2000); return () => clearTimeout(timer); }, [onEnd]); return ( <div className="fixed inset-0 z-[999] pointer-events-none flex items-center justify-center bg-black/60 animate-fade-in-out backdrop-blur-sm"><div className="w-64 h-64 rounded-full bg-neuro-primary/40 blur-[80px] animate-ping-slow absolute"></div><div className="relative z-10 flex flex-col items-center"><div className="text-6xl mb-2">⛏️</div><div className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-primary tracking-widest animate-zoom-in-out">BLOCK MINED</div></div></div> ); };

type AuthStatus = 'CHECKING' | 'VALID' | 'INVALID';

const AppContent: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('CHECKING');
  const [bootComplete, setBootComplete] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({...INITIAL_USER_STATE});
  const [network, setNetwork] = useState<NetworkState>(INITIAL_NETWORK_STATE);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MINING);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<number | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'NONE' | 'PRICE_CHART'>('NONE');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('NEON');
  const [showBlockMined, setShowBlockMined] = useState(false);
  const [bgFlash, setBgFlash] = useState(false);
  
  // NEW: Ref to track when we recently processed a block to ignore stale network ticks
  const blockProcessingRef = useRef<boolean>(false);

  // MOCK ID REF (Persistent across re-renders but resets on page reload)
  const mockIdRef = useRef(`mock_user_${Math.floor(Math.random() * 100000)}`);

  const { t } = useLanguage();
  const socketRef = useRef<Socket | null>(null);
  const [tonConnectUI] = useTonConnectUI(); 
  
  useEffect(() => { 
    initTelegramApp(); 
    setAuthStatus('VALID'); 
  }, []);

  const showNotification = useCallback((message: string) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification(message);
    notificationTimerRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const handleCloseNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification(null);
  }, []);

  const handleReconnect = () => {
      if (socketRef.current) {
          socketRef.current.connect();
          showNotification("RECONNECTING...");
      }
  };

  useEffect(() => {
    if (authStatus !== 'VALID') return;

    // FIX: Determine correct Socket URL for Dev/Prod
    // In production, undefined means "same host" which is correct.
    // In dev (vite @ 5173), we must point to backend @ 3000.
    const SOCKET_URL = (import.meta as any).env.DEV ? 'http://localhost:3000' : undefined;

    // IMPROVED: Socket config for better connectivity on various hosts
    const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Fallback to polling if WS fails
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 2000,
        timeout: 20000
    });
    
    socketRef.current = socket;

    const attemptConnection = (attempt = 0) => {
        const tgUser = getTelegramUser();
        const initData = getTelegramInitData();

        if (initData && !tgUser?.id && attempt < 10) {
            setTimeout(() => attemptConnection(attempt + 1), 200);
            return;
        }

        socket.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
            
            // USE RANDOM MOCK ID IF TG DATA MISSING
            // This prevents "Genesis_Miner" collision in testing
            const userPayload = tgUser || { 
                id: mockIdRef.current, 
                username: 'Anon_Miner' 
            };
            
            socket.emit('user_connect', { user: userPayload, initData: initData });
        });

        socket.on('disconnect', () => setIsConnected(false));
        
        socket.on('connect_error', (err) => {
            console.error("Socket error:", err);
            setConnectionError(err.message);
            setIsConnected(false);
        });

        // HANDLE STARS INVOICE LINK
        socket.on('invoice_link', (data) => {
            if (data.url && tg) {
                // Open Telegram Invoice
                tg.openInvoice(data.url, (status: any) => {
                    if (status === 'paid') {
                        showNotification('PAYMENT SUCCESSFUL!');
                    } else if (status === 'cancelled') {
                        showNotification('PAYMENT CANCELLED');
                    } else {
                        showNotification('PAYMENT FAILED');
                    }
                });
            }
        });

        socket.on('init_state', (data) => { setUser(data.userProfile); setNetwork(data.networkState); setAllTasks(data.allTasks); });
        socket.on('update_user_profile', (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser })));
        
        socket.on('network_tick', (updatedNetwork) => {
            if (blockProcessingRef.current) {
                if (updatedNetwork.currentBlockProgress < 100) {
                     setNetwork(updatedNetwork);
                }
                return;
            }
            setNetwork(updatedNetwork);
        });

        socket.on('notification', (message) => { showNotification(message); });
        
        socket.on('block_found_global', () => { 
            blockProcessingRef.current = true;
            setShowBlockMined(true); 
            setBgFlash(true); 
            setNetwork(prev => ({ ...prev, currentBlockProgress: 0, blockHeight: prev.blockHeight + 1 }));
            setTimeout(() => {
                setBgFlash(false); 
                blockProcessingRef.current = false;
            }, 2000); 
        });
    };

    attemptConnection();
    return () => { socket.disconnect(); };
  }, [authStatus, showNotification]);

  const handleTabChange = (tab: Tab) => { hapticSelection(); setActiveTab(tab); };

  const handleTap = useCallback(() => { 
    if (user.energy >= 1) {
      setUser(prev => ({ ...prev, energy: prev.energy - 1 }));
      setNetwork(prev => {
          if (prev.currentBlockProgress >= prev.difficulty) return prev;
          const nextProgress = prev.currentBlockProgress + user.hashRateClick;
          const clampedProgress = Math.min(nextProgress, prev.difficulty);
          return { ...prev, currentBlockProgress: clampedProgress };
      });
      socketRef.current?.emit('user_action', { type: 'TAP' });
    } 
  }, [user.energy, user.hashRateClick]); 
  
  const handleBuy = async (itemId: string, currency: 'TON' | 'NRC' | 'STARS'): Promise<boolean> => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    if (currency === 'NRC') {
      const currentLvl = user.inventory[itemId] || 0;
      const price = calculatePrice(item.baseCostNRC, item.growthFactorNRC, currentLvl);
      if (user.balanceNRC < price) {
        showNotification("INSUFFICIENT NRC");
        return false;
      }
      socketRef.current?.emit('user_action', { type: 'BUY_ITEM', payload: { itemId } });
      return true; 
    } 
    
    if (currency === 'TON') {
      if (!tonConnectUI.connected) { await tonConnectUI.openModal(); return false; }
      const currentLvl = user.inventory[itemId] || 0;
      const price = calculatePrice(item.baseCostTON, item.growthFactorTON, currentLvl);
      try {
          showNotification('Broadcast Transaction to Mainnet...');
          const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: POOL_WALLET_ADDRESS, amount: Math.floor(price * 1e9).toString() }] };
          const result = await tonConnectUI.sendTransaction(transaction);
          socketRef.current?.emit('user_action', { type: 'BUY_ITEM_REAL_TON', payload: { itemId, txHash: result.boc } });
          showNotification(`CONFIRMED: ${item.name.en} DEPLOYED`);
          return true;
      } catch (e) { 
          showNotification('TX REJECTED BY NETWORK');
          console.error('TON Purchase failed', e); 
          return false; 
      }
    }
    
    // START STARS FLOW
    if (currency === 'STARS') {
        // Since upgrades with stars are instant in shop logic, we can treat them same as NRC/TON trigger
        // BUT if it requires payment, we need a flow similar to WalletModal.
        // For simplicity, current UpgradesView doesn't support 'STARS' currency flow with Invoice yet.
        // It assumes balance is enough.
        // If we want direct purchase of items with Stars, we need to generate invoice for that specific item.
        // For now, let's assume user buys credits first. Or implement direct invoice.
        showNotification('Please top up balance with Stars first.');
        return false;
    }
    
    return false;
  };

  const handleStarPurchaseRequest = (packId: string) => {
    showNotification('Generating Invoice...');
    socketRef.current?.emit('request_stars_invoice', { packId });
  };

  const handleBuyPremium = async (duration: number, priceStars: number) => {
    // For now, prompt to top up
    showNotification(`Requires ${priceStars} Stars. Please Top Up.`);
    setIsWalletOpen(true);
  };

  const handleBuyTheme = (theme: AppTheme, price: number) => { /* ... */ };
  const handleRealDeposit = (amount: number, txHash: string) => { 
    socketRef.current?.emit('user_action', { type: 'DEPOSIT_CONFIRMED', payload: { amount, txHash } });
    showNotification(`Verifying Block Confirmation...`);
  };
  const handleClaimDaily = () => socketRef.current?.emit('user_action', { type: 'CLAIM_DAILY' });
  const handleCompleteTask = (taskId: string) => socketRef.current?.emit('user_action', { type: 'COMPLETE_TASK', payload: { taskId } });
  const handleCasinoAction = (action: any) => socketRef.current?.emit('casino_action', action);
  const handleCreditUser = (userId: string, amount: number, currency: 'NRC') => socketRef.current?.emit('admin_action', { type: 'CREDIT_USER', payload: { userId, amount, currency } });
  const handleDeleteTask = (taskId: string) => socketRef.current?.emit('admin_action', { type: 'DELETE_TASK', payload: { taskId } });
  const handleUpdateNetwork = (updates: Partial<NetworkState>) => socketRef.current?.emit('admin_action', { type: 'UPDATE_NETWORK', payload: updates });

  const currentPrice = network.totalMined > 0 ? (network.liquidityPoolTON / network.totalMined) : 0;

  // SYSTEM BOOT SIMULATION
  if (authStatus === 'CHECKING' || !bootComplete) {
      return <SystemBoot onComplete={() => setBootComplete(true)} />;
  }

  if (authStatus === 'INVALID') {
    return (
      <div className="fixed inset-0 bg-neuro-bg z-[999] flex flex-col items-center justify-center text-center p-8 font-sans">
        {/* Access Denied View */}
        <div className="orb-container"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">ACCESS DENIED</h1>
        <a href="https://t.me/neurocoin_bot" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg text-sm">RETRY</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-neuro-bg text-white overflow-hidden relative font-sans select-none">
      <style>{`
        @keyframes slide-down { from { transform: translate(-50%, -150%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
      
      {/* BACKGROUND & EFFECTS */}
      <div className="orb-container"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"></div>
      
      {/* STATUS & NOTIFICATIONS */}
      <button 
        onClick={handleReconnect}
        className={`fixed right-3 w-2 h-2 rounded-full z-[101] transition-all shadow-[0_0_5px_currentColor] ${isConnected ? 'bg-green-500 text-green-500 pointer-events-none' : 'bg-red-500 text-red-500 animate-pulse cursor-pointer'}`} 
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        title={isConnected ? "Online" : "Offline - Click to Reconnect"}
      ></button>
      
      {!isConnected && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm" style={{ top: 'calc(env(safe-area-inset-top) + 60px)' }}>
              <div className="glass-card px-4 py-2 rounded-full flex items-center gap-3 border-l-4 border-red-500 bg-black/90 backdrop-blur-xl" onClick={handleReconnect}>
                  <span className="text-lg animate-bounce">⚠️</span>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-red-400">CONNECTION LOST</span>
                      <span className="text-[8px] text-slate-400">TAP TO RECONNECT</span>
                  </div>
              </div>
          </div>
      )}

      {notification && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-slide-down" style={{ top: 'calc(env(safe-area-inset-top) + 60px)' }}>
              <div className="glass-card px-4 py-3 rounded-full flex items-center gap-3 border-l-4 border-neuro-primary bg-black/80 backdrop-blur-xl">
                  <span className="text-lg animate-pulse">📡</span>
                  <span className="text-xs font-bold tracking-wide text-white font-mono uppercase flex-1">{notification}</span>
              </div>
          </div>
      )}
      {showBlockMined && <BlockMinedEffect onEnd={() => setShowBlockMined(false)} />}
      
      <NewsTicker price={currentPrice} pool={network.liquidityPoolTON} mined={network.totalMined} />
      
      {/* MODALS & OVERLAYS */}
      {ADMIN_USER_IDS.includes(user.id) && <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} network={network} onUpdateNetwork={handleUpdateNetwork} onAddTask={()=>{}} onCreditUser={(id, amt) => handleCreditUser(id, amt, 'NRC')} allTasks={allTasks} onDeleteTask={handleDeleteTask} />}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} onDeposit={handleRealDeposit} onStarPurchase={handleStarPurchaseRequest} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} currentTheme={currentTheme} setTheme={setCurrentTheme} onBuyEffect={()=>{}} onBuyTheme={handleBuyTheme} onOpenAdmin={() => setIsAdminOpen(true)} />
      {activeOverlay === 'PRICE_CHART' && <PriceChartView network={network} onClose={() => setActiveOverlay('NONE')} />}

      
      {/* MAIN VIEWPORT */}
      <main className="flex-1 relative z-10 flex flex-col overflow-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)' }}>
        {activeTab === Tab.MINING && (<MiningView user={user} network={network} onTap={handleTap} onOpenWallet={() => setIsWalletOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}/>)}
        {activeTab === Tab.SHOP && (<UpgradesView user={user} items={SHOP_ITEMS} onBuy={handleBuy} onBuyPremium={handleBuyPremium} />)}
        {activeTab === Tab.CASINO && (<CasinoView user={user} network={network} onAction={handleCasinoAction} />)}
        {activeTab === Tab.EARN && (<EarnView user={user} allTasks={allTasks} dailyBonusAmount={network.dailyBonusAmount} onClaimDaily={handleClaimDaily} onCompleteTask={handleCompleteTask} network={network} onGetTask={() => {}} currentTask={null} />)}
        {activeTab === Tab.NETWORK && (<NetworkView network={network} user={user} onOpenPriceChart={() => setActiveOverlay('PRICE_CHART')} />)}
      </main>

      {/* BOTTOM NAVIGATION */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] nav-glass">
        <div className="flex items-center justify-around h-[72px] px-2 max-w-lg mx-auto">
           {[ { tab: Tab.MINING, Icon: Icons.Mine, label: t('tab_mining') }, { tab: Tab.SHOP, Icon: Icons.Upgrade, label: t('tab_shop') }, { tab: Tab.EARN, Icon: Icons.Task, label: t('tab_earn') }, { tab: Tab.CASINO, Icon: Icons.Games, label: t('tab_casino') }, { tab: Tab.NETWORK, Icon: Icons.Stats, label: t('tab_network') } ].map(({ tab, Icon, label }) => (
             <button key={tab} onClick={() => handleTabChange(tab)} className="flex-1 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform group">
                <Icon active={activeTab === tab} />
                <span className={`text-[10px] font-bold tracking-wider transition-colors ${activeTab === tab ? 'text-white' : 'text-neuro-textSec'}`}>{label}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => { return (<LanguageProvider><AppContent /></LanguageProvider>); };
export default App;
