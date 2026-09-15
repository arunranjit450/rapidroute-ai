from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.ambulance import Ambulance
from backend.schemas.ambulance import AmbulanceResponse


router = APIRouter(prefix="/api/ambulances", tags=["ambulances"])


@router.get("", response_model=list[AmbulanceResponse])
def list_ambulances(db: Session = Depends(get_db)) -> list[Ambulance]:
    return db.query(Ambulance).order_by(Ambulance.id).all()


@router.get("/{id}", response_model=AmbulanceResponse)
def get_ambulance(id: str, db: Session = Depends(get_db)) -> Ambulance:
    ambulance = db.get(Ambulance, id)
    if ambulance is None:
        raise HTTPException(status_code=404, detail=f"Ambulance {id} not found")
    return ambulance
