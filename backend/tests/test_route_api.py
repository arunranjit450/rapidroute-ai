import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.database import Base, get_db
from backend.database.seed import AMBULANCES, EMERGENCIES, HOSPITALS, _upsert
from backend.main import app
from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.hospital import Hospital
from backend.models.route import Route
from backend.routing.tomtom_routes import TomTomRoutesProvider
from backend.routing.provider import GeoPoint, RouteCandidate


@pytest.fixture
def test_session_factory(tmp_path):
    database_path = tmp_path / "rapidroute_test.db"
    engine = create_engine(
        f"sqlite:///{database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = session_factory()
    try:
        for values in AMBULANCES:
            _upsert(session, Ambulance, values)
        for values in HOSPITALS:
            _upsert(session, Hospital, values)
        for values in EMERGENCIES:
            _upsert(session, Emergency, values)
        session.commit()
    finally:
        session.close()

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield session_factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


@pytest.fixture
def client(test_session_factory) -> TestClient:
    return TestClient(app)


def test_create_route_endpoint_returns_selected_route(monkeypatch, client: TestClient):
    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=5.0,
            etaMinutes=15.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.01, 76.01),
            ),
        ),
        RouteCandidate(
            routeIndex=1,
            distanceKm=4.0,
            etaMinutes=10.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
    )

    def fake_calculate_routes(self, request):
        return candidates

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        fake_calculate_routes,
    )

    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["routeId"] == "R0001"
    assert body["ambulanceId"] == "A103"
    assert body["hospitalId"] == "H002"
    assert body["distanceKm"] == 4.0
    assert body["etaMinutes"] == 10.0
    assert body["trafficLevel"] in {
        "low",
        "moderate",
        "high",
        "unknown",
    }

    assert body["coordinates"] == [
        {
            "latitude": 10.0,
            "longitude": 76.0,
        },
        {
            "latitude": 10.02,
            "longitude": 76.02,
        },
    ]


def test_create_route_rejects_unknown_ambulance(client: TestClient):
    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "UNKNOWN",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "Ambulance UNKNOWN not found" in response.json()["detail"]


def test_create_route_rejects_unknown_emergency(client: TestClient):
    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "UNKNOWN",
        },
    )

    assert response.status_code == 409
    assert "Emergency UNKNOWN not found" in response.json()["detail"]


def test_create_route_rejects_wrong_ambulance_assignment(client: TestClient):
    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A101",
            "emergencyId": "E1042",
        },
    )

    assert response.status_code == 409
    assert "is not assigned to emergency" in response.json()["detail"]


def test_create_route_requires_both_ids(client: TestClient):
    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A101",
        },
    )

    assert response.status_code == 422


def test_get_route_candidates_returns_multiple_ranked_candidates(
    monkeypatch, client: TestClient, test_session_factory
):
    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=5.0,
            etaMinutes=15.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.01, 76.01),
            ),
        ),
        RouteCandidate(
            routeIndex=1,
            distanceKm=4.0,
            etaMinutes=10.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
        RouteCandidate(
            routeIndex=2,
            distanceKm=6.0,
            etaMinutes=12.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.03, 76.03),
            ),
        ),
    )

    def fake_calculate_routes(self, request):
        return candidates

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        fake_calculate_routes,
    )

    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert isinstance(body, list)
    assert len(body) == 3

    assert body[0]["rank"] == 1
    assert body[0]["routeIndex"] == 1
    assert body[0]["distanceKm"] == 4.0
    assert body[0]["etaMinutes"] == 10.0
    assert isinstance(body[0]["score"], float)
    assert body[0]["coordinates"] == [
        {"latitude": 10.0, "longitude": 76.0},
        {"latitude": 10.02, "longitude": 76.02},
    ]

    assert [candidate["rank"] for candidate in body] == [1, 2, 3]

    for candidate in body:
        assert "routeIndex" in candidate
        assert "rank" in candidate
        assert "score" in candidate
        assert "distanceKm" in candidate
        assert "etaMinutes" in candidate
        assert "coordinates" in candidate

    session = test_session_factory()
    try:
        assert session.query(Route).count() == 0
        ambulance = session.get(Ambulance, "A103")
        assert ambulance.status == "busy"
        assert ambulance.destinationHospitalId == "H002"
        assert ambulance.etaMinutes == 12.0
    finally:
        session.close()


def test_get_route_candidates_rejects_unknown_ambulance(client: TestClient):
    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "UNKNOWN",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "Ambulance UNKNOWN not found" in response.json()["detail"]


def test_get_route_candidates_rejects_unknown_emergency(client: TestClient):
    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "A103",
            "emergencyId": "UNKNOWN",
        },
    )

    assert response.status_code == 409
    assert "Emergency UNKNOWN not found" in response.json()["detail"]


def test_get_route_candidates_rejects_wrong_ambulance_assignment(client: TestClient):
    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "A101",
            "emergencyId": "E1042",
        },
    )

    assert response.status_code == 409
    assert "is not assigned to emergency" in response.json()["detail"]


def test_get_route_candidates_requires_both_ids(client: TestClient):
    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "A101",
        },
    )

    assert response.status_code == 422


def test_reroute_successful_when_meaningful_improvement(
    monkeypatch, client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A103",
            hospitalId="H002",
            distanceKm=10.0,
            etaMinutes=17.0,
            trafficLevel="moderate",
            coordinates=[
                {"latitude": 10.0, "longitude": 76.0},
                {"latitude": 10.05, "longitude": 76.05},
            ],
        )
        session.add(route)
        ambulance = session.get(Ambulance, "A103")
        ambulance.etaMinutes = 17.0
        ambulance.destinationHospitalId = "H002"
        ambulance.status = "en_route"
        session.commit()
    finally:
        session.close()

    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=4.0,
            etaMinutes=9.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, request: candidates,
    )

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["previousEtaMinutes"] == 17.0
    assert body["newEtaMinutes"] == 9.0
    assert body["timeSavedMinutes"] == 8.0
    assert body["reason"] == "Heavy congestion detected"
    assert body["coordinates"] == [
        {"latitude": 10.0, "longitude": 76.0},
        {"latitude": 10.02, "longitude": 76.02},
    ]

    session = test_session_factory()
    try:
        assert session.query(Route).count() == 1
        updated_route = session.get(Route, "R0001")
        assert updated_route.etaMinutes == 9.0
        assert updated_route.distanceKm == 4.0
        assert updated_route.coordinates == [
            {"latitude": 10.0, "longitude": 76.0},
            {"latitude": 10.02, "longitude": 76.02},
        ]
        updated_ambulance = session.get(Ambulance, "A103")
        assert updated_ambulance.etaMinutes == 9.0
        assert updated_ambulance.status == "en_route"
    finally:
        session.close()


def test_reroute_rejected_when_savings_below_threshold(
    monkeypatch, client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A103",
            hospitalId="H002",
            distanceKm=5.0,
            etaMinutes=10.0,
            trafficLevel="low",
            coordinates=[
                {"latitude": 10.0, "longitude": 76.0},
                {"latitude": 10.05, "longitude": 76.05},
            ],
        )
        session.add(route)
        ambulance = session.get(Ambulance, "A103")
        ambulance.etaMinutes = 10.0
        session.commit()
    finally:
        session.close()

    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=4.8,
            etaMinutes=9.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, request: candidates,
    )

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["previousEtaMinutes"] == 10.0
    assert body["newEtaMinutes"] == 10.0
    assert body["timeSavedMinutes"] == 0.0
    assert body["reason"] == "No meaningful ETA improvement"
    assert body["coordinates"] == [
        {"latitude": 10.0, "longitude": 76.0},
        {"latitude": 10.05, "longitude": 76.05},
    ]

    session = test_session_factory()
    try:
        current_route = session.get(Route, "R0001")
        assert current_route.etaMinutes == 10.0
        assert current_route.distanceKm == 5.0
        ambulance = session.get(Ambulance, "A103")
        assert ambulance.etaMinutes == 10.0
    finally:
        session.close()


def test_reroute_rejected_when_new_route_is_equal_or_slower(
    monkeypatch, client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A103",
            hospitalId="H002",
            distanceKm=5.0,
            etaMinutes=10.0,
            trafficLevel="low",
            coordinates=[
                {"latitude": 10.0, "longitude": 76.0},
                {"latitude": 10.05, "longitude": 76.05},
            ],
        )
        session.add(route)
        session.commit()
    finally:
        session.close()

    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=6.0,
            etaMinutes=12.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.03, 76.03),
            ),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, request: candidates,
    )

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["previousEtaMinutes"] == 10.0
    assert body["newEtaMinutes"] == 10.0
    assert body["timeSavedMinutes"] == 0.0
    assert body["reason"] == "No meaningful ETA improvement"


def test_reroute_selects_best_candidate_via_scoring(
    monkeypatch, client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A103",
            hospitalId="H002",
            distanceKm=10.0,
            etaMinutes=17.0,
            trafficLevel="moderate",
            coordinates=[
                {"latitude": 10.0, "longitude": 76.0},
            ],
        )
        session.add(route)
        session.commit()
    finally:
        session.close()

    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=9.0,
            etaMinutes=16.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.01, 76.01),
            ),
        ),
        RouteCandidate(
            routeIndex=1,
            distanceKm=4.0,
            etaMinutes=10.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, request: candidates,
    )

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["newEtaMinutes"] == 10.0
    assert body["timeSavedMinutes"] == 7.0
    assert body["coordinates"] == [
        {"latitude": 10.0, "longitude": 76.0},
        {"latitude": 10.02, "longitude": 76.02},
    ]


def test_reroute_rejects_unknown_ambulance(client: TestClient):
    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "UNKNOWN",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 409
    assert "Ambulance UNKNOWN not found" in response.json()["detail"]


def test_reroute_rejects_unknown_route(client: TestClient):
    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "UNKNOWN",
        },
    )

    assert response.status_code == 409
    assert "Route UNKNOWN not found" in response.json()["detail"]


def test_reroute_rejects_route_belonging_to_another_ambulance(
    client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A102",
            hospitalId="H001",
            distanceKm=5.0,
            etaMinutes=8.0,
            trafficLevel="low",
            coordinates=[{"latitude": 10.0, "longitude": 76.0}],
        )
        session.add(route)
        session.commit()
    finally:
        session.close()

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 409
    assert "does not belong to ambulance" in response.json()["detail"]


def test_reroute_rejects_missing_hospital(client: TestClient, test_session_factory):
    session = test_session_factory()
    try:
        route = Route(
            routeId="R0001",
            ambulanceId="A103",
            hospitalId="H_DELETED",
            distanceKm=5.0,
            etaMinutes=15.0,
            trafficLevel="low",
            coordinates=[{"latitude": 10.0, "longitude": 76.0}],
        )
        session.add(route)
        session.commit()
    finally:
        session.close()

    response = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": "A103",
            "currentRouteId": "R0001",
        },
    )

    assert response.status_code == 409
    assert "Hospital H_DELETED not found" in response.json()["detail"]


def test_create_route_rejects_ambulance_with_invalid_coordinates(
    client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        ambulance = session.get(Ambulance, "A103")
        ambulance.latitude = 999.0  # Invalid latitude
        session.commit()
    finally:
        session.close()

    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "does not have valid coordinates" in response.json()["detail"]


def test_create_route_rejects_hospital_with_invalid_coordinates(
    client: TestClient, test_session_factory
):
    session = test_session_factory()
    try:
        hospital = session.get(Hospital, "H002")
        hospital.longitude = 999.0  # Invalid longitude
        session.commit()
    finally:
        session.close()

    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "does not have valid coordinates" in response.json()["detail"]


def test_create_route_handles_database_commit_failure(
    monkeypatch, client: TestClient, test_session_factory
):
    candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=4.0,
            etaMinutes=10.0,
            coordinates=(
                GeoPoint(10.0, 76.0),
                GeoPoint(10.02, 76.02),
            ),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, request: candidates,
    )

    from sqlalchemy.orm import Session as OrmSession

    def fail_commit(self):
        raise RuntimeError("Disk I/O error during commit")

    monkeypatch.setattr(OrmSession, "commit", fail_commit)

    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "Failed to persist route to database" in response.json()["detail"]


def test_create_route_handles_tomtom_provider_error(
    monkeypatch, client: TestClient
):
    from backend.routing.tomtom_routes import TomTomRoutesError

    def failing_calculate_routes(self, request):
        raise TomTomRoutesError("TomTom API rate limit exceeded")

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        failing_calculate_routes,
    )

    response = client.post(
        "/api/routes",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "TomTom API rate limit exceeded" in response.json()["detail"]


def test_candidates_endpoint_handles_tomtom_provider_error(
    monkeypatch, client: TestClient
):
    from backend.routing.tomtom_routes import TomTomRoutesError

    def failing_calculate_routes(self, request):
        raise TomTomRoutesError("TomTom request failed")

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        failing_calculate_routes,
    )

    response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": "A103",
            "emergencyId": "E1041",
        },
    )

    assert response.status_code == 409
    assert "TomTom request failed" in response.json()["detail"]