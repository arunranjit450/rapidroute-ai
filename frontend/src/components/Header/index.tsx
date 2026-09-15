import { useLocation } from 'react-router-dom';
import { useEmergencyContext } from '../../context/EmergencyContext';
import { ShieldAlert, Truck, Activity, Radio, Wifi, Command, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const { emergencies, ambulances, hospitals, isFallbackMode } = useEmergencyContext();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'COMMAND CENTER', sysCode: 'SYS.OPS.01' };
      case '/emergencies':
        return { title: 'INCIDENT CONTROL', sysCode: 'SYS.EMG.01' };
      case '/resources':
        return { title: 'ASSET OPERATIONS', sysCode: 'SYS.RES.01' };
      case '/settings':
        return { title: 'SYSTEM CONFIGURATION', sysCode: 'SYS.CFG.01' };
      default:
        return { title: 'OVERVIEW', sysCode: 'SYS.GEN.00' };
    }
  };

  const pageInfo = getPageInfo();
  const activeEmergenciesCount = emergencies.length;
  const availAmbulancesCount = ambulances.filter(a => a.status === 'Available').length;
  const totalAmbulancesCount = ambulances.length;
  const availHospitalsCount = hospitals.length;

  return (
    <header className="h-16 bg-slate-950/95 backdrop-blur border-b border-slate-800/90 flex items-center justify-between px-3 sm:px-6 shrink-0 select-none z-20 font-mono tracking-tight">
      {/* 1. Left Section: Page Title & System Route Identifier */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFallbackMode ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isFallbackMode ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]'}`}></span>
          </span>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider font-mono truncate">
            {pageInfo.title}
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 shrink-0">
          <span className="text-cyan-400 font-bold">{pageInfo.sysCode}</span>
          <span className="text-slate-600">•</span>
          {isFallbackMode ? (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="text-amber-400 font-bold tracking-wider">OFFLINE (FALLBACK)</span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold tracking-wider">LIVE</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Right Section: Global Telemetry Metrics & Command Palette Button */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 hover:bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-400/60 px-2 sm:px-2.5 py-1 rounded text-slate-300 transition-all duration-150 shadow-[0_0_10px_rgba(6,182,212,0.1)] group"
          title="Open Command Palette (Ctrl+K)"
        >
          <Command className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-[11px] font-bold text-slate-200">COMMANDS</span>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-500/30 px-1 py-0.2 rounded font-bold">
            Ctrl+K
          </span>
        </button>

        {/* Operational Status Pill */}
        {isFallbackMode ? (
          <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/30 px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-[11px] text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">BACKEND</span>
            <span>OFFLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-[11px] text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">SYSTEM</span>
            <span>OPERATIONAL</span>
          </div>
        )}

        {/* Telemetry Strip - Responsive Breakdown */}
        <div className="hidden md:flex items-center gap-2.5 border-l border-slate-800/80 pl-2.5 text-[11px]">
          {/* Active Incidents */}
          <div
            className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-2 py-1 rounded hover:border-red-500/40 transition-colors"
            title="Active Incidents"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden lg:inline text-slate-400 uppercase text-[10px]">INCIDENTS:</span>
            <span className="text-red-400 font-bold font-mono">[{activeEmergenciesCount}]</span>
          </div>

          {/* Ambulances Status */}
          <div
            className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-2 py-1 rounded hover:border-emerald-500/40 transition-colors"
            title="Available / Total Ambulances"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-slate-400 uppercase text-[10px]">AMBULANCES:</span>
            <span className="text-emerald-400 font-bold font-mono">
              [{availAmbulancesCount}/{totalAmbulancesCount}]
            </span>
          </div>

          {/* Hospitals Status */}
          <div
            className="hidden lg:flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-2 py-1 rounded hover:border-cyan-500/40 transition-colors"
            title="Active Medical Facilities"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[10px]">HOSPITALS:</span>
            <span className="text-cyan-400 font-bold font-mono">[{availHospitalsCount}]</span>
          </div>

          {/* Network Latency */}
          <div
            className="hidden xl:flex items-center gap-1.5 bg-slate-900/50 border border-slate-800/60 px-2 py-1 rounded text-slate-400 text-[10px]"
            title="Network Latency"
          >
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-cyan-300 font-semibold">12ms</span>
          </div>
        </div>
      </div>
    </header>
  );
}
