from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.route import (
    Coordinate,
    RerouteRequest,
    RerouteResponse,
    RouteCandidateResponse,
    RouteCandidatesRequest,
    RouteCreateRequest,
    RouteResponse,
)
from backend.services.route_service import (
    RouteServiceError,
    create_route,
    get_route_candidates,
    reroute_route,
)


router = APIRouter(
    prefix="/api/routes",
    tags=["routes"],
)


@router.post(
    "/reroute",
    response_model=RerouteResponse,
)
def reroute_endpoint(
    request: RerouteRequest,
    db: Session = Depends(get_db),
) -> RerouteResponse:
    try:
        return reroute_route(
            db,
            request.ambulanceId,
            request.currentRouteId,
        )
    except RouteServiceError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error


@router.post(
    "/candidates",
    response_model=list[RouteCandidateResponse],
)
def get_route_candidates_endpoint(
    request: RouteCandidatesRequest,
    db: Session = Depends(get_db),
) -> list[RouteCandidateResponse]:
    try:
        candidates = get_route_candidates(
            db,
            request.ambulanceId,
            request.emergencyId,
        )
        return [
            RouteCandidateResponse(
                routeIndex=candidate.routeIndex,
                rank=candidate.rank,
                score=candidate.score,
                distanceKm=candidate.distanceKm,
                etaMinutes=candidate.etaMinutes,
                coordinates=[
                    Coordinate(
                        latitude=point.latitude,
                        longitude=point.longitude,
                    )
                    for point in candidate.coordinates
                ],
            )
            for candidate in candidates
        ]
    except RouteServiceError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error


@router.post(
    "",
    response_model=RouteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_route_endpoint(
    request: RouteCreateRequest,
    db: Session = Depends(get_db),
):
    try:
        return create_route(
            db,
            request.ambulanceId,
            request.emergencyId,
        )
    except RouteServiceError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error