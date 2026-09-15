from sqlalchemy import Boolean, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    capabilities: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    availableBeds: Mapped[int] = mapped_column(Integer, nullable=False)
    emergencyAvailable: Mapped[bool] = mapped_column(Boolean, nullable=False)
