import json
from collections.abc import Callable
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from backend import config
from backend.routing.provider import (
    GeoPoint,
    RouteCandidate,
    RouteProvider,
    RouteRequest,
    RouteResult,
)

TOMTOM_ROUTING_ENDPOINT = (
    "https://api.tomtom.com/routing/1/calculateRoute/{locations}/json"
)

DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_MAX_ALTERNATIVES = 2


class TomTomRoutesError(RuntimeError):
    """Raised when TomTom Routes cannot provide a valid route."""


class TomTomRoutesProvider(RouteProvider):
    def __init__(
        self,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        urlopen_callable: Callable[..., Any] = urlopen,
        max_alternatives: int = DEFAULT_MAX_ALTERNATIVES,
    ) -> None:
        self._timeout_seconds = timeout_seconds
        self._urlopen = urlopen_callable
        self._max_alternatives = max_alternatives

    def calculate_route(self, request: RouteRequest) -> RouteResult:
        """
        Calculate the primary TomTom route for an origin/destination pair.
        """
        candidates = self.calculate_routes(request)

        if not candidates:
            raise TomTomRoutesError(
                "TomTom Routes response contained no valid routes"
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
        Calculate the primary route plus TomTom-provided alternative candidates.
        """
        try:
            api_key = (
                config.get_settings()
                .require_tomtom_api_key()
            )
        except config.ConfigurationError as error:
            raise TomTomRoutesError(str(error)) from error

        locations = (
            f"{request.origin.latitude},{request.origin.longitude}:"
            f"{request.destination.latitude},{request.destination.longitude}"
        )

        query_params = {
            "key": api_key,
            "traffic": "true",
            "maxAlternatives": self._max_alternatives,
            "travelMode": "car",
            "routeType": "fastest",
        }

        url = f"{TOMTOM_ROUTING_ENDPOINT.format(locations=locations)}?{urlencode(query_params)}"

        http_request = Request(
            url,
            headers={
                "Accept": "application/json",
            },
            method="GET",
        )

        try:
            with self._urlopen(
                http_request,
                timeout=self._timeout_seconds,
            ) as response:
                status_code = response.getcode()
                response_body = response.read().decode("utf-8")

        except HTTPError as error:
            raise TomTomRoutesError(
                f"TomTom Routes returned HTTP {error.code}"
            ) from error

        except (URLError, OSError) as error:
            raise TomTomRoutesError(
                "TomTom Routes request failed"
            ) from error

        if not 200 <= status_code < 300:
            raise TomTomRoutesError(
                f"TomTom Routes returned HTTP {status_code}"
            )

        try:
            payload = json.loads(response_body)
        except json.JSONDecodeError as error:
            raise TomTomRoutesError(
                "TomTom Routes returned invalid JSON"
            ) from error

        return self._parse_routes(payload)

    @classmethod
    def _parse_routes(
        cls,
        payload: object,
    ) -> tuple[RouteCandidate, ...]:
        if not isinstance(payload, dict):
            raise TomTomRoutesError(
                "TomTom Routes returned a malformed response"
            )

        routes = payload.get("routes")

        if not isinstance(routes, list) or not routes:
            raise TomTomRoutesError(
                "TomTom Routes response contained no routes"
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
                raise TomTomRoutesError(
                    str(error)
                ) from error

        if not candidates:
            raise TomTomRoutesError(
                "TomTom Routes response contained no valid routes"
            )

        return tuple(candidates)

    @staticmethod
    def _parse_route_candidate(
        route: object,
        route_index: int,
    ) -> RouteCandidate:
        if not isinstance(route, dict):
            raise ValueError(
                "TomTom Routes returned a malformed route"
            )

        summary = route.get("summary")
        if not isinstance(summary, dict):
            raise ValueError(
                "TomTom Routes returned a route missing summary"
            )

        length_in_meters = summary.get("lengthInMeters")
        travel_time_in_seconds = summary.get("travelTimeInSeconds")

        if (
            isinstance(length_in_meters, bool)
            or not isinstance(length_in_meters, (int, float))
            or length_in_meters < 0
        ):
            raise ValueError(
                "TomTom Routes returned an invalid lengthInMeters"
            )

        if (
            isinstance(travel_time_in_seconds, bool)
            or not isinstance(travel_time_in_seconds, (int, float))
            or travel_time_in_seconds < 0
        ):
            raise ValueError(
                "TomTom Routes returned an invalid travelTimeInSeconds"
            )

        legs = route.get("legs")
        if not isinstance(legs, list) or not legs:
            raise ValueError(
                "TomTom Routes returned a route without legs"
            )

        coordinates: list[GeoPoint] = []

        for leg in legs:
            if not isinstance(leg, dict):
                raise ValueError(
                    "TomTom Routes returned a malformed leg"
                )

            points = leg.get("points")
            if not isinstance(points, list) or not points:
                raise ValueError(
                    "TomTom Routes returned a leg without points"
                )

            for point in points:
                if not isinstance(point, dict):
                    raise ValueError(
                        "TomTom Routes returned a malformed point"
                    )

                lat = point.get("latitude")
                lon = point.get("longitude")

                if (
                    isinstance(lat, bool)
                    or isinstance(lon, bool)
                    or not isinstance(lat, (int, float))
                    or not isinstance(lon, (int, float))
                    or not (-90.0 <= lat <= 90.0)
                    or not (-180.0 <= lon <= 180.0)
                ):
                    raise ValueError(
                        "TomTom Routes returned an invalid coordinate"
                    )

                geo_point = GeoPoint(
                    latitude=float(lat),
                    longitude=float(lon),
                )

                if not coordinates or coordinates[-1] != geo_point:
                    coordinates.append(geo_point)

        if not coordinates:
            raise ValueError(
                "TomTom Routes returned no valid coordinates"
            )

        return RouteCandidate(
            routeIndex=route_index,
            distanceKm=float(length_in_meters) / 1000.0,
            etaMinutes=float(travel_time_in_seconds) / 60.0,
            coordinates=tuple(coordinates),
        )
