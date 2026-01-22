"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Tag, TrendingUp, X, BarChart3, Check, Loader2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import SupportModal from "@/components/SupportModal";

export default function KeywordPage() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null); // To show loader on add button
  const { data: session } = useSession();

  const showToast = (message, type) => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  /* ---------- Fetch Google keywords ---------- */
  const searchKeywords = async (value) => {
    if (!value) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const res = await fetch('https://n8n.limbutech.in/webhook/4dc0fc39-0e04-4d74-a189-1c4f09bd6894', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: value
      })
    });



    const data = await res.json();

    if (data.results) {
      // Handle Google Ads API response format
      const mappedSuggestions = data.results.map((item) => ({
        keyword: item.text,
        volume: item.keywordIdeaMetrics?.avgMonthlySearches ? parseInt(item.keywordIdeaMetrics.avgMonthlySearches) : 0,
        competition: item.keywordIdeaMetrics?.competition,
        competitionIndex: item.keywordIdeaMetrics?.competitionIndex,
      }));
      setSuggestions(mappedSuggestions);
    } else if (data.success) {
      // Fallback for previous format
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
      body: JSON.stringify({ userId, keyword: keywordData.keyword, volume: keywordData.volume, competition: keywordData.competition }),
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
                  className="w-full pl-12 pr-12 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                )}
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
                        {k.competition && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-block ${k.competition === 'LOW' ? 'bg-green-100 text-green-700' :
                              k.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {k.competition}
                          </span>
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
                      <div className="flex flex-col min-w-0 mr-2 gap-1">
                        <span className="font-medium text-gray-700 truncate">{k.keyword}</span>
                        {k.competition && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${k.competition === 'LOW' ? 'bg-green-100 text-green-700' :
                              k.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {k.competition}
                          </span>
                        )}
                      </div>
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

      <SupportModal showToast={showToast} />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919289344726"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-9 h-9 fill-white"
        >
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </div>
  );
}