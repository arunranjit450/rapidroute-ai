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
    database_path = tmp_path / "rapidroute_e2e_test.db"
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


def test_complete_backend_workflow(
    monkeypatch, client: TestClient, test_session_factory
):
    """
    Verify complete flow:
    1. Emergency created & dispatched (ambulance + hospital selected)
    2. Candidate routes calculated & ranked without persisting
    3. Best route selected, persisted, and ambulance set to en_route
    4. Reroute evaluated: rejected when savings < 2 minutes
    5. Reroute evaluated: accepted when savings >= 2 minutes (updates in-place)
    """

    # --- Phase 1: Create Emergency ---
    # Cardiac emergency in Kochi near Ernakulam
    emergency_response = client.post(
        "/api/emergencies",
        json={
            "type": "cardiac",
            "severity": "critical",
            "latitude": 9.9816,
            "longitude": 76.2999,
        },
    )
    assert emergency_response.status_code == 201
    emergency_data = emergency_response.json()
    created_emergency_id = emergency_data["id"]
    assigned_ambulance_id = emergency_data["ambulanceId"]
    assigned_hospital_id = emergency_data["hospitalId"]

    assert created_emergency_id.startswith("E")
    assert emergency_data["status"] == "assigned"
    assert assigned_ambulance_id in {"A101", "A104"}  # Available ambulances in seed
    assert assigned_hospital_id in {"H001", "H002", "H003", "H004"}  # Cardiac hospitals

    # --- Phase 2: Candidate Routes Calculation ---
    initial_candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=6.0,
            etaMinutes=16.0,
            coordinates=(GeoPoint(9.98, 76.29), GeoPoint(9.99, 76.30)),
        ),
        RouteCandidate(
            routeIndex=1,
            distanceKm=4.0,
            etaMinutes=11.0,
            coordinates=(GeoPoint(9.98, 76.29), GeoPoint(10.00, 76.31)),
        ),
        RouteCandidate(
            routeIndex=2,
            distanceKm=8.0,
            etaMinutes=20.0,
            coordinates=(GeoPoint(9.98, 76.29), GeoPoint(10.01, 76.32)),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, req: initial_candidates,
    )

    candidates_response = client.post(
        "/api/routes/candidates",
        json={
            "ambulanceId": assigned_ambulance_id,
            "emergencyId": created_emergency_id,
        },
    )
    assert candidates_response.status_code == 200
    candidates_data = candidates_response.json()

    assert len(candidates_data) == 3
    # Candidate 1 (eta=11.0, dist=4.0) ranks #1
    assert candidates_data[0]["rank"] == 1
    assert candidates_data[0]["routeIndex"] == 1
    assert candidates_data[0]["etaMinutes"] == 11.0
    assert candidates_data[0]["distanceKm"] == 4.0

    # Ensure candidate calculation created no DB routes
    session = test_session_factory()
    try:
        assert session.query(Route).count() == 0
    finally:
        session.close()

    # --- Phase 3: Route Creation & Selection ---
    route_response = client.post(
        "/api/routes",
        json={
            "ambulanceId": assigned_ambulance_id,
            "emergencyId": created_emergency_id,
        },
    )
    assert route_response.status_code == 201
    route_data = route_response.json()
    created_route_id = route_data["routeId"]

    assert created_route_id.startswith("R")
    assert route_data["ambulanceId"] == assigned_ambulance_id
    assert route_data["hospitalId"] == assigned_hospital_id
    assert route_data["etaMinutes"] == 11.0
    assert route_data["distanceKm"] == 4.0

    # Verify route persisted in DB and ambulance is en_route
    session = test_session_factory()
    try:
        assert session.query(Route).count() == 1
        persisted_ambulance = session.get(Ambulance, assigned_ambulance_id)
        assert persisted_ambulance.status == "en_route"
        assert persisted_ambulance.etaMinutes == 11.0
    finally:
        session.close()

    # --- Phase 4: Insignificant Rerouting Attempt (< 2 min savings) ---
    insignificant_candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=3.9,
            etaMinutes=10.2,  # Saves 0.8 min (< 2.0 min)
            coordinates=(GeoPoint(9.98, 76.29), GeoPoint(10.00, 76.31)),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, req: insignificant_candidates,
    )

    reroute_attempt_1 = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": assigned_ambulance_id,
            "currentRouteId": created_route_id,
        },
    )
    assert reroute_attempt_1.status_code == 200
    r1_data = reroute_attempt_1.json()

    assert r1_data["previousEtaMinutes"] == 11.0
    assert r1_data["newEtaMinutes"] == 11.0
    assert r1_data["timeSavedMinutes"] == 0.0
    assert r1_data["reason"] == "No meaningful ETA improvement"

    # Verify route and ambulance untouched
    session = test_session_factory()
    try:
        persisted_route = session.get(Route, created_route_id)
        assert persisted_route.etaMinutes == 11.0
    finally:
        session.close()

    # --- Phase 5: Meaningful Rerouting Attempt (>= 2 min savings) ---
    significant_candidates = (
        RouteCandidate(
            routeIndex=0,
            distanceKm=3.2,
            etaMinutes=7.5,  # Saves 3.5 min (>= 2.0 min)
            coordinates=(GeoPoint(9.98, 76.29), GeoPoint(10.02, 76.33)),
        ),
    )

    monkeypatch.setattr(
        TomTomRoutesProvider,
        "calculate_routes",
        lambda self, req: significant_candidates,
    )

    reroute_attempt_2 = client.post(
        "/api/routes/reroute",
        json={
            "ambulanceId": assigned_ambulance_id,
            "currentRouteId": created_route_id,
        },
    )
    assert reroute_attempt_2.status_code == 200
    r2_data = reroute_attempt_2.json()

    assert r2_data["previousEtaMinutes"] == 11.0
    assert r2_data["newEtaMinutes"] == 7.5
    assert r2_data["timeSavedMinutes"] == 3.5
    assert r2_data["reason"] == "Faster traffic-aware route detected"

    # Verify Route updated IN-PLACE (count still 1, same routeId)
    session = test_session_factory()
    try:
        assert session.query(Route).count() == 1
        updated_route = session.get(Route, created_route_id)
        assert updated_route.etaMinutes == 7.5
        assert updated_route.distanceKm == 3.2
        updated_ambulance = session.get(Ambulance, assigned_ambulance_id)
        assert updated_ambulance.etaMinutes == 7.5
    finally:
        session.close()
