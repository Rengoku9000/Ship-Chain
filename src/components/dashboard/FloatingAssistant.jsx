import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const FloatingAssistant = React.memo(({ activeShipment }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (activeShipment && activeShipment.riskScore > 60) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [activeShipment]);

    if (!activeShipment) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="absolute bottom-32 right-96 z-50 w-64 bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-lg p-4 pointer-events-auto"
                >
                    <button onClick={() => setVisible(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
                        <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-start space-x-3">
                        <div className="bg-blue-500/20 p-1.5 rounded text-blue-400 mt-0.5">
                            <Sparkles className="w-3 h-3" />
                        </div>
                        <div>
                            <h3 className="text-[10px] text-blue-300 font-medium tracking-widest uppercase mb-1">Divergence Detected</h3>
                            <p className="text-[9px] text-slate-300 font-mono leading-relaxed opacity-80">
                                Shipment {activeShipment.id} is experiencing elevated risk ({activeShipment.riskScore}%). I can re-route via secondary channel to mitigate impact.
                            </p>
                            <button className="mt-3 text-[9px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded tracking-widest uppercase transition-colors w-full border border-blue-500/30">
                                Execute Reroute
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default FloatingAssistant;
