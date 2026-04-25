import React from 'react';
import { motion } from 'framer-motion';

const TopNavbar = () => {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-8 py-5 bg-slate-900/20 backdrop-blur-md border-b border-white/5 pointer-events-none"
        >
            <div className="flex items-center space-x-3 pointer-events-auto">
                <div className="w-5 h-5 rounded-sm bg-slate-400/60 shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                </div>
                <span className="text-sm md:text-lg font-light tracking-[0.2em] text-slate-200 uppercase">ChainGuard AI+</span>
            </div>

            {/* CTA Buttons Removed for clean cinematic entry. Intro scroll handles the sequence naturally. */}
        </motion.nav>
    );
};

export default TopNavbar;
