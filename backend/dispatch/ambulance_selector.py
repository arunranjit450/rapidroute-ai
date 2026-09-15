from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from typing import Iterable

from backend.dispatch.severity import normalize_severity


EARTH_RADIUS_KM = 6371.0
ESTIMATED_SPEED_KMH = 30.0
ETA_WEIGHT = 0.60
DISTANCE_WEIGHT = 0.40


class NoAvailableAmbulanceError(Exception):
    """Raised when dispatch has no available ambulance candidates."""


@dataclass(frozen=True)
class AmbulanceCandidate:
    ambulanceId: str
    latitude: float
    longitude: float
    status: str


@dataclass(frozen=True)
class RankedAmbulance:
    ambulanceId: str
    distanceKm: float
    etaMinutes: float
    score: float
    rank: int
    selected: bool


@dataclass(frozen=True)
class AmbulanceSelection:
    severity: str
    selected: RankedAmbulance
    rankedCandidates: tuple[RankedAmbulance, ...]


def haversine_distance_km(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
) -> float:
    latitude_delta = radians(destination_latitude - origin_latitude)
    longitude_delta = radians(destination_longitude - origin_longitude)
    origin_latitude_rad = radians(origin_latitude)
    destination_latitude_rad = radians(destination_latitude)

    haversine_value = (
        sin(latitude_delta / 2) ** 2
        + cos(origin_latitude_rad)
        * cos(destination_latitude_rad)
        * sin(longitude_delta / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * asin(sqrt(haversine_value))


def estimate_eta_minutes(distance_km: float) -> float:
    """Temporary local-road ETA approximation, replaceable by a routing provider."""
    return distance_km / ESTIMATED_SPEED_KMH * 60


def select_ambulance(
    emergency_location: tuple[float, float],
    severity: str,
    candidates: Iterable[AmbulanceCandidate],
) -> AmbulanceSelection:
    normalized_severity = normalize_severity(severity)
    emergency_latitude, emergency_longitude = emergency_location
    scored_candidates: list[tuple[str, float, float, float]] = []

    for candidate in candidates:
        if candidate.status != "available":
            continue

        distance_km = haversine_distance_km(
            candidate.latitude,
            candidate.longitude,
            emergency_latitude,
            emergency_longitude,
        )
        eta_minutes = estimate_eta_minutes(distance_km)
        score = ETA_WEIGHT * eta_minutes + DISTANCE_WEIGHT * distance_km
        scored_candidates.append((candidate.ambulanceId, distance_km, eta_minutes, score))

    if not scored_candidates:
        raise NoAvailableAmbulanceError("No available ambulances for dispatch")

    scored_candidates.sort(key=lambda candidate: (candidate[3], candidate[0]))
    ranked_candidates = tuple(
        RankedAmbulance(
            ambulanceId=ambulance_id,
            distanceKm=round(distance_km, 3),
            etaMinutes=round(eta_minutes, 2),
            score=round(score, 3),
            rank=index,
            selected=index == 1,
        )
        for index, (ambulance_id, distance_km, eta_minutes, score) in enumerate(
            scored_candidates, start=1
        )
    )

    return AmbulanceSelection(
        severity=normalized_severity,
        selected=ranked_candidates[0],
        rankedCandidates=ranked_candidates,
    )
