from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.models import Shipment, ShipmentLogsResponse, ShipmentSummary, CreateShipmentRequest

router = APIRouter()


@router.get("/shipments", response_model=ShipmentSummary)
async def get_shipments(request: Request) -> ShipmentSummary:
    service = request.app.state.simulation_service
    return ShipmentSummary(shipments=service.list_shipments())


@router.post("/shipments", response_model=Shipment)
async def create_shipment(request: Request, shipment_req: CreateShipmentRequest) -> Shipment:
    service = request.app.state.simulation_service
    try:
        shipment = service.add_shipment(shipment_req.source, shipment_req.destination)
        return shipment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/shipment/{shipment_id}", response_model=Shipment)
async def get_shipment(shipment_id: int, request: Request) -> Shipment:
    service = request.app.state.simulation_service
    shipment = service.get_shipment(shipment_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.get("/logs/{shipment_id}", response_model=ShipmentLogsResponse)
async def get_logs(shipment_id: int, request: Request) -> ShipmentLogsResponse:
    simulation_service = request.app.state.simulation_service
    if simulation_service.get_shipment(shipment_id) is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    blockchain_service = request.app.state.blockchain_service
    return blockchain_service.get_logs(shipment_id)
