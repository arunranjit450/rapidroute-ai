import json
from urllib.error import URLError

import pytest

from backend.routing.google_routes import (
    FIELD_MASK,
    GOOGLE_ROUTES_ENDPOINT,
    GoogleRoutesError,
    GoogleRoutesProvider,
    decode_polyline,
)
from backend.routing.provider import GeoPoint, RouteCandidate, RouteRequest


KNOWN_POLYLINE = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"


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
def successful_payload() -> dict[str, object]:
    return {
        "routes": [
            {
                "duration": "600s",
                "distanceMeters": 1234,
                "polyline": {"encodedPolyline": KNOWN_POLYLINE},
            }
        ]
    }


def test_provider_sends_google_traffic_aware_request_and_maps_response(
    monkeypatch, route_request, successful_payload
) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-api-key")
    opener = RecordingUrlOpen(FakeResponse(200, successful_payload))

    result = GoogleRoutesProvider(
        urlopen_callable=opener
    ).calculate_route(route_request)

    assert opener.request.full_url == GOOGLE_ROUTES_ENDPOINT
    assert opener.request.get_method() == "POST"
    assert opener.request.get_header("X-goog-api-key") == "test-api-key"
    assert opener.request.get_header("X-goog-fieldmask") == FIELD_MASK
    assert opener.request.get_header("Content-type") == "application/json"

    assert json.loads(opener.request.data) == {
        "origin": {
            "location": {
                "latLng": {
                    "latitude": 10.0184,
                    "longitude": 76.3088,
                }
            }
        },
        "destination": {
            "location": {
                "latLng": {
                    "latitude": 9.9816,
                    "longitude": 76.2999,
                }
            }
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": True,
        "units": "METRIC",
    }

    assert result.distanceKm == 1.234
    assert result.etaMinutes == 10.0
    assert result.coordinates[0] == GeoPoint(
        latitude=38.5,
        longitude=-120.2,
    )
    assert result.coordinates[-1] == GeoPoint(
        latitude=43.252,
        longitude=-126.453,
    )


def test_provider_returns_google_alternative_route_candidates(
    monkeypatch, route_request
) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-api-key")

    payload = {
        "routes": [
            {
                "duration": "600s",
                "distanceMeters": 1234,
                "polyline": {"encodedPolyline": KNOWN_POLYLINE},
            },
            {
                "duration": "720s",
                "distanceMeters": 1500,
                "polyline": {"encodedPolyline": KNOWN_POLYLINE},
            },
            {
                "duration": "540s",
                "distanceMeters": 1400,
                "polyline": {"encodedPolyline": KNOWN_POLYLINE},
            },
        ]
    }

    opener = RecordingUrlOpen(FakeResponse(200, payload))

    candidates = GoogleRoutesProvider(
        urlopen_callable=opener
    ).calculate_routes(route_request)

    assert candidates == (
        RouteCandidate(
            routeIndex=0,
            distanceKm=1.234,
            etaMinutes=10.0,
            coordinates=decode_polyline(KNOWN_POLYLINE),
        ),
        RouteCandidate(
            routeIndex=1,
            distanceKm=1.5,
            etaMinutes=12.0,
            coordinates=decode_polyline(KNOWN_POLYLINE),
        ),
        RouteCandidate(
            routeIndex=2,
            distanceKm=1.4,
            etaMinutes=9.0,
            coordinates=decode_polyline(KNOWN_POLYLINE),
        ),
    )

    body = json.loads(opener.request.data)

    assert body["computeAlternativeRoutes"] is True


def test_known_encoded_polyline_is_decoded() -> None:
    assert decode_polyline(KNOWN_POLYLINE) == (
        GeoPoint(latitude=38.5, longitude=-120.2),
        GeoPoint(latitude=40.7, longitude=-120.95),
        GeoPoint(latitude=43.252, longitude=-126.453),
    )


def test_missing_api_key_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)

    with pytest.raises(GoogleRoutesError, match="GOOGLE_MAPS_API_KEY"):
        GoogleRoutesProvider().calculate_route(route_request)


def test_http_failure_raises_provider_error(monkeypatch, route_request) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-api-key")

    def failing_urlopen(*args, **kwargs):
        raise URLError("offline")

    with pytest.raises(GoogleRoutesError, match="request failed"):
        GoogleRoutesProvider(
            urlopen_callable=failing_urlopen
        ).calculate_route(route_request)


def test_response_without_routes_raises_provider_error(
    monkeypatch, route_request
) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-api-key")

    opener = RecordingUrlOpen(
        FakeResponse(200, {"routes": []})
    )

    with pytest.raises(GoogleRoutesError, match="no routes"):
        GoogleRoutesProvider(
            urlopen_callable=opener
        ).calculate_route(route_request)


@pytest.mark.parametrize(
    "payload",
    [
        {
            "routes": [
                {
                    "duration": "not-a-duration",
                    "distanceMeters": 100,
                    "polyline": {
                        "encodedPolyline": KNOWN_POLYLINE
                    },
                }
            ]
        },
        {
            "routes": [
                {
                    "duration": "60s",
                    "distanceMeters": "100",
                    "polyline": {
                        "encodedPolyline": KNOWN_POLYLINE
                    },
                }
            ]
        },
        {
            "routes": [
                {
                    "duration": "60s",
                    "distanceMeters": 100,
                    "polyline": {
                        "encodedPolyline": "bad"
                    },
                }
            ]
        },
    ],
)
def test_malformed_google_response_raises_provider_error(
    monkeypatch, route_request, payload
) -> None:
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "test-api-key")

    opener = RecordingUrlOpen(
        FakeResponse(200, payload)
    )

    with pytest.raises(GoogleRoutesError):
        GoogleRoutesProvider(
            urlopen_callable=opener
        ).calculate_route(route_request)