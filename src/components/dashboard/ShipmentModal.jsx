import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

const GLOBAL_PORTS = [
    { name: 'Singapore', country: 'Singapore', lat: 1.290270, lng: 103.851959 },
    { name: 'Rotterdam', country: 'Netherlands', lat: 51.9225, lng: 4.47917 },
    { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
    { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
    { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
    { name: 'Antwerp', country: 'Belgium', lat: 51.2194, lng: 4.4025 },
    { name: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756 },
    { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 }
];

const inputClasses = "w-full bg-[#06111a] border border-white/10 rounded px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors";
const labelClasses = "block text-[10px] text-white/40 uppercase tracking-widest mb-1.5";
const errorClasses = "text-[9px] text-red-400 mt-1 uppercase tracking-wider";

const PortAutocomplete = ({ label, value, onChange, error, placeholder }) => {
    const [query, setQuery] = useState(value?.name || '');
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        setQuery(value?.name || '');
    }, [value]);

    const filteredPorts = GLOBAL_PORTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.country.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="relative">
            <label className={labelClasses}>{label}</label>
            <input 
                type="text" 
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (value) onChange(null); 
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                className={inputClasses} 
            />
            {error && <div className={errorClasses}>{error}</div>}
            
            <AnimatePresence>
                {isOpen && query && !value && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-[#0b1f2a] border border-white/10 rounded-md shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar"
                    >
                        {filteredPorts.length > 0 ? filteredPorts.map(port => (
                            <div 
                                key={port.name}
                                className="px-3 py-2 text-xs text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
                                onClick={() => {
                                    setQuery(port.name);
                                    onChange(port);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="font-medium text-white">{port.name}</span> <span className="opacity-50">({port.country})</span>
                            </div>
                        )) : (
                            <div className="px-3 py-2 text-xs text-white/40 italic">No ports found</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const ShipmentModal = ({ isOpen, mode, initialData, onClose, onSave }) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {
                id: `SHP-${Date.now()}`,
                numericId: Date.now(),
                status: 'ON-TIME',
                origin: null,
                destination: null,
                type: 'Container',
                size: '40ft',
                weight: '',
                cargo: '',
                carrier: '',
                temperature: 'Ambient',
                delayReason: '',
                riskScore: 10,
                lastCheckpoint: ''
            });
            setErrors({});
            setGlobalError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        setGlobalError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(null);
        setIsSubmitting(true);
        
        try {
            const newErrors = {};
            if (!formData.origin || !formData.origin.lat || !formData.origin.lng) {
                newErrors.origin = 'Valid origin port selection is required';
            }
            if (!formData.destination || !formData.destination.lat || !formData.destination.lng) {
                newErrors.destination = 'Valid destination port selection is required';
            }
            
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setIsSubmitting(false);
                return;
            }

            // Calculate Distance and ETA
            const distance = calculateDistance(
                formData.origin.lat, formData.origin.lng,
                formData.destination.lat, formData.destination.lng
            );
            const SPEED_KMH = 30;
            const travelTimeMs = Math.round((distance / SPEED_KMH) * 3600000);
            const etaDate = new Date(Date.now() + travelTimeMs);

            // Strictly construct safe routeCoordinates array
            const routeCoordinates = [
                [formData.origin.lat, formData.origin.lng],
                [formData.destination.lat, formData.destination.lng]
            ];

            const safeShipment = {
                ...formData,
                routeCoordinates,
                eta: etaDate.toISOString(),
                etaFormatted: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            await onSave(safeShipment);
        } catch (error) {
            console.error("[ShipmentModal] Error saving shipment:", error);
            setGlobalError(error.message || "An unexpected error occurred during creation.");
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, isSubmitting]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-[#0b1f2a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-sm font-medium text-slate-200 tracking-widest uppercase">
                                {mode === 'edit' ? `Edit Shipment ${formData.id || ''}` : 'Create Shipment'}
                            </h2>
                            <button onClick={onClose} disabled={isSubmitting} className="text-white/40 hover:text-white/80 transition-colors disabled:opacity-50">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                            <form id="shipment-form" onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* Basic Info */}
                                <div>
                                    <h3 className="text-[10px] text-blue-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">Basic Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Shipment ID</label>
                                            <input type="text" name="id" value={formData.id || ''} readOnly className={`${inputClasses} opacity-50 cursor-not-allowed`} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Status</label>
                                            <select name="status" value={formData.status || ''} onChange={handleChange} className={inputClasses}>
                                                <option value="ON-TIME">ON-TIME</option>
                                                <option value="DELAYED">DELAYED</option>
                                                <option value="RISK">AT RISK</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Route */}
                                <div>
                                    <h3 className="text-[10px] text-blue-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">Route</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <PortAutocomplete 
                                            label="Origin" 
                                            placeholder="Search ports..."
                                            value={formData.origin}
                                            onChange={(val) => {
                                                setFormData(prev => ({...prev, origin: val}));
                                                if (errors.origin) setErrors(prev => ({...prev, origin: null}));
                                            }}
                                            error={errors.origin}
                                        />
                                        <PortAutocomplete 
                                            label="Destination" 
                                            placeholder="Search ports..."
                                            value={formData.destination}
                                            onChange={(val) => {
                                                setFormData(prev => ({...prev, destination: val}));
                                                if (errors.destination) setErrors(prev => ({...prev, destination: null}));
                                            }}
                                            error={errors.destination}
                                        />
                                    </div>
                                </div>

                                {/* Details */}
                                <div>
                                    <h3 className="text-[10px] text-blue-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Type</label>
                                            <select name="type" value={formData.type || ''} onChange={handleChange} className={inputClasses}>
                                                <option value="Container">Container</option>
                                                <option value="Bulk">Bulk</option>
                                                <option value="Liquid">Liquid</option>
                                                <option value="Express">Express</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Size</label>
                                            <input type="text" name="size" placeholder="40ft" value={formData.size || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Weight</label>
                                            <input type="text" name="weight" placeholder="18,500 kg" value={formData.weight || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Cargo</label>
                                            <input type="text" name="cargo" placeholder="Electronics" value={formData.cargo || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Carrier</label>
                                            <input type="text" name="carrier" placeholder="Maersk" value={formData.carrier || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Temperature</label>
                                            <input type="text" name="temperature" placeholder="Ambient" value={formData.temperature || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced */}
                                <div>
                                    <h3 className="text-[10px] text-blue-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">Advanced</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClasses}>Last Checkpoint</label>
                                            <input type="text" name="lastCheckpoint" placeholder="Suez Canal" value={formData.lastCheckpoint || ''} onChange={handleChange} className={inputClasses} />
                                        </div>
                                        {formData.status === 'DELAYED' && (
                                            <div>
                                                <label className={labelClasses}>Delay Reason</label>
                                                <textarea name="delayReason" rows="2" placeholder="Port congestion" value={formData.delayReason || ''} onChange={handleChange} className={`${inputClasses} resize-none`}></textarea>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {globalError && (
                            <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center space-x-2 text-red-400 text-xs shrink-0">
                                <AlertCircle className="w-4 h-4" />
                                <span>{globalError}</span>
                            </div>
                        )}

                        <div className="p-4 border-t border-white/10 flex justify-end space-x-3 bg-black/20 shrink-0">
                            <button 
                                type="button" 
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors tracking-widest uppercase disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                form="shipment-form"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded transition-colors tracking-widest uppercase disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isSubmitting && <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>}
                                <span>{mode === 'edit' ? 'Save Changes' : 'Create Shipment'}</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ShipmentModal;
