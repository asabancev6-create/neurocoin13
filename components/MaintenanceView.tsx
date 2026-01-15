
import React from 'react';

export const MaintenanceView: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[999] bg-black text-cyan-500 font-mono flex flex-col items-center justify-center p-6 text-center select-none">
       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
       
       <div className="relative z-10 animate-pulse">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-widest">System Update</h1>
          <div className="h-0.5 w-24 bg-cyan-500 mx-auto mb-6"></div>
          <p className="text-lg text-cyan-400 mb-8 max-w-md mx-auto">
             NeuroCoin Network is currently undergoing a quantum protocol upgrade. 
          </p>
       </div>

       <div className="w-full max-w-xs bg-slate-900/50 border border-cyan-500/30 h-8 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,242,255,0.1)_10px,rgba(0,242,255,0.1)_20px)] animate-[slide_2s_linear_infinite]"></div>
          <div className="h-full bg-cyan-500/50 w-2/3 shadow-[0_0_20px_#00F2FF]"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-widest">
             UPGRADING NODES...
          </div>
       </div>
       
       <div className="absolute bottom-10 text-[10px] opacity-40">
          ERR_NETWORK_MAINTENANCE_503
       </div>
       
       <style>{`
         @keyframes slide { from { background-position: 0 0; } to { background-position: 40px 0; } }
       `}</style>
    </div>
  );
};
