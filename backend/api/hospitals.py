from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.hospital import Hospital
from backend.schemas.hospital import HospitalResponse


router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalResponse])
def list_hospitals(db: Session = Depends(get_db)) -> list[Hospital]:
    return db.query(Hospital).order_by(Hospital.id).all()


@router.get("/{id}", response_model=HospitalResponse)
def get_hospital(id: str, db: Session = Depends(get_db)) -> Hospital:
    hospital = db.get(Hospital, id)
    if hospital is None:
        raise HTTPException(status_code=404, detail=f"Hospital {id} not found")
    return hospital
