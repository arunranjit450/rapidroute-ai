import { useState } from 'react';
import { useEmergencyContext } from '../context/EmergencyContext';
import CommandCenterHero from '../components/CommandCenter/CommandCenterHero';
import LiveResponseMatrix from '../components/CommandCenter/LiveResponseMatrix';
import IncidentIntelligence from '../components/CommandCenter/IncidentIntelligence';
import AIRouteIntelligence from '../components/CommandCenter/AIRouteIntelligence';
import OperationalActions from '../components/CommandCenter/OperationalActions';
import DispatchSimulation from '../components/DispatchSimulation';

export default function Dashboard() {
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  const {
    emergencies,
    selectedEmergencyId,
    setSelectedEmergencyId,
    isRerouted,
    setIsRerouted,
    isRerouting,
    triggerReroute,
    setIsDetailsOpen,
    selectedEmergency,
    rawSelectedEmergency,
    assignedAmbulance,
    destinationHospital,
    hospitals,
    ambulances,
    currentRouteId,
  } = useEmergencyContext();

  return (
    <div className="min-h-full max-w-7xl mx-auto space-y-6 pb-12 select-none font-mono animate-fade-in">
      {/* SECTION 00 — OPERATIONAL INTRO */}
      <CommandCenterHero />

      {/* SECTION 01 — LIVE RESPONSE MATRIX (Immersive Map Viewport) */}
      <LiveResponseMatrix
        selectedEmergencyId={selectedEmergencyId}
        onSelectEmergency={setSelectedEmergencyId}
        isRerouted={isRerouted}
        selectedEmergency={selectedEmergency}
      />

      {/* SECTION 02 — INCIDENT INTELLIGENCE */}
      <IncidentIntelligence
        emergencies={emergencies}
        selectedEmergencyId={selectedEmergencyId}
        onSelectEmergency={setSelectedEmergencyId}
        onViewDetails={() => setIsDetailsOpen(true)}
        hospitals={hospitals}
        ambulances={ambulances}
      />

      {/* SECTION 03 — AI ROUTE INTELLIGENCE */}
      <AIRouteIntelligence
        selectedEmergency={selectedEmergency}
        rawSelectedEmergency={rawSelectedEmergency}
        assignedAmbulance={assignedAmbulance}
        destinationHospital={destinationHospital}
        isRerouted={isRerouted}
        isRerouting={isRerouting}
      />

      {/* SECTION 04 — OPERATIONAL ACTIONS */}
      <OperationalActions
        onInitiateSimulation={() => setIsSimulationOpen(true)}
        isSimulationOpen={isSimulationOpen}
        selectedEmergencyId={selectedEmergencyId}
        currentRouteId={currentRouteId}
        isRerouted={isRerouted}
        isRerouting={isRerouting}
        onTriggerReroute={triggerReroute}
        onResetRoute={() => {
          setIsRerouted(false);
          setSelectedEmergencyId(null);
        }}
      />

      {/* DISPATCH SIMULATION OVERLAY */}
      <DispatchSimulation
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
      />
    </div>
  );
}
