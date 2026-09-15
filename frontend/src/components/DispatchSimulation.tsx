import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Truck,
  Navigation,
  Activity,
  X,
  Radio,
  Zap
} from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

export interface DispatchSimulationProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SimulationPhase = 1 | 2 | 3 | 4 | 5 | 6;

export default function DispatchSimulation({ isOpen, onClose }: DispatchSimulationProps) {
  const [phase, setPhase] = useState<SimulationPhase>(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const { emergencies, ambulances, hospitals, setSelectedEmergencyId } = useEmergencyContext();

  // Use real context data for simulation fallback target
  const targetEmergency = emergencies[0] || {
    id: 'EMG-2401',
    type: 'MULTI-VEHICLE COLLISION',
    severity: 'Critical' as const,
    locationName: 'MG Road Junction, Kochi',
    assignedAmbulanceId: 'AMB-101',
    destinationHospitalId: 'HOSP-01',
    distance: '4.2 km',
    eta: '8 mins',
  };

  const assignedAmbulance =
    ambulances.find(a => a.id === targetEmergency.assignedAmbulanceId) || ambulances[0] || { id: 'AMB-101' };

  const destinationHospital =
    hospitals.find(h => h.id === targetEmergency.destinationHospitalId) || hospitals[0] || { name: 'General Hospital Kochi' };

  // Phase transition timeline
  useEffect(() => {
    if (!isOpen) {
      setPhase(1);
      setIsCompleted(false);
      return;
    }

    setPhase(1);
    setIsCompleted(false);

    const t1 = setTimeout(() => setPhase(2), 1500); // Phase 2: AI Triage
    const t2 = setTimeout(() => setPhase(3), 3200); // Phase 3: Unit Assignment
    const t3 = setTimeout(() => setPhase(4), 4800); // Phase 4: Route Computation
    const t4 = setTimeout(() => setPhase(5), 6400); // Phase 5: Facility Match
    const t5 = setTimeout(() => {
      setPhase(6);
      setIsCompleted(true);
      if (targetEmergency.id) {
        setSelectedEmergencyId(targetEmergency.id);
      }
    }, 8000); // Phase 6: Dispatch Confirmed

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen, setSelectedEmergencyId, targetEmergency.id]);

  // Keyboard Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in select-none font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="Dispatch Simulation Console"
    >
      <div
        className="w-full max-w-xl bg-slate-950 border border-cyan-500/40 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.25)] tactical-border overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-100">
              DISPATCH SIMULATION CONSOLE
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
              SYS.SIM.01
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded transition-colors"
            aria-label="Close Simulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Progress Tracker Header */}
        <div className="grid grid-cols-6 border-b border-slate-800/80 bg-slate-950 text-[10px] text-center font-bold">
          {[1, 2, 3, 4, 5, 6].map(pNum => {
            const isActive = phase === pNum;
            const isPassed = phase > pNum;
            return (
              <div
                key={pNum}
                className={`py-2 border-r last:border-0 border-slate-800/80 transition-colors ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border-b-2 border-b-cyan-400'
                    : isPassed
                    ? 'bg-slate-900/60 text-emerald-400'
                    : 'bg-slate-950 text-slate-600'
                }`}
              >
                PHASE 0{pNum}
              </div>
            );
          })}
        </div>

        {/* Dynamic Simulation Content Area */}
        <div className="p-6 space-y-6">
          {/* PHASE 01: INCOMING EMERGENCY */}
          {phase === 1 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-red-950/40 border border-red-500/40 p-3 rounded shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-red-400 tracking-widest">
                      PHASE 01 &bull; INCOMING EMERGENCY DETECTED
                    </div>
                    <div className="text-sm font-bold text-slate-100 uppercase">
                      {targetEmergency.type}
                    </div>
                  </div>
                </div>
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-1 rounded text-xs font-bold animate-pulse">
                  CRITICAL
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/90 p-4 rounded text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>INCIDENT IDENTIFIER:</span>
                  <span className="text-cyan-400 font-bold">{targetEmergency.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>LOCATION VECTOR:</span>
                  <span className="text-slate-200">{targetEmergency.locationName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SIGNAL STRENGTH:</span>
                  <span className="text-emerald-400">99.8% (GPS LOCK)</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 02: AI TRIAGE */}
          {phase === 2 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-500/40 p-3 rounded shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-cyan-400 animate-spin" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-cyan-400 tracking-widest">
                      PHASE 02 &bull; AI TRIAGE ENGINE
                    </div>
                    <div className="text-sm font-bold text-slate-100 uppercase">
                      ANALYZING INCIDENT SEVERITY
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing bar animation */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded text-xs space-y-3">
                <div className="text-slate-300">Evaluating casualty risk parameters & nearest response units...</div>
                <div className="w-full bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-blue-500 w-2/3 animate-pulse rounded"></div>
                </div>
                <div className="text-[11px] text-cyan-400 flex items-center justify-between">
                  <span>TRIAGE STATUS: PROCESSING</span>
                  <span>PRIORITY: HIGH IMPACT</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 03: UNIT ASSIGNMENT */}
          {phase === 3 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 p-3 rounded shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-emerald-400 animate-bounce" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest">
                      PHASE 03 &bull; DISPATCH ENGINE
                    </div>
                    <div className="text-sm font-bold text-slate-100 uppercase">
                      SELECTING OPTIMAL RESPONSE UNIT
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>TARGET AMBULANCE UNIT:</span>
                  <span className="text-emerald-400 font-bold">{assignedAmbulance.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>UNIT AVAILABILITY:</span>
                  <span className="text-cyan-400">READY FOR DISPATCH</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>EQUIPMENT LEVEL:</span>
                  <span className="text-slate-200">ADVANCED LIFE SUPPORT (ALS)</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 04: ROUTE COMPUTATION */}
          {phase === 4 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-500/40 p-3 rounded shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="flex items-center gap-3">
                  <Navigation className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-cyan-400 tracking-widest">
                      PHASE 04 &bull; ROUTING ENGINE
                    </div>
                    <div className="text-sm font-bold text-slate-100 uppercase">
                      COMPUTING FASTEST RESPONSE PATH
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>CALCULATED DISTANCE:</span>
                  <span className="text-slate-100 font-bold">{targetEmergency.distance || '4.2 km'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ESTIMATED ETA:</span>
                  <span className="text-emerald-400 font-bold">{targetEmergency.eta || '8 mins'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TRAFFIC CONGESTION:</span>
                  <span className="text-cyan-400 font-bold">LOW / OPTIMAL</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 05: FACILITY MATCH */}
          {phase === 5 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 p-3 rounded shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest">
                      PHASE 05 &bull; MEDICAL NETWORK
                    </div>
                    <div className="text-sm font-bold text-slate-100 uppercase">
                      MATCHING DESTINATION FACILITY
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>MATCHED MEDICAL FACILITY:</span>
                  <span className="text-emerald-400 font-bold">{destinationHospital.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SPECIALIZATION:</span>
                  <span className="text-slate-200">TRAUMA & ICU READY</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>FACILITY CAPACITY:</span>
                  <span className="text-cyan-400">CONFIRMED AVAILABLE</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 06: DISPATCH CONFIRMED */}
          {phase === 6 && (
            <div className="space-y-4 animate-fade-in-slide">
              <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/60 p-4 rounded shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest">
                      PHASE 06 &bull; WORKFLOW COMPLETE
                    </div>
                    <div className="text-base font-bold text-slate-100 uppercase">
                      DISPATCH CONFIRMED
                    </div>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded text-xs font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">ASSIGNMENT VECTOR:</span>
                  <span className="text-cyan-400 font-bold">
                    {assignedAmbulance.id} → {destinationHospital.name}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">ESTIMATED RESPONSE TIME:</span>
                  <span className="text-emerald-400 font-bold">{targetEmergency.eta}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  The Command Center live routing matrix has locked onto this incident vector. Real-time telemetry is broadcast to unit {assignedAmbulance.id}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-t border-slate-800/90 text-xs">
          <div className="text-slate-400 text-[10px]">
            {isCompleted ? 'DISPATCH SEQUENCE VERIFIED' : 'PRESS ESC TO CANCEL SIMULATION'}
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors"
              >
                CANCEL (ESC)
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-4 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>RETURN TO COMMAND CENTER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
