import React from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const getSmoothPathString = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];

        // Add a slight arc upwards for natural route projection
        const midX = (prev[0] + curr[0]) / 2;
        const midY = Math.min(prev[1], curr[1]) - 30; // 30px upward curve arch

        d += ` Q ${midX} ${midY} ${curr[0]} ${curr[1]}`;
    }
    return d;
};

// Math function to compute exactly where on the quadratic bezier curve we are given progress T (0 -> 1)
const getQuadraticBezierPoint = (p0, p1, p2, t) => {
    const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    return [x, y];
};

const getPointOnPath = (points, progress) => {
    if (!points || points.length < 2) return points[0] || [0, 0];

    const p = Math.max(0, Math.min(1, progress));

    const maxSegment = points.length - 1;
    const rawProgress = p * maxSegment;
    const startIdx = Math.floor(rawProgress);
    const endIdx = Math.min(startIdx + 1, maxSegment);
    const localT = rawProgress - startIdx;

    const p0 = points[startIdx];
    const p2 = points[endIdx];
    // Control point matches what's drawn in the path generator
    const p1 = [(p0[0] + p2[0]) / 2, Math.min(p0[1], p2[1]) - 30];

    return getQuadraticBezierPoint(p0, p1, p2, localT);
};

// Physical locations on 1000x507 SVG grid for visual anchoring
const GLOBAL_NODES = [
    { id: 'na', name: 'North America', coords: [220, 180] },
    { id: 'eu', name: 'Europe', coords: [480, 150] },
    { id: 'me', name: 'Middle East', coords: [580, 220] },
    { id: 'in', name: 'India', coords: [680, 240] },
    { id: 'ea', name: 'East Asia', coords: [800, 200] },
    { id: 'au', name: 'Australia', coords: [850, 380] }
];

const projectPoint = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 507;
    return [x, y];
};

const CentralVisualization = ({ shipments, selectedId, onSelect, userEvents = [], mapOverlayMode = 'none', warehouseStats = [] }) => {
    if (!shipments) return null;

    return (
        <div className="absolute inset-0 z-10 pointer-events-none flex mx-24 my-20">
            <TransformWrapper
                initialScale={1}
                minScale={0.8}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                pinch={{ step: 5 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <React.Fragment>
                        <div className="fixed bottom-24 right-8 z-[100] flex space-x-2">
                            <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center bg-[#0b1f2a]/80 hover:bg-[#1a3648] text-slate-300 hover:text-white rounded-lg border border-white/10 backdrop-blur-md shadow-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center bg-[#0b1f2a]/80 hover:bg-[#1a3648] text-slate-300 hover:text-white rounded-lg border border-white/10 backdrop-blur-md shadow-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <button onClick={() => resetTransform()} className="px-3 h-8 flex items-center justify-center bg-[#0b1f2a]/80 hover:bg-[#1a3648] text-[10px] tracking-widest uppercase font-mono text-slate-300 hover:text-white rounded-lg border border-white/10 backdrop-blur-md shadow-lg transition-colors">
                                Reset
                            </button>
                        </div>
                        <TransformComponent 
                            wrapperClass="w-full h-full cursor-grab active:cursor-grabbing"
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ width: '100%', height: '100%' }}
                        >
                            {/* The SVG coordinates and map bounding box perfectly lock together.
                                Using exactly 1000x507 keeps the Wikipedia SVG proportions native so lines aren't stretched. */}
                            <svg
                                className="w-full h-full relative z-20"
                                viewBox="0 0 1000 507"
                                preserveAspectRatio="xMidYMid meet"
                            >
                <defs>
                    <linearGradient id="normalGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="delayedGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="highRiskGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* SVG Image Underlay representing exact geography clearly and sharply */}
                <image
                    href="/world.svg"
                    x="0" y="0" width="1000" height="507"
                    className="opacity-20"
                    style={{ mixBlendMode: 'screen' }}
                />

                {/* Warehouse Intelligence Layer (Heatmap) */}
                {warehouseStats.map(wh => {
                    const coords = projectPoint(wh.location.lat, wh.location.lng);
                    const isHeatmap = mapOverlayMode === 'heatmap';
                    const score = wh.activityScore || 0;
                    
                    // Heatmap color interpolation (low: blue, mid: amber, high: red)
                    // We use an SVG circle with high blur instead of gradient for performance
                    const heatColor = score > 0.7 ? '#ef4444' : (score > 0.4 ? '#f59e0b' : '#3b82f6');
                    const heatRadius = isHeatmap ? 20 + (score * 40) : 0;
                    const heatOpacity = isHeatmap ? 0.1 + (score * 0.4) : 0;

                    return (
                        <g key={`wh-${wh.id}`} transform={`translate(${coords[0]}, ${coords[1]})`}>
                            {/* Heat radial overlay */}
                            {isHeatmap && (
                                <circle 
                                    r={heatRadius} 
                                    fill={heatColor} 
                                    opacity={heatOpacity} 
                                    filter="url(#glow)"
                                    style={{ mixBlendMode: 'screen', transition: 'all 1s ease' }}
                                />
                            )}
                            
                            {/* Warehouse Core Node */}
                            <circle 
                                r={3 + (score * 2)} 
                                fill={heatColor} 
                                opacity={0.8}
                                className="transition-all duration-1000"
                            />
                        </g>
                    );
                })}

                {/* Render Global Logistics Nodes (Ports) */}
                {GLOBAL_NODES.map(node => (
                    <g key={node.id} transform={`translate(${node.coords[0]}, ${node.coords[1]})`}>
                        {/* Soft pulsing underlayer */}
                        <motion.circle
                            r={6}
                            fill="#60a5fa"
                            initial={{ opacity: 0.1, scale: 0.8 }}
                            animate={{ opacity: 0.4, scale: 2 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="pointer-events-none"
                        />
                        <circle r={2.5} fill="#60a5fa" className="opacity-80" />
                    </g>
                ))}

                {/* Render Routes and Shipment Markers */}
                {shipments.map(ship => {
                    // Strict Map Safety Check
                    if (!ship.routeCoordinates || ship.routeCoordinates.length === 0) return null;
                    const firstCoord = ship.routeCoordinates[0];
                    if (firstCoord.lat === undefined || firstCoord.lng === undefined) return null;

                    const isSelected = selectedId === ship.id;
                    const isHighRisk = ship.riskScore > 80;
                    const isDelayed = ship.status === 'DELAYED';

                    // State Differentiation Logic (Normal -> subtle blue, Delayed -> muted amber, High Risk -> soft red)
                    const strokeColor = isHighRisk ? 'url(#highRiskGrad)' : (isDelayed ? 'url(#delayedGrad)' : 'url(#normalGrad)');
                    const coreColor = isHighRisk ? '#f87171' : (isDelayed ? '#fbbf24' : '#60a5fa');
                    const strokeWidth = isSelected ? 4 : 2;

                    // Support both projected backend path and simple manual route coordinates
                    const pathPoints = ship.path || ship.routeCoordinates.map(coord => projectPoint(coord.lat, coord.lng));
                    const pathD = getSmoothPathString(pathPoints);
                    const currentPos = ship.markerPosition || getPointOnPath(pathPoints, ship.progress || 0.5); // Default progress 0.5 for new

                    return (
                        <g key={ship.id} onClick={() => onSelect(ship.id)} className="cursor-pointer transition-opacity duration-300">
                            {/* Glow behind the active route */}
                            {isSelected && (
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={coreColor}
                                    strokeWidth={strokeWidth * 3}
                                    strokeDasharray="4 4"
                                    className="transition-all duration-500 opacity-20 pointer-events-none"
                                    filter="url(#glow)"
                                >
                                    <animate attributeName="stroke-dashoffset" values="10;0" dur="2s" repeatCount="indefinite" calcMode="linear" />
                                </path>
                            )}

                            {/* Core Route Path Arc */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray="3 3"
                                className="transition-all duration-500 hover:stroke-white/70"
                                style={{ opacity: isSelected ? 1 : 0.6 }}
                            >
                                {/* Flowing stroke animation native to SVG representing continuous flow */}
                                <animate
                                    attributeName="stroke-dashoffset"
                                    values="6;0"
                                    dur={isSelected ? "1s" : "4s"}
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </path>

                            {/* Moving Shipment Marker Container */}
                            <g style={{ transform: `translate(${currentPos[0]}px, ${currentPos[1]}px)` }}>
                                {/* Selected Ring Glow */}
                                {isSelected && (
                                    <motion.circle
                                        r={12}
                                        cx={0}
                                        cy={0}
                                        fill="transparent"
                                        stroke={coreColor}
                                        strokeWidth={1.5}
                                        style={{ filter: 'url(#glow)' }}
                                        initial={{ opacity: 0.9, scale: 0.3 }}
                                        animate={{ opacity: 0, scale: 1.5 }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                                    />
                                )}

                                {/* Core Tracking Dot */}
                                <circle
                                    r={isSelected ? 4 : 2.5}
                                    cx={0}
                                    cy={0}
                                    fill={coreColor}
                                    className="transition-colors duration-300 pointer-events-auto"
                                    filter="url(#glow)"
                                />
                            </g>
                        </g>
                    );
                })}

                {/* Render User Events */}
                {userEvents.map(event => {
                    const [x, y] = projectPoint(event.lat, event.lng);
                    return (
                        <g key={event.id} transform={`translate(${x}, ${y})`} className="pointer-events-auto group">
                            {/* Alert Pulse Effect */}
                            <motion.circle
                                r={15}
                                fill="#f43f5e"
                                initial={{ opacity: 0.8, scale: 0.1 }}
                                animate={{ opacity: 0, scale: 2 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                            />
                            
                            {/* Event Marker */}
                            <circle 
                                r={5} 
                                fill="#f43f5e" 
                                stroke="#fff"
                                strokeWidth={1.5}
                                filter="url(#glow)"
                            />

                            {/* Tooltip on Hover */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <rect x={10} y={-10} width={150} height={24} rx={4} fill="#0f172a" fillOpacity={0.9} stroke="#334155" strokeWidth={1} />
                                <text x={18} y={6} fill="#fff" fontSize={11} fontFamily="sans-serif" fontWeight="500">
                                    {event.title || 'User Event'}
                                </text>
                            </g>
                        </g>
                    );
                })}
            </svg>
                        </TransformComponent>
                    </React.Fragment>
                )}
            </TransformWrapper>
        </div>
    );
};

export default React.memo(CentralVisualization);
