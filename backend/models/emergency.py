from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.database import Base


class Emergency(Base):
    __tablename__ = "emergencies"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    ambulanceId: Mapped[str | None] = mapped_column(String, nullable=True)
    hospitalId: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
