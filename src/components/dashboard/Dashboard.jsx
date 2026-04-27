import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HeaderSystem from './HeaderSystem';
import ShipmentPanel from './ShipmentPanel';
import AlertsPanel from './AlertsPanel';
import GoogleMapView from './GoogleMapView';
import MetricsPanel from './MetricsPanel';
import CostAnalysis from './CostAnalysis';
import EventTimeline from './EventTimeline';
import AIAssistant from './AIAssistant';
import FloatingAssistant from './FloatingAssistant';
import { buildUpdateAlerts, chainguardApi, createAlertsFromShipments } from '../../lib/chainguardApi';
import { subscribeToEvents } from '../../lib/dbService';

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

    const selectedShipment = useMemo(
        () => shipments.find((shipment) => shipment.id === selectedShipmentId) || null,
        [shipments, selectedShipmentId]
    );

    const warehouseSummary = useMemo(() => {
        if (!warehouseData.length) return { label: 'Warehouse syncing', level: 'LOW' };
        const highLoadCount = warehouseData.filter((item) => item.status === 'High').length;
        if (highLoadCount >= 2) return { label: 'Warehouse strain', level: 'HIGH' };
        if (highLoadCount === 1) return { label: 'Warehouse watch', level: 'MEDIUM' };
        return { label: 'Warehouse fluid', level: 'LOW' };
    }, [warehouseData]);

    const headerSimulationMode = liveFeedEnabled && connectionStatus === 'LIVE';

    return (
        <div className="absolute inset-0 z-20 pointer-events-none p-6 grid grid-cols-12 grid-rows-6 gap-6">
            <GoogleMapView shipments={shipments} selectedId={selectedShipmentId} onSelect={setSelectedShipmentId} userEvents={userEvents} />

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
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="col-span-3 row-span-4 pointer-events-auto z-20 flex flex-col gap-6"
            >
                <ShipmentPanel shipments={shipments} selectedId={selectedShipmentId} onSelect={setSelectedShipmentId} />
                <AlertsPanel alerts={alerts} />
            </motion.div>

            <div className="col-span-6 row-span-4 z-10" />

            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                className="col-span-3 row-span-4 pointer-events-auto z-20 flex flex-col gap-6"
            >
                <MetricsPanel shipments={shipments} warehouseData={warehouseData} />
                <CostAnalysis shipment={selectedShipment} costData={selectedCost} />
                <AIAssistant selectedShipment={selectedShipment} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
                className="col-span-12 row-span-1 pointer-events-auto z-20"
            >
                <EventTimeline
                    selectedShipment={selectedShipment}
                    logs={selectedLogs}
                    logHash={selectedLogHash}
                />
            </motion.div>

            <FloatingAssistant activeShipment={selectedShipment} />
        </div>
    );
};

export default Dashboard;
