from backend import config
from backend.main import app
from backend.schemas.ambulance import AmbulanceResponse
from backend.schemas.emergency import EmergencyCreateRequest, EmergencyResponse
from backend.schemas.hospital import HospitalResponse
from backend.schemas.route import (
    Coordinate,
    RerouteRequest,
    RerouteResponse,
    RouteCandidateResponse,
    RouteCandidatesRequest,
    RouteCreateRequest,
    RouteResponse,
)


def test_audit_all_endpoints_exist():
    openapi_schema = app.openapi()
    paths = openapi_schema["paths"]

    expected_endpoints = [
        ("/api/emergencies", "get"),
        ("/api/emergencies", "post"),
        ("/api/emergencies/{id}", "get"),
        ("/api/ambulances", "get"),
        ("/api/ambulances/{id}", "get"),
        ("/api/hospitals", "get"),
        ("/api/hospitals/{id}", "get"),
        ("/api/routes", "post"),
        ("/api/routes/candidates", "post"),
        ("/api/routes/reroute", "post"),
        ("/health", "get"),
    ]

    for path, method in expected_endpoints:
        assert path in paths, f"Path {path} missing from OpenAPI schema"
        assert method in paths[path], f"Method {method.upper()} {path} missing"


def test_audit_camel_case_field_names():
    # RouteResponse contract
    route_fields = set(RouteResponse.model_fields.keys())
    assert {"routeId", "ambulanceId", "hospitalId", "distanceKm", "etaMinutes", "trafficLevel", "coordinates"}.issubset(route_fields)

    # RouteCandidateResponse contract
    candidate_fields = set(RouteCandidateResponse.model_fields.keys())
    assert {"routeIndex", "rank", "score", "distanceKm", "etaMinutes", "coordinates"}.issubset(candidate_fields)

    # RerouteRequest contract
    reroute_req_fields = set(RerouteRequest.model_fields.keys())
    assert {"ambulanceId", "currentRouteId"}.issubset(reroute_req_fields)

    # RerouteResponse contract
    reroute_res_fields = set(RerouteResponse.model_fields.keys())
    assert {"previousEtaMinutes", "newEtaMinutes", "timeSavedMinutes", "reason", "coordinates"}.issubset(reroute_res_fields)

    # AmbulanceResponse contract
    ambulance_fields = set(AmbulanceResponse.model_fields.keys())
    assert {"id", "latitude", "longitude", "status", "emergencyId", "destinationHospitalId", "etaMinutes"}.issubset(ambulance_fields)

    # EmergencyResponse contract
    emergency_fields = set(EmergencyResponse.model_fields.keys())
    assert {"id", "type", "severity", "latitude", "longitude", "ambulanceId", "hospitalId", "status"}.issubset(emergency_fields)

    # Coordinate fields
    coord_fields = set(Coordinate.model_fields.keys())
    assert coord_fields == {"latitude", "longitude"}


def test_audit_cors_configuration():
    settings = config.get_settings()
    assert "http://localhost:5173" in settings.cors_origins
    assert "*" not in settings.cors_origins


def test_audit_google_api_key_backend_only():
    import os
    # Verify no frontend variable leaks key
    for env_var in os.environ:
        assert not env_var.startswith("VITE_GOOGLE"), "Google API key leaked to VITE_ frontend variable"
