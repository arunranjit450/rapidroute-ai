import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { KOCHI_CENTER } from '../mock';
import { useEmergencyContext } from '../context/EmergencyContext';

// Fix for default icons when using leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons to differentiate types
const createCustomIcon = (color: string, className?: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: className || '',
  });
};

const icons = {
  ambulance: createCustomIcon('blue'),
  ambulanceSelected: createCustomIcon('violet'), // highlight selected
  hospital: createCustomIcon('green'),
  hospitalSelected: createCustomIcon('yellow'),
  emergency: createCustomIcon('red'),
  emergencySelected: createCustomIcon('orange', 'leaflet-selected-marker')
};

function isValidRouteCoords(coords: unknown): coords is [number, number][] {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  return coords.every(
    (pt) =>
      Array.isArray(pt) &&
      pt.length >= 2 &&
      typeof pt[0] === 'number' &&
      !isNaN(pt[0]) &&
      typeof pt[1] === 'number' &&
      !isNaN(pt[1])
  );
}

function MapController({ selectedEmergencyId, isRerouted }: { selectedEmergencyId: string | null, isRerouted?: boolean }) {
  const map = useMap();
  const { emergencies } = useEmergencyContext();
  
  useEffect(() => {
    // Invalidate size on mount to ensure Leaflet recalculates dimensions after layout calculation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    map.invalidateSize();
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedEmergencyId) {
      const emg = emergencies.find(e => e.id === selectedEmergencyId);
      if (emg) {
        const routeCoords = isRerouted && emg.alternativeRoute ? emg.alternativeRoute.routeCoords : emg.routeCoords;
        if (isValidRouteCoords(routeCoords)) {
          const bounds = L.latLngBounds(routeCoords);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else if (emg.pos && Array.isArray(emg.pos) && emg.pos.length === 2) {
          map.flyTo(emg.pos, 14);
        }
      }
    }
  }, [selectedEmergencyId, isRerouted, map, emergencies]);
  
  return null;
}

interface LiveMapProps {
  selectedEmergencyId: string | null;
  onSelectEmergency: (id: string) => void;
  isRerouted?: boolean;
}

export default function LiveMap({ selectedEmergencyId, onSelectEmergency, isRerouted }: LiveMapProps) {
  const {
    mapSettings,
    ambulances,
    hospitals,
    emergencies,
    selectedEmergency,
    rawSelectedEmergency,
    candidateRoutes,
  } = useEmergencyContext();

  const routeToDraw = (isRerouted && rawSelectedEmergency?.alternativeRoute) 
    ? rawSelectedEmergency.alternativeRoute.routeCoords 
    : (selectedEmergency?.routeCoords || []);

  return (
    <div className="w-full h-full relative z-0 min-h-[400px]">
      <MapContainer 
        center={KOCHI_CENTER} 
        zoom={13} 
        className="w-full h-full bg-slate-900"
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <MapController selectedEmergencyId={selectedEmergencyId} isRerouted={isRerouted} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Alternative Candidate Route Polylines (Task 2, 3, 6) */}
        {Array.isArray(candidateRoutes) && candidateRoutes.length > 0 && candidateRoutes.map((candidate, idx) => {
          if (!isValidRouteCoords(candidate.routeCoords)) {
            return null;
          }

          const isPrimary = candidate.rank === 1 && !isRerouted;

          return (
            <Polyline
              key={`candidate-route-${candidate.routeIndex ?? idx}`}
              positions={candidate.routeCoords}
              pathOptions={{
                color: isPrimary ? '#06b6d4' : '#64748b',
                weight: isPrimary ? 3 : 2.5,
                dashArray: isPrimary ? undefined : '6, 8',
                opacity: isPrimary ? 0.45 : 0.65,
              }}
            >
              <Popup>
                <div className="font-mono text-xs p-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-700 uppercase mb-1">
                    <span>CANDIDATE #{candidate.rank}</span>
                    {isPrimary && (
                      <span className="text-[9px] bg-cyan-100 text-cyan-800 px-1 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-slate-700">ETA: <strong className="text-amber-600">{candidate.eta}</strong></div>
                  <div className="text-slate-700">Distance: <strong>{candidate.distance}</strong></div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    Backend Rank #{candidate.rank} &bull; Score: {candidate.score.toFixed(2)}
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Active Primary / Detour Route Polylines (Glow + Solid Path rendered on top) */}
        {isValidRouteCoords(routeToDraw) && (
          <>
            {/* Background Glow Polyline */}
            <Polyline 
              positions={routeToDraw} 
              pathOptions={{ 
                color: isRerouted ? '#f59e0b' : '#06b6d4', 
                weight: 10, 
                opacity: 0.35,
              }} 
            />
            {/* Foreground Route Line */}
            <Polyline 
              positions={routeToDraw} 
              pathOptions={{ 
                color: isRerouted ? '#f59e0b' : '#3b82f6', 
                weight: 4, 
                dashArray: isRerouted ? '8, 8' : undefined,
                opacity: 0.95,
              }} 
            />
          </>
        )}

        {/* Ambulances */}
        {mapSettings.showAmbulances && ambulances.map((amb) => {
          const isSelected = selectedEmergency?.assignedAmbulanceId === amb.id;
          return (
            <Marker 
              key={amb.id} 
              position={amb.pos} 
              icon={isSelected ? icons.ambulanceSelected : icons.ambulance}
            >
              <Popup>
                <div className="font-sans">
                  <strong className="text-slate-900 block">{amb.id}</strong>
                  <span className="text-slate-600 text-sm">Status: {amb.status}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Hospitals */}
        {mapSettings.showHospitals && hospitals.map((hosp) => {
          const isSelected = selectedEmergency?.destinationHospitalId === hosp.id;
          return (
            <Marker 
              key={hosp.id} 
              position={hosp.pos} 
              icon={isSelected ? icons.hospitalSelected : icons.hospital}
            >
              <Popup>
                <div className="font-sans">
                  <strong className="text-slate-900 block">{hosp.name}</strong>
                  <span className="text-slate-600 text-sm">Capability: {hosp.capability}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Emergencies */}
        {mapSettings.showEmergencyMarkers && emergencies.map((emg) => {
          const isSelected = emg.id === selectedEmergencyId;
          return (
            <Marker 
              key={emg.id} 
              position={emg.pos} 
              icon={isSelected ? icons.emergencySelected : icons.emergency}
              eventHandlers={{
                click: () => onSelectEmergency(emg.id)
              }}
            >
              <Popup>
                <div className="font-sans">
                  <strong className="text-red-600 block">{emg.type}</strong>
                  <span className="text-slate-600 text-sm">Severity: {emg.severity}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
