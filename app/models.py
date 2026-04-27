from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ShipmentStatus = Literal["on-time", "risk", "delayed"]
WarehouseLevel = Literal["Low", "Medium", "High"]


class Shipment(BaseModel):
    id: int
    source: str
    destination: str
    current_route: list[str]
    current_route_time: int = Field(..., description="Current route time in minutes")
    distance: float = Field(..., description="Remaining distance in km")
    lat: float
    lng: float
    traffic: int = Field(..., ge=1, le=10)
    weather: int = Field(..., ge=1, le=5)
    warehouse_delay: bool
    status: ShipmentStatus
    delay_probability: float = Field(..., ge=0, le=1)
    estimated_delay_minutes: int = Field(..., ge=0)
    explanation: str
    suggested_route: list[str] = Field(default_factory=list)
    suggested_route_time: int = 0
    time_saved: int = 0
    updated_at: datetime


class ShipmentSummary(BaseModel):
    shipments: list[Shipment]


class ShipmentLogEntry(BaseModel):
    time: datetime
    event: str


class ShipmentLogsResponse(BaseModel):
    shipment_id: int
    log: list[ShipmentLogEntry]
    hash: str


class RouteResponse(BaseModel):
    source: str
    destination: str
    old_route: list[str]
    old_time: int
    new_route: list[str]
    new_time: int
    time_saved: int


class WarehouseStatus(BaseModel):
    warehouse: str
    load: int = Field(..., ge=1, le=100)
    status: WarehouseLevel


class WarehouseStatusResponse(BaseModel):
    warehouses: list[WarehouseStatus]


class CostResponse(BaseModel):
    shipment_id: int
    delay_minutes: int
    cost_per_minute: float
    current_loss: float
    optimized_savings: float


class ShipmentUpdateEnvelope(BaseModel):
    type: Literal["shipment_update"] = "shipment_update"
    data: ShipmentSummary


class CreateShipmentRequest(BaseModel):
    source: str
    destination: str
