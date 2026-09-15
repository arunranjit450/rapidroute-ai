from sqlalchemy import Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.database import Base


class Route(Base):
    __tablename__ = "routes"

    routeId: Mapped[str] = mapped_column(String, primary_key=True)
    ambulanceId: Mapped[str] = mapped_column(String, nullable=False)
    hospitalId: Mapped[str] = mapped_column(String, nullable=False)
    distanceKm: Mapped[float] = mapped_column(Float, nullable=False)
    etaMinutes: Mapped[float] = mapped_column(Float, nullable=False)
    trafficLevel: Mapped[str] = mapped_column(String, nullable=False)
    coordinates: Mapped[list[dict[str, float]]] = mapped_column(JSON, nullable=False)
