import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderSystem from './HeaderSystem';
import ShipmentPanel from './ShipmentPanel';
import AlertsPanel from './AlertsPanel';
import CentralVisualization from './CentralVisualization';
import MetricsPanel from './MetricsPanel';
import CostAnalysis from './CostAnalysis';
import EventTimeline from './EventTimeline';
import AIAssistant from './AIAssistant';
import FloatingAssistant from './FloatingAssistant';

const INITIAL_SHIPMENTS = [
    { id: 'LBL-1094', status: 'IN TRANSIT', eta: '12:45', riskScore: 12, aiConfidence: 98, path: [[800, 200], [500, 100], [220, 180]], costImpact: '$1.2k/hr', progress: 0.1 },
    { id: 'OCN-4421', status: 'DELAYED', eta: '--:--', riskScore: 84, aiConfidence: 62, path: [[480, 150], [350, 140], [220, 180]], costImpact: '$8.5k penalties', progress: 0.5 },
    { id: 'PAC-9902', status: 'HIGH RISK', eta: '18:30', riskScore: 92, aiConfidence: 45, path: [[850, 380], [830, 280], [800, 200]], costImpact: 'Critical', progress: 0.2 },
];

const INITIAL_ALERTS = [
    { id: 1, severity: 'low', text: 'Routine sync verified', timestamp: '12:00:01' }
];

const Dashboard = () => {
    const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
    const [alerts, setAlerts] = useState(INITIAL_ALERTS);
    const [selectedShipmentId, setSelectedShipmentId] = useState(null);
    const [simulationMode, setSimulationMode] = useState(true);

    // Central Simulation Engine
    useEffect(() => {
        if (!simulationMode) return;

        const interval = setInterval(() => {
            setShipments(prev => {
                return prev.map(ship => {
                    // Increment progress simulating movement
                    let newProgress = ship.progress + (Math.random() * 0.05);
                    if (newProgress > 1) newProgress = 0;

                    let newRisk = ship.riskScore;
                    if (Math.random() > 0.8) {
                        newRisk = Math.max(0, Math.min(100, newRisk + (Math.floor(Math.random() * 11) - 5)));
                    }

                    let newStatus = ship.status;
                    if (newRisk > 85) newStatus = 'HIGH RISK';
                    else if (newRisk > 50 && newStatus !== 'DELAYED') newStatus = 'WARNING';
                    else if (newStatus !== 'DELAYED') newStatus = 'IN TRANSIT';

                    return { ...ship, progress: newProgress, riskScore: newRisk, status: newStatus };
                });
            });

            // Random alert injection
            if (Math.random() > 0.85) {
                setAlerts(prev => {
                    const newAlert = {
                        id: Date.now(),
                        severity: Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low'),
                        text: Math.random() > 0.5 ? 'Atmospheric anomaly detected on PAC sector.' : 'Vessel localized. Speed adjustment recorded.',
                        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                    }
                    return [newAlert, ...prev].slice(0, 5); // Keep last 5
                });
            }

        }, 2500);

        return () => clearInterval(interval);
    }, [simulationMode]);

    const selectedShipment = useMemo(() => shipments.find(s => s.id === selectedShipmentId) || null, [shipments, selectedShipmentId]);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none p-6 grid grid-cols-12 grid-rows-6 gap-6">

            {/* Background Visualization Layer (Map & Routes) */}
            <CentralVisualization shipments={shipments} selectedId={selectedShipmentId} onSelect={setSelectedShipmentId} />

            {/* Header spanning top */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                className="col-span-12 row-span-1 pointer-events-auto z-20 h-16"
            >
                <HeaderSystem simulationMode={simulationMode} onToggle={() => setSimulationMode(!simulationMode)} />
            </motion.div>

            {/* Left Panels: Shipments & Alerts */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="col-span-3 row-span-4 pointer-events-auto z-20 flex flex-col gap-6"
            >
                <ShipmentPanel shipments={shipments} selectedId={selectedShipmentId} onSelect={setSelectedShipmentId} />
                <AlertsPanel alerts={alerts} />
            </motion.div>

            {/* Center Empty Space for Map */}
            <div className="col-span-6 row-span-4 z-10" />

            {/* Right Panels: Metrics, Cost, Assistant */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                className="col-span-3 row-span-4 pointer-events-auto z-20 flex flex-col gap-6"
            >
                <MetricsPanel shipments={shipments} />
                <CostAnalysis />
                <AIAssistant />
            </motion.div>

            {/* Bottom Panel: Event Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
                className="col-span-12 row-span-1 pointer-events-auto z-20"
            >
                <EventTimeline selectedShipment={selectedShipment} />
            </motion.div>

            {/* Floating Elements */}
            <FloatingAssistant activeShipment={selectedShipment} />
        </div>
    );
};

export default Dashboard;
