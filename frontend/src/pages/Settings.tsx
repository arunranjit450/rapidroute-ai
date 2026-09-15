import React from 'react';
import { Settings as SettingsIcon, Server, Cpu, MapPin, Bell, Info, CheckCircle2, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, value, onToggle }) => (
  <div className="group flex items-center justify-between p-4 border-b border-slate-800/60 last:border-0 hover:bg-slate-900/50 focus-within:bg-slate-900/60 transition-colors duration-150">
    <div className="pr-4 max-w-xl">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors duration-150 tracking-wide">
          {label}
        </span>
        <span
          className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-semibold transition-colors duration-200 ${
            value
              ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}
        >
          {value ? '[ENABLED]' : '[DISABLED]'}
        </span>
      </div>
      <div className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
        {description}
      </div>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        value
          ? 'bg-cyan-950 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
          : 'bg-slate-900 border-slate-700/80 hover:border-slate-600'
      }`}
      role="switch"
      aria-checked={value}
      aria-label={`Toggle ${label}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
          value ? 'translate-x-5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'translate-x-0 bg-slate-500'
        }`}
      />
    </button>
  </div>
);

export default function Settings() {
  const {
    dispatchSettings,
    setDispatchSettings,
    mapSettings,
    setMapSettings,
    notificationSettings,
    setNotificationSettings,
  } = useEmergencyContext();

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-4xl mx-auto space-y-6 animate-fade-in-slide select-none">
      {/* 1. Page Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] tactical-border">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
              SYSTEM CONFIGURATION
            </h2>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span className="text-cyan-400 font-bold">SYS.CFG.01</span>
              <span className="text-slate-600">•</span>
              <span>GLOBAL DISPATCH & PLATFORM CONTROL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider">SYSTEM STATUS: STABLE</span>
        </div>
      </div>

      {/* Settings Container */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        
        {/* System Monitor & Telemetry Panel */}
        <div className="tactical-border bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">SYSTEM MONITOR & TELEMETRY</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
              HEALTH OK
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase block mb-1">System Status</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Operational
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase block mb-1">Dispatch Engine</span>
              <span className="text-blue-400 font-mono font-medium flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-400" />
                Active [v2.4]
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase block mb-1">Map Service</span>
              <span className="text-cyan-400 font-mono font-medium">Connected</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded hover:border-slate-700 transition-colors">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase block mb-1">Routing Engine</span>
              <span className="text-emerald-400 font-mono font-medium">Active</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded hover:border-slate-700 transition-colors col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase block mb-1">Last Check</span>
              <span className="text-slate-300 font-mono">JUST NOW</span>
            </div>
          </div>
        </div>

        {/* 01 DISPATCH CONFIGURATION */}
        <div className="tactical-border bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">01 DISPATCH CONFIGURATION</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
              AUTOMATION RULES
            </span>
          </div>
          <div>
            <ToggleRow
              label="Auto-dispatch"
              description="Automatically assign optimal available ambulance to new critical incidents."
              value={dispatchSettings.autoDispatch}
              onToggle={() =>
                setDispatchSettings(prev => ({ ...prev, autoDispatch: !prev.autoDispatch }))
              }
            />
            <ToggleRow
              label="Priority Routing"
              description="Calculate routes prioritizing minimum travel time and low traffic congestion."
              value={dispatchSettings.priorityRouting}
              onToggle={() =>
                setDispatchSettings(prev => ({ ...prev, priorityRouting: !prev.priorityRouting }))
              }
            />
            <ToggleRow
              label="Emergency Alerts"
              description="Broadcast real-time sound and visual warnings to active dispatch consoles."
              value={dispatchSettings.emergencyAlerts}
              onToggle={() =>
                setDispatchSettings(prev => ({ ...prev, emergencyAlerts: !prev.emergencyAlerts }))
              }
            />
          </div>
        </div>

        {/* 02 MAP CONTROL MATRIX */}
        <div className="tactical-border bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">02 MAP CONTROL MATRIX</h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
              GIS LAYERS
            </span>
          </div>
          <div>
            <ToggleRow
              label="Show Ambulances"
              description="Display active ambulance markers on the Live Routing Map."
              value={mapSettings.showAmbulances}
              onToggle={() =>
                setMapSettings(prev => ({ ...prev, showAmbulances: !prev.showAmbulances }))
              }
            />
            <ToggleRow
              label="Show Hospitals"
              description="Display medical facility markers and availability indicators on the map."
              value={mapSettings.showHospitals}
              onToggle={() =>
                setMapSettings(prev => ({ ...prev, showHospitals: !prev.showHospitals }))
              }
            />
            <ToggleRow
              label="Show Emergency Markers"
              description="Display incident pins and emergency markers on the map."
              value={mapSettings.showEmergencyMarkers}
              onToggle={() =>
                setMapSettings(prev => ({ ...prev, showEmergencyMarkers: !prev.showEmergencyMarkers }))
              }
            />
          </div>
        </div>

        {/* 03 NOTIFICATION CONTROL */}
        <div className="tactical-border bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">03 NOTIFICATION CONTROL</h3>
            </div>
            <span className="text-[10px] font-mono text-red-400/90 bg-red-950/80 border border-red-500/30 px-2 py-0.5 rounded">
              ALERT CHANNELS
            </span>
          </div>
          <div>
            <ToggleRow
              label="Critical Emergency Alerts"
              description="Receive high-priority notifications for life-threatening incidents."
              value={notificationSettings.criticalEmergencyAlerts}
              onToggle={() =>
                setNotificationSettings(prev => ({ ...prev, criticalEmergencyAlerts: !prev.criticalEmergencyAlerts }))
              }
            />
            <ToggleRow
              label="Traffic Incident Alerts"
              description="Notify dispatchers when traffic incidents affect active routes."
              value={notificationSettings.trafficIncidentAlerts}
              onToggle={() =>
                setNotificationSettings(prev => ({ ...prev, trafficIncidentAlerts: !prev.trafficIncidentAlerts }))
              }
            />
          </div>
        </div>

        {/* 04 SYSTEM TELEMETRY */}
        <div className="tactical-border bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">04 SYSTEM TELEMETRY</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              BUILD SPECS
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs font-mono">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 uppercase text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Application Name
              </span>
              <span className="text-slate-200 font-bold">RapidRoute AI Command</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 uppercase text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Frontend Version
              </span>
              <span className="text-cyan-400 font-bold">v1.0.0-PROD-TACTICAL</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 uppercase text-[11px]">Runtime Environment</span>
              <span className="text-slate-300">DEVELOPMENT</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 uppercase text-[11px]">GIS Map Engine</span>
              <span className="text-slate-300">Leaflet GIS v1.9.4</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 md:border-b-0">
              <span className="text-slate-400 uppercase text-[11px]">State Architecture</span>
              <span className="text-emerald-400 font-medium">EmergencyContext Sync</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 uppercase text-[11px]">Security Protocol</span>
              <span className="text-slate-300">TLS 1.3 / AES-256</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


