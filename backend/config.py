from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from starlette.config import Config


GOOGLE_MAPS_API_KEY_ENV = "GOOGLE_MAPS_API_KEY"
TOMTOM_API_KEY_ENV = "TOMTOM_API_KEY"
CORS_ORIGINS_ENV = "CORS_ORIGINS"
DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)

_DOTENV_PATH = Path(__file__).resolve().parent.parent / ".env"
_config = Config(_DOTENV_PATH if _DOTENV_PATH.is_file() else None)


class ConfigurationError(ValueError):
    """Raised when explicitly requested configuration is unavailable."""


@dataclass(frozen=True)
class Settings:
    google_maps_api_key: str | None = None
    tomtom_api_key: str | None = None
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS

    def require_google_maps_api_key(self) -> str:
        if not self.google_maps_api_key:
            raise ConfigurationError(
                f"{GOOGLE_MAPS_API_KEY_ENV} is required for Google Routes integration"
            )
        return self.google_maps_api_key

    def require_tomtom_api_key(self) -> str:
        if not self.tomtom_api_key:
            raise ConfigurationError(
                f"{TOMTOM_API_KEY_ENV} is required for TomTom Routes integration"
            )
        return self.tomtom_api_key


def get_settings(config_source: Optional[Config] = None) -> Settings:
    """Read local settings without validating or contacting external services."""
    cfg = config_source if config_source is not None else _config

    raw_cors = cfg(CORS_ORIGINS_ENV, default=None)
    if raw_cors is not None:
        origins = tuple(
            origin.strip()
            for origin in raw_cors.split(",")
            if origin.strip()
        )
    else:
        origins = DEFAULT_CORS_ORIGINS

    return Settings(
        google_maps_api_key=cfg(GOOGLE_MAPS_API_KEY_ENV, default=None),
        tomtom_api_key=cfg(TOMTOM_API_KEY_ENV, default=None),
        cors_origins=origins,
    )

