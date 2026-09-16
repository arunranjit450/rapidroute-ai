from fastapi.testclient import TestClient

from backend.database.seed import HOSPITALS
from backend.hospital.hospital_selector import HospitalCandidate, select_hospital
from backend.main import app


client = TestClient(app)


def test_list_ambulances() -> None:
    response = client.get("/api/ambulances")

    assert response.status_code == 200
    assert len(response.json()) == 5


def test_list_hospitals() -> None:
    response = client.get("/api/hospitals")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(HOSPITALS)
    assert len(data) == 14

    returned_ids = [item["id"] for item in data]
    expected_ids = [item["id"] for item in HOSPITALS]
    assert returned_ids == expected_ids


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


def test_get_newly_seeded_hospitals() -> None:
    for hospital_id in ["H006", "H007", "H014"]:
        response = client.get(f"/api/hospitals/{hospital_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == hospital_id
        assert isinstance(data["name"], str)
        assert isinstance(data["capabilities"], list)
        assert isinstance(data["availableBeds"], int)
        assert isinstance(data["emergencyAvailable"], bool)


def test_hospital_selection_with_expanded_seed_dataset() -> None:
    response = client.get("/api/hospitals")
    assert response.status_code == 200
    hospitals_data = response.json()

    candidates = [
        HospitalCandidate(
            hospitalId=item["id"],
            name=item["name"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            capabilities=tuple(item["capabilities"]),
            availableBeds=item["availableBeds"],
            emergencyAvailable=item["emergencyAvailable"],
        )
        for item in hospitals_data
    ]

    # Test cardiac emergency near Edappally (near H006)
    cardiac_selection = select_hospital("cardiac", (10.0320, 76.2955), candidates)
    assert cardiac_selection.selected.hospitalId == "H006"
    assert "cardiac" in [h for h in candidates if h.hospitalId == "H006"][0].capabilities

    # Test trauma emergency near Fort Kochi (near H010)
    trauma_selection = select_hospital("trauma", (9.9630, 76.2440), candidates)
    assert trauma_selection.selected.hospitalId == "H010"

    # Test stroke emergency near Kakkanad (near H008)
    stroke_selection = select_hospital("stroke", (10.0160, 76.3420), candidates)
    assert stroke_selection.selected.hospitalId == "H008"

