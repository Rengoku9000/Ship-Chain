import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderSystem from './HeaderSystem';
import ShipmentPanel from './ShipmentPanel';
import SystemEventsPanel from './SystemEventsPanel';
import CentralVisualization from './CentralVisualization';
import MetricsPanel from './MetricsPanel';
import CostAnalysis from './CostAnalysis';

const LazyGoogleMapView = React.lazy(() => import('./GoogleMapView'));
import EventTimeline from './EventTimeline';
import FloatingAssistant from './FloatingAssistant';
import ShipmentModal from './ShipmentModal';
import { buildUpdateAlerts, chainguardApi, createAlertsFromShipments, normalizeShipment } from '../../lib/chainguardApi';
import { clientSimulation } from '../../lib/clientSimulation';
import { subscribeToEvents } from '../../lib/dbService';
import { WAREHOUSES, getNearestWarehouse } from '../../data/warehouses';

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return <div className="fixed inset-0 z-[999] bg-red-900 text-white p-10"><h1 className="text-2xl font-bold">Error Caught:</h1><pre className="mt-4 text-xs">{this.state.error?.toString()}</pre><pre className="mt-4 text-xs">{this.state.error?.stack}</pre></div>;
        }
        return this.props.children;
    }
}
const Dashboard = ({ currentUser, onLogout }) => {
    const isOfflineRef = useRef(false);
    const [shipments, setShipments] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedShipmentId, setSelectedShipmentId] = useState(null);
    const [liveFeedEnabled, setLiveFeedEnabled] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
    const [warehouseData, setWarehouseData] = useState([]);
    const [selectedCost, setSelectedCost] = useState(null);
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [selectedLogHash, setSelectedLogHash] = useState('');
    const [userEvents, setUserEvents] = useState([]);
    const [mapView, setMapView] = useState('svg');
    const [mapOverlayMode, setMapOverlayMode] = useState('none'); // 'none' | 'heatmap'
    const [hasOpenedGoogleMap, setHasOpenedGoogleMap] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState('kpi');
    
    // Deletion State
    const [deletedShipmentIds, setDeletedShipmentIds] = useState(() => {
        const stored = localStorage.getItem('deletedShipmentIds');
        return stored ? JSON.parse(stored) : [];
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [modalData, setModalData] = useState(null);

    const [localShipmentOverrides, setLocalShipmentOverrides] = useState(() => {
        try {
            const saved = localStorage.getItem('localShipmentOverrides');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const [localCustomShipments, setLocalCustomShipments] = useState(() => {
        try {
            const saved = localStorage.getItem('localCustomShipments');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const previousShipmentsRef = useRef([]);
    const socketRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeToEvents((events) => {
            setUserEvents(events);
        });
        return () => unsubscribe();
    }, []);

    const hydrateDashboard = async () => {
        const [initialShipments, warehouseResponse] = await Promise.all([
            chainguardApi.getShipments(),
            chainguardApi.getWarehouseStatus(),
        ]);

        setShipments(initialShipments);
        setWarehouseData(warehouseResponse.warehouses);
        setAlerts((currentAlerts) => {
            const withoutOfflineBanner = currentAlerts.filter((alert) => alert.id !== 'boot-error');
            const seeded = createAlertsFromShipments(initialShipments);
            return withoutOfflineBanner.length ? withoutOfflineBanner : seeded;
        });
        previousShipmentsRef.current = initialShipments;
        setConnectionStatus('LIVE');
        return initialShipments;
    };

    useEffect(() => {
        let cancelled = false;

        const loadInitialData = async () => {
            try {
                if (cancelled) return;
                const initialShipments = await hydrateDashboard();
                if (!selectedShipmentId && initialShipments[0]) {
                    setSelectedShipmentId(initialShipments[0].id);
                }
            } catch (error) {
                if (!cancelled) {
                    // Backend unreachable — activate client-side simulation
                    isOfflineRef.current = true;
                    clientSimulation.init();
                    const simShipments = clientSimulation.getShipmentsNormalized();
                    setShipments(simShipments);
                    setWarehouseData(clientSimulation.getWarehouseStatus().warehouses);
                    setAlerts(createAlertsFromShipments(simShipments));
                    previousShipmentsRef.current = simShipments;
                    setConnectionStatus('LIVE');
                    if (!selectedShipmentId && simShipments[0]) {
                        setSelectedShipmentId(simShipments[0].id);
                    }

                    // Start the simulation loop (mirrors the backend 2s tick)
                    clientSimulation.startSimulation((rawShipments) => {
                        if (cancelled) return;
                        const normalized = rawShipments.map(normalizeShipment).map((s) => {
                            const idNum = s.numericId || 1;
                            const types = ['Container', 'Bulk', 'Liquid', 'Express'];
                            const sizes = ['40ft', '20ft', '12 pallets', '5000 TEU'];
                            const weights = ['18,500 kg', '22,000 kg', '4,500 kg', '10,200 kg'];
                            const cargos = ['Electronics', 'Automotive Parts', 'Oil', 'Medical Supplies', 'Machinery'];
                            const carriers = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd'];
                            const temperatures = ['Ambient', '-18°C', '4°C', 'Ambient', 'Controlled'];
                            return {
                                ...s,
                                type: types[idNum % types.length],
                                size: sizes[(idNum + 1) % sizes.length],
                                weight: weights[(idNum + 2) % weights.length],
                                cargo: cargos[(idNum + 3) % cargos.length],
                                carrier: carriers[(idNum + 4) % carriers.length],
                                temperature: temperatures[(idNum + 5) % temperatures.length],
                                lastCheckpoint: s.currentRoute?.[s.currentRoute.length - 1] || s.source || 'Unknown',
                                delayReason: (s.status === 'DELAYED' || s.estimatedDelayMinutes > 0)
                                    ? (s.explanation || 'Operational delays detected at port')
                                    : null,
                            };
                        });
                        setShipments(normalized);
                        setAlerts((prev) => [
                            ...buildUpdateAlerts(previousShipmentsRef.current, normalized),
                            ...prev,
                        ].slice(0, 6));
                        previousShipmentsRef.current = normalized;
                    });
                }
            }
        };

        loadInitialData();

        return () => {
            cancelled = true;
            clientSimulation.stopSimulation();
        };
    }, []);

    useEffect(() => {
        if (!shipments.length) return;
        const selectionStillExists = shipments.some((shipment) => shipment.id === selectedShipmentId);
        if (!selectionStillExists) {
            setSelectedShipmentId(shipments[0].id);
        }
    }, [selectedShipmentId, shipments]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                if (isOfflineRef.current) {
                    setWarehouseData(clientSimulation.getWarehouseStatus().warehouses);
                } else {
                    const warehouseResponse = await chainguardApi.getWarehouseStatus();
                    setWarehouseData(warehouseResponse.warehouses);
                }
            } catch (_error) {
                // Keep the last known warehouse state when polling fails.
            }
        }, 9000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!liveFeedEnabled) {
            // Pause: stop WebSocket and client simulation
            socketRef.current?.close();
            socketRef.current = null;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            clientSimulation.stopSimulation();
            setConnectionStatus('PAUSED');
            return;
        }

        // Resume: choose strategy based on offline flag
        let disposed = false;

        if (isOfflineRef.current) {
            // Offline mode — restart the client-side simulation ticker
            setConnectionStatus('LIVE');
            clientSimulation.startSimulation((rawShipments) => {
                if (disposed) return;
                const normalized = rawShipments.map(normalizeShipment).map((s) => {
                    const idNum = s.numericId || 1;
                    const types = ['Container', 'Bulk', 'Liquid', 'Express'];
                    const sizes = ['40ft', '20ft', '12 pallets', '5000 TEU'];
                    const weights = ['18,500 kg', '22,000 kg', '4,500 kg', '10,200 kg'];
                    const cargos = ['Electronics', 'Automotive Parts', 'Oil', 'Medical Supplies', 'Machinery'];
                    const carriers = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd'];
                    const temperatures = ['Ambient', '-18°C', '4°C', 'Ambient', 'Controlled'];
                    return {
                        ...s,
                        type: types[idNum % types.length],
                        size: sizes[(idNum + 1) % sizes.length],
                        weight: weights[(idNum + 2) % weights.length],
                        cargo: cargos[(idNum + 3) % cargos.length],
                        carrier: carriers[(idNum + 4) % carriers.length],
                        temperature: temperatures[(idNum + 5) % temperatures.length],
                        lastCheckpoint: s.currentRoute?.[s.currentRoute.length - 1] || s.source || 'Unknown',
                        delayReason: (s.status === 'DELAYED' || s.estimatedDelayMinutes > 0)
                            ? (s.explanation || 'Operational delays detected at port')
                            : null,
                    };
                });
                setShipments(normalized);
                setAlerts((prev) => [
                    ...buildUpdateAlerts(previousShipmentsRef.current, normalized),
                    ...prev,
                ].slice(0, 6));
                previousShipmentsRef.current = normalized;
            });

            return () => {
                disposed = true;
                clientSimulation.stopSimulation();
            };
        }

        // Online mode — connect via WebSocket
        const connect = async () => {
            try {
                await hydrateDashboard();
            } catch (_error) {
                setConnectionStatus('OFFLINE');
            }
            if (disposed) return;

            const socket = chainguardApi.connectToShipments((incomingShipments) => {
                setShipments(incomingShipments);
                setAlerts((currentAlerts) => [
                    ...buildUpdateAlerts(previousShipmentsRef.current, incomingShipments),
                    ...currentAlerts,
                ].slice(0, 6));
                previousShipmentsRef.current = incomingShipments;
                setConnectionStatus('LIVE');
            });

            socket.onopen = () => setConnectionStatus('LIVE');
            socket.onerror = () => setConnectionStatus('OFFLINE');
            socket.onclose = () => {
                if (!liveFeedEnabled || disposed) return;
                setConnectionStatus('OFFLINE');
                reconnectTimerRef.current = setTimeout(() => {
                    connect();
                }, 2500);
            };

            socketRef.current = socket;
        };

        connect();

        return () => {
            disposed = true;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [liveFeedEnabled]);

    useEffect(() => {
        if (!selectedShipmentId) return;

        const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId);
        if (!selectedShipment) return;

        let cancelled = false;

        const loadSelectedShipmentData = async () => {
            try {
                if (isOfflineRef.current) {
                    // Use client-side simulation data
                    const costData = clientSimulation.getCost(selectedShipment.numericId);
                    const logsData = await clientSimulation.getLogs(selectedShipment.numericId);
                    if (!cancelled) {
                        setSelectedCost(costData);
                        setSelectedLogs(logsData.log);
                        setSelectedLogHash(logsData.hash);
                    }
                } else {
                    const [costResponse, logsResponse] = await Promise.all([
                        chainguardApi.getCost(selectedShipment.numericId),
                        chainguardApi.getLogs(selectedShipment.numericId),
                    ]);
                    if (!cancelled) {
                        setSelectedCost(costResponse);
                        setSelectedLogs(logsResponse.log);
                        setSelectedLogHash(logsResponse.hash);
                    }
                }
            } catch (_error) {
                if (!cancelled) {
                    setSelectedCost(null);
                    setSelectedLogs([]);
                    setSelectedLogHash('');
                }
            }
        };

        loadSelectedShipmentData();

        return () => {
            cancelled = true;
        };
    }, [selectedShipmentId, shipments]);

    useEffect(() => {
        localStorage.setItem('localShipmentOverrides', JSON.stringify(localShipmentOverrides));
    }, [localShipmentOverrides]);

    useEffect(() => {
        localStorage.setItem('localCustomShipments', JSON.stringify(localCustomShipments));
    }, [localCustomShipments]);

    useEffect(() => {
        localStorage.setItem('deletedShipmentIds', JSON.stringify(deletedShipmentIds));
    }, [deletedShipmentIds]);

    const mergedShipments = useMemo(() => {
        const enrichShipment = (s) => {
            // Find coordinates depending on data structure (local vs websocket)
            const oLat = s.origin?.lat ?? s.lat;
            const oLng = s.origin?.lng ?? s.lng;
            
            // For destination, base shipments might not have a distinct destination lat/lng but rather a path.
            // If they don't have destination coords, we just use the origin for destination nearest as fallback to prevent crash
            const dLat = s.destination?.lat ?? (s.routeCoordinates?.[1]?.[0] || oLat);
            const dLng = s.destination?.lng ?? (s.routeCoordinates?.[1]?.[1] || oLng);

            const originWarehouseId = getNearestWarehouse(oLat, oLng)?.id;
            const destinationWarehouseId = getNearestWarehouse(dLat, dLng)?.id;

            return { ...s, originWarehouseId, destinationWarehouseId };
        };

        const baseShipments = shipments
            .filter(s => !deletedShipmentIds.includes(s.id))
            .map(s => {
                const base = localShipmentOverrides[s.id] ? { ...s, ...localShipmentOverrides[s.id] } : s;
                return enrichShipment(base);
            });
            
        const customFiltered = localCustomShipments
            .filter(s => !deletedShipmentIds.includes(s.id))
            .map(enrichShipment);
            
        return [...customFiltered, ...baseShipments];
    }, [shipments, localShipmentOverrides, localCustomShipments, deletedShipmentIds]);

    const warehouseStats = useMemo(() => {
        // Compute active shipments per warehouse
        const activeShipmentsMap = {};
        WAREHOUSES.forEach(w => activeShipmentsMap[w.id] = 0);

        mergedShipments.forEach(ship => {
            if (ship.originWarehouseId) activeShipmentsMap[ship.originWarehouseId]++;
            if (ship.destinationWarehouseId) activeShipmentsMap[ship.destinationWarehouseId]++;
        });

        // Compute activity score for each warehouse
        return WAREHOUSES.map(w => {
            const activeShipments = activeShipmentsMap[w.id] || 0;
            const currentLoad = w.baseLoad + (activeShipments * w.avgShipmentLoad);
            
            let activityScore = 
                (currentLoad / w.capacity) * 0.5 +
                (w.throughput / w.maxThroughput) * 0.3 +
                (activeShipments / w.maxShipments) * 0.2;

            // Normalize safely between 0 and 1
            activityScore = Math.max(0, Math.min(1, activityScore));

            return {
                ...w,
                activeShipments,
                currentLoad,
                activityScore
            };
        });
    }, [mergedShipments]);

    const selectedShipment = useMemo(
        () => mergedShipments.find((shipment) => shipment.id === selectedShipmentId) || null,
        [mergedShipments, selectedShipmentId]
    );

    const warehouseSummary = useMemo(() => {
        if (!warehouseData.length) return { label: 'Warehouse syncing', level: 'LOW' };
        const highLoadCount = warehouseData.filter((item) => item.status === 'High').length;
        if (highLoadCount >= 2) return { label: 'Warehouse strain', level: 'HIGH' };
        if (highLoadCount === 1) return { label: 'Warehouse watch', level: 'MEDIUM' };
        return { label: 'Warehouse fluid', level: 'LOW' };
    }, [warehouseData]);

    const headerSimulationMode = liveFeedEnabled && connectionStatus === 'LIVE';

    const handleToggleMap = () => {
        setMapView((prev) => {
            const next = prev === 'svg' ? 'google' : 'svg';
            if (next === 'google') setHasOpenedGoogleMap(true);
            return next;
        });
    };

    const handleOpenModal = (mode, data = null) => {
        setModalMode(mode);
        setModalData(data);
        setIsModalOpen(true);
    };

    const handleSaveShipment = async (data) => {
        if (modalMode === 'edit') {
            setLocalShipmentOverrides(prev => ({
                ...prev,
                [data.id]: data
            }));
        } else {
            setLocalCustomShipments(prev => [...prev, data]);
            setSelectedShipmentId(data.id);
        }
        setIsModalOpen(false);
    };

    const handleDeleteShipment = (id) => {
        setDeletedShipmentIds(prev => [...prev, id]);
        setLocalCustomShipments(prev => prev.filter(s => s.id !== id));
        if (selectedShipmentId === id) {
            setSelectedShipmentId(null);
        }
    };

    const panelStyle = {
        opacity: mapView === 'google' ? 0 : 1,
        transform: mapView === 'google' ? 'scale(0.98)' : 'scale(1)',
        pointerEvents: mapView === 'google' ? 'none' : 'auto',
        transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'
    };

    return (
        <div className="absolute inset-0 z-20 pointer-events-none p-6 grid grid-cols-12 grid-rows-6 gap-6">
            <div 
                className="absolute inset-0 z-10"
                style={{
                    opacity: mapView === 'svg' ? 1 : 0,
                    pointerEvents: mapView === 'svg' ? 'auto' : 'none',
                    filter: mapView === 'svg' ? 'blur(0px)' : 'blur(4px)',
                    transition: 'opacity 0.8s ease-in-out, filter 0.8s ease-in-out'
                }}
            >
                <CentralVisualization 
                    shipments={mergedShipments} 
                    selectedId={selectedShipmentId} 
                    onSelect={setSelectedShipmentId} 
                    userEvents={userEvents}
                    mapOverlayMode={mapOverlayMode}
                    warehouseStats={warehouseStats}
                />
            </div>

            <div 
                className="fixed inset-0 z-0 bg-[#0b1f2a]"
                style={{
                    opacity: mapView === 'google' ? 1 : 0,
                    pointerEvents: mapView === 'google' ? 'auto' : 'none',
                    visibility: mapView === 'google' ? 'visible' : 'hidden',
                    transform: mapView === 'google' ? 'scale(1)' : 'scale(1.02)',
                    transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out, visibility 0.8s ease-in-out'
                }}
            >
                {hasOpenedGoogleMap && (
                    <React.Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0b1f2a]/90 backdrop-blur-md text-slate-300 z-50">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[10px] tracking-widest uppercase animate-pulse">Loading detailed map...</span>
                            </div>
                        </div>
                    }>
                        <LazyGoogleMapView 
                            shipments={mergedShipments} 
                            selectedId={selectedShipmentId} 
                            onSelect={setSelectedShipmentId} 
                            userEvents={userEvents} 
                            mapOverlayMode={mapOverlayMode}
                            warehouseStats={warehouseStats}
                        />
                    </React.Suspense>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                className="col-span-12 row-span-1 pointer-events-auto z-20 h-16"
            >
                <HeaderSystem
                    simulationMode={headerSimulationMode}
                    onToggle={() => setLiveFeedEnabled((current) => !current)}
                    connectionStatus={connectionStatus}
                    warehouseSummary={warehouseSummary}
                    currentUser={currentUser}
                    onLogout={onLogout}
                    mapView={mapView}
                    onToggleMap={handleToggleMap}
                    mapOverlayMode={mapOverlayMode}
                    onToggleOverlay={() => setMapOverlayMode(prev => prev === 'none' ? 'heatmap' : 'none')}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="col-span-3 row-span-4 z-20 flex flex-col gap-4"
                style={panelStyle}
            >
                <ShipmentPanel shipments={mergedShipments} selectedId={selectedShipmentId} onSelect={setSelectedShipmentId} onOpenModal={handleOpenModal} onDelete={handleDeleteShipment} />
            </motion.div>

            <div className="col-span-6 row-span-4 z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                className="col-span-3 row-span-4 z-20 flex flex-col gap-4 pointer-events-auto"
                style={panelStyle}
            >
                <div className="flex space-x-1 p-1 bg-[#0b1f2a]/80 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    {[
                        { id: 'kpi', label: 'Performance' },
                        { id: 'events', label: 'System Events' },
                        { id: 'cost', label: 'Cost Flow' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveRightTab(tab.id)}
                            className={`flex-1 py-2.5 px-3 text-[10px] tracking-[0.15em] uppercase font-mono rounded-lg transition-all duration-300 ${
                                activeRightTab === tab.id 
                                ? 'bg-slate-800 text-white shadow-inner border border-white/10' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 relative h-full">
                    <AnimatePresence mode="wait">
                        {activeRightTab === 'kpi' && (
                            <motion.div key="kpi" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="absolute inset-0">
                                <MetricsPanel shipments={mergedShipments} warehouseData={warehouseData} />
                            </motion.div>
                        )}
                        {activeRightTab === 'events' && (
                            <motion.div key="events" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="absolute inset-0">
                                <SystemEventsPanel alerts={alerts} />
                            </motion.div>
                        )}
                        {activeRightTab === 'cost' && (
                            <motion.div key="cost" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="absolute inset-0">
                                <CostAnalysis shipment={selectedShipment} costData={selectedCost} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
                className="col-span-12 row-span-1 z-20"
                style={panelStyle}
            >
                <EventTimeline
                    selectedShipment={selectedShipment}
                    logs={selectedLogs}
                    logHash={selectedLogHash}
                />
            </motion.div>

            <div style={{ ...panelStyle, pointerEvents: 'none' }} className="absolute inset-0 z-50">
                <FloatingAssistant activeShipment={selectedShipment} />
            </div>

            <ErrorBoundary>
                <ShipmentModal 
                    isOpen={isModalOpen}
                    mode={modalMode}
                    initialData={modalData}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveShipment}
                />
            </ErrorBoundary>
        </div>
    );
};

export default Dashboard;
