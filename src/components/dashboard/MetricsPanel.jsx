import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricsPanel = React.memo(({ shipments, warehouseData = [] }) => {
    const avgRisk = useMemo(() => {
        if (shipments.length === 0) return 0;
        return shipments.reduce((acc, s) => acc + s.riskScore, 0) / shipments.length;
    }, [shipments]);

    const throughput = useMemo(() => {
        if (!warehouseData.length) return 0;
        const averageLoad = warehouseData.reduce((sum, item) => sum + item.load, 0) / warehouseData.length;
        return Math.max(0, Math.round(100 - averageLoad * 0.35));
    }, [warehouseData]);

    const densitySeries = useMemo(() => {
        if (!warehouseData.length) return [35, 48, 52, 60, 72, 68];
        return warehouseData.map((item) => item.load);
    }, [warehouseData]);

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
                        <span className="text-xl font-mono text-slate-200 font-light">{throughput}%</span>
                        <Minus className="w-3 h-3 text-slate-400 mb-1" />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-2">Warehouse Load Density</div>
                <div className="flex items-end h-8 space-x-1">
                    {densitySeries.map((val, i) => (
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
