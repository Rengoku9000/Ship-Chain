import React, { useMemo, useState, useEffect } from 'react';
import { APIProvider, InfoWindow, Map, Marker, Polyline, useMap } from '@vis.gl/react-google-maps';

// Inner component to handle Heatmap rendering which requires useMap context
const HeatmapOverlay = ({ warehouseStats, mapOverlayMode }) => {
    const map = useMap();
    const [heatmap, setHeatmap] = useState(null);

    useEffect(() => {
        if (!map || !window.google?.maps?.visualization) return;

        if (!heatmap) {
            const newHeatmap = new window.google.maps.visualization.HeatmapLayer({
                radius: 40,
                opacity: 0.6,
                map: mapOverlayMode === 'heatmap' ? map : null
            });
            setHeatmap(newHeatmap);
        }
    }, [map]);

    useEffect(() => {
        if (!heatmap) return;

        if (mapOverlayMode === 'heatmap') {
            const data = warehouseStats.map(wh => ({
                location: new window.google.maps.LatLng(wh.location.lat, wh.location.lng),
                weight: wh.activityScore
            }));
            heatmap.setData(data);
            heatmap.setMap(map);
        } else {
            heatmap.setMap(null);
        }
    }, [heatmap, warehouseStats, mapOverlayMode, map]);

    return null;
};

const GoogleMapView = ({ shipments, selectedId, onSelect, userEvents = [], mapOverlayMode = 'none', warehouseStats = [] }) => {
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [hoveredWarehouse, setHoveredWarehouse] = useState(null);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const defaultCenter = { lat: 24, lng: 20 };

    // ... existing map styles ...
    const maritimeMapStyles = [
        { elementType: 'geometry', stylers: [{ color: '#0b1f2a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1f2a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#162e3d' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f3c50' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06111a' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
    ];

    const selectedShipment = useMemo(
        () => shipments.find((shipment) => shipment.id === selectedId) || null,
        [shipments, selectedId]
    );

    const eventMarkers = useMemo(
        () =>
            userEvents
                .filter((event) => Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng)))
                .map((event) => ({
                    ...event,
                    lat: Number(event.lat),
                    lng: Number(event.lng),
                })),
        [userEvents]
    );

    const selectedEvent = eventMarkers.find((event) => event.id === selectedEventId) || null;

    return (
        <div className="absolute inset-0 z-10">
            <APIProvider apiKey={apiKey} libraries={['visualization']}>
                <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={2.2}
                    disableDefaultUI={true}
                    zoomControl={true}
                    gestureHandling="greedy"
                    styles={maritimeMapStyles}
                    className="w-full h-full"
                >
                    <HeatmapOverlay warehouseStats={warehouseStats} mapOverlayMode={mapOverlayMode} />

                    {/* Warehouse Nodes */}
                    {warehouseStats.map(wh => (
                        <Marker
                            key={`wh-node-${wh.id}`}
                            position={{ lat: wh.location.lat, lng: wh.location.lng }}
                            icon={{
                                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                                scale: 6 + (wh.activityScore * 4),
                                fillColor: wh.activityScore > 0.7 ? '#ef4444' : (wh.activityScore > 0.4 ? '#f59e0b' : '#3b82f6'),
                                fillOpacity: 0.8,
                                strokeWeight: 1,
                                strokeColor: '#ffffff'
                            }}
                            onMouseOver={() => setHoveredWarehouse(wh)}
                            onMouseOut={() => setHoveredWarehouse(null)}
                        />
                    ))}

                    {shipments.map((shipment) => {
                        const lat = shipment.origin?.lat ?? shipment.lat;
                        const lng = shipment.origin?.lng ?? shipment.lng;
                        
                        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
                            return null;
                        }

                        // Map over routeCoordinates or extract them from path if backend
                        let routeCoords = shipment.routeCoordinates || [];
                        if (!routeCoords.length && shipment.path?.length > 0) {
                            routeCoords = shipment.path.map(p => ({ lat: p[0], lng: p[1] })); // Adjust mapping as per backend format if needed, though typically path is array of [x,y] for SVG, wait, we'll just stick to routeCoordinates for new shipments.
                        }

                        // Actually, backend path is projected SVG coordinates [x, y], not lat/lng!
                        // So for Google Map, we can only draw Polyline if `shipment.routeCoordinates` exists with valid {lat, lng} objects or arrays.
                        // The user specified routeCoordinates = [[lat, lng], [lat, lng]]
                        const polylinePath = routeCoords.map(coord => 
                            Array.isArray(coord) ? { lat: coord[0], lng: coord[1] } : coord
                        );

                        return (
                            <React.Fragment key={`shipment-marker-${shipment.id}`}>
                                <Marker
                                    position={{ lat: Number(lat), lng: Number(lng) }}
                                    title={`${shipment.id} • ${shipment.status}`}
                                    onClick={() => onSelect(selectedId === shipment.id ? null : shipment.id)}
                                />
                                {selectedId === shipment.id && polylinePath.length > 1 && (
                                    <Polyline
                                        path={polylinePath}
                                        options={{
                                            strokeColor: shipment.status === 'DELAYED' ? '#f59e0b' : '#60a5fa',
                                            strokeOpacity: 0.95,
                                            strokeWeight: 4,
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

                    {eventMarkers.map((event) => (
                        <Marker
                            key={event.id}
                            position={{ lat: event.lat, lng: event.lng }}
                            title={event.title}
                            onClick={() => setSelectedEventId(event.id)}
                        />
                    ))}

                    {selectedShipment && (
                        <InfoWindow
                            position={{ lat: selectedShipment.lat, lng: selectedShipment.lng }}
                            onCloseClick={() => onSelect(null)}
                        >
                            <div className="min-w-44 text-slate-900">
                                <div className="font-semibold">{selectedShipment.id}</div>
                                <div>{selectedShipment.source} to {selectedShipment.destination}</div>
                                <div>Status: {selectedShipment.status}</div>
                                <div>Delay Risk: {selectedShipment.delayProbability}%</div>
                                <div>Suggested Save: {selectedShipment.timeSaved} min</div>
                            </div>
                        </InfoWindow>
                    )}

                    {selectedEvent && (
                        <InfoWindow
                            position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
                            onCloseClick={() => setSelectedEventId(null)}
                        >
                            <div className="min-w-40 text-slate-900">
                                <div className="font-semibold">{selectedEvent.title}</div>
                                <div>{selectedEvent.description || 'Manual event marker'}</div>
                                <div className="text-xs opacity-70">
                                    {selectedEvent.createdBy || 'operator'}
                                </div>
                            </div>
                        </InfoWindow>
                    )}

                    {hoveredWarehouse && (
                        <InfoWindow
                            position={{ lat: hoveredWarehouse.location.lat, lng: hoveredWarehouse.location.lng }}
                            onCloseClick={() => setHoveredWarehouse(null)}
                        >
                            <div className="min-w-48 text-slate-900 font-sans p-1">
                                <div className="font-bold text-sm border-b pb-1 mb-2">{hoveredWarehouse.name}</div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600">Current Load:</span>
                                    <span className="font-semibold">{(hoveredWarehouse.currentLoad).toLocaleString()} units</span>
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600">Throughput:</span>
                                    <span className="font-semibold">{hoveredWarehouse.throughput} / day</span>
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600">Active Shipments:</span>
                                    <span className="font-semibold">{hoveredWarehouse.activeShipments} connected</span>
                                </div>
                                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full" 
                                        style={{ 
                                            width: `${Math.min(100, hoveredWarehouse.activityScore * 100)}%`,
                                            backgroundColor: hoveredWarehouse.activityScore > 0.7 ? '#ef4444' : (hoveredWarehouse.activityScore > 0.4 ? '#f59e0b' : '#3b82f6')
                                        }} 
                                    />
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>
        </div>
    );
};

export default React.memo(GoogleMapView);
