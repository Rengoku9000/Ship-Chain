from __future__ import annotations

import asyncio
import random
from copy import deepcopy
from datetime import datetime

from app.models import Shipment, ShipmentSummary, WarehouseStatus, WarehouseStatusResponse
from app.services.blockchain import BlockchainLogService
from app.services.explanation import explain_delay
from app.services.optimization import RouteOptimizationService
from app.services.prediction import PredictionService
from app.utils.geo import haversine_distance, lerp


class SimulationService:
    def __init__(
        self,
        prediction_service: PredictionService,
        optimization_service: RouteOptimizationService,
        blockchain_service: BlockchainLogService,
    ) -> None:
        self.prediction_service = prediction_service
        self.optimization_service = optimization_service
        self.blockchain_service = blockchain_service
        self._lock = asyncio.Lock()
        self._rng = random.Random()
        self.shipments: dict[int, Shipment] = {}
        self._coords = {
            "Singapore": (1.3521, 103.8198),
            "Dubai": (25.2048, 55.2708),
            "Rotterdam": (51.9244, 4.4777),
            "New York": (40.7128, -74.0060),
            "Mumbai": (19.0760, 72.8777),
            "Tokyo": (35.6762, 139.6503),
            "Los Angeles": (34.0522, -118.2437),
            "Sydney": (-33.8688, 151.2093),
            "Montreal": (45.5019, -73.5674),
        }
        self._warehouse_names = ["Singapore", "Dubai", "Rotterdam", "New York", "Tokyo", "Mumbai"]
        self._bootstrap_shipments()

    def _bootstrap_shipments(self) -> None:
        seeded = [
            (1, "Singapore", "New York", ["Singapore", "Dubai", "Rotterdam", "New York"]),
            (2, "Rotterdam", "Montreal", ["Rotterdam", "New York", "Montreal"]),
            (3, "Sydney", "Tokyo", ["Sydney", "Singapore", "Mumbai", "Tokyo"]),
            (4, "Mumbai", "Los Angeles", ["Mumbai", "Tokyo", "Los Angeles"]),
        ]

        for shipment_id, source, destination, route in seeded:
            source_lat, source_lng = self._coords[source]
            destination_lat, destination_lng = self._coords[destination]
            distance = haversine_distance(source_lat, source_lng, destination_lat, destination_lng)
            old_time = self.optimization_service.route_time(route)
            _, probability, delay_minutes, status = self.prediction_service.predict(
                traffic=self._rng.randint(2, 9),
                weather=self._rng.randint(1, 5),
                distance=distance,
            )
            shipment = Shipment(
                id=shipment_id,
                source=source,
                destination=destination,
                current_route=route,
                current_route_time=old_time,
                distance=round(distance, 2),
                lat=source_lat,
                lng=source_lng,
                traffic=self._rng.randint(2, 9),
                weather=self._rng.randint(1, 5),
                warehouse_delay=self._rng.choice([False, False, True]),
                status=status,
                delay_probability=probability,
                estimated_delay_minutes=delay_minutes,
                explanation="Initializing simulation.",
                updated_at=datetime.utcnow(),
            )
            self._refresh_shipment(shipment, initial=True)
            self.shipments[shipment.id] = shipment

    def list_shipments(self) -> list[Shipment]:
        return [deepcopy(shipment) for shipment in self.shipments.values()]

    def add_shipment(self, source: str, destination: str) -> Shipment:
        if source not in self._coords or destination not in self._coords:
            raise ValueError("Invalid source or destination")

        shipment_id = max(self.shipments.keys(), default=0) + 1
        route_info = self.optimization_service.get_best_route(source, destination)
        route = route_info.new_route
        source_lat, source_lng = self._coords[source]
        destination_lat, destination_lng = self._coords[destination]
        distance = haversine_distance(source_lat, source_lng, destination_lat, destination_lng)
        old_time = route_info.new_time
        
        _, probability, delay_minutes, status = self.prediction_service.predict(
            traffic=self._rng.randint(2, 9),
            weather=self._rng.randint(1, 5),
            distance=distance,
        )

        shipment = Shipment(
            id=shipment_id,
            source=source,
            destination=destination,
            current_route=route,
            current_route_time=old_time,
            distance=round(distance, 2),
            lat=source_lat,
            lng=source_lng,
            traffic=self._rng.randint(2, 9),
            weather=self._rng.randint(1, 5),
            warehouse_delay=self._rng.choice([False, False, True]),
            status=status,
            delay_probability=probability,
            estimated_delay_minutes=delay_minutes,
            explanation="Newly dispatched operation.",
            updated_at=datetime.utcnow(),
        )

        self._refresh_shipment(shipment, initial=True)
        self.shipments[shipment.id] = shipment
        return deepcopy(shipment)

    def get_shipment(self, shipment_id: int) -> Shipment | None:
        shipment = self.shipments.get(shipment_id)
        return deepcopy(shipment) if shipment else None

    def get_warehouse_status(self) -> WarehouseStatusResponse:
        warehouses = []
        for warehouse in self._warehouse_names:
            load = self._rng.randint(1, 100)
            if load < 35:
                status = "Low"
            elif load < 70:
                status = "Medium"
            else:
                status = "High"
            warehouses.append(WarehouseStatus(warehouse=warehouse, load=load, status=status))
        return WarehouseStatusResponse(warehouses=warehouses)

    async def step(self) -> ShipmentSummary:
        async with self._lock:
            for shipment in self.shipments.values():
                self._advance_position(shipment)
                self._refresh_factors(shipment)
                self._refresh_shipment(shipment)
            return ShipmentSummary(shipments=self.list_shipments())

    def _advance_position(self, shipment: Shipment) -> None:
        destination_lat, destination_lng = self._coords[shipment.destination]
        shipment.lat = round(lerp(shipment.lat, destination_lat, 0.06), 4)
        shipment.lng = round(lerp(shipment.lng, destination_lng, 0.06), 4)
        shipment.distance = round(
            haversine_distance(shipment.lat, shipment.lng, destination_lat, destination_lng), 2
        )

    def _refresh_factors(self, shipment: Shipment) -> None:
        shipment.traffic = max(1, min(10, shipment.traffic + self._rng.randint(-1, 2)))
        shipment.weather = max(1, min(5, shipment.weather + self._rng.randint(-1, 1)))
        if self._rng.random() > 0.78:
            shipment.warehouse_delay = not shipment.warehouse_delay

    def _refresh_shipment(self, shipment: Shipment, initial: bool = False) -> None:
        _, probability, delay_minutes, status = self.prediction_service.predict(
            traffic=shipment.traffic,
            weather=shipment.weather,
            distance=shipment.distance,
        )
        shipment.delay_probability = round(probability, 2)
        shipment.estimated_delay_minutes = delay_minutes + (12 if shipment.warehouse_delay else 0)
        shipment.status = status
        shipment.updated_at = datetime.utcnow()
        shipment.explanation = explain_delay(shipment)

        route_info = self.optimization_service.get_best_route(
            shipment.source,
            shipment.destination,
            shipment.current_route,
        )
        shipment.suggested_route = route_info.new_route if shipment.status != "on-time" else []
        shipment.suggested_route_time = route_info.new_time if shipment.status != "on-time" else 0
        shipment.time_saved = route_info.time_saved if shipment.status != "on-time" else 0

        if initial:
            self.blockchain_service.seed(
                shipment.id,
                [
                    f"Shipment {shipment.id} registered on route {' -> '.join(shipment.current_route)}",
                    f"Initial status classified as {shipment.status}",
                ],
            )
            return

        self.blockchain_service.append(
            shipment.id,
            (
                f"Shipment {shipment.id} updated: status={shipment.status}, "
                f"traffic={shipment.traffic}, weather={shipment.weather}, "
                f"delay={shipment.estimated_delay_minutes}m"
            ),
        )
        if shipment.status != "on-time" and shipment.time_saved > 0:
            self.blockchain_service.append(
                shipment.id,
                (
                    f"AI reroute suggestion available: {' -> '.join(shipment.suggested_route)} "
                    f"with {shipment.time_saved} minutes saved"
                ),
            )
