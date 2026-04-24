import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const AuthCard = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
            {/* Subtle glow effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl mb-4 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <ShieldCheck className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-medium tracking-wide text-white mb-2">ChainGuard Access</h2>
                <p className="text-sm text-gray-400 font-light tracking-wider uppercase">Secure Neural Gateway</p>
            </div>

            <form onSubmit={onLogin} className="relative z-10 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-cyan-400/80 uppercase tracking-widest ml-1">Identity</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                        placeholder="OPERATIVE.ID@DOMAIN.COM"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-cyan-400/80 uppercase tracking-widest ml-1">Passcode</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm tracking-[0.3em]"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full mt-4 bg-gradient-to-r from-cyan-600/80 to-emerald-600/80 hover:from-cyan-500 hover:to-emerald-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-white/10 active:scale-95"
                >
                    <span className="tracking-widest text-sm">INITIALIZE</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default AuthCard;
