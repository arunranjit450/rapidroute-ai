from pydantic import BaseModel, ConfigDict


class HospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    latitude: float
    longitude: float
    capabilities: list[str]
    availableBeds: int
    emergencyAvailable: bool
