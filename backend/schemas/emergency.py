from pydantic import BaseModel, ConfigDict


class EmergencyCreateRequest(BaseModel):
    type: str
    latitude: float
    longitude: float
    severity: str | None = None


class EmergencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    severity: str
    latitude: float
    longitude: float
    ambulanceId: str | None = None
    hospitalId: str | None = None
    status: str
