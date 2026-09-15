import { useState } from 'react';
import { ShieldAlert, Search, Filter, AlertTriangle, Truck, Activity, ExternalLink, Radio } from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

export default function Emergencies() {
  const { emergencies, ambulances, hospitals, selectedEmergencyId, setSelectedEmergencyId, setIsDetailsOpen } = useEmergencyContext();
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'Critical' | 'High'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const totalEmergencies = emergencies.length;
  const criticalCount = emergencies.filter(e => e.severity === 'Critical').length;
  const highCount = emergencies.filter(e => e.severity === 'High').length;
  const dispatchedCount = emergencies.filter(e => e.assignedAmbulanceId).length;

  const filteredEmergencies = emergencies.filter(emergency => {
    // Severity Filter
    if (filterSeverity !== 'ALL' && emergency.severity !== filterSeverity) {
      return false;
    }
    // Search Query (ID, type, location)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = emergency.id.toLowerCase().includes(q);
      const matchType = emergency.type.toLowerCase().includes(q);
      const matchLoc = emergency.locationName.toLowerCase().includes(q);
      if (!matchId && !matchType && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-7xl mx-auto space-y-5 select-none animate-fade-in-slide">
      {/* 1. Page Header */}
      <div className="shrink-0 flex items-center justify-between bg-slate-950/90 border border-slate-800/80 p-4 rounded-lg shadow-2xl backdrop-blur tactical-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)] tactical-border">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
              INCIDENT CONTROL
            </h2>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span className="text-red-400 font-bold">SYS.EMG.01</span>
              <span className="text-slate-600">•</span>
              <span>REAL-TIME INCIDENT DISPATCH & TELEMETRY STREAM</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-red-500/30 px-3 py-1.5 rounded text-xs font-mono text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="font-bold tracking-wider">INCIDENT NETWORK: ACTIVE</span>
        </div>
      </div>

      {/* 2. 01 Incident Status & Operational Metric Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">TOTAL INCIDENTS</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{totalEmergencies}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">EVENTS</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">CRITICAL SEVERITY</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400 font-mono">{criticalCount}</span>
            <span className="text-[10px] font-mono text-red-500/80 uppercase">PRIORITY 1</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">HIGH SEVERITY</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{highCount}</span>
            <span className="text-[10px] font-mono text-amber-500/80 uppercase">PRIORITY 2</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">ACTIVE DISPATCHES</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">{dispatchedCount}</span>
            <span className="text-[10px] font-mono text-cyan-500/80 uppercase">ASSIGNED</span>
          </div>
        </div>
      </div>

      {/* 3. 02 Filter Matrix & Tactical Control Strip */}
      <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-3.5 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl backdrop-blur tactical-border">
        {/* Severity Filter Control Strip */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            FILTER SEVERITY:
          </span>
          {(['ALL', 'Critical', 'High'] as const).map(severity => (
            <button
              key={severity}
              onClick={() => setFilterSeverity(severity)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-all duration-150 border active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                filterSeverity === severity
                  ? severity === 'Critical'
                    ? 'bg-red-950/90 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                    : severity === 'High'
                    ? 'bg-amber-950/90 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {severity}
            </button>
          ))}
        </div>

        {/* Tactical Command Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, type, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>
      </div>

      {/* 4. 03 Active Incident Registry */}
      <div className="flex-1 min-h-0 bg-slate-950/95 border border-slate-800/80 rounded-lg overflow-hidden flex flex-col shadow-2xl backdrop-blur tactical-border">
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">03 ACTIVE INCIDENT REGISTRY</h3>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
            [SHOWING {filteredEmergencies.length} OF {totalEmergencies}]
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredEmergencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded bg-slate-900/30">
              <ShieldAlert className="w-10 h-10 text-slate-600 mb-3 stroke-1" />
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 mb-1">
                NO INCIDENTS MATCHING QUERY PARAMETERS
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm font-mono">
                Try adjusting the severity filter or clearing search keywords to view all active emergency operations.
              </p>
            </div>
          ) : (
            filteredEmergencies.map(emergency => {
              const isSelected = selectedEmergencyId === emergency.id;
              const ambulance = ambulances.find(a => a.id === emergency.assignedAmbulanceId);
              const hospital = hospitals.find(h => h.id === emergency.destinationHospitalId);

              const severityColor = emergency.severity === 'Critical' 
                ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse' 
                : emergency.severity === 'High' 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]';

              return (
                <div
                  key={emergency.id}
                  onClick={() => setSelectedEmergencyId(emergency.id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEmergencyId(emergency.id);
                    }
                  }}
                  className={`group border rounded p-4 cursor-pointer transition-all duration-150 ease-out relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] -translate-y-0.5'
                      : 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700/90 hover:bg-slate-900/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:-translate-y-0.5'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)]"></div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Primary Emergency Info */}
                    <div className="flex items-start gap-3.5">
                      <div className={`mt-0.5 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border font-mono shrink-0 ${severityColor}`}>
                        {emergency.severity}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-100 text-sm font-sans group-hover:text-cyan-300 transition-colors">{emergency.type}</span>
                          <span className="text-slate-400 text-xs font-mono">({emergency.id})</span>
                          {isSelected && (
                            <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                              [TARGET LOCK]
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-3">
                          <span>{emergency.locationName}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 font-mono">{emergency.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dispatch & Destination Status Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <div className="bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        <div>
                          <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest block leading-none mb-0.5">AMBULANCE</span>
                          <span className="text-cyan-400 font-bold leading-none">{ambulance?.id || emergency.assignedAmbulanceId || 'Pending'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <div>
                          <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest block leading-none mb-0.5">DESTINATION</span>
                          <span className="text-emerald-400 font-bold leading-none truncate max-w-[140px]">{hospital?.name || emergency.destinationHospitalId || 'Pending'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded font-mono">
                          {ambulance?.status === 'Dispatched' ? 'EN ROUTE' : 'DISPATCHED'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmergencyId(emergency.id);
                            setIsDetailsOpen(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-1.5 transition-all duration-150 font-mono active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                          aria-label={`Open details for ${emergency.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


