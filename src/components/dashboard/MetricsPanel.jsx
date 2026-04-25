import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricsPanel = React.memo(({ shipments }) => {
    const avgRisk = useMemo(() => {
        if (shipments.length === 0) return 0;
        return shipments.reduce((acc, s) => acc + s.riskScore, 0) / shipments.length;
    }, [shipments]);

    return (
        <div className="bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl">
            <div className="border-b border-white/10 pb-3 mb-4">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">Performance KPI</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Global System Risk</div>
                    <div className="flex items-end space-x-2">
                        <span className="text-xl font-mono text-slate-200 font-light">{avgRisk.toFixed(1)}</span>
                        {avgRisk > 50 ? <TrendingUp className="w-3 h-3 text-amber-400 mb-1" /> : <TrendingDown className="w-3 h-3 text-blue-400 mb-1" />}
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Active Throughput</div>
                    <div className="flex items-end space-x-2">
                        <span className="text-xl font-mono text-slate-200 font-light">94%</span>
                        <Minus className="w-3 h-3 text-slate-400 mb-1" />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-2">Throughput Density</div>
                <div className="flex items-end h-8 space-x-1">
                    {[40, 60, 45, 80, 50, 90, 65, 85, 70, 95].map((val, i) => (
                        <div key={i} className="flex-1 bg-blue-500/30 rounded-sm relative group overflow-hidden">
                            <div
                                className="absolute bottom-0 w-full bg-blue-400/80 transition-all duration-700"
                                style={{ height: `${val}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default MetricsPanel;
