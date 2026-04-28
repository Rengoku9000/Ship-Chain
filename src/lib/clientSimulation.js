/**
 * Client-Side Simulation Engine
 * ─────────────────────────────
 * A full JS port of the Python FastAPI backend (simulation, prediction,
 * optimization, cost, blockchain logs, geo). Activates automatically
 * when the real backend is unreachable (e.g. on Vercel).
 */

import { CITY_COORDS, normalizeShipment } from './chainguardApi';

// ─── Geo Utilities ───────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const rLat1 = (lat1 * Math.PI) / 180;
    const rLat2 = (lat2 * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function lerp(value, target, factor) {
    return value + (target - value) * factor;
}

// ─── Prediction Service ──────────────────────────────────────────
const RISK_THRESHOLD = 5.7;
const DELAYED_THRESHOLD = 7.2;

function predict(traffic, weather, distance) {
    const normalizedDistance = Math.min(distance / 1000.0, 10.0);
    const delayRisk = traffic * 0.5 + weather * 0.3 + normalizedDistance * 0.2;
    const probability = Math.max(0, Math.min(delayRisk / 10.0, 1.0));
    const estimatedDelay = Math.max(0, Math.round(probability * 90));

    let status;
    if (delayRisk >= DELAYED_THRESHOLD) status = 'delayed';
    else if (delayRisk >= RISK_THRESHOLD) status = 'risk';
    else status = 'on-time';

    return { delayRisk, probability, estimatedDelay, status };
}

// ─── Route Optimization (Dijkstra on the same graph) ─────────────
const EDGES = [
    ['Singapore', 'Dubai', 420],
    ['Dubai', 'Rotterdam', 360],
    ['Rotterdam', 'New York', 410],
    ['Singapore', 'Mumbai', 290],
    ['Mumbai', 'Dubai', 180],
    ['Mumbai', 'Tokyo', 370],
    ['Tokyo', 'Los Angeles', 520],
    ['Los Angeles', 'New York', 310],
    ['Sydney', 'Singapore', 390],
    ['Sydney', 'Tokyo', 430],
    ['Montreal', 'New York', 95],
    ['Rotterdam', 'Montreal', 455],
    ['Dubai', 'Montreal', 510],
    ['Tokyo', 'New York', 560],
];

function buildGraph() {
    const graph = {};
    for (const [a, b, time] of EDGES) {
        if (!graph[a]) graph[a] = {};
        if (!graph[b]) graph[b] = {};
        graph[a][b] = time;
        graph[b][a] = time;
    }
    return graph;
}

const GRAPH = buildGraph();

function routeTime(route) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
        total += GRAPH[route[i]][route[i + 1]];
    }
    return total;
}

function shortestPath(source, destination) {
    const dist = {};
    const prev = {};
    const visited = new Set();
    const nodes = Object.keys(GRAPH);

    for (const n of nodes) dist[n] = Infinity;
    dist[source] = 0;

    while (true) {
        let u = null;
        let uDist = Infinity;
        for (const n of nodes) {
            if (!visited.has(n) && dist[n] < uDist) {
                u = n;
                uDist = dist[n];
            }
        }
        if (u === null || u === destination) break;
        visited.add(u);
        for (const [neighbor, time] of Object.entries(GRAPH[u])) {
            const alt = dist[u] + time;
            if (alt < dist[neighbor]) {
                dist[neighbor] = alt;
                prev[neighbor] = u;
            }
        }
    }

    const path = [];
    let cur = destination;
    while (cur) {
        path.unshift(cur);
        cur = prev[cur];
    }
    return path;
}

function getBestRoute(source, destination, currentRoute = null) {
    const newRoute = shortestPath(source, destination);
    const newTime = routeTime(newRoute);
    const oldRoute = currentRoute || newRoute;
    const oldTime = routeTime(oldRoute);
    const timeSaved = Math.max(0, oldTime - newTime);
    return { source, destination, oldRoute, oldTime, newRoute, newTime, timeSaved };
}

// ─── Explanation Generator ───────────────────────────────────────
function explainDelay(shipment) {
    const reasons = [];
    if (shipment.traffic > 7) reasons.push('Heavy traffic');
    if (shipment.weather > 3) reasons.push('Bad weather');
    if (shipment.warehouse_delay) reasons.push('Warehouse congestion');
    if (!reasons.length) return 'Shipment is moving within expected operating conditions.';
    return reasons.join(', ') + '.';
}

// ─── Blockchain Log Service ──────────────────────────────────────
const blockchainLogs = {};

function seedLogs(shipmentId, events) {
    blockchainLogs[shipmentId] = events.map((event) => ({
        time: new Date().toISOString(),
        event,
    }));
}

function appendLog(shipmentId, event) {
    if (!blockchainLogs[shipmentId]) blockchainLogs[shipmentId] = [];
    blockchainLogs[shipmentId].push({ time: new Date().toISOString(), event });
}

async function simpleHash(text) {
    try {
        const data = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
        // Fallback for environments without SubtleCrypto
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
}

// ─── Cost Service ────────────────────────────────────────────────
const COST_PER_MINUTE = 24.0;

function calculateCost(shipment) {
    const currentLoss = shipment.estimated_delay_minutes * COST_PER_MINUTE;
    const optimizedSavings = shipment.time_saved * COST_PER_MINUTE;
    return {
        shipment_id: shipment.id,
        delay_minutes: shipment.estimated_delay_minutes,
        cost_per_minute: COST_PER_MINUTE,
        current_loss: Math.round(currentLoss * 100) / 100,
        optimized_savings: Math.round(optimizedSavings * 100) / 100,
    };
}

// ─── Warehouse Status ────────────────────────────────────────────
const WAREHOUSE_NAMES = ['Singapore', 'Dubai', 'Rotterdam', 'New York', 'Tokyo', 'Mumbai'];

function generateWarehouseStatus() {
    return {
        warehouses: WAREHOUSE_NAMES.map((warehouse) => {
            const load = Math.floor(Math.random() * 100) + 1;
            let status;
            if (load < 35) status = 'Low';
            else if (load < 70) status = 'Medium';
            else status = 'High';
            return { warehouse, load, status };
        }),
    };
}

// ─── Simulation Engine ──────────────────────────────────────────
const SEEDED_SHIPMENTS = [
    { id: 1, source: 'Singapore', destination: 'New York', route: ['Singapore', 'Dubai', 'Rotterdam', 'New York'] },
    { id: 2, source: 'Rotterdam', destination: 'Montreal', route: ['Rotterdam', 'New York', 'Montreal'] },
    { id: 3, source: 'Sydney', destination: 'Tokyo', route: ['Sydney', 'Singapore', 'Mumbai', 'Tokyo'] },
    { id: 4, source: 'Mumbai', destination: 'Los Angeles', route: ['Mumbai', 'Tokyo', 'Los Angeles'] },
];

let shipments = {};
let nextId = 5;
let stepInterval = null;
let listeners = [];

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function refreshShipment(s, initial = false) {
    const { probability, estimatedDelay, status } = predict(s.traffic, s.weather, s.distance);
    s.delay_probability = Math.round(probability * 100) / 100;
    s.estimated_delay_minutes = estimatedDelay + (s.warehouse_delay ? 12 : 0);
    s.status = status;
    s.updated_at = new Date().toISOString();
    s.explanation = explainDelay(s);

    const routeInfo = getBestRoute(s.source, s.destination, s.current_route);
    s.suggested_route = status !== 'on-time' ? routeInfo.newRoute : [];
    s.suggested_route_time = status !== 'on-time' ? routeInfo.newTime : 0;
    s.time_saved = status !== 'on-time' ? routeInfo.timeSaved : 0;

    if (initial) {
        seedLogs(s.id, [
            `Shipment ${s.id} registered on route ${s.current_route.join(' -> ')}`,
            `Initial status classified as ${s.status}`,
        ]);
    } else {
        appendLog(
            s.id,
            `Shipment ${s.id} updated: status=${s.status}, traffic=${s.traffic}, weather=${s.weather}, delay=${s.estimated_delay_minutes}m`
        );
        if (status !== 'on-time' && s.time_saved > 0) {
            appendLog(
                s.id,
                `AI reroute suggestion available: ${s.suggested_route.join(' -> ')} with ${s.time_saved} minutes saved`
            );
        }
    }
}

function bootstrapShipments() {
    shipments = {};
    for (const { id, source, destination, route } of SEEDED_SHIPMENTS) {
        const srcCoord = CITY_COORDS[source];
        const dstCoord = CITY_COORDS[destination];
        const distance = haversineDistance(srcCoord.lat, srcCoord.lng, dstCoord.lat, dstCoord.lng);
        const oldTime = routeTime(route);

        const s = {
            id,
            source,
            destination,
            current_route: route,
            current_route_time: oldTime,
            distance: Math.round(distance * 100) / 100,
            lat: srcCoord.lat,
            lng: srcCoord.lng,
            traffic: randInt(2, 9),
            weather: randInt(1, 5),
            warehouse_delay: Math.random() > 0.66,
            status: 'on-time',
            delay_probability: 0,
            estimated_delay_minutes: 0,
            explanation: 'Initializing simulation.',
            suggested_route: [],
            suggested_route_time: 0,
            time_saved: 0,
            updated_at: new Date().toISOString(),
        };

        refreshShipment(s, true);
        shipments[id] = s;
    }
}

function advancePosition(s) {
    const dstCoord = CITY_COORDS[s.destination];
    s.lat = Math.round(lerp(s.lat, dstCoord.lat, 0.06) * 10000) / 10000;
    s.lng = Math.round(lerp(s.lng, dstCoord.lng, 0.06) * 10000) / 10000;
    s.distance = Math.round(haversineDistance(s.lat, s.lng, dstCoord.lat, dstCoord.lng) * 100) / 100;
}

function refreshFactors(s) {
    s.traffic = Math.max(1, Math.min(10, s.traffic + randInt(-1, 2)));
    s.weather = Math.max(1, Math.min(5, s.weather + randInt(-1, 1)));
    if (Math.random() > 0.78) s.warehouse_delay = !s.warehouse_delay;
}

function simulationStep() {
    for (const s of Object.values(shipments)) {
        advancePosition(s);
        refreshFactors(s);
        refreshShipment(s);
    }
    const shipmentList = Object.values(shipments).map((s) => ({ ...s }));
    for (const cb of listeners) cb(shipmentList);
}

// ─── Public API (mirrors chainguardApi interface) ────────────────
export const clientSimulation = {
    init() {
        bootstrapShipments();
    },

    getShipments() {
        return Object.values(shipments).map((s) => ({ ...s }));
    },

    getShipmentsNormalized() {
        return this.getShipments().map(normalizeShipment).map(enhanceShipmentWithMockData);
    },

    getCost(shipmentId) {
        const s = shipments[shipmentId];
        if (!s) return null;
        return calculateCost(s);
    },

    async getLogs(shipmentId) {
        const log = blockchainLogs[shipmentId] || [];
        const hash = await simpleHash(JSON.stringify(log));
        return { shipment_id: shipmentId, log, hash };
    },

    getBestRoute(source, destination) {
        return getBestRoute(source, destination);
    },

    getWarehouseStatus() {
        return generateWarehouseStatus();
    },

    addShipment(source, destination) {
        const srcCoord = CITY_COORDS[source];
        const dstCoord = CITY_COORDS[destination];
        if (!srcCoord || !dstCoord) throw new Error('Invalid source or destination');

        const id = nextId++;
        const routeInfo = getBestRoute(source, destination);
        const distance = haversineDistance(srcCoord.lat, srcCoord.lng, dstCoord.lat, dstCoord.lng);

        const s = {
            id,
            source,
            destination,
            current_route: routeInfo.newRoute,
            current_route_time: routeInfo.newTime,
            distance: Math.round(distance * 100) / 100,
            lat: srcCoord.lat,
            lng: srcCoord.lng,
            traffic: randInt(2, 9),
            weather: randInt(1, 5),
            warehouse_delay: Math.random() > 0.66,
            status: 'on-time',
            delay_probability: 0,
            estimated_delay_minutes: 0,
            explanation: 'Newly dispatched operation.',
            suggested_route: [],
            suggested_route_time: 0,
            time_saved: 0,
            updated_at: new Date().toISOString(),
        };

        refreshShipment(s, true);
        shipments[id] = s;
        return normalizeShipment({ ...s });
    },

    startSimulation(onUpdate) {
        if (stepInterval) clearInterval(stepInterval);
        listeners = [onUpdate];
        stepInterval = setInterval(simulationStep, 2000);
    },

    stopSimulation() {
        if (stepInterval) clearInterval(stepInterval);
        stepInterval = null;
        listeners = [];
    },
};

// ─── Mock data enhancer (same as in chainguardApi) ───────────────
function enhanceShipmentWithMockData(shipment) {
    const idNum = shipment.numericId || 1;

    const types = ['Container', 'Bulk', 'Liquid', 'Express'];
    const sizes = ['40ft', '20ft', '12 pallets', '5000 TEU'];
    const weights = ['18,500 kg', '22,000 kg', '4,500 kg', '10,200 kg'];
    const cargos = ['Electronics', 'Automotive Parts', 'Oil', 'Medical Supplies', 'Machinery'];
    const carriers = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd'];
    const temperatures = ['Ambient', '-18°C', '4°C', 'Ambient', 'Controlled'];

    const type = types[idNum % types.length];
    const size = sizes[(idNum + 1) % sizes.length];
    const weight = weights[(idNum + 2) % weights.length];
    const cargo = cargos[(idNum + 3) % cargos.length];
    const carrier = carriers[(idNum + 4) % carriers.length];
    const temperature = temperatures[(idNum + 5) % temperatures.length];

    const lastCheckpoint =
        shipment.currentRoute?.[shipment.currentRoute.length - 1] || shipment.source || 'Unknown';
    const delayReason =
        shipment.status === 'DELAYED' || shipment.estimatedDelayMinutes > 0
            ? shipment.explanation || 'Operational delays detected at port'
            : null;

    return { ...shipment, type, size, weight, cargo, carrier, temperature, lastCheckpoint, delayReason };
}
