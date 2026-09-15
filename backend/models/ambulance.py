from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.database import Base


class Ambulance(Base):
    __tablename__ = "ambulances"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    emergencyId: Mapped[str | None] = mapped_column(String, nullable=True)
    destinationHospitalId: Mapped[str | None] = mapped_column(String, nullable=True)
    etaMinutes: Mapped[float | None] = mapped_column(Float, nullable=True)
