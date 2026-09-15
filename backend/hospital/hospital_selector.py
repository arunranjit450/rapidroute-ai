from dataclasses import dataclass
from typing import Iterable

from backend.dispatch.ambulance_selector import estimate_eta_minutes, haversine_distance_km


ETA_WEIGHT = 0.50
DISTANCE_WEIGHT = 0.30
CAPACITY_WEIGHT = 0.20

REQUIRED_CAPABILITIES = {
    "cardiac": "cardiac",
    "trauma": "trauma",
    "stroke": "stroke",
    "other": None,
}


class NoSuitableHospitalError(Exception):
    """Raised when no hospital satisfies dispatch eligibility requirements."""


@dataclass(frozen=True)
class HospitalCandidate:
    hospitalId: str
    name: str
    latitude: float
    longitude: float
    capabilities: tuple[str, ...]
    availableBeds: int
    emergencyAvailable: bool


@dataclass(frozen=True)
class RankedHospital:
    hospitalId: str
    name: str
    distanceKm: float
    etaMinutes: float
    availableBeds: int
    score: float
    rank: int
    selected: bool


@dataclass(frozen=True)
class HospitalSelection:
    requiredCapability: str | None
    selected: RankedHospital
    rankedCandidates: tuple[RankedHospital, ...]


def get_required_capability(emergency_type: str) -> str | None:
    normalized_type = emergency_type.strip().lower()
    try:
        return REQUIRED_CAPABILITIES[normalized_type]
    except KeyError as error:
        raise ValueError(f"Unknown emergency type: {emergency_type!r}") from error


def select_hospital(
    emergency_type: str,
    emergency_location: tuple[float, float],
    hospitals: Iterable[HospitalCandidate],
) -> HospitalSelection:
    required_capability = get_required_capability(emergency_type)
    eligible_hospitals = [
        hospital
        for hospital in hospitals
        if hospital.emergencyAvailable
        and hospital.availableBeds > 0
        and (
            required_capability is None
            or required_capability
            in {capability.strip().lower() for capability in hospital.capabilities}
        )
    ]

    if not eligible_hospitals:
        raise NoSuitableHospitalError("No suitable hospital for this emergency")

    emergency_latitude, emergency_longitude = emergency_location
    maximum_available_beds = max(hospital.availableBeds for hospital in eligible_hospitals)
    scored_hospitals: list[tuple[HospitalCandidate, float, float, float]] = []

    for hospital in eligible_hospitals:
        distance_km = haversine_distance_km(
            hospital.latitude,
            hospital.longitude,
            emergency_latitude,
            emergency_longitude,
        )
        eta_minutes = estimate_eta_minutes(distance_km)
        capacity_penalty = 1 - (hospital.availableBeds / maximum_available_beds)
        score = (
            ETA_WEIGHT * eta_minutes
            + DISTANCE_WEIGHT * distance_km
            + CAPACITY_WEIGHT * capacity_penalty
        )
        scored_hospitals.append((hospital, distance_km, eta_minutes, score))

    scored_hospitals.sort(key=lambda item: (item[3], item[0].hospitalId))
    ranked_candidates = tuple(
        RankedHospital(
            hospitalId=hospital.hospitalId,
            name=hospital.name,
            distanceKm=round(distance_km, 3),
            etaMinutes=round(eta_minutes, 2),
            availableBeds=hospital.availableBeds,
            score=round(score, 3),
            rank=index,
            selected=index == 1,
        )
        for index, (hospital, distance_km, eta_minutes, score) in enumerate(
            scored_hospitals, start=1
        )
    )

    return HospitalSelection(
        requiredCapability=required_capability,
        selected=ranked_candidates[0],
        rankedCandidates=ranked_candidates,
    )
