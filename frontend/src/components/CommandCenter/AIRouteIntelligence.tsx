import { useState } from 'react';
import { Sparkles, AlertTriangle, Cpu, Terminal, Clock, ChevronDown, ChevronUp, Route } from 'lucide-react';
import { Emergency, Ambulance, Hospital, AdaptedRouteCandidate } from '../../types';
import { useEmergencyContext } from '../../context/EmergencyContext';

interface AIRouteIntelligenceProps {
  selectedEmergency?: Emergency | null;
  rawSelectedEmergency?: Emergency | null;
  assignedAmbulance?: Ambulance | null;
  destinationHospital?: Hospital | null;
  isRerouted: boolean;
  isRerouting: boolean;
  candidateRoutes?: AdaptedRouteCandidate[];
}

export default function AIRouteIntelligence({
  selectedEmergency,
  rawSelectedEmergency,
  assignedAmbulance,
  destinationHospital,
  isRerouted,
  isRerouting,
  candidateRoutes: propCandidateRoutes,
}: AIRouteIntelligenceProps) {
  const [showRationale, setShowRationale] = useState(true);
  const context = useEmergencyContext();
  const candidateRoutes = propCandidateRoutes ?? context?.candidateRoutes ?? [];
  const isLoadingRoute = context?.isLoadingRoute ?? false;

  if (!selectedEmergency) {
    return (
      <section
        className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-6 font-mono text-center shadow-xl tactical-border"
        aria-label="AI Route Intelligence"
      >
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 justify-center">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>// 03 AI ROUTE INTELLIGENCE</span>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          SELECT AN ACTIVE INCIDENT ABOVE TO GENERATE OPTIMAL RESPONSE PATH
        </p>
      </section>
    );
  }

  return (
    <section
      className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-4 sm:p-6 space-y-4 shadow-xl backdrop-blur tactical-border font-mono"
      aria-label="AI Route Intelligence"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">// 03</span>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
            AI ROUTE INTELLIGENCE
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            {isRerouting ? 'ANALYZING' : 'AI ENGINE ACTIVE'}
          </span>
        </div>
      </div>

      {/* Large Title */}
      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-extrabold text-slate-100 uppercase tracking-tight">
          OPTIMAL RESPONSE PATH
        </div>
        <div className="text-xs text-slate-400">
          Target Incident: <span className="text-cyan-400 font-bold">{selectedEmergency.id}</span> &bull; {selectedEmergency.type}
        </div>
      </div>

      {/* Processing State during Reroute Analysis */}
      {isRerouting ? (
        <div className="p-6 bg-slate-900/60 border border-cyan-500/30 rounded-md flex flex-col items-center justify-center text-center space-y-3 animate-fade-in-slide shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Cpu className="w-4.5 h-4.5 animate-spin text-cyan-400" />
            <span>ANALYZING TRAFFIC DATA VECTOR</span>
          </div>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 w-1/2 animate-pulse rounded-full"></div>
          </div>
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>CALCULATING DYNAMIC DETOUR & TRAFFIC OPTIMIZATION...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Traffic Detour Alert */}
          {isRerouted && rawSelectedEmergency?.alternativeRoute && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded p-3 flex items-start gap-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest">TRAFFIC DISRUPTION DETECTED</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
                    SAVED: {rawSelectedEmergency.alternativeRoute.timeSaved}
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-tight">
                  Heavy traffic obstruction on primary vector. AI engaged dynamic detour.
                </p>
              </div>
            </div>
          )}

          {/* Technical Readout Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">TARGET</span>
              <span className="text-cyan-400 font-bold text-xs">{selectedEmergency.id}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">UNIT</span>
              <span className="text-slate-100 font-bold text-xs">{assignedAmbulance?.id || selectedEmergency.assignedAmbulanceId || 'AMB-101'}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors col-span-2 sm:col-span-1">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">FACILITY</span>
              <span className="text-emerald-400 font-bold text-xs truncate block">{destinationHospital?.name || 'General Hospital'}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> EST. ETA
              </span>
              <span className="text-amber-400 font-bold text-xs">{selectedEmergency.eta || '11 MIN'}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">DISTANCE</span>
              <span className="text-slate-200 font-bold text-xs">{selectedEmergency.distance || '4.2 KM'}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">TRAFFIC</span>
              <span className={`font-bold text-xs uppercase ${
                selectedEmergency.trafficCondition === 'HIGH' ? 'text-red-400' :
                selectedEmergency.trafficCondition === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {selectedEmergency.trafficCondition || 'LOW'}
              </span>
            </div>
          </div>

          {/* Evaluated Route Candidates (Backend Authoritative Ranking - Task 4, 5, 7) */}
          {candidateRoutes && candidateRoutes.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Route className="w-3.5 h-3.5" />
                  <span>BACKEND EVALUATED ROUTE CANDIDATES</span>
                </div>
                <span className="text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded text-[9px] shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                  {candidateRoutes.length} VECTORS EVALUATED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {candidateRoutes.map((candidate) => {
                  const isPrimary = candidate.rank === 1 && !isRerouted;
                  return (
                    <div
                      key={`candidate-${candidate.routeIndex}`}
                      className={`border rounded p-3 transition-colors font-mono relative overflow-hidden ${
                        isPrimary
                          ? 'border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      {isPrimary && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isPrimary
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ROUTE {candidate.rank}
                          </span>
                          {isPrimary && (
                            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          SCORE <span className="text-cyan-300 font-bold">{typeof candidate.score === 'number' ? candidate.score.toFixed(2) : candidate.score}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1.5 rounded">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">ETA</span>
                          <span className="font-bold text-amber-400">{candidate.eta}</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1.5 rounded text-right">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">DISTANCE</span>
                          <span className="font-bold text-slate-200">{candidate.distance}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isLoadingRoute && candidateRoutes.length === 0 && (
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 py-1 border-t border-slate-800/60 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>EVALUATING ROUTE CANDIDATE VECTORS...</span>
            </div>
          )}

          {/* Collapsible AI Route Rationale */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRationale(prev => !prev)}
              className="w-full px-3 py-2 bg-cyan-950/40 hover:bg-cyan-950/60 flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-widest text-left transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRerouted ? 'DYNAMIC DETOUR RATIONALE' : 'AI ROUTE RATIONALE'}</span>
              </div>
              {showRationale ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRationale && (
              <div className="p-3 text-xs text-slate-300 leading-relaxed border-t border-cyan-500/20 animate-fade-in">
                <span className="text-cyan-400 mr-1.5 font-bold">&gt;</span>
                {selectedEmergency.aiReasoning ||
                  'Route calculated based on nearest available facility capability, priority traffic lights override, and live sensor feeds.'}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
