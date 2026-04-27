import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, Send, Cpu } from 'lucide-react';
import { chainguardApi } from '../../lib/chainguardApi';

const FloatingAssistant = React.memo(({ activeShipment }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', text: "System intelligence online. Awaiting query." }
    ]);
    const [draft, setDraft] = useState('');
    const [hasNotification, setHasNotification] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (activeShipment && activeShipment.riskScore > 60 && !isOpen) {
            setHasNotification(true);
        } else if (isOpen) {
            setHasNotification(false);
        }
    }, [activeShipment, isOpen]);

    const handleSuggest = async (prompt) => {
        setMessages(prev => [...prev, { role: 'user', text: prompt }]);

        if (!activeShipment) {
            setMessages(prev => [...prev, { role: 'system', text: 'Select a shipment first so the AI core can analyze a live route.' }]);
            return;
        }

        try {
            if (prompt.toLowerCase().includes('optimize')) {
                const route = await chainguardApi.getBestRoute(activeShipment.source, activeShipment.destination);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'system',
                        text: `Best route: ${route.new_route.join(' -> ')}. Estimated transit ${route.new_time} min, saving ${route.time_saved} min against the current corridor.`,
                    },
                ]);
                return;
            }

            const cost = await chainguardApi.getCost(activeShipment.numericId);
            setMessages(prev => [
                ...prev,
                {
                    role: 'system',
                    text: `Delay exposure is $${cost.current_loss.toFixed(2)} with modeled recovery savings of $${cost.optimized_savings.toFixed(2)}. ${activeShipment.explanation || ''}`,
                },
            ]);
        } catch (_error) {
            setMessages(prev => [...prev, { role: 'system', text: 'Backend query failed. Confirm the FastAPI service is still running.' }]);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!draft.trim()) return;
        const prompt = draft.trim();
        setDraft('');
        await handleSuggest(prompt);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="mb-4 w-[320px] h-[420px] bg-[#0b1f2a]/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                            <div className="flex items-center space-x-2">
                                <Cpu className="w-4 h-4 text-blue-400" />
                                <h2 className="text-xs tracking-[0.1em] text-slate-200 font-medium uppercase">AI Assistant</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`p-3 rounded-lg text-[11px] font-mono leading-relaxed max-w-[85%] shadow-sm ${
                                        msg.role === 'system' 
                                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-100 self-start' 
                                            : 'bg-white/10 border border-white/5 text-slate-100 self-end'
                                    }`}
                                >
                                    <div className="opacity-50 text-[9px] mb-1 tracking-widest">{msg.role === 'system' ? 'SYS' : 'USR'}</div>
                                    {msg.text}
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-2 bg-black/10">
                            <button onClick={() => handleSuggest('Optimize active route')} className="text-[9px] tracking-widest text-blue-300 border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 uppercase transition-colors">
                                Optimize Route
                            </button>
                            <button onClick={() => handleSuggest('Analyze financial impact')} className="text-[9px] tracking-widest text-amber-300 border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 uppercase transition-colors">
                                Analyze Impact
                            </button>
                        </div>

                        {/* Footer Input */}
                        <div className="p-3 border-t border-white/10 bg-black/30">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Type your query..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <button type="submit" disabled={!draft.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setHasNotification(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: hasNotification ? ['0px 0px 0px rgba(59,130,246,0)', '0px 0px 20px rgba(59,130,246,0.6)', '0px 0px 0px rgba(59,130,246,0)'] : 'none' }}
                transition={{ repeat: hasNotification ? Infinity : 0, duration: 2 }}
                className="w-14 h-14 rounded-full bg-blue-600/80 hover:bg-blue-500/90 backdrop-blur-md border border-blue-400/50 shadow-[0_8px_32px_rgba(59,130,246,0.3)] flex items-center justify-center text-white relative transition-colors"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                
                {hasNotification && !isOpen && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#0b1f2a] rounded-full" />
                )}
            </motion.button>
        </div>
    );
});

export default FloatingAssistant;
