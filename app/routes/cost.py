from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.models import CostResponse

router = APIRouter()


@router.get("/cost/{shipment_id}", response_model=CostResponse)
async def get_cost(shipment_id: int, request: Request) -> CostResponse:
    simulation_service = request.app.state.simulation_service
    shipment = simulation_service.get_shipment(shipment_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")

    cost_service = request.app.state.cost_service
    return cost_service.calculate(shipment)
