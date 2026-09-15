import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useEmergencyContext } from '../context/EmergencyContext';

export const EmergencyDetailsModal: React.FC = () => {
  const {
    isDetailsOpen,
    setIsDetailsOpen,
    selectedEmergency,
    rawSelectedEmergency,
    assignedAmbulance,
    destinationHospital,
    isRerouted,
  } = useEmergencyContext();

  if (!isDetailsOpen || !selectedEmergency) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      onClick={() => setIsDetailsOpen(false)}
    >
      <div 
        className="bg-slate-950 border border-slate-700/80 rounded-lg w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 tactical-border"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-slate-100 font-bold uppercase tracking-wide text-sm flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            Emergency Details
          </h2>
          <button 
            onClick={() => setIsDetailsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* Emergency Section */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Emergency</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">ID</span>
                <span className="text-slate-200 font-medium">{selectedEmergency.id}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Type</span>
                <span className="text-slate-200 font-medium">{selectedEmergency.type}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Severity</span>
                <span className={`font-bold ${
                  selectedEmergency.severity === 'Critical' ? 'text-red-400' :
                  selectedEmergency.severity === 'High' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {selectedEmergency.severity}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Reported Time</span>
                <span className="text-slate-200">{selectedEmergency.timestamp}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 text-xs block mb-0.5">Location</span>
                <span className="text-slate-200">{selectedEmergency.locationName}</span>
              </div>
            </div>
          </section>

          {/* Dispatch Section */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Dispatch</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Assigned Ambulance</span>
                <span className="text-blue-400 font-medium">{assignedAmbulance?.id || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Ambulance Status</span>
                <span className="text-slate-200">{assignedAmbulance?.status || 'Unknown'}</span>
              </div>
            </div>
          </section>

          {/* Destination Section */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">Destination</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <span className="text-slate-500 text-xs block mb-0.5">Hospital Name</span>
                <span className="text-green-400 font-medium">{destinationHospital?.name || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Capability</span>
                <span className="text-slate-200">{destinationHospital?.capability || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Availability</span>
                <span className="text-slate-200">Available</span>
              </div>
            </div>
          </section>

          {/* Route Section */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
              Route
              {isRerouted && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px]">REROUTED</span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">ETA</span>
                <span className="text-slate-200 font-medium">
                  {isRerouted && rawSelectedEmergency?.alternativeRoute ? (
                    <>
                      <span className="text-slate-500 line-through mr-1.5 text-xs">{rawSelectedEmergency.eta}</span>
                      <span className="text-blue-400">{selectedEmergency.eta}</span>
                    </>
                  ) : (
                    selectedEmergency.eta || '--'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Distance</span>
                <span className="text-slate-200">{selectedEmergency.distance || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Traffic Condition</span>
                <span className={`${selectedEmergency.trafficCondition === 'MODERATE' ? 'text-amber-400' : 'text-green-400'} font-semibold`}>
                  {selectedEmergency.trafficCondition || '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Route Status</span>
                <span className="text-slate-200">{isRerouted ? 'Alternative Active' : 'Primary Active'}</span>
              </div>
              
              {isRerouted && (
                <div className="col-span-2 mt-2 bg-amber-500/10 border border-amber-500/20 rounded p-3 text-amber-400/90 text-xs">
                  <div className="font-bold uppercase tracking-wider mb-1 text-amber-500">Reroute Reason</div>
                  Traffic incident detected on original route. Time saved: {rawSelectedEmergency?.alternativeRoute?.timeSaved}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
export default EmergencyDetailsModal;
