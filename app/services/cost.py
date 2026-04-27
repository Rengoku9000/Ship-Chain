from __future__ import annotations

from app.models import CostResponse, Shipment


class CostService:
    def __init__(self, cost_per_minute: float = 24.0) -> None:
        self.cost_per_minute = cost_per_minute

    def calculate(self, shipment: Shipment) -> CostResponse:
        current_loss = shipment.estimated_delay_minutes * self.cost_per_minute
        optimized_savings = shipment.time_saved * self.cost_per_minute
        return CostResponse(
            shipment_id=shipment.id,
            delay_minutes=shipment.estimated_delay_minutes,
            cost_per_minute=self.cost_per_minute,
            current_loss=round(current_loss, 2),
            optimized_savings=round(optimized_savings, 2),
        )
