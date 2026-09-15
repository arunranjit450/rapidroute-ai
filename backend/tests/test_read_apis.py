from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_list_ambulances() -> None:
    response = client.get("/api/ambulances")

    assert response.status_code == 200
    assert len(response.json()) == 5


def test_list_hospitals() -> None:
    response = client.get("/api/hospitals")

    assert response.status_code == 200
    assert len(response.json()) == 5


def test_list_emergencies() -> None:
    response = client.get("/api/emergencies")

    assert response.status_code == 200
    assert len(response.json()) == 4


def test_get_existing_ambulance() -> None:
    response = client.get("/api/ambulances/A101")

    assert response.status_code == 200
    assert response.json()["id"] == "A101"


def test_get_existing_hospital() -> None:
    response = client.get("/api/hospitals/H001")

    assert response.status_code == 200
    assert response.json()["id"] == "H001"


def test_get_existing_emergency() -> None:
    response = client.get("/api/emergencies/E1041")

    assert response.status_code == 200
    assert response.json()["id"] == "E1041"


def test_missing_ambulance_returns_404() -> None:
    response = client.get("/api/ambulances/A999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Ambulance A999 not found"}


def test_missing_hospital_returns_404() -> None:
    response = client.get("/api/hospitals/H999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Hospital H999 not found"}


def test_missing_emergency_returns_404() -> None:
    response = client.get("/api/emergencies/E9999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Emergency E9999 not found"}
