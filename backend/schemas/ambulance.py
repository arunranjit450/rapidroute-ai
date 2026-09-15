from pydantic import BaseModel, ConfigDict


class AmbulanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    latitude: float
    longitude: float
    status: str
    emergencyId: str | None = None
    destinationHospitalId: str | None = None
    etaMinutes: float | None = None
