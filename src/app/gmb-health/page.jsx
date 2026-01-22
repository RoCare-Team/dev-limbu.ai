"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import GBPAuditCard from "@/components/GBPAuditCard";
import { Loader2, Search, MapPin, BarChart3, Sparkles, Activity } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

export default function AuditPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const loadingMessages = [
    "Connecting to Google Business Profile...",
    "Fetching location details...",
    "Analyzing reviews and ratings...",
    "Checking local SEO signals...",
    "Compiling final report..."
  ];

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  useEffect(() => {
    // Load locations from localStorage
    const storedLocations = localStorage.getItem("locationDetails");
    if (storedLocations) {
      try {
        const parsed = JSON.parse(storedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed);
          setSelectedLocationId(parsed[0].locationId);
        }
      } catch (e) {
        console.error("Failed to parse locations", e);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateReport = async () => {
    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to generate report");
      return;
    }

    const selectedLoc = locations.find((l) => l.locationId === selectedLocationId);
    if (!selectedLoc) {
      toast.error("Location details not found");
      return;
    }

    setLoading(true);
    setAuditData(null);
    setLoadingMsgIndex(0);

    try {
      // Construct payload as requested
      const payload = [
        {
          location_id: selectedLoc.locationId,
          account_id: selectedLoc.accountId,
          token: session.accessToken,
        },
      ];

      const res = await fetch(
        "https://n8n.limbutech.in/webhook/10d9cd54-46a7-4c3b-9c61-0ce9cf666eac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch audit data");

      const data = await res.json();
      
      
      // Handle potential response structures
      let audit = data;
      if (Array.isArray(data) && data.length > 0) {
        audit = data[0];
      }
      
      // Handle the specific key structure if present (based on previous code context)
      if (audit && typeof audit === 'object' && "" in audit) {
        audit = audit[""];
      }

      setAuditData(audit);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Audit Error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster />
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 pb-20 pt-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-indigo-400 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl mb-4 ring-1 ring-white/10">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
            GBP Report Card
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Select a location to generate a comprehensive audit of your Google Business Profile performance.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        
        {/* Selection Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-5 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Select Business Location
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="block w-full pl-11 pr-10 py-4 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl transition-all bg-gray-50 hover:bg-white cursor-pointer appearance-none font-medium text-gray-700"
                  disabled={loading || locations.length === 0}
                >
                  {locations.length === 0 ? (
                    <option>No locations found</option>
                  ) : (
                    locations.map((loc) => (
                      <option key={loc.locationId} value={loc.locationId}>
                        {loc.title} {loc.locality ? `— ${loc.locality}` : ""}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading || locations.length === 0}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {auditData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">
            <GBPAuditCard audit={auditData} />
          </div>
        )}
        
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500 mb-12">
            
            {/* Scanning Animation */}
            <div className="relative w-24 h-32 bg-slate-50 rounded-lg border-2 border-slate-200 mb-8 overflow-hidden flex flex-col gap-2 p-3 shadow-inner">
              <div className="h-2 w-3/4 bg-slate-200 rounded" />
              <div className="h-2 w-full bg-slate-200 rounded" />
              <div className="h-2 w-5/6 bg-slate-200 rounded" />
              <div className="h-2 w-full bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-100 rounded mt-2 border border-slate-200 border-dashed" />

              {/* Scanning Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-scan-vertical" />
            </div>
            
            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-2xl font-bold text-gray-800 animate-pulse">
                {loadingMessages[loadingMsgIndex]}
              </h3>
              <p className="text-gray-500 font-medium">
                Our AI is analyzing over 50+ data points to generate your scorecard.
              </p>
              
              {/* Progress Bar */}
              <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden mx-auto">
                 <div className="h-full bg-blue-600 rounded-full animate-progress-indeterminate" />
              </div>
            </div>
          </div>
        )}

        {!auditData && !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-2xl mx-auto">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500">
                Select a location from the dropdown above and click "Generate Report" to see your detailed performance metrics.
              </p>
            </div>
          </div>
        )}
      </div>
      

      <SupportModal showToast={showToast} />
      
      <style jsx>{`
        @keyframes scan-vertical {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-vertical {
          animation: scan-vertical 2s linear infinite;
        }
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
