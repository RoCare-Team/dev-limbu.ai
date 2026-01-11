"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import GBPAuditCard from "@/components/GBPAuditCard";
import { Loader2, Search, MapPin, BarChart3, Sparkles, FileText, CheckCircle2, ScanLine, Activity, MessageSquare, Phone, AlertCircle, Send, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AuditPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");

  const loadingMessages = [
    "Connecting to Google Business Profile...",
    "Fetching location details...",
    "Analyzing reviews and ratings...",
    "Checking local SEO signals...",
    "Compiling final report..."
  ];

  // Show support popup after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSupportPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto hide support popup after 5 seconds
  useEffect(() => {
    if (showSupportPopup) {
      const timer = setTimeout(() => {
        setShowSupportPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSupportPopup]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    
    const loadingToast = toast.loading("Submitting issue...");
    
    // Simulate API call
    setTimeout(() => {
        toast.success("Issue reported! We'll contact you shortly.", { id: loadingToast });
        setShowIssueModal(false);
        setIssueText("");
        setShowSupportPopup(false);
    }, 1500);
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

      {/* Reopen Support Popup Button */}
      {!showSupportPopup && (
        <button
          onClick={() => setShowSupportPopup(true)}
          className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:scale-110 group animate-in fade-in zoom-in duration-300"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </button>
      )}

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-sm w-full animate-in slide-in-from-right fade-in duration-500">
          <div className="bg-white/95 backdrop-blur-md border border-blue-100 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
            <button 
              onClick={() => setShowSupportPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-4 items-start">
              <div className="bg-blue-50 p-3 rounded-full flex-shrink-0 animate-pulse">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Need Help?</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Facing any issues? Let us know and we'll fix it for you.
                </p>
                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => setShowIssueModal(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                    >
                    Report Issue
                    </button>
                    <a href="tel:9289344726" className="flex-1 inline-flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all whitespace-nowrap">
                        <Phone className="w-3 h-3" /> 9289344726
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
                    <p className="text-sm text-gray-500">We'll help you resolve it quickly.</p>
                </div>
            </div>

            <form onSubmit={handleIssueSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe the issue</label>
                    <textarea
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        placeholder="e.g., I cannot connect my GMB account..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] text-sm resize-none"
                        required
                    />
                </div>
                
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowIssueModal(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-sm flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit Ticket
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
      
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
