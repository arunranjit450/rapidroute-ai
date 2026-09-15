from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.hospital import Hospital
from backend.models.route import Route
from backend.routing.tomtom_routes import (
    TomTomRoutesError,
    TomTomRoutesProvider,
)
from backend.routing.provider import GeoPoint, RouteRequest
from backend.routing.route_scoring import ScoredRoute, score_routes
from backend.schemas.route import Coordinate, RerouteResponse

MIN_REROUTE_SAVINGS_MINUTES = 2.0
HEAVY_CONGESTION_SAVINGS_THRESHOLD_MINUTES = 5.0


class RouteServiceError(RuntimeError):
    """Raised when a route cannot be created."""


def generate_route_id(session: Session) -> str:
    route_ids = session.query(Route.routeId).all()

    numeric_ids = [
        int(route_id[1:])
        for (route_id,) in route_ids
        if route_id.startswith("R")
        and route_id[1:].isdigit()
    ]

    return f"R{max(numeric_ids, default=0) + 1:04d}"


def _is_valid_coordinate(latitude: object, longitude: object) -> bool:
    if isinstance(latitude, bool) or isinstance(longitude, bool):
        return False
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        return False
    return -90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0


def _resolve_route_context(
    session: Session,
    ambulance_id: str,
    emergency_id: str,
) -> tuple[Ambulance, Hospital, RouteRequest]:
    ambulance = session.get(Ambulance, ambulance_id)

    if ambulance is None:
        raise RouteServiceError(
            f"Ambulance {ambulance_id} not found"
        )

    emergency = session.get(Emergency, emergency_id)

    if emergency is None:
        raise RouteServiceError(
            f"Emergency {emergency_id} not found"
        )

    if emergency.ambulanceId != ambulance.id:
        raise RouteServiceError(
            f"Ambulance {ambulance_id} is not assigned to "
            f"emergency {emergency_id}"
        )

    if emergency.hospitalId is None:
        raise RouteServiceError(
            f"Emergency {emergency_id} has no destination hospital"
        )

    hospital = session.get(
        Hospital,
        emergency.hospitalId,
    )

    if hospital is None:
        raise RouteServiceError(
            f"Hospital {emergency.hospitalId} not found"
        )

    if not _is_valid_coordinate(ambulance.latitude, ambulance.longitude):
        raise RouteServiceError(
            f"Ambulance {ambulance_id} does not have valid coordinates"
        )

    if not _is_valid_coordinate(hospital.latitude, hospital.longitude):
        raise RouteServiceError(
            f"Hospital {hospital.id} does not have valid coordinates"
        )

    route_request = RouteRequest(
        origin=GeoPoint(
            latitude=ambulance.latitude,
            longitude=ambulance.longitude,
        ),
        destination=GeoPoint(
            latitude=hospital.latitude,
            longitude=hospital.longitude,
        ),
    )

    return ambulance, hospital, route_request


def _fetch_and_score_candidates(
    route_request: RouteRequest,
) -> tuple[ScoredRoute, ...]:
    provider = TomTomRoutesProvider()

    try:
        candidates = provider.calculate_routes(
            route_request
        )
    except TomTomRoutesError as error:
        raise RouteServiceError(
            str(error)
        ) from error

    ranked_routes = score_routes(candidates)

    if not ranked_routes:
        raise RouteServiceError(
            "No route candidates were returned"
        )

    return ranked_routes


def get_route_candidates(
    session: Session,
    ambulance_id: str,
    emergency_id: str,
) -> tuple[ScoredRoute, ...]:
    """
    Calculate and rank candidate routes for an emergency without persisting.
    """
    _, _, route_request = _resolve_route_context(
        session,
        ambulance_id,
        emergency_id,
    )
    return _fetch_and_score_candidates(route_request)


def create_route(
    session: Session,
    ambulance_id: str,
    emergency_id: str,
) -> Route:
    """
    Calculate, rank and persist the best route for an emergency.

    The ambulance must be associated with the requested emergency,
    and the emergency must have a destination hospital.
    """
    ambulance, hospital, route_request = _resolve_route_context(
        session,
        ambulance_id,
        emergency_id,
    )

    ranked_routes = _fetch_and_score_candidates(route_request)
    selected = ranked_routes[0]

    route = Route(
        routeId=generate_route_id(session),
        ambulanceId=ambulance.id,
        hospitalId=hospital.id,
        distanceKm=selected.distanceKm,
        etaMinutes=selected.etaMinutes,
        trafficLevel=_traffic_level(
            selected.etaMinutes,
            selected.distanceKm,
        ),
        coordinates=[
            {
                "latitude": point.latitude,
                "longitude": point.longitude,
            }
            for point in selected.coordinates
        ],
    )

    session.add(route)

    ambulance.etaMinutes = selected.etaMinutes
    ambulance.destinationHospitalId = hospital.id
    ambulance.status = "en_route"

    try:
        session.commit()
        session.refresh(route)
    except Exception as error:
        session.rollback()
        raise RouteServiceError("Failed to persist route to database") from error

    return route


def reroute_route(
    session: Session,
    ambulance_id: str,
    current_route_id: str,
) -> RerouteResponse:
    """
    Evaluate fresh traffic-aware route candidates for an active route and reroute
    only when a meaningful ETA improvement is achieved.
    """
    ambulance = session.get(Ambulance, ambulance_id)
    if ambulance is None:
        raise RouteServiceError(f"Ambulance {ambulance_id} not found")

    current_route = session.get(Route, current_route_id)
    if current_route is None:
        raise RouteServiceError(f"Route {current_route_id} not found")

    if current_route.ambulanceId != ambulance.id:
        raise RouteServiceError(
            f"Route {current_route_id} does not belong to ambulance {ambulance_id}"
        )

    hospital = session.get(Hospital, current_route.hospitalId)
    if hospital is None:
        raise RouteServiceError(
            f"Hospital {current_route.hospitalId} not found"
        )

    if not _is_valid_coordinate(ambulance.latitude, ambulance.longitude):
        raise RouteServiceError(
            f"Ambulance {ambulance_id} does not have valid coordinates"
        )

    if not _is_valid_coordinate(hospital.latitude, hospital.longitude):
        raise RouteServiceError(
            f"Hospital {hospital.id} does not have valid coordinates"
        )

    route_request = RouteRequest(
        origin=GeoPoint(
            latitude=ambulance.latitude,
            longitude=ambulance.longitude,
        ),
        destination=GeoPoint(
            latitude=hospital.latitude,
            longitude=hospital.longitude,
        ),
    )

    ranked_routes = _fetch_and_score_candidates(route_request)
    best_candidate = ranked_routes[0]

    previous_eta = current_route.etaMinutes
    new_eta = best_candidate.etaMinutes
    time_saved = previous_eta - new_eta

    if new_eta < previous_eta and time_saved >= MIN_REROUTE_SAVINGS_MINUTES:
        if time_saved >= HEAVY_CONGESTION_SAVINGS_THRESHOLD_MINUTES:
            reason = "Heavy congestion detected"
        else:
            reason = "Faster traffic-aware route detected"

        new_coordinates = [
            {
                "latitude": point.latitude,
                "longitude": point.longitude,
            }
            for point in best_candidate.coordinates
        ]

        current_route.distanceKm = best_candidate.distanceKm
        current_route.etaMinutes = best_candidate.etaMinutes
        current_route.trafficLevel = _traffic_level(
            best_candidate.etaMinutes,
            best_candidate.distanceKm,
        )
        current_route.coordinates = new_coordinates

        ambulance.etaMinutes = best_candidate.etaMinutes
        ambulance.destinationHospitalId = hospital.id
        ambulance.status = "en_route"

        try:
            session.commit()
            session.refresh(current_route)
            session.refresh(ambulance)
        except Exception as error:
            session.rollback()
            raise RouteServiceError("Failed to update reroute in database") from error

        return RerouteResponse(
            previousEtaMinutes=round(previous_eta, 2),
            newEtaMinutes=round(best_candidate.etaMinutes, 2),
            timeSavedMinutes=round(time_saved, 2),
            reason=reason,
            coordinates=[
                Coordinate(
                    latitude=point.latitude,
                    longitude=point.longitude,
                )
                for point in best_candidate.coordinates
            ],
        )

    return RerouteResponse(
        previousEtaMinutes=round(previous_eta, 2),
        newEtaMinutes=round(previous_eta, 2),
        timeSavedMinutes=0.0,
        reason="No meaningful ETA improvement",
        coordinates=[
            Coordinate(
                latitude=coord["latitude"],
                longitude=coord["longitude"],
            )
            for coord in current_route.coordinates
        ],
    )


def _traffic_level(
    eta_minutes: float,
    distance_km: float,
) -> str:
    """
    Derive a simple traffic classification from effective
    traffic-aware travel speed.

    This is an MVP classification. The actual Google traffic-aware
    ETA remains the authoritative routing value.
    """

    if distance_km <= 0:
        return "unknown"

    effective_speed = distance_km / (
        eta_minutes / 60
    )

    if effective_speed >= 35:
        return "low"

    if effective_speed >= 20:
        return "moderate"

    return "high"