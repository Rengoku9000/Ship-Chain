import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Zap, BarChart3, Bot } from 'lucide-react';

const FloatingAssistant = React.memo(({ activeShipment }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "ChainGuard AI online. How can I assist with your logistics operations?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotification, setHasNotification] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeShipment && activeShipment.riskScore > 60 && !isOpen) {
            setHasNotification(true);
        } else if (isOpen) {
            setHasNotification(false);
        }
    }, [activeShipment, isOpen]);

    const buildContextMessage = () => {
        if (!activeShipment) return '';
        return ` [Active shipment context: ${activeShipment.id}, status: ${activeShipment.status}, route: ${activeShipment.source} → ${activeShipment.destination}, risk: ${activeShipment.riskScore}%, delay: ${activeShipment.estimatedDelayMinutes || 0} min]`;
    };

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Build history for context (exclude the system greeting)
        const history = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text + buildContextMessage(),
                    history
                })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply
            }]);
        } catch (err) {
            console.error('AI Chat Error:', err);
            
            // Fallback smart simulation if API is unreachable or missing keys
            setTimeout(() => {
                let simulatedResponse = "I'm currently running in offline simulation mode. ";
                const lowerText = text.toLowerCase();
                
                if (lowerText.includes('optimize')) {
                    const timeSaved = activeShipment?.timeSaved || 45;
                    simulatedResponse += `Based on real-time traffic data, rerouting this shipment will save approximately ${timeSaved} minutes. The new path avoids the current weather congestion.`;
                } else if (lowerText.includes('analyze') || lowerText.includes('impact')) {
                    const cost = (activeShipment?.estimatedDelayMinutes || 0) * 24;
                    simulatedResponse += `The current delay of ${activeShipment?.estimatedDelayMinutes || 0} minutes is projected to cause a financial loss of $${cost.toFixed(2)}. I recommend expediting clearance at the destination port.`;
                } else {
                    simulatedResponse += `The active shipment ${activeShipment?.id || ''} has a risk score of ${activeShipment?.riskScore || 0}%. Let me know if you want me to analyze the financial impact or optimize the route.`;
                }

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: simulatedResponse
                }]);
                setIsLoading(false);
            }, 1200);
            return; // Exit early to wait for the setTimeout
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
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
                        className="mb-4 w-[320px] h-[420px] bg-[#0b1f2a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                            <div className="flex items-center space-x-2">
                                <Bot className="w-4 h-4 text-blue-400" />
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
                                        msg.role === 'assistant'
                                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-100 self-start'
                                            : 'bg-white/10 border border-white/5 text-slate-100 self-end'
                                    }`}
                                >
                                    <div className="opacity-50 text-[9px] mb-1 tracking-widest">
                                        {msg.role === 'assistant' ? 'AI' : 'YOU'}
                                    </div>
                                    {msg.content}
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-lg text-[11px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-200 self-start max-w-[85%]"
                                >
                                    <div className="opacity-50 text-[9px] mb-1 tracking-widest">AI</div>
                                    <div className="flex items-center space-x-1">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-2 bg-black/10">
                            <button
                                onClick={() => sendMessage('Optimize the active shipment route')}
                                disabled={isLoading}
                                className="text-[9px] tracking-widest text-blue-300 border border-blue-500/30 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 uppercase transition-colors disabled:opacity-40 flex items-center gap-1"
                            >
                                <Zap className="w-2.5 h-2.5" />
                                Optimize Route
                            </button>
                            <button
                                onClick={() => sendMessage('Analyze the delay and financial impact of the active shipment')}
                                disabled={isLoading}
                                className="text-[9px] tracking-widest text-amber-300 border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 uppercase transition-colors disabled:opacity-40 flex items-center gap-1"
                            >
                                <BarChart3 className="w-2.5 h-2.5" />
                                Analyze Impact
                            </button>
                        </div>

                        {/* Footer Input */}
                        <div className="p-3 border-t border-white/10 bg-black/30">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about shipments, routes, delays..."
                                    disabled={isLoading}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors"
                                >
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
                animate={{
                    boxShadow: hasNotification
                        ? ['0px 0px 0px rgba(59,130,246,0)', '0px 0px 20px rgba(59,130,246,0.6)', '0px 0px 0px rgba(59,130,246,0)']
                        : 'none'
                }}
                transition={{ repeat: hasNotification ? Infinity : 0, duration: 2 }}
                className="w-14 h-14 rounded-full bg-[#0b1f2a]/80 hover:bg-[#0b1f2a] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center text-white relative transition-colors"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-slate-300" />
                ) : (
                    <Bot className="w-6 h-6 text-blue-400" />
                )}

                {hasNotification && !isOpen && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#0b1f2a] rounded-full" />
                )}
            </motion.button>
        </div>
    );
});

export default FloatingAssistant;
