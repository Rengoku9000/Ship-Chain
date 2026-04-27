from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from app.models import RouteResponse

router = APIRouter()


@router.get("/route", response_model=RouteResponse)
async def get_best_route(
    request: Request,
    source: str = Query(...),
    destination: str = Query(...),
) -> RouteResponse:
    optimization_service = request.app.state.optimization_service
    simulation_service = request.app.state.simulation_service

    current_route = None
    for shipment in simulation_service.list_shipments():
        if shipment.source == source and shipment.destination == destination:
            current_route = shipment.current_route
            break

    try:
        return optimization_service.get_best_route(source, destination, current_route)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
