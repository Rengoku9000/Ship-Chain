import React from 'react';
import { motion } from 'framer-motion';

const ShipmentPanel = React.memo(({ shipments, selectedId, onSelect }) => {
    return (
        <div className="flex-1 bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">Active Operations</h2>
                <span className="text-[9px] text-blue-400 font-mono tracking-widest">{shipments.length} UNITS</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {shipments.map(ship => {
                    const isSelected = selectedId === ship.id;
                    const isHighRisk = ship.riskScore > 80;
                    return (
                        <motion.div
                            layout
                            key={ship.id}
                            onClick={() => onSelect(isSelected ? null : ship.id)}
                            className={`p-3 rounded border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-white/10 border-blue-400/50' : 'bg-white/5 border-white/5 hover:bg-white/10'} ${isHighRisk && !isSelected ? 'border-amber-500/30' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs text-slate-200 tracking-widest font-mono">{ship.id}</div>
                                <div className={`text-[9px] tracking-widest font-mono ${isHighRisk ? 'text-amber-400' : 'text-blue-300'}`}>{ship.status}</div>
                            </div>
                            <div className="flex justify-between items-end mt-3">
                                <div>
                                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">ETA</div>
                                    <div className="text-[10px] text-slate-300 font-mono tracking-widest">{ship.eta}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">Risk Level</div>
                                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${isHighRisk ? 'bg-amber-400' : 'bg-blue-400'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${ship.riskScore}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

export default ShipmentPanel;
