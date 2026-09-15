from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class GeoPoint:
    latitude: float
    longitude: float


@dataclass(frozen=True)
class RouteRequest:
    origin: GeoPoint
    destination: GeoPoint


@dataclass(frozen=True)
class RouteResult:
    distanceKm: float
    etaMinutes: float
    coordinates: tuple[GeoPoint, ...]


@dataclass(frozen=True)
class RouteCandidate:
    routeIndex: int
    distanceKm: float
    etaMinutes: float
    coordinates: tuple[GeoPoint, ...]


class RouteProvider(Protocol):
    def calculate_route(self, request: RouteRequest) -> RouteResult:
        """Calculate the primary route for an origin/destination pair."""