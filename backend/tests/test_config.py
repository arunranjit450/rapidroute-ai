import importlib
import socket

import pytest

import backend.config as config


def test_configuration_reads_google_maps_api_key(monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-key")

    settings = config.get_settings()

    assert settings.google_maps_api_key == "test-key"
    assert settings.require_google_maps_api_key() == "test-key"


def test_missing_key_raises_when_explicitly_requested(monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)

    with pytest.raises(config.ConfigurationError, match="GOOGLE_MAPS_API_KEY"):
        config.get_settings().require_google_maps_api_key()


def test_configuration_reads_tomtom_api_key(monkeypatch) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "test-tomtom-key")

    settings = config.get_settings()

    assert settings.tomtom_api_key == "test-tomtom-key"
    assert settings.require_tomtom_api_key() == "test-tomtom-key"


def test_missing_tomtom_key_raises_when_explicitly_requested(monkeypatch) -> None:
    from starlette.config import Config
    monkeypatch.setattr(config, "_config", Config(None))
    monkeypatch.delenv("TOMTOM_API_KEY", raising=False)

    with pytest.raises(config.ConfigurationError, match="TOMTOM_API_KEY"):
        config.get_settings().require_tomtom_api_key()



def test_importing_configuration_does_not_make_network_request(monkeypatch) -> None:
    def fail_network(*args, **kwargs):
        raise AssertionError("configuration import must not make network requests")

    monkeypatch.setattr(socket, "socket", fail_network)
    importlib.reload(config)

    assert config.get_settings().google_maps_api_key is None or isinstance(
        config.get_settings().google_maps_api_key, str
    )


def test_cors_origins_defaults(monkeypatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    settings = config.get_settings()
    assert settings.cors_origins == ("http://localhost:5173",)


def test_cors_origins_custom_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "http://localhost:5173, https://rapidroute.example.com ",
    )
    settings = config.get_settings()
    assert settings.cors_origins == (
        "http://localhost:5173",
        "https://rapidroute.example.com",
    )
