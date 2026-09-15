import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from backend.database.database import Base, get_db
from backend.main import app
from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.hospital import Hospital


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
    session.add_all(
        [
            Ambulance(
                id="A101",
                latitude=9.9816,
                longitude=76.2999,
                status="available",
                emergencyId=None,
                destinationHospitalId=None,
                etaMinutes=None,
            ),
            Ambulance(
                id="A102",
                latitude=9.9933,
                longitude=76.2921,
                status="en_route",
                emergencyId="E1042",
                destinationHospitalId="H001",
                etaMinutes=8.0,
            ),
            Ambulance(
                id="A103",
                latitude=10.0224,
                longitude=76.3117,
                status="busy",
                emergencyId="E1041",
                destinationHospitalId="H002",
                etaMinutes=12.0,
            ),
            Ambulance(
                id="A104",
                latitude=9.9626,
                longitude=76.2837,
                status="available",
                emergencyId=None,
                destinationHospitalId=None,
                etaMinutes=None,
            ),
            Ambulance(
                id="A105",
                latitude=9.9468,
                longitude=76.3196,
                status="en_route",
                emergencyId="E1044",
                destinationHospitalId="H004",
                etaMinutes=10.0,
            ),
            Hospital(
                id="H001",
                name="Ernakulam General Hospital",
                latitude=9.9816,
                longitude=76.2999,
                capabilities=["cardiac", "trauma", "icu"],
                availableBeds=12,
                emergencyAvailable=True,
            ),
            Hospital(
                id="H002",
                name="Rajagiri Hospital",
                latitude=10.0246,
                longitude=76.3162,
                capabilities=["cardiac", "stroke", "icu"],
                availableBeds=8,
                emergencyAvailable=True,
            ),
            Hospital(
                id="H003",
                name="Aster Medcity",
                latitude=10.0617,
                longitude=76.2845,
                capabilities=["cardiac", "trauma", "stroke", "icu"],
                availableBeds=15,
                emergencyAvailable=True,
            ),
            Emergency(
                id="E1041",
                type="cardiac",
                severity="critical",
                latitude=10.0184,
                longitude=76.3088,
                ambulanceId="A103",
                hospitalId="H002",
                status="assigned",
            ),
            Emergency(
                id="E1042",
                type="trauma",
                severity="high",
                latitude=9.9897,
                longitude=76.2912,
                ambulanceId="A102",
                hospitalId="H001",
                status="assigned",
            ),
            Emergency(
                id="E1043",
                type="stroke",
                severity="medium",
                latitude=10.0441,
                longitude=76.3027,
                ambulanceId=None,
                hospitalId=None,
                status="pending",
            ),
            Emergency(
                id="E1044",
                type="other",
                severity="low",
                latitude=9.9508,
                longitude=76.3211,
                ambulanceId="A105",
                hospitalId="H001",
                status="assigned",
            ),
        ]
    )
    session.commit()
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


def create_payload(severity: str = "critical") -> dict[str, str | float]:
    return {
        "type": "cardiac",
        "latitude": 10.0184,
        "longitude": 76.3088,
        "severity": severity,
    }


def test_create_and_dispatch_emergency(client: TestClient, test_session_factory) -> None:
    response = client.post("/api/emergencies", json=create_payload("CRITICAL"))

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "E1045"
    assert body["severity"] == "critical"
    assert body["status"] == "assigned"
    assert body["ambulanceId"] is not None
    assert body["hospitalId"] is not None

    session = test_session_factory()
    try:
        created = session.get(Emergency, body["id"])
        selected_ambulance = session.get(Ambulance, body["ambulanceId"])
        selected_hospital = session.get(Hospital, body["hospitalId"])

        assert created is not None
        assert selected_ambulance.status == "en_route"
        assert selected_ambulance.emergencyId == body["id"]
        assert selected_ambulance.destinationHospitalId == body["hospitalId"]
        assert selected_hospital.emergencyAvailable is True
        assert selected_hospital.availableBeds > 0
        assert "cardiac" in selected_hospital.capabilities
    finally:
        session.close()


def test_invalid_severity_returns_400(client: TestClient, test_session_factory) -> None:
    response = client.post("/api/emergencies", json=create_payload("urgent"))

    assert response.status_code == 400
    session = test_session_factory()
    try:
        assert session.scalar(select(func.count()).select_from(Emergency)) == 4
    finally:
        session.close()


def test_no_available_ambulance_returns_409(client: TestClient, test_session_factory) -> None:
    session = test_session_factory()
    try:
        for ambulance in session.scalars(select(Ambulance)):
            ambulance.status = "busy"
        session.commit()
    finally:
        session.close()

    response = client.post("/api/emergencies", json=create_payload())

    assert response.status_code == 409
    session = test_session_factory()
    try:
        assert session.scalar(select(func.count()).select_from(Emergency)) == 4
    finally:
        session.close()


def test_no_suitable_hospital_rolls_back_dispatch(
    client: TestClient, test_session_factory
) -> None:
    session = test_session_factory()
    try:
        for hospital in session.scalars(select(Hospital)):
            hospital.emergencyAvailable = False
        session.commit()
    finally:
        session.close()

    response = client.post("/api/emergencies", json=create_payload())

    assert response.status_code == 409
    session = test_session_factory()
    try:
        assert session.scalar(select(func.count()).select_from(Emergency)) == 4
        available_ambulances = session.scalars(
            select(Ambulance).where(Ambulance.id.in_(["A101", "A104"]))
        ).all()
        assert all(ambulance.status == "available" for ambulance in available_ambulances)
        assert all(ambulance.emergencyId is None for ambulance in available_ambulances)
    finally:
        session.close()
