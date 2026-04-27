from __future__ import annotations

from app.models import ShipmentStatus


class PredictionService:
    def __init__(self, risk_threshold: float = 5.7, delayed_threshold: float = 7.2) -> None:
        self.risk_threshold = risk_threshold
        self.delayed_threshold = delayed_threshold

    def predict(self, traffic: int, weather: int, distance: float) -> tuple[float, float, int, ShipmentStatus]:
        normalized_distance = min(distance / 1000.0, 10.0)
        delay_risk = (traffic * 0.5) + (weather * 0.3) + (normalized_distance * 0.2)
        probability = max(0.0, min(delay_risk / 10.0, 1.0))
        estimated_delay = max(0, int(probability * 90))

        if delay_risk >= self.delayed_threshold:
            status: ShipmentStatus = "delayed"
        elif delay_risk >= self.risk_threshold:
            status = "risk"
        else:
            status = "on-time"

        return delay_risk, probability, estimated_delay, status
