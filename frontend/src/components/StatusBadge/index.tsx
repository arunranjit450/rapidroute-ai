export default function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'operational' | 'warning' | 'critical', 
  label: string 
}) {
  const getColors = () => {
    switch (status) {
      case 'operational': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getColors()}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          status === 'operational' ? 'bg-green-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          status === 'operational' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
        }`}></span>
      </span>
      {label}
    </div>
  );
}
