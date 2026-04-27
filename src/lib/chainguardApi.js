const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const CITY_COORDS = {
    Singapore: { lat: 1.3521, lng: 103.8198 },
    Dubai: { lat: 25.2048, lng: 55.2708 },
    Rotterdam: { lat: 51.9244, lng: 4.4777 },
    'New York': { lat: 40.7128, lng: -74.006 },
    Mumbai: { lat: 19.076, lng: 72.8777 },
    Tokyo: { lat: 35.6762, lng: 139.6503 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    Sydney: { lat: -33.8688, lng: 151.2093 },
    Montreal: { lat: 45.5019, lng: -73.5674 },
};

export const CITY_NAMES = Object.keys(CITY_COORDS);

const projectPoint = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 507;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
};

const toStatusLabel = (status) => {
    if (!status) return 'UNKNOWN';
    if (status === 'on-time') return 'ON-TIME';
    return status.replace('-', ' ').toUpperCase();
};

export const formatClockFromDelay = (delayMinutes) => {
    if (!delayMinutes) return 'ON SCHED';
    const totalMinutes = 12 * 60 + delayMinutes;
    const hours = `${Math.floor(totalMinutes / 60) % 24}`.padStart(2, '0');
    const minutes = `${totalMinutes % 60}`.padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const createAlertsFromShipments = (shipments) =>
    shipments
        .filter((shipment) => shipment.status !== 'ON-TIME' || shipment.warehouseDelay)
        .slice(0, 6)
        .map((shipment) => ({
            id: `boot-${shipment.id}`,
            severity:
                shipment.status === 'DELAYED'
                    ? 'high'
                    : shipment.status === 'RISK'
                        ? 'medium'
                        : 'low',
            text: `${shipment.id}: ${shipment.explanation}`,
            timestamp: new Date(shipment.updatedAt).toLocaleTimeString('en-US', { hour12: false }),
        }));

export const buildUpdateAlerts = (previousShipments, nextShipments) => {
    const previousMap = new Map(previousShipments.map((shipment) => [shipment.id, shipment]));
    const nextAlerts = [];

    nextShipments.forEach((shipment) => {
        const previous = previousMap.get(shipment.id);
        if (!previous) return;

        if (previous.status !== shipment.status) {
            nextAlerts.push({
                id: `${shipment.id}-${shipment.updatedAt}-status`,
                severity: shipment.status === 'DELAYED' ? 'high' : 'medium',
                text: `${shipment.id} shifted from ${previous.status} to ${shipment.status}.`,
                timestamp: new Date(shipment.updatedAt).toLocaleTimeString('en-US', { hour12: false }),
            });
        } else if (Math.abs(previous.riskScore - shipment.riskScore) >= 10) {
            nextAlerts.push({
                id: `${shipment.id}-${shipment.updatedAt}-risk`,
                severity: shipment.riskScore > previous.riskScore ? 'medium' : 'low',
                text: `${shipment.id} risk recalibrated to ${shipment.riskScore}%. ${shipment.explanation}`,
                timestamp: new Date(shipment.updatedAt).toLocaleTimeString('en-US', { hour12: false }),
            });
        }
    });

    return nextAlerts;
};

export const normalizeShipment = (shipment) => {
    const routePoints = shipment.current_route
        .map((city) => CITY_COORDS[city])
        .filter(Boolean)
        .map(({ lat, lng }) => projectPoint(lat, lng));

    return {
        id: `SHP-${shipment.id}`,
        numericId: shipment.id,
        status: toStatusLabel(shipment.status),
        eta: formatClockFromDelay(shipment.estimated_delay_minutes),
        riskScore: Math.round(shipment.delay_probability * 100),
        aiConfidence: Math.max(35, 100 - Math.round(shipment.distance / 150)),
        path: routePoints,
        progress: 0,
        lat: shipment.lat,
        lng: shipment.lng,
        markerPosition: projectPoint(shipment.lat, shipment.lng),
        traffic: shipment.traffic,
        weather: shipment.weather,
        warehouseDelay: shipment.warehouse_delay,
        source: shipment.source,
        destination: shipment.destination,
        distance: shipment.distance,
        currentRoute: shipment.current_route,
        routeCoordinates: shipment.current_route
            .map((city) => CITY_COORDS[city])
            .filter(Boolean),
        currentRouteTime: shipment.current_route_time,
        estimatedDelayMinutes: shipment.estimated_delay_minutes,
        delayProbability: Math.round(shipment.delay_probability * 100),
        explanation: shipment.explanation,
        suggestedRoute: shipment.suggested_route,
        suggestedRouteTime: shipment.suggested_route_time,
        timeSaved: shipment.time_saved,
        updatedAt: shipment.updated_at,
    };
};

const fetchJson = async (path) => {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error(`Backend request failed for ${path}`);
    }
    return response.json();
};

export const chainguardApi = {
    async getShipments() {
        const data = await fetchJson('/shipments');
        return data.shipments.map(normalizeShipment);
    },
    async getCost(shipmentId) {
        return fetchJson(`/cost/${shipmentId}`);
    },
    async getLogs(shipmentId) {
        return fetchJson(`/logs/${shipmentId}`);
    },
    async getBestRoute(source, destination) {
        const params = new URLSearchParams({ source, destination });
        return fetchJson(`/route?${params.toString()}`);
    },
    async getWarehouseStatus() {
        return fetchJson('/warehouse-status');
    },
    async createShipment(source, destination) {
        const response = await fetch(`${BASE_URL}/shipments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ source, destination }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create shipment`);
        }
        const data = await response.json();
        return normalizeShipment(data);
    },
    connectToShipments(onMessage) {
        const socket = new WebSocket(`${BASE_URL.replace('http', 'ws')}/ws/shipments`);
        socket.onmessage = (event) => {
            const parsed = JSON.parse(event.data);
            if (parsed?.type === 'shipment_update') {
                onMessage(parsed.data.shipments.map(normalizeShipment));
            }
        };
        return socket;
    },
};
