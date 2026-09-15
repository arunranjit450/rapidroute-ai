from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.dispatch.ambulance_selector import NoAvailableAmbulanceError
from backend.hospital.hospital_selector import NoSuitableHospitalError
from backend.models.emergency import Emergency
from backend.schemas.emergency import EmergencyCreateRequest, EmergencyResponse
from backend.services.emergency_service import create_and_dispatch_emergency


router = APIRouter(prefix="/api/emergencies", tags=["emergencies"])


@router.post("", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
def create_emergency(
    request: EmergencyCreateRequest, db: Session = Depends(get_db)
) -> Emergency:
    try:
        return create_and_dispatch_emergency(
            db,
            request.type,
            request.latitude,
            request.longitude,
            request.severity,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except NoAvailableAmbulanceError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except NoSuitableHospitalError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.get("", response_model=list[EmergencyResponse])
def list_emergencies(db: Session = Depends(get_db)) -> list[Emergency]:
    return db.query(Emergency).order_by(Emergency.id).all()


@router.get("/{id}", response_model=EmergencyResponse)
def get_emergency(id: str, db: Session = Depends(get_db)) -> Emergency:
    emergency = db.get(Emergency, id)
    if emergency is None:
        raise HTTPException(status_code=404, detail=f"Emergency {id} not found")
    return emergency
