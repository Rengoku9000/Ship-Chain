import React, { useState } from 'react';
import { Send, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { chainguardApi } from '../../lib/chainguardApi';

const AIAssistant = React.memo(({ selectedShipment }) => {
    const [messages, setMessages] = useState([
        { role: 'system', text: "System intelligence online. Awaiting query." }
    ]);
    const [draft, setDraft] = useState('');

    const handleSuggest = async (prompt) => {
        setMessages(prev => [...prev, { role: 'user', text: prompt }]);

        if (!selectedShipment) {
            setMessages(prev => [...prev, { role: 'system', text: 'Select a shipment first so the AI core can analyze a live route.' }]);
            return;
        }

        try {
            if (prompt.toLowerCase().includes('optimize')) {
                const route = await chainguardApi.getBestRoute(selectedShipment.source, selectedShipment.destination);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'system',
                        text: `Best route: ${route.new_route.join(' -> ')}. Estimated transit ${route.new_time} min, saving ${route.time_saved} min against the current corridor.`,
                    },
                ]);
                return;
            }

            const cost = await chainguardApi.getCost(selectedShipment.numericId);
            setMessages(prev => [
                ...prev,
                {
                    role: 'system',
                    text: `Delay exposure is $${cost.current_loss.toFixed(2)} with modeled recovery savings of $${cost.optimized_savings.toFixed(2)}. ${selectedShipment.explanation}`,
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
        <div className="flex-1 bg-[#0b1f2a]/60 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h2 className="text-[10px] tracking-[0.2em] text-slate-300 font-medium uppercase">Logistics AI Core</h2>
                <Cpu className="w-3 h-3 text-blue-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 mb-4 flex flex-col justify-end">
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`p-2.5 rounded text-[10px] font-mono leading-relaxed ${msg.role === 'system' ? 'bg-white/5 border border-white/5 text-blue-200' : 'bg-blue-500/10 border border-blue-500/20 text-slate-100 ml-4'}`}
                    >
                        <span className="opacity-50 mr-2">{msg.role === 'system' ? 'SYS>' : 'USR>'}</span>
                        {msg.text}
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => handleSuggest('Optimize active route')} className="text-[8px] tracking-widest text-blue-300 border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 uppercase transition-colors">
                    Optimize Route
                </button>
                <button onClick={() => handleSuggest('Analyze financial impact')} className="text-[8px] tracking-widest text-amber-300 border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 uppercase transition-colors">
                    Analyze Impact
                </button>
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Query system..."
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 mix-blend-screen mix-blend-mode">
                    <Send className="w-3 h-3" />
                </button>
            </form>
        </div>
    );
});

export default AIAssistant;
