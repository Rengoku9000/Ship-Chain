from __future__ import annotations

import networkx as nx

from app.models import RouteResponse


class RouteOptimizationService:
    def __init__(self) -> None:
        self.graph = nx.Graph()
        self._build_graph()

    def _build_graph(self) -> None:
        edges = [
            ("Singapore", "Dubai", 420),
            ("Dubai", "Rotterdam", 360),
            ("Rotterdam", "New York", 410),
            ("Singapore", "Mumbai", 290),
            ("Mumbai", "Dubai", 180),
            ("Mumbai", "Tokyo", 370),
            ("Tokyo", "Los Angeles", 520),
            ("Los Angeles", "New York", 310),
            ("Sydney", "Singapore", 390),
            ("Sydney", "Tokyo", 430),
            ("Montreal", "New York", 95),
            ("Rotterdam", "Montreal", 455),
            ("Dubai", "Montreal", 510),
            ("Tokyo", "New York", 560),
        ]
        for source, destination, time in edges:
            self.graph.add_edge(source, destination, time=time)

    def route_time(self, route: list[str]) -> int:
        total = 0
        for source, destination in zip(route, route[1:]):
            total += int(self.graph[source][destination]["time"])
        return total

    def get_best_route(
        self,
        source: str,
        destination: str,
        current_route: list[str] | None = None,
    ) -> RouteResponse:
        new_route = nx.shortest_path(self.graph, source, destination, weight="time")
        new_time = self.route_time(new_route)
        old_route = current_route or new_route
        old_time = self.route_time(old_route)
        time_saved = max(0, old_time - new_time)

        return RouteResponse(
            source=source,
            destination=destination,
            old_route=old_route,
            old_time=old_time,
            new_route=new_route,
            new_time=new_time,
            time_saved=time_saved,
        )
