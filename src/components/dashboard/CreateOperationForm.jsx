import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { chainguardApi, CITY_NAMES } from '../../lib/chainguardApi';
import { addOperationRecord } from '../../lib/dbService';
import { Send, X } from 'lucide-react';

const CreateOperationForm = ({ currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [source, setSource] = useState(CITY_NAMES[0]);
    const [destination, setDestination] = useState(CITY_NAMES[1]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (source === destination) {
            setError('Source and destination must be different');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const shipment = await chainguardApi.createShipment(source, destination);
            await addOperationRecord({
                shipmentId: shipment.numericId,
                shipmentCode: shipment.id,
                source,
                destination,
                status: shipment.status,
                delayProbability: shipment.delayProbability,
                createdBy: currentUser?.displayName || currentUser?.email || 'operator',
            });
            setIsOpen(false);
        } catch (err) {
            setError('Failed to dispatch operation');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="absolute top-6 right-44 z-50 pointer-events-auto">
            {!isOpen ? (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg border border-white/10 flex items-center gap-2"
                >
                    <Send className="w-5 h-5" />
                    <span className="text-sm font-medium pr-2">Dispatch Ops</span>
                </button>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-2xl w-80"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-medium text-sm tracking-wide uppercase text-[10px]">Dispatch Operation</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Source</label>
                            <select 
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            >
                                {CITY_NAMES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Destination</label>
                            <select 
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            >
                                {CITY_NAMES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 text-sm font-medium mt-4 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Dispatching...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Launch Ops
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

export default CreateOperationForm;
