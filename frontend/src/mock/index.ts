import { Ambulance, Hospital, Emergency, RouteCoords } from '../types';

export const KOCHI_CENTER: [number, number] = [9.9312, 76.2673];

export const MOCK_AMBULANCES: Ambulance[] = [
  { id: 'AMB-101', pos: [9.935, 76.260], status: 'Dispatched' },
  { id: 'AMB-102', pos: [9.920, 76.275], status: 'Available' },
  { id: 'AMB-103', pos: [9.940, 76.280], status: 'Returning' },
];

export const MOCK_HOSPITALS: Hospital[] = [
  { id: 'HSP-01', name: 'General Hospital Kochi', capability: 'Level 1 Trauma', pos: [9.950, 76.270] },
  { id: 'HSP-02', name: 'Sunrise Clinic', capability: 'Basic Care', pos: [9.925, 76.285] },
  { id: 'HSP-03', name: 'Medical Trust Hospital', capability: 'Advanced Cardiac', pos: [9.960, 76.250] },
];

const route1: RouteCoords = [
  [9.935, 76.260],
  [9.940, 76.262],
  [9.943, 76.264],
  [9.945, 76.265], // Emergency Location
  [9.947, 76.268],
  [9.950, 76.270], // Hospital Location
];

const route2: RouteCoords = [
  [9.920, 76.275],
  [9.915, 76.265],
  [9.910, 76.255], // Emergency Location
  [9.915, 76.250],
  [9.925, 76.285], // Hospital Location
];

const route1_alt: RouteCoords = [
  [9.935, 76.260],
  [9.938, 76.255], // detour
  [9.940, 76.250],
  [9.945, 76.265], // Emergency Location
  [9.948, 76.275], // detour
  [9.950, 76.270], // Hospital Location
];

export const MOCK_EMERGENCIES: Emergency[] = [
  { 
    id: 'EMG-2401', 
    type: 'Multi-vehicle Collision', 
    severity: 'Critical', 
    pos: [9.945, 76.265], 
    assignedAmbulanceId: 'AMB-101',
    destinationHospitalId: 'HSP-01',
    routeCoords: route1,
    timestamp: '2m ago',
    locationName: 'I-95 Northbound, Mile 42',
    eta: '11 min',
    distance: '4.2 km',
    trafficCondition: 'LOW',
    aiReasoning: 'General Hospital Kochi is recommended because it supports Level 1 Trauma capabilities required for this critical collision and provides a feasible low-traffic route for AMB-101.',
    alternativeRoute: {
      routeCoords: route1_alt,
      eta: '07 min',
      distance: '4.8 km',
      trafficCondition: 'MODERATE',
      timeSaved: '04 min',
      aiReasoning: 'Traffic incident detected on the current route. Alternative route selected to reduce estimated travel time.'
    }
  },
  { 
    id: 'EMG-2402', 
    type: 'Cardiac Arrest', 
    severity: 'High', 
    pos: [9.910, 76.255],
    assignedAmbulanceId: 'AMB-102',
    destinationHospitalId: 'HSP-02',
    routeCoords: route2,
    timestamp: '8m ago',
    locationName: '1240 W Elm St, Apt 4B',
    eta: '12 min',
    distance: '6.5 km',
    trafficCondition: 'MODERATE',
    aiReasoning: 'Sunrise Clinic is selected as it is the nearest available facility providing basic life support necessary for this emergency, with AMB-102 currently available on a moderate-traffic route.'
  },
];
