from pydantic import BaseModel, ConfigDict


class Coordinate(BaseModel):
    latitude: float
    longitude: float


class RouteCreateRequest(BaseModel):
    ambulanceId: str
    emergencyId: str


class RouteCandidatesRequest(BaseModel):
    ambulanceId: str
    emergencyId: str


class RouteCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    routeIndex: int
    rank: int
    score: float
    distanceKm: float
    etaMinutes: float
    coordinates: list[Coordinate]


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    routeId: str
    ambulanceId: str
    hospitalId: str
    distanceKm: float
    etaMinutes: float
    trafficLevel: str
    coordinates: list[Coordinate]


class RerouteRequest(BaseModel):
    ambulanceId: str
    currentRouteId: str


class RerouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    previousEtaMinutes: float
    newEtaMinutes: float
    timeSavedMinutes: float
    reason: str
    coordinates: list[Coordinate]
