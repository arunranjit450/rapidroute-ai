import { useState } from 'react';
import { Truck, Navigation, Activity, CheckCircle, ShieldAlert, X, AlertTriangle, Radio } from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

export default function Resources() {
  const { ambulances, emergencies, hospitals } = useEmergencyContext();
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  const totalAmbulances = ambulances.length;
  const availableAmbulances = ambulances.filter(a => a.status === 'Available').length;
  const dispatchedAmbulances = ambulances.filter(a => a.status === 'Dispatched' || a.status === 'Returning').length;
  const totalHospitals = hospitals.length;

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-7xl mx-auto space-y-5 select-none animate-fade-in-slide">
      {/* 1. Page Header */}
      <div className="shrink-0 flex items-center justify-between bg-slate-950/90 border border-slate-800/80 p-4 rounded-lg shadow-2xl backdrop-blur tactical-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] tactical-border">
            <Truck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
              ASSET OPERATIONS
            </h2>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span className="text-cyan-400 font-bold">SYS.RES.01</span>
              <span className="text-slate-600">•</span>
              <span>FLEET TELEMETRY & MEDICAL FACILITY DISPATCH MATRIX</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider">RESOURCE NETWORK: ONLINE</span>
        </div>
      </div>

      {/* 2. 01 Resource Status & Operational Metric Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">TOTAL AMBULANCES</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{totalAmbulances}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">UNITS</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">AVAILABLE FLEET</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{availableAmbulances}</span>
            <span className="text-[10px] font-mono text-emerald-500/80 uppercase">READY</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">ACTIVE DISPATCH</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{dispatchedAmbulances}</span>
            <span className="text-[10px] font-mono text-amber-500/80 uppercase">EN ROUTE</span>
          </div>
        </div>
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-center shadow-xl backdrop-blur tactical-border transition-all duration-150 hover:border-slate-700">
          <span className="text-slate-400 text-[9px] font-mono font-bold uppercase tracking-widest mb-1 block">MEDICAL NETWORK</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">{totalHospitals}</span>
            <span className="text-[10px] font-mono text-cyan-500/80 uppercase">ONLINE</span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
        
        {/* 02 Ambulance Fleet Panel */}
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg flex flex-col overflow-hidden h-full shadow-2xl backdrop-blur tactical-border">
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">02 AMBULANCE FLEET DIRECTORY</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
              [{ambulances.length} UNITS]
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {ambulances.map((amb) => {
              const assignedEmg = emergencies.find(e => e.assignedAmbulanceId === amb.id);
              const isSelected = selectedAmbulanceId === amb.id;
              
              return (
                <div 
                  key={amb.id}
                  onClick={() => setSelectedAmbulanceId(isSelected ? null : amb.id)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAmbulanceId(isSelected ? null : amb.id);
                    }
                  }}
                  className={`group border rounded p-3.5 cursor-pointer transition-all duration-150 ease-out relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                    isSelected 
                      ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] -translate-y-0.5' 
                      : 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700/90 hover:bg-slate-900/80 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:-translate-y-0.5'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.9)]"></div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-base">
                        🚑
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 font-mono text-sm block leading-tight">{amb.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">GPS POS: [{amb.pos[0].toFixed(3)}, {amb.pos[1].toFixed(3)}]</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border font-mono ${
                      amb.status === 'Available' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]' :
                      amb.status === 'Dispatched' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    }`}>
                      {amb.status}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col gap-3 text-xs font-mono animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest block mb-0.5">LOCATION VECTOR</span>
                          <span className="text-slate-300 font-mono text-xs">{amb.pos.map(p => p.toFixed(4)).join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest block mb-0.5">CURRENT ASSIGNMENT</span>
                          <span className="text-slate-200 font-medium">
                            {assignedEmg ? (
                              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                                <ShieldAlert className="w-3 h-3 animate-pulse text-red-400" />
                                {assignedEmg.id}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned / Standby</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {assignedEmg && (
                        <div className="bg-slate-950 rounded p-3 border border-slate-800/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-200 text-xs font-bold">{assignedEmg.type}</span>
                            <span className="text-cyan-400 text-xs font-bold font-mono">ETA: {assignedEmg.eta}</span>
                          </div>
                          <span className="text-slate-400 text-[10px] truncate block font-sans">{assignedEmg.locationName}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedAmbulanceId(null); }}
                        className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-bold uppercase tracking-widest rounded border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                      >
                        <X className="w-3.5 h-3.5" /> Close Telemetry Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 03 Medical Facility Network Panel */}
        <div className="bg-slate-950/95 border border-slate-800/80 rounded-lg flex flex-col overflow-hidden h-full shadow-2xl backdrop-blur tactical-border">
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">03 MEDICAL FACILITY NETWORK</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
              [{hospitals.length} FACILITIES]
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {hospitals.map((hosp) => {
              const assignedEmg = emergencies.find(e => e.destinationHospitalId === hosp.id);
              const isSelected = selectedHospitalId === hosp.id;
              
              return (
                <div 
                  key={hosp.id}
                  onClick={() => setSelectedHospitalId(isSelected ? null : hosp.id)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedHospitalId(isSelected ? null : hosp.id);
                    }
                  }}
                  className={`group border rounded p-3.5 cursor-pointer transition-all duration-150 ease-out relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                    isSelected 
                      ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] -translate-y-0.5' 
                      : 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700/90 hover:bg-slate-900/80 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:-translate-y-0.5'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]"></div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-base mt-0.5">
                        🏥
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 block leading-tight mb-1 font-sans text-sm group-hover:text-emerald-300 transition-colors">{hosp.name}</span>
                        <span className="text-slate-400 text-xs font-mono block">{hosp.capability}</span>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30 font-mono shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      OPERATIONAL
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col gap-3 text-xs font-mono animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest block mb-0.5">FACILITY ID</span>
                          <span className="text-slate-300 font-mono text-xs">{hosp.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest block mb-0.5">INCOMING PATIENTS</span>
                          <span className="text-slate-200">
                            {assignedEmg ? (
                              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                                <AlertTriangle className="w-3 h-3 animate-pulse text-amber-400" />
                                1 En Route
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {assignedEmg && (
                        <div className="bg-slate-950 rounded p-3 border border-slate-800/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs">Assigned Incident</span>
                            <span className="text-slate-200 text-xs font-bold font-mono">{assignedEmg.id}</span>
                          </div>
                          <span className="text-slate-400 text-[10px] truncate block font-sans">{assignedEmg.type}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedHospitalId(null); }}
                        className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-bold uppercase tracking-widest rounded border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      >
                        <X className="w-3.5 h-3.5" /> Close Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}


