from math import isfinite

import pytest

from backend.hospital.hospital_selector import (
    HospitalCandidate,
    NoSuitableHospitalError,
    select_hospital,
)


EMERGENCY_LOCATION = (9.9816, 76.2999)


def hospital(
    hospital_id: str,
    latitude: float = 9.9816,
    longitude: float = 76.2999,
    capabilities: tuple[str, ...] = ("cardiac",),
    available_beds: int = 5,
    emergency_available: bool = True,
) -> HospitalCandidate:
    return HospitalCandidate(
        hospitalId=hospital_id,
        name=f"Hospital {hospital_id}",
        latitude=latitude,
        longitude=longitude,
        capabilities=capabilities,
        availableBeds=available_beds,
        emergencyAvailable=emergency_available,
    )


def test_cardiac_emergency_requires_cardiac_capability() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", capabilities=("cardiac",)), hospital("H002", capabilities=("trauma",))],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H001"]
    assert result.requiredCapability == "cardiac"


def test_trauma_emergency_requires_trauma_capability() -> None:
    result = select_hospital(
        "trauma",
        EMERGENCY_LOCATION,
        [hospital("H001", capabilities=("cardiac",)), hospital("H002", capabilities=("trauma",))],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H002"]


def test_stroke_emergency_requires_stroke_capability() -> None:
    result = select_hospital(
        "stroke",
        EMERGENCY_LOCATION,
        [hospital("H001", capabilities=("cardiac",)), hospital("H002", capabilities=("stroke",))],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H002"]


def test_other_emergency_requires_no_specific_capability() -> None:
    result = select_hospital(
        "other", EMERGENCY_LOCATION, [hospital("H001", capabilities=())]
    )

    assert result.requiredCapability is None
    assert result.selected.hospitalId == "H001"


def test_emergency_unavailable_hospitals_are_excluded() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [
            hospital("H001", emergency_available=False),
            hospital("H002", capabilities=("cardiac",)),
        ],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H002"]


def test_hospitals_with_zero_beds_are_excluded() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", available_beds=0), hospital("H002")],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H002"]


def test_lower_eta_improves_ranking() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", latitude=10.0016), hospital("H002", latitude=9.9866)],
    )

    assert result.rankedCandidates[0].etaMinutes < result.rankedCandidates[1].etaMinutes
    assert result.rankedCandidates[0].score < result.rankedCandidates[1].score


def test_lower_distance_improves_ranking() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", latitude=10.0116), hospital("H002", latitude=9.9866)],
    )

    assert result.rankedCandidates[0].distanceKm < result.rankedCandidates[1].distanceKm
    assert result.selected.hospitalId == "H002"


def test_higher_available_capacity_improves_ranking() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", available_beds=2), hospital("H002", available_beds=8)],
    )

    assert result.selected.hospitalId == "H002"
    assert result.rankedCandidates[0].score < result.rankedCandidates[1].score


def test_equal_scores_are_broken_by_hospital_id() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H002"), hospital("H001")],
    )

    assert [item.hospitalId for item in result.rankedCandidates] == ["H001", "H002"]


def test_selected_hospital_has_rank_one() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", latitude=10.0016), hospital("H002", latitude=9.9866)],
    )

    assert result.selected.rank == 1
    assert result.selected.selected is True


def test_all_eligible_hospitals_are_returned() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [
            hospital("H001"),
            hospital("H002", latitude=9.9916),
            hospital("H003", available_beds=0),
            hospital("H004", emergency_available=False),
        ],
    )

    assert {item.hospitalId for item in result.rankedCandidates} == {"H001", "H002"}


def test_no_suitable_hospital_raises_domain_error() -> None:
    with pytest.raises(NoSuitableHospitalError, match="No suitable hospital"):
        select_hospital(
            "cardiac",
            EMERGENCY_LOCATION,
            [hospital("H001", capabilities=("trauma",)), hospital("H002", available_beds=0)],
        )


def test_single_eligible_hospital_is_selected() -> None:
    result = select_hospital("cardiac", EMERGENCY_LOCATION, [hospital("H001")])

    assert result.selected.hospitalId == "H001"
    assert len(result.rankedCandidates) == 1


def test_zero_distance_and_same_capacity_are_safe() -> None:
    result = select_hospital(
        "cardiac",
        EMERGENCY_LOCATION,
        [hospital("H001", available_beds=3), hospital("H002", available_beds=3)],
    )

    assert all(isfinite(item.score) for item in result.rankedCandidates)
    assert result.rankedCandidates[0].score == 0.0
