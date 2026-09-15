import { Map, Wifi } from 'lucide-react';
import LiveMap from '../LiveMap';
import { Emergency } from '../../types';

interface LiveResponseMatrixProps {
  selectedEmergencyId: string | null;
  onSelectEmergency: (id: string | null) => void;
  isRerouted: boolean;
  selectedEmergency?: Emergency | null;
}

export default function LiveResponseMatrix({
  selectedEmergencyId,
  onSelectEmergency,
  isRerouted,
  selectedEmergency,
}: LiveResponseMatrixProps) {
  return (
    <section
      className="bg-slate-950/90 border border-slate-800/80 rounded-lg overflow-hidden flex flex-col relative shadow-2xl tactical-border h-[460px] lg:h-[520px] min-h-[440px] w-full"
      aria-label="Live Response Matrix"
    >
      {/* Top Header Overlay Bar */}
      <div className="absolute top-3 left-3 bg-slate-950/95 backdrop-blur border border-slate-800/90 px-3 py-1.5 rounded text-xs font-mono text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2.5 z-10 shadow-xl">
        <Map className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-cyan-400 font-extrabold">// 01</span>
        <span className="text-slate-100">LIVE RESPONSE MATRIX</span>
        <span className="text-slate-700">&bull;</span>
        <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          GPS LOCK
        </span>
        <span className="text-slate-700">&bull;</span>
        <span className={`text-[10px] flex items-center gap-1.5 font-mono ${isRerouted ? 'text-amber-400' : 'text-cyan-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRerouted ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'}`}></span>
          {isRerouted ? 'DETOUR ACTIVE' : 'ROUTE ACTIVE'}
        </span>
      </div>

      {/* Top Right Target Telemetry Badge */}
      {selectedEmergency && (
        <div className="hidden sm:flex absolute top-3 right-3 bg-slate-950/95 backdrop-blur border border-slate-800/90 px-3 py-1.5 rounded text-[10px] font-mono text-slate-300 z-10 shadow-xl items-center gap-3">
          <div>
            <span className="text-slate-500 uppercase block text-[9px]">TARGET ID</span>
            <span className="text-cyan-400 font-bold">{selectedEmergency.id}</span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 uppercase block text-[9px]">VECTOR</span>
            <span className="text-slate-200 font-bold">{selectedEmergency.distance || '--'}</span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 uppercase block text-[9px]">EST. ETA</span>
            <span className="text-emerald-400 font-bold">{selectedEmergency.eta || '--'}</span>
          </div>
          <div className="border-l border-slate-800 pl-3 flex items-center gap-1 text-slate-400">
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span>12ms</span>
          </div>
        </div>
      )}

      {/* Leaflet Live Map Render */}
      <div className="w-full h-full flex-1 overflow-hidden z-0 min-h-[440px] relative">
        <LiveMap
          selectedEmergencyId={selectedEmergencyId}
          onSelectEmergency={onSelectEmergency}
          isRerouted={isRerouted}
        />
      </div>
    </section>
  );
}
