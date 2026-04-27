import React, { useMemo, useState } from 'react';
import { APIProvider, InfoWindow, Map, Marker, Polyline } from '@vis.gl/react-google-maps';

const GoogleMapView = ({ shipments, selectedId, onSelect, userEvents = [] }) => {
    const [selectedEventId, setSelectedEventId] = useState(null);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const defaultCenter = { lat: 24, lng: 20 };

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
        <div className="absolute inset-0 z-10 mx-24 my-20 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={2.2}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    colorScheme="DARK"
                    className="w-full h-full"
                >
                    {shipments.map((shipment) => (
                        <React.Fragment key={shipment.id}>
                            <Marker
                                position={{ lat: shipment.lat, lng: shipment.lng }}
                                title={`${shipment.id} • ${shipment.status}`}
                                onClick={() => onSelect(selectedId === shipment.id ? null : shipment.id)}
                            />
                            {selectedId === shipment.id && shipment.routeCoordinates?.length > 1 && (
                                <Polyline
                                    path={shipment.routeCoordinates}
                                    options={{
                                        strokeColor: shipment.status === 'DELAYED' ? '#f59e0b' : '#60a5fa',
                                        strokeOpacity: 0.95,
                                        strokeWeight: 4,
                                    }}
                                />
                            )}
                        </React.Fragment>
                    ))}

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
                </Map>
            </APIProvider>
        </div>
    );
};

export default React.memo(GoogleMapView);
