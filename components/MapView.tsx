
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const MapView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-6 py-8">
      <h2 className="text-2xl font-display font-bold text-white mb-6 border-b border-cyan-500/30 pb-4">
        {t('map_title')}
      </h2>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full aspect-square bg-slate-900/50 border border-slate-700 rounded-2xl relative overflow-hidden mb-6 group shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]"></div>
          
          {/* Grid */}
          <div className="absolute inset-0 opacity-10" 
               style={{ backgroundImage: 'linear-gradient(#00F2FF 1px, transparent 1px), linear-gradient(90deg, #00F2FF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          {/* Fake Map Nodes */}
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_10px_#00F2FF] z-10"></div>
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse z-10 flex items-center justify-center">
             <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
          </div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-fuchsia-500 rounded-full shadow-[0_0_10px_#d946ef] z-10"></div>
          
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#00F2FF" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="50%" y1="50%" x2="75%" y2="66%" stroke="#d946ef" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
          
          {/* Text Labels */}
          <div className="absolute top-[20%] left-[20%] text-[10px] text-cyan-300 font-mono bg-slate-900/80 px-1 rounded">ZONE A</div>
          <div className="absolute bottom-[30%] right-[20%] text-[10px] text-fuchsia-300 font-mono bg-slate-900/80 px-1 rounded">ZONE B</div>
        </div>
        
        <p className="text-slate-400 text-center text-sm px-4">
          {t('map_subtitle')}
        </p>
        
        <div className="mt-6 flex gap-2">
            <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 text-xs rounded border border-cyan-500/30">{t('map_zone_current')}: HOME</span>
            <span className="px-3 py-1 bg-slate-800 text-slate-500 text-xs rounded border border-slate-700">ZONE BETA ({t('map_zone_locked')})</span>
        </div>
      </div>
    </div>
  );
};
