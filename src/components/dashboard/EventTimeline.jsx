import React from 'react';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

const EventTimeline = React.memo(({ selectedShipment }) => {
    if (!selectedShipment) {
        return (
            <div className="w-full h-full bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl flex items-center justify-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Select shipment to view ledger timeline</span>
            </div>
        );
    }

    const stages = [
        { label: 'Origin Auth', status: 'completed', hash: '0x8f...4a1', time: '04:22' },
        { label: 'Transit Checkpoint Alpha', status: 'completed', hash: '0x33...b92', time: '10:14' },
        { label: 'Current Pos Sync', status: selectedShipment.status === 'DELAYED' ? 'pending' : 'active', hash: 'verify...', time: '--:--' },
        { label: 'Destination Clearance', status: 'pending', hash: 'TBD', time: '--:--' }
    ];

    return (
        <div className="w-full h-[100px] bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl px-8 flex flex-col justify-center shadow-2xl">
            <div className="flex justify-between relative">
                <div className="absolute top-3 left-0 right-0 h-px bg-white/10 -z-10" />

                {stages.map((stage, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-3 border ${stage.status === 'completed' ? 'bg-blue-900/50 border-blue-400 text-blue-400' : (stage.status === 'active' ? 'bg-amber-900/50 border-amber-400 text-amber-400 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-600')}`}>
                            {stage.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                            {stage.status === 'active' && <Clock className="w-3 h-3" />}
                            {stage.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                        </div>
                        <span className="text-[9px] text-slate-300 tracking-widest uppercase text-center">{stage.label}</span>
                        <div className="flex items-center space-x-1 mt-1 opacity-60">
                            <ShieldCheck className="w-2.5 h-2.5 text-slate-500" />
                            <span className="text-[8px] font-mono text-slate-500">{stage.hash}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default EventTimeline;
