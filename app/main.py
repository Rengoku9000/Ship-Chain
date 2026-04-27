from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.routes.cost import router as cost_router
from app.routes.route import router as route_router
from app.routes.shipments import router as shipment_router
from app.routes.warehouse import router as warehouse_router
from app.services.blockchain import BlockchainLogService
from app.services.cost import CostService
from app.services.optimization import RouteOptimizationService
from app.services.prediction import PredictionService
from app.services.simulation import SimulationService
from app.websocket.manager import ConnectionManager


async def simulation_loop(app: FastAPI) -> None:
    while True:
        summary = await app.state.simulation_service.step()
        if app.state.ws_manager.has_connections:
            await app.state.ws_manager.broadcast_json(
                {
                    "type": "shipment_update",
                    "data": summary.model_dump(mode="json"),
                }
            )
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    optimization_service = RouteOptimizationService()
    blockchain_service = BlockchainLogService()
    prediction_service = PredictionService()
    simulation_service = SimulationService(
        prediction_service=prediction_service,
        optimization_service=optimization_service,
        blockchain_service=blockchain_service,
    )

    app.state.optimization_service = optimization_service
    app.state.blockchain_service = blockchain_service
    app.state.prediction_service = prediction_service
    app.state.simulation_service = simulation_service
    app.state.cost_service = CostService()
    app.state.ws_manager = ConnectionManager()

    task = asyncio.create_task(simulation_loop(app))
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    title="ChainGuard AI+ Backend",
    version="1.0.0",
    description="Real-time supply chain optimizer with simulation, prediction, routing, and websocket updates.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipment_router)
app.include_router(route_router)
app.include_router(warehouse_router)
app.include_router(cost_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "ChainGuard AI+ backend is running"}


@app.websocket("/ws/shipments")
async def shipments_ws(websocket: WebSocket) -> None:
    manager: ConnectionManager = websocket.app.state.ws_manager
    await manager.connect(websocket)
    try:
        initial_summary = {
            "type": "shipment_update",
            "data": {
                "shipments": [
                    shipment.model_dump(mode="json")
                    for shipment in websocket.app.state.simulation_service.list_shipments()
                ]
            },
        }
        await websocket.send_json(initial_summary)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
