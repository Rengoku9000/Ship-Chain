import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react';

const ShipmentCard = React.memo(({ ship, isSelected, onSelect, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const isHighRisk = ship.riskScore > 80;

    const toggleExpand = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
        setShowConfirmDelete(false); // Reset confirmation state on toggle
    };

    return (
        <motion.div
            layout
            onClick={() => {
                onSelect(isSelected ? null : ship.id);
                setShowConfirmDelete(false); // Reset confirmation state on select
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:-translate-y-[1px]
                ${isSelected ? 'bg-white/10 border-blue-400/50' : 'bg-white/5 border-white/5 hover:border-white/20'}
                ${isHighRisk && !isSelected ? 'border-amber-500/30' : ''}`}
        >
            {/* Primary Row */}
            <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-slate-200 tracking-widest font-mono font-medium">{ship.id}</div>
                <div className={`text-[10px] px-2 py-0.5 rounded tracking-widest font-mono border ${isHighRisk ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-blue-300 border-blue-500/30 bg-blue-500/10'}`}>
                    {ship.status}
                </div>
            </div>

            {/* Secondary Row */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Route</div>
                    <div className="text-[12px] text-white/80 font-medium">
                        {ship.origin?.name || ship.source || 'Unknown'} → {ship.destination?.name || ship.destination || 'Unknown'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">ETA</div>
                    <div className="text-[12px] text-white/80 font-medium font-mono">{ship.etaFormatted || ship.eta}</div>
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">Type</div>
                    <div className="text-[12px] text-white/80 font-medium">{ship.type}</div>
                </div>
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">Size</div>
                    <div className="text-[12px] text-white/80 font-medium">{ship.size}</div>
                </div>
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">Weight</div>
                    <div className="text-[12px] text-white/80 font-medium">{ship.weight}</div>
                </div>
                <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Risk Level</div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${isHighRisk ? 'bg-amber-400' : 'bg-blue-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${ship.riskScore}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </div>

            {/* Expand Toggle */}
            <button
                onClick={toggleExpand}
                className="w-full py-1.5 flex items-center justify-center space-x-1 border-t border-white/5 text-white/40 hover:text-white/80 hover:bg-white/5 rounded transition-colors"
            >
                <span className="text-[10px] uppercase tracking-widest">{expanded ? 'Less Details' : 'More Details'}</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Expandable Details */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 mt-2">
                            <div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wide">Cargo</div>
                                <div className="text-[12px] text-white/80 font-medium">{ship.cargo}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wide">Carrier</div>
                                <div className="text-[12px] text-white/80 font-medium">{ship.carrier}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-[10px] text-white/40 uppercase tracking-wide">Last Checkpoint</div>
                                <div className="text-[12px] text-white/80 font-medium">{ship.lastCheckpoint}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wide">Temperature</div>
                                <div className="text-[12px] text-white/80 font-medium">{ship.temperature}</div>
                            </div>
                            {ship.delayReason && (
                                <div className="col-span-2">
                                    <div className="text-[10px] text-amber-400/60 uppercase tracking-wide mt-1">Delay Reason</div>
                                    <div className="text-[12px] text-amber-400/90 font-medium">{ship.delayReason}</div>
                                </div>
                            )}
                            <div className="col-span-2 pt-2 flex justify-end space-x-2">
                                {showConfirmDelete ? (
                                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                                        <span className="text-[10px] text-red-400 uppercase tracking-widest">Delete this?</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(ship.id);
                                            }}
                                            className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-[10px] uppercase transition-colors"
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowConfirmDelete(false);
                                            }}
                                            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/60 rounded text-[10px] uppercase transition-colors"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowConfirmDelete(true);
                                        }}
                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(ship);
                                    }}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded text-[10px] uppercase tracking-widest transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit Shipment</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

const SkeletonCard = () => (
    <div className="p-4 rounded-lg border bg-white/5 border-white/5 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="h-4 bg-white/10 rounded w-16"></div>
            <div className="h-4 bg-white/10 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-end mb-4">
            <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded w-10"></div>
                <div className="h-3 bg-white/10 rounded w-24"></div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
                <div className="h-2 bg-white/10 rounded w-8"></div>
                <div className="h-3 bg-white/10 rounded w-12"></div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="h-8 bg-white/10 rounded"></div>
            <div className="h-8 bg-white/10 rounded"></div>
        </div>
    </div>
);

const ShipmentPanel = ({ shipments = [], selectedId, onSelect, onOpenModal, onDelete }) => {
    // If no shipments exist, render an empty state
    const isEmpty = shipments.length === 0;

    return (
        <div className="flex flex-col h-[65vh] min-h-[480px] pointer-events-auto bg-[#0b1f2a]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm tracking-widest uppercase font-semibold text-slate-200">Active Operations</span>
                    <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-white/60 ml-2">
                        {shipments.length}
                    </span>
                </div>
                <button 
                    onClick={() => onOpenModal('create')}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-colors text-[10px] uppercase tracking-widest border border-blue-500/30"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 relative pr-1">
                {isEmpty ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 space-y-3">
                        <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center bg-white/5">
                            <span className="text-xs uppercase tracking-widest">0</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest">No Active Operations</span>
                    </div>
                ) : (
                    <AnimatePresence>
                        {shipments.map(ship => (
                            <motion.div
                                key={ship.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ShipmentCard
                                    ship={ship}
                                    isSelected={selectedId === ship.id}
                                    onSelect={onSelect}
                                    onEdit={() => onOpenModal('edit', ship)}
                                    onDelete={onDelete}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default ShipmentPanel;
