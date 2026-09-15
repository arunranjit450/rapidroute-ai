import { Radio, ShieldAlert } from 'lucide-react';

export default function CommandCenterHero() {
  return (
    <section
      className="bg-slate-950 border-b border-slate-800/80 pb-6 pt-2 font-mono select-none animate-fade-in"
      aria-label="Operational Intro"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* Main Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <span>// SYS.OPS.01</span>
            <span className="text-slate-700">&bull;</span>
            <span>EMERGENCY RESPONSE NETWORK</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight uppercase font-mono">
            RAPIDROUTE <span className="text-cyan-400">AI COMMAND CENTER</span>
          </h1>

          <p className="text-xs text-slate-400 font-mono tracking-wide flex items-center gap-2">
            <span>REAL-TIME INCIDENT DETECTION</span>
            <span className="text-slate-700">&bull;</span>
            <span>ROUTE INTELLIGENCE</span>
            <span className="text-slate-700">&bull;</span>
            <span>DISPATCH COORDINATION</span>
          </p>
        </div>

        {/* System Status Readout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded text-xs text-cyan-300 font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold tracking-wider">LIVE OPS ENGINE</span>
            <span className="text-slate-700">&bull;</span>
            <span className="text-slate-300 font-bold">ONLINE</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1.5 rounded text-slate-400 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>INCIDENT MATRIX ACTIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
