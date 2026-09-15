from backend.database.database import Base, engine
from backend.models import ambulance, emergency, hospital, route


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
