from backend.routing.provider import GeoPoint, RouteCandidate
from backend.routing.route_scoring import (
    DISTANCE_WEIGHT,
    ETA_WEIGHT,
    score_routes,
)


def _candidate(
    route_index: int,
    distance_km: float,
    eta_minutes: float,
) -> RouteCandidate:
    return RouteCandidate(
        routeIndex=route_index,
        distanceKm=distance_km,
        etaMinutes=eta_minutes,
        coordinates=(
            GeoPoint(
                latitude=10.0 + route_index,
                longitude=76.0 + route_index,
            ),
        ),
    )


def test_empty_candidates_return_empty_result() -> None:
    assert score_routes(()) == ()


def test_routes_are_ranked_by_score() -> None:
    candidates = (
        _candidate(0, 5.0, 15.0),
        _candidate(1, 4.0, 10.0),
        _candidate(2, 3.0, 12.0),
    )

    ranked = score_routes(candidates)

    assert [route.rank for route in ranked] == [1, 2, 3]
    assert ranked[0].routeIndex == 1


def test_fast_route_beats_longer_slower_route() -> None:
    candidates = (
        _candidate(0, 8.0, 20.0),
        _candidate(1, 5.0, 10.0),
    )

    ranked = score_routes(candidates)

    assert ranked[0].routeIndex == 1
    assert ranked[0].etaMinutes == 10.0


def test_shorter_route_can_win_when_eta_is_equal() -> None:
    candidates = (
        _candidate(0, 8.0, 10.0),
        _candidate(1, 5.0, 10.0),
    )

    ranked = score_routes(candidates)

    assert ranked[0].routeIndex == 1


def test_ranking_is_deterministic_for_identical_routes() -> None:
    candidates = (
        _candidate(2, 5.0, 10.0),
        _candidate(0, 5.0, 10.0),
        _candidate(1, 5.0, 10.0),
    )

    ranked = score_routes(candidates)

    assert [route.routeIndex for route in ranked] == [0, 1, 2]
    assert [route.rank for route in ranked] == [1, 2, 3]


def test_scores_are_between_zero_and_one() -> None:
    candidates = (
        _candidate(0, 5.0, 10.0),
        _candidate(1, 10.0, 20.0),
        _candidate(2, 7.0, 15.0),
    )

    ranked = score_routes(candidates)

    assert all(
        0.0 <= route.score <= 1.0
        for route in ranked
    )


def test_scoring_weights_sum_to_one() -> None:
    assert ETA_WEIGHT + DISTANCE_WEIGHT == 1.0