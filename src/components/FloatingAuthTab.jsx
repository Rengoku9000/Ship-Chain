import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, User, Mail, X } from 'lucide-react';

const FloatingAuthTab = ({ onLogin }) => {
    // States: 'collapsed', 'signin', 'signup'
    const [view, setView] = useState('collapsed');

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <>
            <AnimatePresence>
                {view !== 'collapsed' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
            >
                <motion.div
                    animate={view === 'collapsed' ? { y: [0, -8, 0] } : { y: 0 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="flex flex-col items-center"
                >
                    <motion.div
                        layout
                        className="overflow-hidden bg-white/5 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col"
                        style={{
                            borderRadius: view === 'collapsed' ? '9999px' : '24px',
                            width: view === 'collapsed' ? 'auto' : '380px'
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {view === 'collapsed' && (
                                <motion.div
                                    key="collapsed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center space-x-2 p-2"
                                >
                                    <button
                                        onClick={() => setView('signin')}
                                        className="px-6 py-2.5 text-sm font-medium tracking-widest uppercase text-white hover:text-cyan-400 transition-colors rounded-full hover:bg-white/5"
                                    >
                                        Sign In
                                    </button>
                                    <div className="w-px h-6 bg-white/20"></div>
                                    <button
                                        onClick={() => setView('signup')}
                                        className="px-6 py-2.5 text-sm font-medium tracking-widest uppercase text-cyan-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-white/5"
                                    >
                                        Sign Up
                                    </button>
                                </motion.div>
                            )}

                            {view !== 'collapsed' && (
                                <motion.div
                                    key="expanded"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-8 relative"
                                >
                                    <button
                                        onClick={() => setView('collapsed')}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex flex-col items-center mb-6">
                                        <h2 className="text-xl font-light tracking-wide text-white mb-1">
                                            {view === 'signin' ? 'Access Gateway' : 'New Operative'}
                                        </h2>
                                        <p className="text-xs text-cyan-500/80 uppercase tracking-widest">
                                            {view === 'signin' ? 'Verify Identity' : 'Register Credentials'}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSignInSubmit} className="space-y-5">
                                        {view === 'signup' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest pl-1">Designation</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:border-cyan-500/50 outline-none transition-all font-mono placeholder:text-gray-600" placeholder="ALIEN.01" required />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest pl-1">Identity</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input type="email" className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:border-cyan-500/50 outline-none transition-all font-mono placeholder:text-gray-600" placeholder="OP@DOMAIN.COM" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest pl-1">Passcode</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input type="password" className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:border-cyan-500/50 outline-none transition-all font-mono placeholder:text-gray-600 tracking-[0.2em]" placeholder="••••••••" required />
                                            </div>
                                        </div>

                                        {view === 'signup' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest pl-1">Confirm</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input type="password" className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:border-cyan-500/50 outline-none transition-all font-mono placeholder:text-gray-600 tracking-[0.2em]" placeholder="••••••••" required />
                                                </div>
                                            </div>
                                        )}

                                        <button type="submit" className="w-full mt-2 bg-gradient-to-r from-cyan-600/90 to-emerald-600/90 hover:from-cyan-500 hover:to-emerald-500 text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 transition-transform active:scale-[0.98]">
                                            <span className="tracking-widest text-sm">{view === 'signin' ? 'INITIALIZE' : 'REGISTER'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    );
};

export default FloatingAuthTab;
