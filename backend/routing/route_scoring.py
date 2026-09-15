from dataclasses import dataclass

from backend.routing.provider import GeoPoint, RouteCandidate


@dataclass(frozen=True)
class ScoredRoute:
    routeIndex: int
    distanceKm: float
    etaMinutes: float
    score: float
    coordinates: tuple[GeoPoint, ...]
    rank: int


# Lower score = better route.
#
# ETA is the primary factor because this is an emergency
# response system. Distance is the secondary factor.
ETA_WEIGHT = 0.70
DISTANCE_WEIGHT = 0.30


def score_routes(
    candidates: tuple[RouteCandidate, ...],
) -> tuple[ScoredRoute, ...]:
    """
    Score and rank candidate routes.

    Lower score is better.

    ETA and distance are normalized across the candidate set
    so that routes can be compared consistently.
    """

    if not candidates:
        return ()

    max_eta = max(
        candidate.etaMinutes
        for candidate in candidates
    )

    max_distance = max(
        candidate.distanceKm
        for candidate in candidates
    )

    scored: list[ScoredRoute] = []

    for candidate in candidates:
        eta_score = _normalize(
            candidate.etaMinutes,
            max_eta,
        )

        distance_score = _normalize(
            candidate.distanceKm,
            max_distance,
        )

        total_score = (
            ETA_WEIGHT * eta_score
            + DISTANCE_WEIGHT * distance_score
        )

        scored.append(
            ScoredRoute(
                routeIndex=candidate.routeIndex,
                distanceKm=candidate.distanceKm,
                etaMinutes=candidate.etaMinutes,
                score=round(total_score, 6),
                coordinates=candidate.coordinates,
                rank=0,
            )
        )

    # Lower score is better.
    #
    # ETA, distance and route index provide deterministic
    # tie-breaking when scores are equal.
    scored.sort(
        key=lambda route: (
            route.score,
            route.etaMinutes,
            route.distanceKm,
            route.routeIndex,
        )
    )

    ranked: list[ScoredRoute] = []

    for rank, route in enumerate(scored, start=1):
        ranked.append(
            ScoredRoute(
                routeIndex=route.routeIndex,
                distanceKm=route.distanceKm,
                etaMinutes=route.etaMinutes,
                score=route.score,
                coordinates=route.coordinates,
                rank=rank,
            )
        )

    return tuple(ranked)


def _normalize(
    value: float,
    maximum: float,
) -> float:
    """
    Normalize a value to the range 0..1.

    If all candidates have the same value, return 0 so
    that this factor does not affect the ranking.
    """

    if maximum <= 0:
        return 0.0

    return value / maximum