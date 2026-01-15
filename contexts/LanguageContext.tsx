
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language } from '../types';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    loading: "INITIALIZING...",
    loading_conn: "CONNECTING TO NEURO-NET...",
    
    // Tabs
    tab_mining: "MINING",
    tab_shop: "MARKET",
    tab_casino: "CASINO",
    tab_earn: "EARN",
    tab_network: "STATS",

    // News Ticker
    ticker_liquidity: "LIQUIDITY",
    ticker_supply: "SUPPLY",
    ticker_market: "MARKET",
    ticker_online: "ONLINE",

    // Mining View
    mining_balance: "Neuro Balance",
    mining_block: "BLOCK #",
    mining_difficulty: "BLOCK DIFFICULTY",
    mining_genesis_block: "GENESIS BLOCK",
    mining_pending: "PENDING SHARES",
    mining_energy: "ENERGY",
    mining_total_hash: "TOTAL HASH",
    
    // Wallet
    wallet_title: "TON Wallet",
    wallet_address: "Deposit Address (Pool)",
    wallet_amount: "Amount (TON)",
    wallet_send: "SEND TRANSACTION",
    wallet_success: "Deposit Successful!",
    
    // Settings
    settings_title: "System Config",
    settings_lang: "Language",
    settings_theme: "Interface Theme",
    settings_effects: "Effects",
    settings_aurora: "Aurora Effect",
    settings_premium_glow: "Premium Glow",
    settings_avatar_glow: "Avatar Glow",
    settings_avatar_desc: "Shine in Leaderboard",
    settings_name_glow: "Name Highlight",
    settings_owned: "OWNED",
    settings_userid: "User ID",
    settings_trophies: "TROPHIES",
    settings_rewards_avail: "REWARDS AVAILABLE",
    settings_claimed: "CLAIMED",
    settings_reward_label: "REWARD",

    // Trophies
    trophy_lvl1000_title: "QUANTUM MIND",
    trophy_lvl1000_desc: "Reach Level 1000",
    trophy_block_title: "BLOCK HUNTER",
    trophy_block_desc: "Mine a Block",
    trophy_balance_title: "NEURO WHALE",
    trophy_balance_desc: "Hold 1,000 NRC",
    
    // Shop
    shop_title: "MARKET",
    shop_subtitle: "Acquire & Upgrade",
    shop_cat_upgrades: "UPGRADES",
    shop_cat_miners: "MINERS",
    shop_cat_farms: "FARMS",
    shop_cat_store: "STORE",
    shop_sold_out: "SOLD OUT",
    shop_max_level: "MAX LEVEL",
    shop_roulette_win: "You won",
    shop_pool_empty: "Reward Pool Empty!",
    
    // Casino / Games
    casino_title: "Quantum Casino",
    casino_subtitle: "Instant Win Protocols",
    casino_tab_slots: "SLOTS",
    casino_tab_lottery: "LOTTERY",
    casino_spin: "SPIN",
    casino_turbo: "TURBO",
    casino_on: "ON",
    casino_off: "OFF",
    casino_win: "BIG WIN!",
    casino_jackpot: "JACKPOT!",
    casino_no_funds: "Insufficient Funds",
    
    // Lottery
    lottery_title: "Cyber Scratch",
    lottery_buy: "BUY TICKET",
    lottery_play_again: "PLAY AGAIN",
    lottery_price: "Price",
    lottery_match: "Match 3 to Win",

    // EARN (NEW)
    earn_title: "EARN NRC",
    earn_tab_tasks: "TASKS",
    earn_tab_referrals: "PARTNERS",
    earn_daily_title: "DAILY REWARD",
    earn_claim: "CLAIM",
    earn_tasks_list: "AVAILABLE PROTOCOLS",
    earn_ref_title: "PARTNER PROGRAM",
    earn_ref_desc: "Invite other nodes to the network and earn 10% of their mining rewards forever.",
    earn_ref_friends: "FRIENDS",
    earn_ref_earned: "EARNED",
    earn_ref_list: "RECENT PARTNERS",
    earn_ref_no_partners: "You have no partners yet.",
    
    // Network Stats
    stats_title: "Network Stats",
    stats_supply: "Total Supply Mined",
    stats_hashrate: "Network Hashrate",
    stats_leaderboard: "Top Miners",
  },
  ru: {
    loading: "ЗАГРУЗКА...",
    loading_conn: "ПОДКЛЮЧЕНИЕ К НЕЙРОСЕТИ...",
    
    // Tabs
    tab_mining: "МАЙНИНГ",
    tab_shop: "МАРКЕТ",
    tab_casino: "КАЗИНО",
    tab_earn: "ЗАРАБОТОК",
    tab_network: "ИНФО",

    // News Ticker
    ticker_liquidity: "ЛИКВИДНОСТЬ",
    ticker_supply: "ЭМИССИЯ",
    ticker_market: "РЫНОК",
    ticker_online: "ОНЛАЙН",

    // Mining View
    mining_balance: "Нейро Баланс",
    mining_block: "БЛОК #",
    mining_difficulty: "СЛОЖНОСТЬ БЛОКА",
    mining_genesis_block: "ГЕНЕЗИС БЛОК",
    mining_pending: "ОЖИДАЮТ ОТПРАВКИ",
    mining_energy: "ЭНЕРГИЯ",
    mining_total_hash: "ОБЩИЙ ХЕШ",
    
    // Wallet
    wallet_title: "TON Кошелек",
    wallet_address: "Адрес Пула (Депозит)",
    wallet_amount: "Сумма (TON)",
    wallet_send: "ОТПРАВИТЬ СРЕДСТВА",
    wallet_success: "Успешное пополнение!",
    
    // Settings
    settings_title: "Настройки Системы",
    settings_lang: "Язык",
    settings_theme: "Тема Интерфейса",
    settings_effects: "Эффекты",
    settings_aurora: "Северное сияние",
    settings_premium_glow: "Премиум Подсветка",
    settings_avatar_glow: "Свечение Аватара",
    settings_avatar_desc: "Выделение в топе",
    settings_name_glow: "Подсветка Имени",
    settings_owned: "КУПЛЕНО",
    settings_userid: "ID Пользователя",
    settings_trophies: "ТРОФЕИ",
    settings_rewards_avail: "НАГРАДЫ ДОСТУПНЫ",
    settings_claimed: "ПОЛУЧЕНО",
    settings_reward_label: "НАГРАДА",

    // Trophies
    trophy_lvl1000_title: "КВАНТОВЫЙ РАЗУМ",
    trophy_lvl1000_desc: "Достигните 1000 уровня",
    trophy_block_title: "ОХОТНИК ЗА БЛОКАМИ",
    trophy_block_desc: "Добыть 1 блок",
    trophy_balance_title: "НЕЙРО КИТ",
    trophy_balance_desc: "Накопить 1,000 NRC",
    
    // Shop
    shop_title: "МАРКЕТ",
    shop_subtitle: "Покупка и Улучшение",
    shop_cat_upgrades: "УЛУЧШЕНИЯ",
    shop_cat_miners: "МАЙНЕРЫ",
    shop_cat_farms: "ФЕРМЫ",
    shop_cat_store: "МАГАЗИН",
    shop_sold_out: "РАСПРОДАНО",
    shop_max_level: "МАКС. УРОВЕНЬ",
    shop_roulette_win: "Выигрыш",
    shop_pool_empty: "Пул наград пуст!",

    // Casino / Games
    casino_title: "Квантовое Казино",
    casino_subtitle: "Мгновенные выигрыши",
    casino_tab_slots: "СЛОТЫ",
    casino_tab_lottery: "ЛОТЕРЕЯ",
    casino_spin: "КРУТИТЬ",
    casino_turbo: "ТУРБО",
    casino_on: "ВКЛ",
    casino_off: "ВЫКЛ",
    casino_win: "ПОБЕДА!",
    casino_jackpot: "ДЖЕКПОТ!",
    casino_no_funds: "Недостаточно средств",
    
    // Lottery
    lottery_title: "Кибер Скретч",
    lottery_buy: "КУПИТЬ БИЛЕТ",
    lottery_play_again: "ИГРАТЬ СНОВА",
    lottery_price: "Цена",
    lottery_match: "Собери 3 символа",

    // EARN (NEW)
    earn_title: "ЗАРАБОТОК",
    earn_tab_tasks: "ЗАДАНИЯ",
    earn_tab_referrals: "ПАРТНЕРЫ",
    earn_daily_title: "ЕЖЕДНЕВНЫЙ БОНУС",
    earn_claim: "ЗАБРАТЬ",
    earn_tasks_list: "ДОСТУПНЫЕ ПРОТОКОЛЫ",
    earn_ref_title: "ПАРТНЕРСКАЯ ПРОГРАММА",
    earn_ref_desc: "Приглашайте новые узлы в сеть и получайте 10% от их добычи навсегда.",
    earn_ref_friends: "ДРУЗЬЯ",
    earn_ref_earned: "ЗАРАБОТАНО",
    earn_ref_list: "НЕДАВНИЕ ПАРТНЕРЫ",
    earn_ref_no_partners: "У вас пока нет партнеров.",
    
    // Network Stats
    stats_title: "Статистика Сети",
    stats_supply: "Добыто Монет",
    stats_hashrate: "Хешрейт Сети",
    stats_leaderboard: "Топ Майнеров",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
