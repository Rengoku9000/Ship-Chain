import React from 'react';
import { DollarSign } from 'lucide-react';

const CostAnalysis = React.memo(({ shipment, costData }) => {
    return (
        <div className="bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl flex flex-col justify-between h-[160px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">Cost Flow Analysis</h2>
                <DollarSign className="w-3 h-3 text-slate-500" />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Current Loss</span>
                    <span className="text-slate-200">{costData ? `$${costData.current_loss.toFixed(2)}` : '--'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Delay Window</span>
                    <span className="text-amber-400">{shipment ? `${shipment.estimatedDelayMinutes} min` : '--'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono border-t border-white/5 pt-2">
                    <span className="text-blue-300">Optimization Savings</span>
                    <span className="text-blue-300">{costData ? `$${costData.optimized_savings.toFixed(2)}` : '--'}</span>
                </div>
            </div>
        </div>
    );
});

export default CostAnalysis;
