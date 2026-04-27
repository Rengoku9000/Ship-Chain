import React, { useState, useEffect } from 'react';
import { Network, Database, Activity, LogOut } from 'lucide-react';

const HeaderSystem = React.memo(({ simulationMode, onToggle, connectionStatus, warehouseSummary, currentUser, onLogout, mapView, onToggleMap, mapOverlayMode, onToggleOverlay }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const headerClasses = mapView === 'google'
        ? "flex items-center justify-between w-full h-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl px-6 transition-all duration-1000"
        : "flex items-center justify-between w-full h-full bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl px-6 transition-all duration-1000";

    return (
        <div className={headerClasses}>
            <div>
                <h1 className="text-xl font-light tracking-[0.3em] text-slate-200 uppercase">
                    Logistics Hub
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1.5 opacity-80">
                        <Network className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">{connectionStatus}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 opacity-80">
                        <Database className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">{warehouseSummary.label}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 opacity-80">
                        <Activity className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">{simulationMode ? 'Streaming Live' : 'Feed Paused'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <div className="text-lg font-mono tracking-widest text-slate-200 font-light">
                    {time.toLocaleTimeString('en-US', { hour12: false })}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                    <span className="text-[9px] text-slate-400 tracking-[0.2em] uppercase">
                        {currentUser?.displayName || currentUser?.email || 'Guest'}
                    </span>
                    <span className="text-[9px] text-slate-400 tracking-[0.2em] uppercase">{time.toLocaleDateString()}</span>
                    
                    <button
                        onClick={onToggleOverlay}
                        className={`text-[9px] border px-2 py-0.5 rounded tracking-widest uppercase transition-colors ${mapOverlayMode === 'heatmap' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-slate-500/50 text-slate-400 hover:bg-slate-500/10'}`}
                    >
                        HEATMAP VIEW
                    </button>

                    <button
                        onClick={onToggle}
                        className={`text-[9px] border px-2 py-0.5 rounded tracking-widest uppercase transition-colors ${simulationMode ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10' : 'border-slate-500/50 text-slate-400 hover:bg-slate-500/10'}`}
                    >
                        {simulationMode ? 'LIVE FEED: ON' : 'LIVE FEED: OFF'}
                    </button>
                    <button
                        onClick={onToggleMap}
                        className="text-[9px] border border-slate-500/50 px-2 py-0.5 rounded tracking-widest uppercase transition-colors text-slate-400 hover:bg-slate-500/10"
                    >
                        {mapView === 'svg' ? 'DETAILED VIEW' : 'EXIT MAP'}
                    </button>
                    {currentUser && (
                        <button
                            onClick={onLogout}
                            className="text-[9px] border border-white/10 px-2 py-0.5 rounded tracking-widest uppercase transition-colors text-slate-300 hover:bg-white/10 flex items-center gap-1"
                        >
                            <LogOut className="w-3 h-3" />
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default HeaderSystem;
