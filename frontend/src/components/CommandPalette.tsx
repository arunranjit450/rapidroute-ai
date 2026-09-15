import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  ShieldAlert,
  Truck,
  Settings,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  X,
  Command
} from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'INCIDENTS' | 'SYSTEM ACTIONS';
  title: string;
  subtitle?: string;
  shortcutHint?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const {
    emergencies,
    setSelectedEmergencyId,
    dispatchSettings,
    setDispatchSettings,
    mapSettings,
    setMapSettings
  } = useEmergencyContext();

  // Listen for global keyboard shortcut (Ctrl+K / Cmd+K) and custom open event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct command items list
  const navigationCommands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      category: 'NAVIGATION',
      title: 'GO TO COMMAND CENTER',
      subtitle: 'Main tactical live dispatch overview & map',
      shortcutHint: '01',
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      action: () => {
        navigate('/');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-emergencies',
      category: 'NAVIGATION',
      title: 'GO TO INCIDENT CONTROL',
      subtitle: 'Active incident registry & priority emergency list',
      shortcutHint: '02',
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      action: () => {
        navigate('/emergencies');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-resources',
      category: 'NAVIGATION',
      title: 'GO TO ASSET OPERATIONS',
      subtitle: 'Ambulance fleet status & medical facility directory',
      shortcutHint: '03',
      icon: <Truck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        navigate('/resources');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-settings',
      category: 'NAVIGATION',
      title: 'GO TO SYSTEM CONFIGURATION',
      subtitle: 'Platform parameters, map matrix & alert channels',
      shortcutHint: '04',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
  ];

  const incidentCommands: CommandItem[] = emergencies.map(e => ({
    id: `incident-${e.id}`,
    category: 'INCIDENTS',
    title: `SELECT INCIDENT: [${e.id}] ${e.type}`,
    subtitle: `Severity: ${e.severity.toUpperCase()} • Location: ${e.locationName}`,
    icon: <MapPin className="w-4 h-4 text-red-400" />,
    action: () => {
      setSelectedEmergencyId(e.id);
      navigate('/');
      setIsOpen(false);
    },
  }));

  const systemActionCommands: CommandItem[] = [
    {
      id: 'action-auto-dispatch',
      category: 'SYSTEM ACTIONS',
      title: `TOGGLE AUTO-DISPATCH [${dispatchSettings.autoDispatch ? 'ENABLED' : 'DISABLED'}]`,
      subtitle: 'Automatically assign available ambulances to new incidents',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setDispatchSettings(prev => ({ ...prev, autoDispatch: !prev.autoDispatch }));
        setIsOpen(false);
      },
    },
    {
      id: 'action-ambulance-markers',
      category: 'SYSTEM ACTIONS',
      title: `TOGGLE AMBULANCE MARKERS [${mapSettings.showAmbulances ? 'VISIBLE' : 'HIDDEN'}]`,
      subtitle: 'Show/hide ambulance markers on the live routing map',
      icon: <Truck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setMapSettings(prev => ({ ...prev, showAmbulances: !prev.showAmbulances }));
        setIsOpen(false);
      },
    },
    {
      id: 'action-reset-route',
      category: 'SYSTEM ACTIONS',
      title: 'RESET ACTIVE ROUTE SELECTION',
      subtitle: 'Clear selected emergency focus and route matrix',
      icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
      action: () => {
        setSelectedEmergencyId(null);
        navigate('/');
        setIsOpen(false);
      },
    },
  ];

  const allCommands = [...navigationCommands, ...incidentCommands, ...systemActionCommands];

  const filteredCommands = allCommands.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcutHint && cmd.shortcutHint.includes(q))
    );
  });

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCommands.length]);

  // Handle keyboard events inside dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-slate-950/95 border border-cyan-500/40 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.2)] tactical-border overflow-hidden flex flex-col max-h-[80vh] font-mono text-slate-200 select-none"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/90 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Command className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
              COMMAND PALETTE
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
              SYS.CMD.01
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
            aria-label="Close Command Palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-800/80 bg-slate-950">
          <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands or navigate..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            aria-label="Search commands"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Command Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto max-h-96 py-2 custom-scrollbar space-y-0.5"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              NO MATCHING COMMANDS FOUND
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors duration-150 border-l-2 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                      : 'border-transparent hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-1.5 rounded transition-colors ${
                        isSelected ? 'bg-cyan-900/60 border border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono tracking-wide truncate">
                          {cmd.title}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-slate-900 text-slate-500 border border-slate-800">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcutHint && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                        [{cmd.shortcutHint}]
                      </span>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800/90 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">↑↓</kbd> NAVIGATE
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">↵</kbd> EXECUTE
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">ESC</kbd> CLOSE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-cyan-400 font-bold">
            <span>RAPIDROUTE AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
