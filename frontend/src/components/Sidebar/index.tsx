import { Link, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, Truck, Settings, Radio, Terminal } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', id: '01', label: 'COMMAND CENTER', icon: Activity },
    { path: '/emergencies', id: '02', label: 'EMERGENCIES', icon: ShieldAlert },
    { path: '/resources', id: '03', label: 'RESOURCES', icon: Truck },
    { path: '/settings', id: '04', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <aside className="w-[230px] bg-slate-950 border-r border-slate-800/80 flex flex-col hidden sm:flex shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur shrink-0 justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/40 group-hover:border-cyan-400 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] tactical-border">
            <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-slate-100 uppercase leading-none font-mono flex items-center gap-1">
              RAPID<span className="text-cyan-400">ROUTE</span>
            </span>
            <span className="text-[9px] font-mono font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
              AI COMMAND OS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-2.5 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>OPERATIONAL CHANNELS</span>
          <Terminal className="w-3 h-3 text-slate-400" />
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono tracking-wider transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isActive 
                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)] font-bold' 
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent hover:border-slate-800/80 hover:translate-x-0.5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              )}
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                [{item.id}]
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Telemetry */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-slate-500 text-[10px] font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider">OPS READY</span>
        </div>
        <span className="text-slate-400 font-mono">v1.0.0</span>
      </div>
    </aside>
  );
}


