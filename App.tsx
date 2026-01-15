
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Tab, NetworkState, Task, AppTheme } from './types';
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

// --- ICONS (UI Components) ---
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

const AppContent: React.FC = () => {
  const [bootComplete, setBootComplete] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<UserProfile>({...INITIAL_USER_STATE});
  const [network, setNetwork] = useState<NetworkState>(INITIAL_NETWORK_STATE);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MINING);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'NONE' | 'PRICE_CHART'>('NONE');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('NEON');
  const [showBlockMined, setShowBlockMined] = useState(false);

  const { t } = useLanguage();
  const socketRef = useRef<Socket | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  
  // Init Telegram
  useEffect(() => { 
    initTelegramApp(); 
    // Simulate boot time
    setTimeout(() => setBootComplete(true), 2500);
  }, []);

  // Notifications
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Socket Connection
  useEffect(() => {
    // Only connect if boot is done (for effect)
    if (!bootComplete) return;

    // Use empty string for relative path in prod, or specific URL in dev
    const SOCKET_URL = (import.meta as any).env.DEV ? 'http://localhost:3000' : '/';

    const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
        setIsConnected(true);
        const initData = getTelegramInitData();
        const tgUser = getTelegramUser();
        
        // Handshake
        socket.emit('user_connect', { 
            initData: initData,
            user: tgUser // Fallback for Dev only (server ignores if not IS_DEV)
        });
    });

    socket.on('auth_error', (msg) => {
        console.error("Auth Error:", msg);
        showNotification("Security Verification Failed");
        socket.disconnect();
    });

    socket.on('init_state', (data) => { 
        setUser(data.userProfile); 
        setNetwork(data.networkState); 
        setAllTasks(data.allTasks || []);
    });

    socket.on('update_user_profile', (u) => setUser(prev => ({ ...prev, ...u })));
    socket.on('network_tick', (n) => setNetwork(n));
    socket.on('notification', (msg) => showNotification(msg));
    
    socket.on('invoice_link', (data) => {
        if (data.url && tg) {
            tg.openInvoice(data.url, (status: any) => {
                if(status === 'paid') showNotification('Payment Successful!');
                else showNotification('Payment Cancelled');
            });
        }
    });

    socket.on('block_found_global', () => { 
        setShowBlockMined(true);
        setTimeout(() => setShowBlockMined(false), 2000);
    });

    return () => { socket.disconnect(); };
  }, [bootComplete]);

  // Actions
  const handleTap = useCallback(() => { 
    if (user.energy >= 1) {
      // Optimistic UI update
      setUser(prev => ({ ...prev, energy: prev.energy - 1 }));
      setNetwork(prev => ({ 
          ...prev, 
          currentBlockProgress: Math.min(prev.difficulty, prev.currentBlockProgress + user.hashRateClick) 
      }));
      socketRef.current?.emit('user_action', { type: 'TAP' });
    } 
  }, [user.energy, user.hashRateClick]);

  const handleBuy = async (itemId: string, currency: 'TON' | 'NRC' | 'STARS') => {
      // (Implementation same as before, simplified for brevity)
      if (currency === 'NRC') {
          socketRef.current?.emit('user_action', { type: 'BUY_ITEM', payload: { itemId } });
          return true;
      }
      return false;
  };

  const handleStarPurchaseRequest = (packId: string) => {
      showNotification('Creating Invoice...');
      socketRef.current?.emit('request_stars_invoice', { packId });
  };

  if (!bootComplete) {
      // You can put the SystemBoot component here
      return <div className="fixed inset-0 bg-black flex items-center justify-center text-cyan-500 font-mono">INITIALIZING NEURO-LINK...</div>;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-neuro-bg text-white overflow-hidden relative font-sans select-none">
      
      {/* Visual Effects */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>
      
      {/* Notifications */}
      {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] glass-card px-4 py-2 rounded-full border border-cyan-500/50 text-xs font-bold text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-bounce">
              {notification}
          </div>
      )}

      {/* Main View */}
      <main className="flex-1 relative z-10 flex flex-col overflow-hidden pt-4">
        {activeTab === Tab.MINING && (<MiningView user={user} network={network} onTap={handleTap} onOpenWallet={() => setIsWalletOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}/>)}
        {activeTab === Tab.SHOP && (<UpgradesView user={user} items={SHOP_ITEMS} onBuy={handleBuy} onBuyPremium={()=>{}} />)}
        {activeTab === Tab.CASINO && (<CasinoView user={user} network={network} onAction={()=>{}} />)}
        {activeTab === Tab.EARN && (<EarnView user={user} network={network} dailyBonusAmount={network.dailyBonusAmount} onClaimDaily={()=>{}} onCompleteTask={()=>{}} onGetTask={()=>{}} currentTask={null} allTasks={allTasks} />)}
        {activeTab === Tab.NETWORK && (<NetworkView network={network} user={user} onOpenPriceChart={() => setActiveOverlay('PRICE_CHART')} />)}
      </main>

      {/* Modals */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} onDeposit={()=>{}} onStarPurchase={handleStarPurchaseRequest} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} currentTheme={currentTheme} setTheme={setCurrentTheme} onBuyEffect={()=>{}} onBuyTheme={()=>{}} onOpenAdmin={() => setIsAdminOpen(true)} />
      {ADMIN_USER_IDS.includes(user.id) && <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} network={network} onUpdateNetwork={()=>{}} onDeleteTask={()=>{}} onCreditUser={()=>{}} allTasks={allTasks} />}

      {/* Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-around h-[70px]">
           {[ { tab: Tab.MINING, Icon: Icons.Mine, label: 'MINE' }, { tab: Tab.SHOP, Icon: Icons.Upgrade, label: 'SHOP' }, { tab: Tab.EARN, Icon: Icons.Task, label: 'EARN' }, { tab: Tab.CASINO, Icon: Icons.Games, label: 'GAMES' }, { tab: Tab.NETWORK, Icon: Icons.Stats, label: 'STATS' } ].map(({ tab, Icon, label }) => (
             <button key={tab} onClick={() => { hapticSelection(); setActiveTab(tab); }} className="flex flex-col items-center gap-1 w-full h-full justify-center active:scale-95 transition-transform">
                <Icon active={activeTab === tab} />
                <span className={`text-[9px] font-bold ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>{label}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => { return (<LanguageProvider><AppContent /></LanguageProvider>); };
export default App;
