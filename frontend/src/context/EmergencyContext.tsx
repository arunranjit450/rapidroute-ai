import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Emergency,
  Ambulance,
  Hospital,
  AdaptedRoute,
  AdaptedRouteCandidate,
} from '../types';
import { MOCK_EMERGENCIES, MOCK_AMBULANCES, MOCK_HOSPITALS } from '../mock';
import {
  fetchEmergencies,
  fetchAmbulances,
  fetchHospitals,
  fetchRoute,
  fetchRouteCandidates,
  rerouteEmergency,
  ApiError,
} from '../services/api';

interface DispatchSettings {
  autoDispatch: boolean;
  priorityRouting: boolean;
  emergencyAlerts: boolean;
}

interface MapSettings {
  showAmbulances: boolean;
  showHospitals: boolean;
  showEmergencyMarkers: boolean;
}

interface NotificationSettings {
  criticalEmergencyAlerts: boolean;
  trafficIncidentAlerts: boolean;
}

interface EmergencyContextType {
  // Existing state
  emergencies: Emergency[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  selectedEmergencyId: string | null;
  setSelectedEmergencyId: (id: string | null) => void;
  isRerouted: boolean;
  setIsRerouted: (rerouted: boolean) => void;
  isRerouting: boolean;
  triggerReroute: () => Promise<void>;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  selectedEmergency: Emergency | undefined;
  rawSelectedEmergency: Emergency | undefined;
  assignedAmbulance: Ambulance | undefined;
  destinationHospital: Hospital | undefined;
  dispatchSettings: DispatchSettings;
  setDispatchSettings: React.Dispatch<React.SetStateAction<DispatchSettings>>;
  mapSettings: MapSettings;
  setMapSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;

  // Integration Batch 2 State
  currentRouteId: string | null;
  setCurrentRouteId: (id: string | null) => void;
  candidateRoutes: AdaptedRouteCandidate[];
  activeRoute: AdaptedRoute | null;
  isLoadingRoute: boolean;
  routeError: string | null;
  rerouteMessage: string | null;
  isFallbackMode: boolean;
  apiError: string | null;
  refreshData: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Operational Data State
  const [emergencies, setEmergencies] = useState<Emergency[]>(MOCK_EMERGENCIES);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(MOCK_AMBULANCES);
  const [hospitals, setHospitals] = useState<Hospital[]>(MOCK_HOSPITALS);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);

  // Route & Candidate State (Tasks 3, 4, 5, 6)
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<AdaptedRoute | null>(null);
  const [candidateRoutes, setCandidateRoutes] = useState<AdaptedRouteCandidate[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [rerouteMessage, setRerouteMessage] = useState<string | null>(null);

  // UI Interactive State
  const [isRerouted, setIsRerouted] = useState<boolean>(false);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Backend Integration Status State
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Ref tracking to prevent stale state in effects and prevent infinite loops
  const emergenciesRef = useRef<Emergency[]>(emergencies);
  emergenciesRef.current = emergencies;
  const ambulancesRef = useRef<Ambulance[]>(ambulances);
  ambulancesRef.current = ambulances;

  // Settings State
  const [dispatchSettings, setDispatchSettings] = useState<DispatchSettings>({
    autoDispatch: true,
    priorityRouting: true,
    emergencyAlerts: true,
  });

  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showAmbulances: true,
    showHospitals: true,
    showEmergencyMarkers: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    criticalEmergencyAlerts: true,
    trafficIncidentAlerts: true,
  });

  // Task 1: Load Initial Data from Live Backend
  const loadInitialData = useCallback(async () => {
    let hadError = false;
    let loadedEmergencies: Emergency[] = [];

    try {
      const liveEmergencies = await fetchEmergencies();
      if (Array.isArray(liveEmergencies) && liveEmergencies.length > 0) {
        setEmergencies(liveEmergencies);
        emergenciesRef.current = liveEmergencies;
        loadedEmergencies = liveEmergencies;
      } else {
        console.info('[EmergencyContext] Backend returned 0 emergencies, retaining fallback data.');
        loadedEmergencies = MOCK_EMERGENCIES;
      }
    } catch (err) {
      hadError = true;
      const msg = err instanceof ApiError ? `Emergencies API ${err.status}: ${err.message}` : String(err);
      console.warn('[EmergencyContext] Failed to load emergencies from backend, falling back to mock:', err);
      setApiError(msg);
      loadedEmergencies = MOCK_EMERGENCIES;
    }

    try {
      const liveAmbulances = await fetchAmbulances();
      if (Array.isArray(liveAmbulances) && liveAmbulances.length > 0) {
        setAmbulances(liveAmbulances);
        ambulancesRef.current = liveAmbulances;
      }
    } catch (err) {
      hadError = true;
      console.warn('[EmergencyContext] Failed to load ambulances from backend:', err);
    }

    try {
      const liveHospitals = await fetchHospitals();
      if (Array.isArray(liveHospitals) && liveHospitals.length > 0) {
        setHospitals(liveHospitals);
      }
    } catch (err) {
      hadError = true;
      console.warn('[EmergencyContext] Failed to load hospitals from backend:', err);
    }

    setIsFallbackMode(hadError);
    if (!hadError) {
      setApiError(null);
    }

    // Set initial selected emergency
    setSelectedEmergencyId((prevId) => {
      if (prevId && loadedEmergencies.some((e) => e.id === prevId)) {
        return prevId;
      }
      return loadedEmergencies[0]?.id || null;
    });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Tasks 2, 3, 4, 5, 6, 10: Fetch Route & Candidate Routes for Selected Emergency
  useEffect(() => {
    if (!selectedEmergencyId) {
      setCurrentRouteId(null);
      setActiveRoute(null);
      setCandidateRoutes([]);
      setIsRerouted(false);
      setRouteError(null);
      setRerouteMessage(null);
      return;
    }

    let isCancelled = false;

    // Task 10: Clear stale route/candidate/reroute state before loading new emergency
    setIsRerouted(false);
    setCurrentRouteId(null);
    setActiveRoute(null);
    setCandidateRoutes([]);
    setRouteError(null);
    setRerouteMessage(null);
    setIsLoadingRoute(true);

    const targetEmergency = emergenciesRef.current.find((e) => e.id === selectedEmergencyId);
    const ambId = targetEmergency?.ambulanceId || targetEmergency?.assignedAmbulanceId;
    const hospId = targetEmergency?.hospitalId || targetEmergency?.destinationHospitalId;

    if (!ambId || !hospId) {
      setIsLoadingRoute(false);
      return;
    }

    // Request primary route and candidate routes concurrently
    Promise.allSettled([
      fetchRoute(ambId, selectedEmergencyId),
      fetchRouteCandidates(ambId, selectedEmergencyId),
    ]).then(([routeRes, candidatesRes]) => {
      if (isCancelled) return;
      setIsLoadingRoute(false);

      if (routeRes.status === 'fulfilled') {
        const routeData = routeRes.value;
        // Task 3: Store current routeId
        setCurrentRouteId(routeData.routeId);
        setActiveRoute(routeData);

        // Task 4: Update emergency with route details
        setEmergencies((prev) =>
          prev.map((emg) =>
            emg.id === selectedEmergencyId
              ? {
                  ...emg,
                  routeId: routeData.routeId,
                  routeCoords: routeData.routeCoords,
                  eta: routeData.eta ?? emg.eta,
                  distance: routeData.distance ?? emg.distance,
                  trafficCondition: routeData.trafficCondition ?? emg.trafficCondition,
                  aiReasoning: routeData.aiReasoning ?? emg.aiReasoning,
                }
              : emg
          )
        );
      } else {
        const err = routeRes.reason;
        console.warn(`[EmergencyContext] Route fetch failed for ${selectedEmergencyId}:`, err);
        const errMsg = err instanceof ApiError ? err.message : String(err);
        setRouteError(errMsg);

        // Preserve mock/existing route coordinates if available so UI map does not go blank
        if (targetEmergency?.routeId) {
          setCurrentRouteId(targetEmergency.routeId);
        }
      }

      if (candidatesRes.status === 'fulfilled') {
        // Task 5: Store all candidate routes preserving backend order/ranking
        setCandidateRoutes(candidatesRes.value);
      } else {
        console.warn(
          `[EmergencyContext] Candidate routes fetch failed for ${selectedEmergencyId}:`,
          candidatesRes.reason
        );
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedEmergencyId]);

  // Handle ESC key for modal details
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDetailsOpen(false);
    };
    if (isDetailsOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDetailsOpen]);

  // Tasks 7, 8, 9: Trigger Reroute using (ambulanceId, currentRouteId)
  const triggerReroute = async () => {
    if (!selectedEmergencyId) return;

    const targetEmergency = emergenciesRef.current.find((e) => e.id === selectedEmergencyId);
    const ambId =
      targetEmergency?.ambulanceId ||
      targetEmergency?.assignedAmbulanceId ||
      ambulancesRef.current[0]?.id;

    const activeRouteId = currentRouteId || targetEmergency?.routeId;

    if (!ambId || !activeRouteId) {
      console.warn('[EmergencyContext] Cannot reroute: missing ambulanceId or currentRouteId', {
        ambulanceId: ambId,
        currentRouteId: activeRouteId,
      });
      setRerouteMessage('Cannot reroute: no active route ID assigned.');
      return;
    }

    setIsRerouting(true);
    setRerouteMessage(null);

    try {
      // Task 7: Call rerouteEmergency(ambulanceId, currentRouteId)
      const rerouteResult = await rerouteEmergency(ambId, activeRouteId);

      // Tasks 8 & 9: Accepted vs Rejected Reroute
      if (rerouteResult.timeSavedMinutes > 0) {
        // Task 8: ACCEPTED REROUTE
        setEmergencies((prevEmergencies) =>
          prevEmergencies.map((emg) =>
            emg.id === selectedEmergencyId
              ? {
                  ...emg,
                  alternativeRoute: {
                    routeCoords: rerouteResult.routeCoords,
                    eta: rerouteResult.eta,
                    distance: emg.distance ?? '4.2 km',
                    trafficCondition: rerouteResult.trafficCondition,
                    aiReasoning: rerouteResult.reason,
                    timeSaved: rerouteResult.timeSaved,
                    previousEtaMinutes: rerouteResult.previousEtaMinutes,
                    newEtaMinutes: rerouteResult.newEtaMinutes,
                    timeSavedMinutes: rerouteResult.timeSavedMinutes,
                    reason: rerouteResult.reason,
                    coordinates: rerouteResult.coordinates,
                  },
                }
              : emg
          )
        );
        setIsRerouted(true);
        setRerouteMessage(`Detour active: saved ${rerouteResult.timeSaved} (${rerouteResult.reason})`);
      } else {
        // Task 9: REJECTED REROUTE
        // Keep current route unchanged, coordinates unchanged, ETA unchanged
        setIsRerouted(false);
        setRerouteMessage(
          rerouteResult.reason || 'No meaningful ETA improvement. Primary route maintained.'
        );
        console.info('[EmergencyContext] Reroute rejected: No meaningful ETA improvement');
      }
    } catch (err) {
      console.warn(`[EmergencyContext] API reroute for ${selectedEmergencyId} failed:`, err);
      const errMsg = err instanceof ApiError ? err.message : 'Reroute calculation unavailable';
      setRerouteMessage(errMsg);
    } finally {
      setIsRerouting(false);
    }
  };

  const rawSelectedEmergency = emergencies.find((e) => e.id === selectedEmergencyId);
  const selectedEmergency =
    isRerouted && rawSelectedEmergency?.alternativeRoute
      ? { ...rawSelectedEmergency, ...rawSelectedEmergency.alternativeRoute }
      : rawSelectedEmergency;

  const assignedAmbulance = ambulances.find(
    (a) => a.id === (selectedEmergency?.ambulanceId || selectedEmergency?.assignedAmbulanceId)
  );
  const destinationHospital = hospitals.find(
    (h) => h.id === (selectedEmergency?.hospitalId || selectedEmergency?.destinationHospitalId)
  );

  return (
    <EmergencyContext.Provider
      value={{
        emergencies,
        ambulances,
        hospitals,
        selectedEmergencyId,
        setSelectedEmergencyId,
        isRerouted,
        setIsRerouted,
        isRerouting,
        triggerReroute,
        isDetailsOpen,
        setIsDetailsOpen,
        selectedEmergency,
        rawSelectedEmergency,
        assignedAmbulance,
        destinationHospital,
        dispatchSettings,
        setDispatchSettings,
        mapSettings,
        setMapSettings,
        notificationSettings,
        setNotificationSettings,
        // Batch 2 properties
        currentRouteId,
        setCurrentRouteId,
        candidateRoutes,
        activeRoute,
        isLoadingRoute,
        routeError,
        rerouteMessage,
        isFallbackMode,
        apiError,
        refreshData: loadInitialData,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergencyContext = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergencyContext must be used within an EmergencyProvider');
  }
  return context;
};
