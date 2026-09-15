import { ShieldAlert, ExternalLink, Navigation, Activity, Clock } from 'lucide-react';
import { Emergency, Hospital, Ambulance } from '../../types';

interface IncidentIntelligenceProps {
  emergencies: Emergency[];
  selectedEmergencyId: string | null;
  onSelectEmergency: (id: string) => void;
  onViewDetails: (id: string) => void;
  hospitals: Hospital[];
  ambulances: Ambulance[];
}

export default function IncidentIntelligence({
  emergencies,
  selectedEmergencyId,
  onSelectEmergency,
  onViewDetails,
  hospitals,
  ambulances,
}: IncidentIntelligenceProps) {
  const criticalCount = emergencies.filter(e => e.severity === 'Critical').length;

  return (
    <section
      className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-4 sm:p-6 space-y-4 shadow-xl tactical-border"
      aria-label="Active Incident Stream"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-widest">// 02</span>
          <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-widest">
            ACTIVE INCIDENTS
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-red-950/80 text-red-400 px-2.5 py-0.5 rounded border border-red-500/30 font-bold shadow-[0_0_8px_rgba(239,68,68,0.2)]">
            [{emergencies.length} ACTIVE &bull; {criticalCount} CRITICAL]
          </span>
        </div>
      </div>

      {/* Large Statement */}
      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono uppercase tracking-tight">
          {emergencies.length} INCIDENTS REQUIRE ATTENTION
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Select an incident to acquire target vector, update AI route intelligence, and trigger dispatch actions.
        </p>
      </div>

      {/* Horizontal Operational Incident Rows */}
      <div className="space-y-3 pt-2">
        {emergencies.map((emg, idx) => {
          const isSelected = emg.id === selectedEmergencyId;
          const assignedAmb = ambulances.find(a => a.id === emg.assignedAmbulanceId);
          const assignedHosp = hospitals.find(h => h.id === emg.destinationHospitalId);
          const itemNum = (idx + 1).toString().padStart(2, '0');

          return (
            <div
              key={emg.id}
              onClick={() => onSelectEmergency(emg.id)}
              className={`group border rounded-lg p-4 cursor-pointer transition-all duration-150 ease-out relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] -translate-y-0.5'
                  : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)]'
              }`}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEmergency(emg.id);
                }
              }}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)]"></div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                {/* Left: Item #, Severity, Type, ID & Location */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 text-xs font-bold">[{itemNum}]</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        emg.severity === 'Critical'
                          ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse'
                          : emg.severity === 'High'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                          : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                      }`}
                    >
                      {emg.severity}
                    </span>
                    <span className="text-slate-400 text-xs font-bold text-slate-200 uppercase tracking-wide">
                      {emg.type}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        [TARGET LOCK]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-cyan-400 font-bold">{emg.id}</span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-300 font-sans truncate">{emg.locationName}</span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-500">{emg.timestamp}</span>
                  </div>
                </div>

                {/* Right: Compact Metadata Strip & View Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{assignedAmb?.id || emg.assignedAmbulanceId || 'AMB-101'}</span>
                    </div>
                    <span className="text-slate-700">&bull;</span>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="max-w-[140px] truncate">{assignedHosp?.name || 'General Hospital'}</span>
                    </div>
                    <span className="text-slate-700">&bull;</span>
                    <div className="flex items-center gap-1 text-slate-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{emg.eta || '11 MIN'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectEmergency(emg.id);
                      onViewDetails(emg.id);
                    }}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded border transition-all font-mono flex items-center gap-1.5 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    aria-label={`View details for ${emg.type}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>DETAILS</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
