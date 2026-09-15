from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import config
from backend.api import ambulances, emergencies, hospitals, routes
from backend.database.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(lifespan=lifespan)



settings = config.get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ambulances.router)
app.include_router(hospitals.router)
app.include_router(emergencies.router)
app.include_router(routes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}