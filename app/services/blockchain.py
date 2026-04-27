from __future__ import annotations

import hashlib
from datetime import datetime

from app.models import ShipmentLogEntry, ShipmentLogsResponse


class BlockchainLogService:
    def __init__(self) -> None:
        self._logs: dict[int, list[ShipmentLogEntry]] = {}

    def seed(self, shipment_id: int, events: list[str]) -> None:
        self._logs[shipment_id] = [
            ShipmentLogEntry(time=datetime.utcnow(), event=event) for event in events
        ]

    def append(self, shipment_id: int, event: str) -> None:
        self._logs.setdefault(shipment_id, []).append(
            ShipmentLogEntry(time=datetime.utcnow(), event=event)
        )

    def get_logs(self, shipment_id: int) -> ShipmentLogsResponse:
        log = self._logs.get(shipment_id, [])
        digest = hashlib.sha256(str([entry.model_dump() for entry in log]).encode()).hexdigest()
        return ShipmentLogsResponse(shipment_id=shipment_id, log=log, hash=digest)
