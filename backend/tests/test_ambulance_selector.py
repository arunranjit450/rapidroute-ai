import pytest

from backend.dispatch.ambulance_selector import (
    AmbulanceCandidate,
    NoAvailableAmbulanceError,
    select_ambulance,
)


EMERGENCY_LOCATION = (9.9816, 76.2999)


def candidate(
    ambulance_id: str, latitude: float, longitude: float, status: str = "available"
) -> AmbulanceCandidate:
    return AmbulanceCandidate(
        ambulanceId=ambulance_id,
        latitude=latitude,
        longitude=longitude,
        status=status,
    )


def test_unavailable_ambulances_are_excluded() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "high",
        [
            candidate("A101", 9.9816, 76.2999, "busy"),
            candidate("A102", 9.9916, 76.2999),
        ],
    )

    assert [item.ambulanceId for item in result.rankedCandidates] == ["A102"]


def test_closest_available_ambulance_ranks_first() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "critical",
        [
            candidate("A101", 10.0016, 76.2999),
            candidate("A102", 9.9866, 76.2999),
        ],
    )

    assert result.selected.ambulanceId == "A102"


def test_lower_eta_improves_ranking() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "medium",
        [
            candidate("A101", 10.0016, 76.2999),
            candidate("A102", 9.9866, 76.2999),
        ],
    )

    assert result.rankedCandidates[0].etaMinutes < result.rankedCandidates[1].etaMinutes
    assert result.rankedCandidates[0].score < result.rankedCandidates[1].score


def test_lower_distance_improves_ranking() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "low",
        [
            candidate("A101", 10.0116, 76.2999),
            candidate("A102", 9.9866, 76.2999),
        ],
    )

    assert result.rankedCandidates[0].distanceKm < result.rankedCandidates[1].distanceKm
    assert result.selected.ambulanceId == "A102"


def test_equal_scores_are_broken_by_ambulance_id() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "high",
        [
            candidate("A102", 9.9916, 76.2999),
            candidate("A101", 9.9916, 76.2999),
        ],
    )

    assert [item.ambulanceId for item in result.rankedCandidates] == ["A101", "A102"]


def test_no_available_ambulance_raises_domain_error() -> None:
    with pytest.raises(NoAvailableAmbulanceError, match="No available ambulances"):
        select_ambulance(
            EMERGENCY_LOCATION,
            "high",
            [candidate("A101", 9.9816, 76.2999, "busy")],
        )


def test_selected_ambulance_is_rank_one() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "high",
        [candidate("A101", 9.9916, 76.2999), candidate("A102", 9.9866, 76.2999)],
    )

    assert result.selected.rank == 1
    assert result.selected.selected is True


def test_ranking_contains_all_eligible_ambulances() -> None:
    result = select_ambulance(
        EMERGENCY_LOCATION,
        "high",
        [
            candidate("A101", 9.9916, 76.2999),
            candidate("A102", 9.9866, 76.2999),
            candidate("A103", 9.9816, 76.3199),
            candidate("A104", 9.9816, 76.2999, "en_route"),
        ],
    )

    assert len(result.rankedCandidates) == 3
    assert {item.ambulanceId for item in result.rankedCandidates} == {
        "A101",
        "A102",
        "A103",
    }
