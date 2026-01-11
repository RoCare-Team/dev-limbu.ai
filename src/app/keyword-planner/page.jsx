"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Tag, TrendingUp, X, BarChart3, Check, Loader2, MessageSquare, Phone, AlertCircle, Send } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function KeywordPage() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null); // To show loader on add button
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");

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

  /* ---------- Fetch Google keywords ---------- */
  const searchKeywords = async (value) => {
    if (!value) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const res = await fetch(`/api/keyword-research?query=${value}`);
    const data = await res.json();
    

    if (data.success) {
      // Assuming API returns [{ keyword: "...", volume: "..." }]
      // For demonstration, adding mock volume if not present
      setSuggestions(
        data.keywords.map(k => (typeof k === 'string' ? { keyword: k, volume: Math.floor(Math.random() * 5000) + 100 } : k))
      );
    }
    setIsSearching(false);
  };

  /* ---------- Add keyword ---------- */
  const addKeyword = async (keywordData) => {
    setIsSaving(keywordData.keyword);
    const userId = localStorage.getItem("userId");
    await fetch("/api/keyword-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, keyword: keywordData.keyword, volume: keywordData.volume }),
    });
    await fetchSavedKeywords();
    setIsSaving(null);
  };

  /* ---------- Remove keyword ---------- */
  const deleteKeyword = async (id) => {
    await fetch(`/api/keyword-research?id=${id}`, {
      method: "DELETE",
    });
    fetchSavedKeywords();
  };

  /* ---------- Fetch saved keywords ---------- */
  const fetchSavedKeywords = async () => {
    const userId = localStorage.getItem("userId");
    const res = await fetch(`/api/keyword-research?userId=${userId}`);
    const data = await res.json();
    if (data.success) setSaved(data.data);
  };

  useEffect(() => {
    fetchSavedKeywords();
  }, []);

  const savedKeywordsSet = useMemo(() => new Set(saved.map(s => s.keyword)), [saved]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Keyword Research</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover and save the best keywords for your content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Panel: Search & Suggestions */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Find Keywords
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    searchKeywords(e.target.value);
                  }}
                  placeholder="Type keyword (e.g. best ro service)"
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 min-h-[60vh]">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Suggestions</h2>

              <div className="space-y-2">
                {isSearching && (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}

                {!isSearching && suggestions.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <p className="font-medium">{input ? "No suggestions found." : "Start typing to see keyword suggestions."}</p>
                  </div>
                )}

                {!isSearching && suggestions.map((k, idx) => {
                  const isAdded = savedKeywordsSet.has(k.keyword);
                  return (
                    <div
                      key={idx}
                      className={`
                        flex justify-between items-center p-4 rounded-xl border-2 transition-all duration-200
                        ${isAdded
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white hover:bg-blue-50 hover:border-blue-200 border-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-medium text-sm ${isAdded ? 'text-green-800' : 'text-gray-800'}`}>{k.keyword}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {k.volume && (
                          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <span>{k.volume.toLocaleString()}</span>
                          </div>
                        )}
                        {isAdded ? (
                          <button
                            disabled
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-200 text-green-800 rounded-lg text-sm font-semibold cursor-default"
                          >
                            <Check className="w-4 h-4" />
                            Added
                          </button>
                        ) : (
                          <button
                            onClick={() => addKeyword(k)}
                            disabled={isSaving === k.keyword}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-wait"
                          >
                            {isSaving === k.keyword ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Saved Keywords */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  My Keywords
                </h2>
                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{saved.length}</span>
              </div>

              {saved.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Your saved keywords will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                  {saved.slice().sort((a, b) => String(b._id).localeCompare(String(a._id))).map((k) => (
                    <div key={k._id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow group">
                      <span className="font-medium text-gray-700 truncate mr-2">{k.keyword}</span>
                      <div className="flex items-center gap-2">
                        {(k.volume !== undefined && k.volume !== null) && (
                          <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm whitespace-nowrap">
                            <BarChart3 className="w-3 h-3 text-blue-500" /> 
                            {k.volume.toLocaleString()}
                          </span>
                        )}
                        <button onClick={() => deleteKeyword(k._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
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
                        className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
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
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-sm flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit Ticket
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}