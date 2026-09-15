from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.dispatch.ambulance_selector import (
    AmbulanceCandidate,
    NoAvailableAmbulanceError,
    select_ambulance,
)
from backend.dispatch.severity import normalize_severity
from backend.hospital.hospital_selector import (
    HospitalCandidate,
    NoSuitableHospitalError,
    select_hospital,
)
from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.hospital import Hospital


DEFAULT_SEVERITY = "medium"


def generate_emergency_id(session: Session) -> str:
    emergency_ids = session.scalars(select(Emergency.id)).all()
    numeric_ids = [
        int(emergency_id[1:])
        for emergency_id in emergency_ids
        if emergency_id.startswith("E") and emergency_id[1:].isdigit()
    ]
    return f"E{max(numeric_ids, default=0) + 1:04d}"


def create_and_dispatch_emergency(
    session: Session,
    emergency_type: str,
    latitude: float,
    longitude: float,
    severity: str | None,
) -> Emergency:
    try:
        normalized_severity = normalize_severity(severity or DEFAULT_SEVERITY)
        emergency = Emergency(
            id=generate_emergency_id(session),
            type=emergency_type.strip().lower(),
            severity=normalized_severity,
            latitude=latitude,
            longitude=longitude,
            ambulanceId=None,
            hospitalId=None,
            status="pending",
        )
        session.add(emergency)

        ambulances = session.scalars(select(Ambulance)).all()
        ambulance_selection = select_ambulance(
            (latitude, longitude),
            normalized_severity,
            [
                AmbulanceCandidate(
                    ambulanceId=ambulance.id,
                    latitude=ambulance.latitude,
                    longitude=ambulance.longitude,
                    status=ambulance.status,
                )
                for ambulance in ambulances
            ],
        )

        hospitals = session.scalars(select(Hospital)).all()
        hospital_selection = select_hospital(
            emergency.type,
            (latitude, longitude),
            [
                HospitalCandidate(
                    hospitalId=hospital.id,
                    name=hospital.name,
                    latitude=hospital.latitude,
                    longitude=hospital.longitude,
                    capabilities=tuple(hospital.capabilities),
                    availableBeds=hospital.availableBeds,
                    emergencyAvailable=hospital.emergencyAvailable,
                )
                for hospital in hospitals
            ],
        )

        selected_ambulance = next(
            ambulance
            for ambulance in ambulances
            if ambulance.id == ambulance_selection.selected.ambulanceId
        )
        emergency.ambulanceId = selected_ambulance.id
        emergency.hospitalId = hospital_selection.selected.hospitalId
        emergency.status = "assigned"
        selected_ambulance.emergencyId = emergency.id
        selected_ambulance.destinationHospitalId = emergency.hospitalId
        selected_ambulance.status = "en_route"

        session.commit()
        session.refresh(emergency)
        return emergency
    except Exception:
        session.rollback()
        raise
