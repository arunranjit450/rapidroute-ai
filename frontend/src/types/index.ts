export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type RouteCoords = [number, number][];

export interface Ambulance {
  id: string;
  status: string;
  pos: [number, number];
  latitude?: number;
  longitude?: number;
  emergencyId?: string | null;
  destinationHospitalId?: string | null;
  etaMinutes?: number | null;
}

export interface Hospital {
  id: string;
  name: string;
  capability?: string;
  capabilities?: string[];
  pos: [number, number];
  latitude?: number;
  longitude?: number;
  availableBeds?: number;
  emergencyAvailable?: boolean;
}

export interface AlternativeRoute {
  routeCoords: RouteCoords;
  eta: string;
  distance: string;
  trafficCondition: string;
  aiReasoning: string;
  timeSaved?: string;
  previousEtaMinutes?: number;
  newEtaMinutes?: number;
  timeSavedMinutes?: number;
  reason?: string;
  coordinates?: Coordinate[];
}

export interface Emergency {
  id: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  pos: [number, number];
  latitude?: number;
  longitude?: number;
  ambulanceId?: string | null;
  hospitalId?: string | null;
  status?: string;
  assignedAmbulanceId?: string;
  destinationHospitalId?: string;
  routeId?: string;
  routeCoords?: RouteCoords;
  timestamp: string;
  locationName: string;
  eta?: string;
  distance?: string;
  trafficCondition?: string;
  aiReasoning?: string;
  alternativeRoute?: AlternativeRoute;
}

// Backend Contract Route Types

export interface Route {
  routeId: string;
  ambulanceId: string;
  hospitalId: string;
  distanceKm: number;
  etaMinutes: number;
  trafficLevel: string;
  coordinates: Coordinate[];
}

export interface RouteCandidate {
  routeIndex: number;
  rank: number;
  score: number;
  distanceKm: number;
  etaMinutes: number;
  coordinates: Coordinate[];
}

export interface RerouteResponse {
  previousEtaMinutes: number;
  newEtaMinutes: number;
  timeSavedMinutes: number;
  reason: string;
  coordinates: Coordinate[];
}

// Backend DTO Types

export interface BackendEmergency {
  id: string;
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
  ambulanceId?: string | null;
  hospitalId?: string | null;
  status: string;
}

export interface BackendAmbulance {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  emergencyId?: string | null;
  destinationHospitalId?: string | null;
  etaMinutes?: number | null;
}

export interface BackendHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capabilities: string[];
  availableBeds: number;
  emergencyAvailable: boolean;
}

// Request Types

export interface EmergencyCreateRequest {
  type: string;
  latitude: number;
  longitude: number;
  severity?: string | null;
}

export interface RouteCreateRequest {
  ambulanceId: string;
  emergencyId: string;
}

export interface RouteCandidatesRequest {
  ambulanceId: string;
  emergencyId: string;
}

export interface RerouteRequest {
  ambulanceId: string;
  currentRouteId: string;
}

// UI Adapted Route Types

export interface AdaptedRoute extends Route {
  routeCoords: RouteCoords;
  eta: string;
  distance: string;
  trafficCondition: string;
  aiReasoning: string;
}

export interface AdaptedRouteCandidate extends RouteCandidate {
  routeCoords: RouteCoords;
  eta: string;
  distance: string;
}

export interface AdaptedRerouteResponse extends RerouteResponse {
  routeCoords: RouteCoords;
  eta: string;
  distance?: string;
  trafficCondition: string;
  aiReasoning: string;
  timeSaved: string;
}
