import json
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse

import pytest

from backend.routing.provider import GeoPoint, RouteCandidate, RouteRequest
from backend.routing.tomtom_routes import (
    TomTomRoutesError,
    TomTomRoutesProvider,
)


class FakeResponse:
    def __init__(self, status_code: int, payload: object) -> None:
        self._status_code = status_code
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        return None

    def getcode(self) -> int:
        return self._status_code

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")


class RecordingUrlOpen:
    def __init__(self, response: FakeResponse) -> None:
        self.response = response
        self.request = None
        self.timeout = None

    def __call__(self, request, timeout: float):
        self.request = request
        self.timeout = timeout
        return self.response


@pytest.fixture
def route_request() -> RouteRequest:
    return RouteRequest(
        origin=GeoPoint(latitude=10.0184, longitude=76.3088),
        destination=GeoPoint(latitude=9.9816, longitude=76.2999),
    )


@pytest.fixture
def successful_tomtom_payload() -> dict[str, object]:
    return {
        "routes": [
            {
                "summary": {
                    "lengthInMeters": 5400,
                    "travelTimeInSeconds": 660,
                    "trafficDelayInSeconds": 60,
                },
                "legs": [
                    {
                        "points": [
                            {"latitude": 10.0184, "longitude": 76.3088},
                            {"latitude": 10.0000, "longitude": 76.3040},
                            {"latitude": 9.9816, "longitude": 76.2999},
                        ]
                    }
                ],
            }
        ]
    }


def test_provider_sends_traffic_aware_request_and_maps_single_route(
    monkeypatch, route_request, successful_tomtom_payload
) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")
    opener = RecordingUrlOpen(FakeResponse(200, successful_tomtom_payload))

    provider = TomTomRoutesProvider(urlopen_callable=opener)
    result = provider.calculate_route(route_request)

    assert opener.request.get_method() == "GET"
    parsed_url = urlparse(opener.request.full_url)
    assert parsed_url.netloc == "api.tomtom.com"
    assert parsed_url.path == "/routing/1/calculateRoute/10.0184,76.3088:9.9816,76.2999/json"

    query = parse_qs(parsed_url.query)
    assert query["key"] == ["mock-tomtom-api-key"]
    assert query["traffic"] == ["true"]
    assert query["maxAlternatives"] == ["2"]
    assert query["travelMode"] == ["car"]
    assert query["routeType"] == ["fastest"]

    assert result.distanceKm == 5.4
    assert result.etaMinutes == 11.0
    assert len(result.coordinates) == 3
    assert result.coordinates[0] == GeoPoint(10.0184, 76.3088)
    assert result.coordinates[-1] == GeoPoint(9.9816, 76.2999)


def test_provider_returns_multiple_alternative_route_candidates(
    monkeypatch, route_request
) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    payload = {
        "routes": [
            {
                "summary": {
                    "lengthInMeters": 6000,
                    "travelTimeInSeconds": 900,
                },
                "legs": [
                    {
                        "points": [
                            {"latitude": 10.0184, "longitude": 76.3088},
                            {"latitude": 9.9816, "longitude": 76.2999},
                        ]
                    }
                ],
            },
            {
                "summary": {
                    "lengthInMeters": 5200,
                    "travelTimeInSeconds": 720,
                },
                "legs": [
                    {
                        "points": [
                            {"latitude": 10.0184, "longitude": 76.3088},
                            {"latitude": 10.0050, "longitude": 76.3010},
                            {"latitude": 9.9816, "longitude": 76.2999},
                        ]
                    }
                ],
            },
        ]
    }

    opener = RecordingUrlOpen(FakeResponse(200, payload))
    candidates = TomTomRoutesProvider(urlopen_callable=opener).calculate_routes(
        route_request
    )

    assert len(candidates) == 2

    assert candidates[0] == RouteCandidate(
        routeIndex=0,
        distanceKm=6.0,
        etaMinutes=15.0,
        coordinates=(
            GeoPoint(10.0184, 76.3088),
            GeoPoint(9.9816, 76.2999),
        ),
    )

    assert candidates[1] == RouteCandidate(
        routeIndex=1,
        distanceKm=5.2,
        etaMinutes=12.0,
        coordinates=(
            GeoPoint(10.0184, 76.3088),
            GeoPoint(10.0050, 76.3010),
            GeoPoint(9.9816, 76.2999),
        ),
    )


def test_missing_api_key_raises_provider_error(monkeypatch, route_request) -> None:
    from starlette.config import Config
    import backend.config as config
    monkeypatch.setattr(config, "_config", Config(None))
    monkeypatch.delenv("TOMTOM_API_KEY", raising=False)

    with pytest.raises(TomTomRoutesError, match="TOMTOM_API_KEY"):
        TomTomRoutesProvider().calculate_route(route_request)


def test_http_error_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    def failing_urlopen(*args, **kwargs):
        raise HTTPError("https://api.tomtom.com", 403, "Forbidden", {}, None)

    with pytest.raises(TomTomRoutesError, match="HTTP 403"):
        TomTomRoutesProvider(urlopen_callable=failing_urlopen).calculate_route(
            route_request
        )


def test_network_failure_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    def failing_urlopen(*args, **kwargs):
        raise URLError("Network connection failed")

    with pytest.raises(TomTomRoutesError, match="request failed"):
        TomTomRoutesProvider(urlopen_callable=failing_urlopen).calculate_route(
            route_request
        )


def test_invalid_json_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    class BadJsonResponse(FakeResponse):
        def read(self) -> bytes:
            return b"<html>Not JSON</html>"

    opener = RecordingUrlOpen(BadJsonResponse(200, None))
    with pytest.raises(TomTomRoutesError, match="invalid JSON"):
        TomTomRoutesProvider(urlopen_callable=opener).calculate_route(route_request)


def test_empty_routes_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    opener = RecordingUrlOpen(FakeResponse(200, {"routes": []}))
    with pytest.raises(TomTomRoutesError, match="no routes"):
        TomTomRoutesProvider(urlopen_callable=opener).calculate_route(route_request)


@pytest.mark.parametrize(
    "payload",
    [
        {"routes": [{"summary": {"lengthInMeters": -10, "travelTimeInSeconds": 100}}]},
        {"routes": [{"summary": {"lengthInMeters": 100, "travelTimeInSeconds": -5}}]},
        {"routes": [{"summary": {"lengthInMeters": "bad", "travelTimeInSeconds": 100}}]},
        {"routes": [{"summary": {"lengthInMeters": 100, "travelTimeInSeconds": 100}, "legs": []}]},
        {
            "routes": [
                {
                    "summary": {"lengthInMeters": 100, "travelTimeInSeconds": 100},
                    "legs": [{"points": []}],
                }
            ]
        },
        {
            "routes": [
                {
                    "summary": {"lengthInMeters": 100, "travelTimeInSeconds": 100},
                    "legs": [{"points": [{"latitude": 999.0, "longitude": 0.0}]}],
                }
            ]
        },
    ],
)
def test_malformed_tomtom_payload_raises_provider_error(
    monkeypatch, route_request, payload
) -> None:
    monkeypatch.setenv("TOMTOM_API_KEY", "mock-tomtom-api-key")

    opener = RecordingUrlOpen(FakeResponse(200, payload))
    with pytest.raises(TomTomRoutesError):
        TomTomRoutesProvider(urlopen_callable=opener).calculate_route(route_request)
