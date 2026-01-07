"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Tag, TrendingUp, X, BarChart3, Check, Loader2 } from "lucide-react";

export default function KeywordPage() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null); // To show loader on add button

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
    </div>
  );
}