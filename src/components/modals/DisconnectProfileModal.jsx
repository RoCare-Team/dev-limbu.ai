import { LogOut, AlertTriangle, X } from "lucide-react";

function DisconnectProfileModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  platformName = "Profile",
  customMessage
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] w-full max-w-md p-8 md:p-12 border border-black/[0.03] overflow-hidden text-center animate-scaleIn">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-20"
        >
          <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
        </button>

        {/* Subtle background grid */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Ambient Glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 bg-black border border-red-100">
            <AlertTriangle size={12} className="text-yellow-500" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-yellow-500">
              Confirm Disconnect
            </span>
          </div>

          <div className="w-20 h-20 rounded-[1.5rem] bg-red-50 flex items-center justify-center mb-8 border border-red-100 shadow-sm">
            <LogOut className="h-10 w-10 text-yellow-400" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-black mb-4 uppercase tracking-tight font-heading leading-tight">
            Disconnect <span className="text-yellow-400">{platformName}?</span>
          </h2>

          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed px-2">
            {customMessage || `Are you sure you want to disconnect this ${platformName} account? This action cannot be undone.`}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-yellow-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:bg-yellow-500 transition-all"
            >
              Yes, Disconnect
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisconnectProfileModal;