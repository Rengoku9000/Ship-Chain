import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addEvent } from '../../lib/dbService';
import { Plus, X } from 'lucide-react';

const CreateEventForm = ({ currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addEvent({
                title,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                createdBy: currentUser?.displayName || currentUser?.email || 'operator',
                description: `Manual event added by ${currentUser?.displayName || currentUser?.email || 'operator'}.`,
            });
            setIsOpen(false);
            setTitle('');
            setLat('');
            setLng('');
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div className="absolute top-6 right-6 z-50 pointer-events-auto">
            {!isOpen ? (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg border border-white/10 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium pr-2">Add Map Event</span>
                </button>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-2xl w-80"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-medium text-sm tracking-wide">New Map Event</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <input 
                                required
                                type="text" 
                                placeholder="Event Title (e.g. Delay at Port)" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <input 
                                required
                                type="number" 
                                step="any"
                                placeholder="Latitude" 
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                className="w-1/2 bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <input 
                                required
                                type="number" 
                                step="any"
                                placeholder="Longitude" 
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                className="w-1/2 bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-sm font-medium mt-2"
                        >
                            {loading ? 'Saving...' : 'Create Event'}
                        </button>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

export default CreateEventForm;
