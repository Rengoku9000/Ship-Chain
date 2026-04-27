from __future__ import annotations

from app.models import Shipment


def explain_delay(shipment: Shipment) -> str:
    reasons: list[str] = []
    if shipment.traffic > 7:
        reasons.append("Heavy traffic")
    if shipment.weather > 3:
        reasons.append("Bad weather")
    if shipment.warehouse_delay:
        reasons.append("Warehouse congestion")

    if not reasons:
        return "Shipment is moving within expected operating conditions."

    return ", ".join(reasons) + "."
