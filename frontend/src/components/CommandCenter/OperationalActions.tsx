import { Play, Zap, RotateCcw, Shield } from 'lucide-react';

interface OperationalActionsProps {
  onInitiateSimulation: () => void;
  isSimulationOpen: boolean;
  selectedEmergencyId?: string | null;
  currentRouteId?: string | null;
  isRerouted: boolean;
  isRerouting: boolean;
  onTriggerReroute: () => void;
  onResetRoute: () => void;
  hasAlternativeRoute?: boolean;
}

export default function OperationalActions({
  onInitiateSimulation,
  isSimulationOpen,
  selectedEmergencyId,
  currentRouteId,
  isRerouted,
  isRerouting,
  onTriggerReroute,
  onResetRoute,
}: OperationalActionsProps) {
  const hasSelectedEmergency = Boolean(selectedEmergencyId);
  const hasValidRoute = Boolean(currentRouteId);
  const canReroute = hasSelectedEmergency && hasValidRoute && !isRerouting && !isRerouted;

  const getDisabledReason = () => {
    if (!hasSelectedEmergency) return 'Select an incident to acquire route vector';
    if (!hasValidRoute) return 'Awaiting active route generation (routeId required)';
    if (isRerouting) return 'Calculating dynamic detour & traffic optimization...';
    if (isRerouted) return 'Dynamic detour already engaged for this incident';
    return 'Inject live congestion detour on active vector';
  };

  const getButtonLabel = () => {
    if (isRerouting) return 'ANALYZING TRAFFIC...';
    if (isRerouted) return 'DETOUR ACTIVE';
    if (!hasSelectedEmergency) return 'NO INCIDENT SELECTED';
    if (!hasValidRoute) return 'AWAITING ROUTE ID';
    return 'SIMULATE TRAFFIC INCIDENT';
  };

  return (
    <section
      className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-4 sm:p-6 space-y-4 shadow-xl tactical-border font-mono"
      aria-label="Operational Actions Zone"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">// 04</span>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
            OPERATIONAL ACTIONS
          </h2>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
          COMMAND COMMANDS READY
        </span>
      </div>

      {/* Action Buttons Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Initiate Dispatch Simulation */}
        <button
          type="button"
          onClick={onInitiateSimulation}
          disabled={isSimulationOpen}
          className="bg-cyan-950/90 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 p-4 rounded-lg flex flex-col justify-between transition-all duration-150 shadow-[0_0_15px_rgba(6,182,212,0.15)] group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Initiate Dispatch Simulation"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-[10px] text-cyan-400 uppercase tracking-widest">// CMD.01</span>
            <Play className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-100 group-hover:text-cyan-200">
              {isSimulationOpen ? 'SIMULATION ACTIVE' : 'INITIATE DISPATCH SIMULATION'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Trigger 6-phase end-to-end incident dispatch sequence
            </div>
          </div>
        </button>

        {/* 2. Simulate Traffic Incident / Detour */}
        <button
          type="button"
          onClick={onTriggerReroute}
          disabled={!canReroute}
          title={getDisabledReason()}
          className={`p-4 rounded-lg flex flex-col justify-between transition-all duration-150 border group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            isRerouted
              ? 'bg-slate-900/50 border-slate-800 text-slate-500'
              : !canReroute
              ? 'bg-slate-900/40 border-slate-800 text-slate-400'
              : 'bg-red-950/40 hover:bg-red-900/40 text-red-300 border-red-500/40 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
          }`}
          aria-label="Simulate Traffic Incident"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-[10px] text-red-400 uppercase tracking-widest">// CMD.02</span>
            <Zap className={`w-4 h-4 ${canReroute ? 'text-red-400 group-hover:scale-110' : 'text-slate-500'} transition-transform`} />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-100 group-hover:text-red-200">
              {getButtonLabel()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {getDisabledReason()}
            </div>
          </div>
        </button>

        {/* 3. Reset Route Selection */}
        <button
          type="button"
          onClick={onResetRoute}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 p-4 rounded-lg flex flex-col justify-between transition-all duration-150 group active:scale-[0.98]"
          aria-label="Reset Route Selection"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">// CMD.03</span>
            <RotateCcw className="w-4 h-4 text-slate-400 group-hover:rotate-[-45deg] transition-transform" />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-100 group-hover:text-slate-200">
              RESET ROUTE MATRIX
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Clear dynamic detour and reset primary vector
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
