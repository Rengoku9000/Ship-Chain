import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, BellRing } from 'lucide-react';

const SystemEventsPanel = React.memo(({ alerts }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to the newest event when alerts update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [alerts]);

    return (
        <div className="h-[260px] w-full bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">System Events</h2>
                <BellRing className="w-3 h-3 text-slate-500" />
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar"
            >
                <AnimatePresence initial={false}>
                    {alerts.map((alert, index) => {
                        const isLatest = index === alerts.length - 1;
                        return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -10, height: 0 }}
                                animate={{ opacity: isLatest ? 1 : 0.6, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`flex items-start space-x-3 p-2.5 rounded transition-all duration-500 ${
                                    isLatest 
                                        ? 'bg-blue-500/10 border border-blue-500/30' 
                                        : 'bg-white/[0.02] border border-white/5'
                                }`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {alert.severity === 'high' && <AlertTriangle className={`w-3 h-3 ${isLatest ? 'text-red-400' : 'text-red-500/60'}`} />}
                                    {alert.severity === 'medium' && <AlertTriangle className={`w-3 h-3 ${isLatest ? 'text-amber-400' : 'text-amber-500/60'}`} />}
                                    {alert.severity === 'low' && <Info className={`w-3 h-3 ${isLatest ? 'text-blue-400' : 'text-blue-500/60'}`} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[10px] font-mono leading-relaxed truncate whitespace-normal ${isLatest ? 'text-slate-200' : 'text-slate-400'}`}>
                                        {alert.text}
                                    </div>
                                    <div className="text-[8px] text-slate-500 tracking-widest mt-1.5 font-mono">
                                        {alert.timestamp}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {alerts.length === 0 && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-4 italic">No anomalies</div>
                )}
            </div>
        </div>
    );
});

export default SystemEventsPanel;
