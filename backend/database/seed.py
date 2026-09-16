from backend.database.database import SessionLocal
from backend.database.init_db import init_db
from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.hospital import Hospital


AMBULANCES = [
    {
        "id": "A101",
        "latitude": 9.9816,
        "longitude": 76.2999,
        "status": "available",
        "emergencyId": None,
        "destinationHospitalId": None,
        "etaMinutes": None,
    },
    {
        "id": "A102",
        "latitude": 9.9933,
        "longitude": 76.2921,
        "status": "en_route",
        "emergencyId": "E1042",
        "destinationHospitalId": "H001",
        "etaMinutes": 8.0,
    },
    {
        "id": "A103",
        "latitude": 10.0224,
        "longitude": 76.3117,
        "status": "busy",
        "emergencyId": "E1041",
        "destinationHospitalId": "H002",
        "etaMinutes": 12.0,
    },
    {
        "id": "A104",
        "latitude": 9.9626,
        "longitude": 76.2837,
        "status": "available",
        "emergencyId": None,
        "destinationHospitalId": None,
        "etaMinutes": None,
    },
    {
        "id": "A105",
        "latitude": 9.9468,
        "longitude": 76.3196,
        "status": "en_route",
        "emergencyId": "E1044",
        "destinationHospitalId": "H004",
        "etaMinutes": 10.0,
    },
]

HOSPITALS = [
    {
        "id": "H001",
        "name": "Ernakulam General Hospital",
        "latitude": 9.9816,
        "longitude": 76.2999,
        "capabilities": ["cardiac", "trauma", "icu"],
        "availableBeds": 12,
        "emergencyAvailable": True,
    },
    {
        "id": "H002",
        "name": "Rajagiri Hospital",
        "latitude": 10.0246,
        "longitude": 76.3162,
        "capabilities": ["cardiac", "stroke", "icu"],
        "availableBeds": 8,
        "emergencyAvailable": True,
    },
    {
        "id": "H003",
        "name": "Aster Medcity",
        "latitude": 10.0617,
        "longitude": 76.2845,
        "capabilities": ["cardiac", "trauma", "stroke", "icu"],
        "availableBeds": 15,
        "emergencyAvailable": True,
    },
    {
        "id": "H004",
        "name": "VPS Lakeshore Hospital",
        "latitude": 9.9375,
        "longitude": 76.3169,
        "capabilities": ["cardiac", "trauma", "icu"],
        "availableBeds": 6,
        "emergencyAvailable": True,
    },
    {
        "id": "H005",
        "name": "Ernakulam Medical Centre",
        "latitude": 9.9992,
        "longitude": 76.2877,
        "capabilities": ["trauma", "stroke"],
        "availableBeds": 4,
        "emergencyAvailable": False,
    },
    {
        "id": "H006",
        "name": "Amrita Hospital - Kochi (Demo)",
        "latitude": 10.0325,
        "longitude": 76.2950,
        "capabilities": ["cardiac", "trauma", "stroke", "icu"],
        "availableBeds": 14,
        "emergencyAvailable": True,
    },
    {
        "id": "H007",
        "name": "Medical Trust Hospital (Demo)",
        "latitude": 9.9654,
        "longitude": 76.2882,
        "capabilities": ["cardiac", "trauma", "icu"],
        "availableBeds": 10,
        "emergencyAvailable": True,
    },
    {
        "id": "H008",
        "name": "Sunrise Hospital - Kakkanad (Demo)",
        "latitude": 10.0159,
        "longitude": 76.3419,
        "capabilities": ["trauma", "stroke", "icu"],
        "availableBeds": 7,
        "emergencyAvailable": True,
    },
    {
        "id": "H009",
        "name": "Government Medical College - Kalamassery (Demo)",
        "latitude": 10.0548,
        "longitude": 76.3534,
        "capabilities": ["cardiac", "trauma", "icu"],
        "availableBeds": 11,
        "emergencyAvailable": True,
    },
    {
        "id": "H010",
        "name": "Fort Kochi Taluk Hospital (Demo)",
        "latitude": 9.9632,
        "longitude": 76.2443,
        "capabilities": ["trauma", "stroke"],
        "availableBeds": 5,
        "emergencyAvailable": True,
    },
    {
        "id": "H011",
        "name": "Tripunithura Taluk Hospital (Demo)",
        "latitude": 9.9495,
        "longitude": 76.3468,
        "capabilities": ["trauma", "icu"],
        "availableBeds": 6,
        "emergencyAvailable": True,
    },
    {
        "id": "H012",
        "name": "Welcare Hospital - Vyttila (Demo)",
        "latitude": 9.9698,
        "longitude": 76.3155,
        "capabilities": ["cardiac", "stroke", "icu"],
        "availableBeds": 8,
        "emergencyAvailable": True,
    },
    {
        "id": "H013",
        "name": "Aluva District Hospital (Demo)",
        "latitude": 10.1082,
        "longitude": 76.3521,
        "capabilities": ["trauma", "cardiac"],
        "availableBeds": 9,
        "emergencyAvailable": True,
    },
    {
        "id": "H014",
        "name": "Cochin Port Authority Hospital (Demo)",
        "latitude": 9.9328,
        "longitude": 76.2685,
        "capabilities": ["trauma", "stroke"],
        "availableBeds": 5,
        "emergencyAvailable": True,
    },
]

EMERGENCIES = [
    {
        "id": "E1041",
        "type": "cardiac",
        "severity": "critical",
        "latitude": 10.0184,
        "longitude": 76.3088,
        "ambulanceId": "A103",
        "hospitalId": "H002",
        "status": "assigned",
    },
    {
        "id": "E1042",
        "type": "trauma",
        "severity": "high",
        "latitude": 9.9897,
        "longitude": 76.2912,
        "ambulanceId": "A102",
        "hospitalId": "H001",
        "status": "assigned",
    },
    {
        "id": "E1043",
        "type": "stroke",
        "severity": "medium",
        "latitude": 10.0441,
        "longitude": 76.3027,
        "ambulanceId": None,
        "hospitalId": None,
        "status": "pending",
    },
    {
        "id": "E1044",
        "type": "other",
        "severity": "low",
        "latitude": 9.9508,
        "longitude": 76.3211,
        "ambulanceId": "A105",
        "hospitalId": "H004",
        "status": "assigned",
    },
]


def _upsert(session, model, values: dict) -> None:
    instance = session.get(model, values["id"])
    if instance is None:
        session.add(model(**values))
        return

    for field, value in values.items():
        setattr(instance, field, value)


def seed_database() -> None:
    init_db()
    session = SessionLocal()
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


if __name__ == "__main__":
    seed_database()
