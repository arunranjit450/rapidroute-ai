import json
import re
from collections.abc import Callable
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend import config
from backend.routing.provider import (
    GeoPoint,
    RouteCandidate,
    RouteProvider,
    RouteRequest,
    RouteResult,
)


GOOGLE_ROUTES_ENDPOINT = (
    "https://routes.googleapis.com/directions/v2:computeRoutes"
)

FIELD_MASK = (
    "routes.duration,"
    "routes.distanceMeters,"
    "routes.polyline.encodedPolyline"
)

DEFAULT_TIMEOUT_SECONDS = 10.0
DURATION_PATTERN = re.compile(r"^(\d+(?:\.\d{1,9})?)s$")


class GoogleRoutesError(RuntimeError):
    """Raised when Google Routes cannot provide a valid route."""


class GoogleRoutesProvider(RouteProvider):
    def __init__(
        self,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        urlopen_callable: Callable[..., Any] = urlopen,
    ) -> None:
        self._timeout_seconds = timeout_seconds
        self._urlopen = urlopen_callable

    def calculate_route(self, request: RouteRequest) -> RouteResult:
        """
        Calculate the primary Google route.

        This preserves the original Step 20 API while internally using
        the first candidate returned by Google.
        """
        candidates = self.calculate_routes(request)

        if not candidates:
            raise GoogleRoutesError(
                "Google Routes response contained no valid routes"
            )

        first = candidates[0]

        return RouteResult(
            distanceKm=first.distanceKm,
            etaMinutes=first.etaMinutes,
            coordinates=first.coordinates,
        )

    def calculate_routes(
        self,
        request: RouteRequest,
    ) -> tuple[RouteCandidate, ...]:
        """
        Calculate the primary route plus Google-provided alternatives.
        """
        try:
            api_key = (
                config.get_settings()
                .require_google_maps_api_key()
            )
        except config.ConfigurationError as error:
            raise GoogleRoutesError(str(error)) from error

        http_request = Request(
            GOOGLE_ROUTES_ENDPOINT,
            data=json.dumps(
                self._request_body(request)
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            method="POST",
        )

        try:
            with self._urlopen(
                http_request,
                timeout=self._timeout_seconds,
            ) as response:
                status_code = response.getcode()
                response_body = (
                    response.read().decode("utf-8")
                )

        except HTTPError as error:
            raise GoogleRoutesError(
                f"Google Routes returned HTTP {error.code}"
            ) from error

        except (URLError, OSError) as error:
            raise GoogleRoutesError(
                "Google Routes request failed"
            ) from error

        if not 200 <= status_code < 300:
            raise GoogleRoutesError(
                f"Google Routes returned HTTP {status_code}"
            )

        try:
            payload = json.loads(response_body)
        except json.JSONDecodeError as error:
            raise GoogleRoutesError(
                "Google Routes returned invalid JSON"
            ) from error

        return self._parse_routes(payload)

    @staticmethod
    def _request_body(
        request: RouteRequest,
    ) -> dict[str, object]:
        return {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": request.origin.latitude,
                        "longitude": request.origin.longitude,
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": request.destination.latitude,
                        "longitude": request.destination.longitude,
                    }
                }
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": True,
            "units": "METRIC",
        }

    @classmethod
    def _parse_routes(
        cls,
        payload: object,
    ) -> tuple[RouteCandidate, ...]:
        if not isinstance(payload, dict):
            raise GoogleRoutesError(
                "Google Routes returned a malformed response"
            )

        routes = payload.get("routes")

        if not isinstance(routes, list) or not routes:
            raise GoogleRoutesError(
                "Google Routes response contained no routes"
            )

        candidates: list[RouteCandidate] = []

        for route_index, route in enumerate(routes):
            try:
                candidates.append(
                    cls._parse_route_candidate(
                        route,
                        route_index,
                    )
                )
            except ValueError as error:
                raise GoogleRoutesError(
                    str(error)
                ) from error

        if not candidates:
            raise GoogleRoutesError(
                "Google Routes response contained no valid routes"
            )

        return tuple(candidates)

    @staticmethod
    def _parse_route_candidate(
        route: object,
        route_index: int,
    ) -> RouteCandidate:
        if not isinstance(route, dict):
            raise ValueError(
                "Google Routes returned a malformed route"
            )

        distance_meters = route.get("distanceMeters")
        duration = route.get("duration")
        polyline = route.get("polyline")

        if (
            isinstance(distance_meters, bool)
            or not isinstance(
                distance_meters,
                (int, float),
            )
            or distance_meters < 0
            or not isinstance(duration, str)
            or not isinstance(polyline, dict)
        ):
            raise ValueError(
                "Google Routes returned a malformed route"
            )

        encoded_polyline = polyline.get(
            "encodedPolyline"
        )

        if (
            not isinstance(
                encoded_polyline,
                str,
            )
            or not encoded_polyline
        ):
            raise ValueError(
                "Google Routes returned a missing or malformed polyline"
            )

        eta_minutes = parse_duration_minutes(duration)
        coordinates = decode_polyline(encoded_polyline)

        return RouteCandidate(
            routeIndex=route_index,
            distanceKm=distance_meters / 1000,
            etaMinutes=eta_minutes,
            coordinates=coordinates,
        )


def parse_duration_minutes(
    duration: str,
) -> float:
    match = DURATION_PATTERN.fullmatch(duration)

    if match is None:
        raise ValueError(
            f"Malformed Google Routes duration: {duration!r}"
        )

    try:
        seconds = Decimal(match.group(1))
    except InvalidOperation as error:
        raise ValueError(
            f"Malformed Google Routes duration: {duration!r}"
        ) from error

    return float(
        seconds / Decimal(60)
    )


def decode_polyline(
    encoded_polyline: str,
) -> tuple[GeoPoint, ...]:
    if not encoded_polyline:
        raise ValueError(
            "Google Routes returned a missing or malformed polyline"
        )

    index = 0
    latitude = 0
    longitude = 0
    coordinates: list[GeoPoint] = []

    while index < len(encoded_polyline):
        latitude_delta, index = _decode_polyline_value(
            encoded_polyline,
            index,
        )

        longitude_delta, index = _decode_polyline_value(
            encoded_polyline,
            index,
        )

        latitude += latitude_delta
        longitude += longitude_delta

        coordinates.append(
            GeoPoint(
                latitude=latitude / 100000,
                longitude=longitude / 100000,
            )
        )

    if not coordinates:
        raise ValueError(
            "Google Routes returned a malformed polyline"
        )

    return tuple(coordinates)


def _decode_polyline_value(
    encoded_polyline: str,
    index: int,
) -> tuple[int, int]:
    result = 0
    shift = 0

    while True:
        if index >= len(encoded_polyline):
            raise ValueError(
                "Google Routes returned a malformed polyline"
            )

        value = ord(
            encoded_polyline[index]
        ) - 63

        index += 1

        if value < 0:
            raise ValueError(
                "Google Routes returned a malformed polyline"
            )

        result |= (
            value & 0x1F
        ) << shift

        shift += 5

        if shift > 60:
            raise ValueError(
                "Google Routes returned a malformed polyline"
            )

        if value < 0x20:
            break

    return (
        -(result >> 1) - 1
        if result & 1
        else result >> 1,
        index,
    )