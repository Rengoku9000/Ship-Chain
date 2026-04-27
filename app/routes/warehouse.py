from __future__ import annotations

from fastapi import APIRouter, Request

from app.models import WarehouseStatusResponse

router = APIRouter()


@router.get("/warehouse-status", response_model=WarehouseStatusResponse)
async def get_warehouse_status(request: Request) -> WarehouseStatusResponse:
    service = request.app.state.simulation_service
    return service.get_warehouse_status()
