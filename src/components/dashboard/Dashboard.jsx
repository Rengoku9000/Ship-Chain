import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
import { buildUpdateAlerts, chainguardApi, createAlertsFromShipments } from '../../lib/chainguardApi';
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
                    setConnectionStatus('OFFLINE');
                    setAlerts([
                        {
                            id: 'boot-error',
                            severity: 'high',
                            text: 'Backend unreachable. Start FastAPI on 127.0.0.1:8000 to stream live data.',
                            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                        },
                    ]);
                }
            }
        };

        loadInitialData();

        return () => {
            cancelled = true;
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
                const warehouseResponse = await chainguardApi.getWarehouseStatus();
                setWarehouseData(warehouseResponse.warehouses);
            } catch (_error) {
                // Keep the last known warehouse state when polling fails.
            }
        }, 9000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!liveFeedEnabled) {
            socketRef.current?.close();
            socketRef.current = null;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            setConnectionStatus('PAUSED');
            return;
        }

        let disposed = false;

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
                const [costResponse, logsResponse] = await Promise.all([
                    chainguardApi.getCost(selectedShipment.numericId),
                    chainguardApi.getLogs(selectedShipment.numericId),
                ]);

                if (cancelled) return;

                setSelectedCost(costResponse);
                setSelectedLogs(logsResponse.log);
                setSelectedLogHash(logsResponse.hash);
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
                className="col-span-3 row-span-4 z-20 flex flex-col gap-4"
                style={panelStyle}
            >
                <MetricsPanel shipments={mergedShipments} warehouseData={warehouseData} />
                <SystemEventsPanel alerts={alerts} />
                <CostAnalysis shipment={selectedShipment} costData={selectedCost} />
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
