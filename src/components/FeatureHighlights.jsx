import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
    {
        id: 1,
        title: "AI Insights",
        desc: "Predicts delays using real-time data",
        hotspot: { x: 35, y: 45 },
        card: { x: 15, y: 25 },
    },
    {
        id: 2,
        title: "Smart Tracking",
        desc: "Monitors shipments across routes",
        hotspot: { x: 65, y: 35 },
        card: { x: 75, y: 15 },
    },
    {
        id: 3,
        title: "Cost Optimization",
        desc: "Reduces logistics cost dynamically",
        hotspot: { x: 50, y: 65 },
        card: { x: 70, y: 75 },
    }
];

const FeatureHighlights = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Slight delay before drawing lines
        const timer = setTimeout(() => setMounted(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-20 pointer-events-none w-full h-full"
        >
            {/* SVG Connection Lines */}
            <svg className="absolute inset-0 w-full h-full z-0 overflow-visible">
                <defs>
                    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
                {mounted && features.map((f, i) => (
                    <motion.line
                        key={`line-${f.id}`}
                        x1={`${f.hotspot.x}%`}
                        y1={`${f.hotspot.y}%`}
                        x2={`${f.card.x}%`}
                        y2={`${f.card.y}%`}
                        stroke="url(#neonGlow)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: i * 0.3, ease: "easeOut" }}
                    />
                ))}
            </svg>

            {/* Hotspots and Cards */}
            {features.map((f, i) => (
                <React.Fragment key={`group-${f.id}`}>
                    {/* Hotspot Pulse */}
                    <motion.div
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
                        style={{ left: `${f.hotspot.x}%`, top: `${f.hotspot.y}%` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.3 }}
                    >
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping absolute opacity-75"></div>
                        <div className="w-2 h-2 bg-white rounded-full relative z-10 shadow-[0_0_10px_#06b6d4]"></div>
                        {/* Soft glowing outline */}
                        <div className="w-6 h-6 border border-cyan-500/50 rounded-full absolute animate-[spin_4s_linear_infinite]"></div>
                    </motion.div>

                    {/* Info Card */}
                    <motion.div
                        className="absolute z-20 w-48 bg-white/5 backdrop-blur-md border border-cyan-500/20 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                        style={{ left: `${f.card.x}%`, top: `${f.card.y}%`, transform: 'translate(-50%, -50%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: (i * 0.3) + 0.4 }}
                    >
                        {/* Floating drift effect applied to content wrapper for idle animation */}
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }}
                        >
                            <h4 className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">{f.title}</h4>
                            <p className="text-[10px] text-gray-300 leading-relaxed font-light">{f.desc}</p>
                        </motion.div>
                    </motion.div>
                </React.Fragment>
            ))}
        </motion.div>
    );
};

export default FeatureHighlights;
