import { useState, useEffect } from 'react';
import { Radio, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

interface SystemBootSequenceProps {
  onComplete?: () => void;
}

export default function SystemBootSequence({ onComplete }: SystemBootSequenceProps) {
  const [bootStep, setBootStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    const hasBooted = sessionStorage.getItem('rapidroute_boot_completed');
    if (hasBooted === 'true') {
      setShouldRender(false);
      if (onComplete) onComplete();
      return;
    }

    // Step sequence timeline (Total duration: ~1100ms + 300ms fade out = 1400ms max)
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setBootStep(1), 200));  // SYS.INIT
    timers.push(setTimeout(() => setBootStep(2), 400));  // ROUTING ENGINE
    timers.push(setTimeout(() => setBootStep(3), 600));  // DISPATCH ENGINE
    timers.push(setTimeout(() => setBootStep(4), 800));  // MEDICAL NETWORK & GPS
    timers.push(setTimeout(() => setBootStep(5), 1000)); // AI ENGINE ONLINE

    // Complete boot and fade out at 1100ms
    timers.push(
      setTimeout(() => {
        setIsFadingOut(true);
        sessionStorage.setItem('rapidroute_boot_completed', 'true');
      }, 1100)
    );

    // Remove component from DOM at 1400ms
    timers.push(
      setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 1400)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  // Handle Keyboard Escape to skip immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldRender) {
        sessionStorage.setItem('rapidroute_boot_completed', 'true');
        setShouldRender(false);
        if (onComplete) onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12 font-mono select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="region"
      aria-label="System Boot Sequence"
    >
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-widest uppercase">
              RAPIDROUTE AI
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wider">
              EMERGENCY RESPONSE NETWORK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded text-xs text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>SYS.INIT.01</span>
        </div>
      </div>

      {/* Center Initialization Telemetry Readout */}
      <div className="max-w-xl mx-auto w-full my-auto space-y-6">
        <div className="text-center space-y-1">
          <div className="text-xs text-slate-500 uppercase tracking-widest">
            INITIALIZING TACTICAL OPERATING SYSTEM
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 uppercase tracking-wider flex items-center justify-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span>ESTABLISHING OPERATIONAL AWARENESS</span>
          </div>
        </div>

        {/* Telemetry Output Lines */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-lg p-5 text-xs space-y-2.5 font-mono shadow-2xl tactical-border">
          <div className={`flex justify-between items-center transition-opacity duration-150 ${bootStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-400">SYS.INIT</span>
            <span className="text-cyan-400 font-bold">BOOT SEQUENCE ENGAGED</span>
          </div>

          <div className={`flex justify-between items-center transition-opacity duration-150 ${bootStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-400">ROUTING ENGINE</span>
            <span className="text-slate-500 font-mono">................</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> READY
            </span>
          </div>

          <div className={`flex justify-between items-center transition-opacity duration-150 ${bootStep >= 3 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-400">DISPATCH ENGINE</span>
            <span className="text-slate-500 font-mono">...............</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> READY
            </span>
          </div>

          <div className={`flex justify-between items-center transition-opacity duration-150 ${bootStep >= 4 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-400">MEDICAL NETWORK</span>
            <span className="text-slate-500 font-mono">...............</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> READY
            </span>
          </div>

          <div className={`flex justify-between items-center transition-opacity duration-150 ${bootStep >= 4 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-400">GPS NETWORK</span>
            <span className="text-slate-500 font-mono">...................</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> LOCKED
            </span>
          </div>

          <div className={`flex justify-between items-center pt-2 border-t border-slate-800 transition-opacity duration-150 ${bootStep >= 5 ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-slate-300 font-bold">AI ENGINE</span>
            <span className="text-slate-500 font-mono">.....................</span>
            <span className="text-cyan-300 font-bold bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info & Skip Hint */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-500">
        <div>RAPIDROUTE AI v1.0 &bull; KERALA EMERGENCY COMMAND MATRIX</div>
        <div className="flex items-center gap-2">
          <span>PRESS</span>
          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">ESC</kbd>
          <span>TO SKIP</span>
        </div>
      </div>
    </div>
  );
}
