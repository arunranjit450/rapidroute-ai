import {
  Emergency,
  Ambulance,
  Hospital,
  RouteCoords,
  Coordinate,
  Route,
  RouteCandidate,
  RerouteResponse,
  BackendEmergency,
  BackendAmbulance,
  BackendHospital,
  EmergencyCreateRequest,
  AdaptedRoute,
  AdaptedRouteCandidate,
  AdaptedRerouteResponse,
} from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  endpoint: string;
  data?: unknown;

  constructor(message: string, status: number, endpoint: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.data = data;
  }
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (networkErr) {
      throw new ApiError(
        `API GET ${endpoint} network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
        0,
        endpoint
      );
    }

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        try {
          errorBody = await response.text();
        } catch {
          errorBody = null;
        }
      }
      throw new ApiError(
        `API GET ${endpoint} failed with status ${response.status}`,
        response.status,
        endpoint,
        errorBody
      );
    }

    return response.json();
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
    } catch (networkErr) {
      throw new ApiError(
        `API POST ${endpoint} network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
        0,
        endpoint
      );
    }

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        try {
          errorBody = await response.text();
        } catch {
          errorBody = null;
        }
      }
      throw new ApiError(
        `API POST ${endpoint} failed with status ${response.status}`,
        response.status,
        endpoint,
        errorBody
      );
    }

    return response.json();
  },
};

/* =========================================================================
   ADAPTER FUNCTIONS (Backend Contracts -> Frontend UI Models)
   ========================================================================= */

export function coordsToLeaflet(coords: Coordinate[]): RouteCoords {
  if (!Array.isArray(coords)) return [];
  return coords.map((c) => [c.latitude, c.longitude] as [number, number]);
}

export function formatEta(etaMinutes: number): string {
  if (typeof etaMinutes !== 'number' || isNaN(etaMinutes)) return '--';
  const rounded = Math.round(etaMinutes);
  return `${rounded} min`;
}

export function formatDistance(distanceKm: number): string {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm)) return '--';
  return `${distanceKm.toFixed(1)} km`;
}

export function normalizeSeverity(severity?: string | null): 'Critical' | 'High' | 'Medium' | 'Low' | string {
  if (!severity) return 'Medium';
  const lower = severity.toLowerCase().trim();
  switch (lower) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'moderate':
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}

export function normalizeTraffic(trafficLevel?: string | null): string {
  if (!trafficLevel) return 'LOW';
  return trafficLevel.toUpperCase();
}

export function mapBackendAmbulance(be: BackendAmbulance): Ambulance {
  return {
    id: be.id,
    status: be.status,
    pos: [be.latitude, be.longitude],
    latitude: be.latitude,
    longitude: be.longitude,
    emergencyId: be.emergencyId,
    destinationHospitalId: be.destinationHospitalId,
    etaMinutes: be.etaMinutes,
  };
}

export function mapBackendHospital(be: BackendHospital): Hospital {
  const capabilities = Array.isArray(be.capabilities) ? be.capabilities : [];
  return {
    id: be.id,
    name: be.name,
    pos: [be.latitude, be.longitude],
    latitude: be.latitude,
    longitude: be.longitude,
    capabilities,
    capability: capabilities.length > 0 ? capabilities.join(', ') : 'General Care',
    availableBeds: be.availableBeds,
    emergencyAvailable: be.emergencyAvailable,
  };
}

export function mapBackendEmergency(be: BackendEmergency): Emergency {
  return {
    id: be.id,
    type: be.type,
    severity: normalizeSeverity(be.severity),
    pos: [be.latitude, be.longitude],
    latitude: be.latitude,
    longitude: be.longitude,
    ambulanceId: be.ambulanceId,
    assignedAmbulanceId: be.ambulanceId ?? undefined,
    hospitalId: be.hospitalId,
    destinationHospitalId: be.hospitalId ?? undefined,
    status: be.status,
    timestamp: 'Active',
    locationName: `Incident Site (${be.latitude.toFixed(4)}, ${be.longitude.toFixed(4)})`,
  };
}

export function mapBackendRoute(route: Route): AdaptedRoute {
  return {
    routeId: route.routeId,
    ambulanceId: route.ambulanceId,
    hospitalId: route.hospitalId,
    distanceKm: route.distanceKm,
    etaMinutes: route.etaMinutes,
    trafficLevel: route.trafficLevel,
    coordinates: route.coordinates,
    routeCoords: coordsToLeaflet(route.coordinates),
    eta: formatEta(route.etaMinutes),
    distance: formatDistance(route.distanceKm),
    trafficCondition: normalizeTraffic(route.trafficLevel),
    aiReasoning: `Optimized route calculated via backend routing engine. Traffic level: ${route.trafficLevel}.`,
  };
}

export function mapBackendRouteCandidate(candidate: RouteCandidate): AdaptedRouteCandidate {
  return {
    routeIndex: candidate.routeIndex,
    rank: candidate.rank,
    score: candidate.score,
    distanceKm: candidate.distanceKm,
    etaMinutes: candidate.etaMinutes,
    coordinates: candidate.coordinates,
    routeCoords: coordsToLeaflet(candidate.coordinates),
    eta: formatEta(candidate.etaMinutes),
    distance: formatDistance(candidate.distanceKm),
  };
}

export function mapBackendReroute(reroute: RerouteResponse): AdaptedRerouteResponse {
  return {
    previousEtaMinutes: reroute.previousEtaMinutes,
    newEtaMinutes: reroute.newEtaMinutes,
    timeSavedMinutes: reroute.timeSavedMinutes,
    reason: reroute.reason,
    coordinates: reroute.coordinates,
    routeCoords: coordsToLeaflet(reroute.coordinates),
    eta: formatEta(reroute.newEtaMinutes),
    trafficCondition: 'MODERATE',
    aiReasoning: reroute.reason,
    timeSaved: formatEta(reroute.timeSavedMinutes),
  };
}

/* =========================================================================
   API ENDPOINTS
   ========================================================================= */

/**
 * Health check: GET /health (from backend root)
 */
export async function checkHealth(): Promise<{ status: string }> {
  const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const response = await fetch(`${rootUrl}/health`);
  if (!response.ok) {
    throw new ApiError(`Health check failed with status ${response.status}`, response.status, '/health');
  }
  return response.json();
}

/**
 * Fetch all active emergencies: GET /api/emergencies
 */
export async function fetchEmergencies(): Promise<Emergency[]> {
  const data = await apiClient.get<BackendEmergency[]>('/emergencies');
  return data.map(mapBackendEmergency);
}

/**
 * Fetch emergency by ID: GET /api/emergencies/{id}
 */
export async function fetchEmergencyById(id: string): Promise<Emergency> {
  const data = await apiClient.get<BackendEmergency>(`/emergencies/${id}`);
  return mapBackendEmergency(data);
}

/**
 * Create an emergency: POST /api/emergencies
 */
export async function createEmergency(request: EmergencyCreateRequest): Promise<Emergency> {
  const data = await apiClient.post<BackendEmergency>('/emergencies', request);
  return mapBackendEmergency(data);
}

/**
 * Fetch all ambulance units: GET /api/ambulances
 */
export async function fetchAmbulances(): Promise<Ambulance[]> {
  const data = await apiClient.get<BackendAmbulance[]>('/ambulances');
  return data.map(mapBackendAmbulance);
}

/**
 * Fetch ambulance by ID: GET /api/ambulances/{id}
 */
export async function fetchAmbulanceById(id: string): Promise<Ambulance> {
  const data = await apiClient.get<BackendAmbulance>(`/ambulances/${id}`);
  return mapBackendAmbulance(data);
}

/**
 * Fetch all medical facilities: GET /api/hospitals
 */
export async function fetchHospitals(): Promise<Hospital[]> {
  const data = await apiClient.get<BackendHospital[]>('/hospitals');
  return data.map(mapBackendHospital);
}

/**
 * Fetch hospital by ID: GET /api/hospitals/{id}
 */
export async function fetchHospitalById(id: string): Promise<Hospital> {
  const data = await apiClient.get<BackendHospital>(`/hospitals/${id}`);
  return mapBackendHospital(data);
}

/**
 * Fetch primary route details: POST /api/routes
 * Body: { ambulanceId, emergencyId }
 */
export async function fetchRoute(ambulanceId: string, emergencyId: string): Promise<AdaptedRoute>;
export async function fetchRoute(emergencyId: string): Promise<AdaptedRoute>;
export async function fetchRoute(
  ambulanceIdOrEmergencyId: string,
  emergencyId?: string
): Promise<AdaptedRoute> {
  const ambId = emergencyId ? ambulanceIdOrEmergencyId : 'AMB-101';
  const emgId = emergencyId ?? ambulanceIdOrEmergencyId;
  const data = await apiClient.post<Route>('/routes', {
    ambulanceId: ambId,
    emergencyId: emgId,
  });
  return mapBackendRoute(data);
}

/**
 * Fetch all candidate routes: POST /api/routes/candidates
 * Body: { ambulanceId, emergencyId }
 * Returns backend-ranked candidates. Frontend must NOT calculate scores or ranks.
 */
export async function fetchRouteCandidates(
  ambulanceId: string,
  emergencyId: string
): Promise<AdaptedRouteCandidate[]> {
  const data = await apiClient.post<RouteCandidate[]>('/routes/candidates', {
    ambulanceId,
    emergencyId,
  });
  return data.map(mapBackendRouteCandidate);
}

/**
 * Trigger dynamic reroute calculation: POST /api/routes/reroute
 * Body: { ambulanceId, currentRouteId }
 */
export async function rerouteEmergency(ambulanceId: string, currentRouteId: string): Promise<AdaptedRerouteResponse>;
export async function rerouteEmergency(emergencyId: string): Promise<AdaptedRerouteResponse>;
export async function rerouteEmergency(
  ambulanceIdOrEmergencyId: string,
  currentRouteId?: string
): Promise<AdaptedRerouteResponse> {
  const ambId = currentRouteId ? ambulanceIdOrEmergencyId : 'AMB-101';
  const routeId = currentRouteId ?? ambulanceIdOrEmergencyId;
  const data = await apiClient.post<RerouteResponse>('/routes/reroute', {
    ambulanceId: ambId,
    currentRouteId: routeId,
  });
  return mapBackendReroute(data);
}
