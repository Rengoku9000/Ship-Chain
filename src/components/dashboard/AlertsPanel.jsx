import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, BellRing } from 'lucide-react';

const AlertsPanel = React.memo(({ alerts }) => {
    return (
        <div className="min-h-[220px] bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">System Events</h2>
                <BellRing className="w-3 h-3 text-slate-500" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {alerts.map(alert => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -10, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-start space-x-3 p-2.5 rounded bg-white/[0.03] border border-white/5"
                        >
                            <div className="mt-0.5">
                                {alert.severity === 'high' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                                {alert.severity === 'medium' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                {alert.severity === 'low' && <Info className="w-3 h-3 text-blue-400" />}
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] text-slate-300 font-mono leading-relaxed">{alert.text}</div>
                                <div className="text-[8px] text-slate-500 tracking-widest mt-1.5 font-mono">{alert.timestamp}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {alerts.length === 0 && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center mt-4 italic">No anomalies</div>
                )}
            </div>
        </div>
    );
});

export default AlertsPanel;
