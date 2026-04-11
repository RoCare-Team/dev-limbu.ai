"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Tag,
  TrendingUp,
  X,
  BarChart3,
  Check,
  Loader2,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Database
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import SupportModal from "@/components/SupportModal";

export default function KeywordPage() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null);

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

    const res = await fetch(
      "https://n8n.limbutech.in/webhook/4dc0fc39-0e04-4d74-a189-1c4f09bd6894",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: value,
        }),
      },
    );

    const data = await res.json();

    if (data.results) {
      const mappedSuggestions = data.results.map((item) => ({
        keyword: item.text,
        volume: item.keywordIdeaMetrics?.avgMonthlySearches
          ? parseInt(item.keywordIdeaMetrics.avgMonthlySearches)
          : 0,
        competition: item.keywordIdeaMetrics?.competition,
        competitionIndex: item.keywordIdeaMetrics?.competitionIndex,
      }));
      setSuggestions(mappedSuggestions);
    } else if (data.success) {
      setSuggestions(
        data.keywords.map((k) =>
          typeof k === "string"
            ? { keyword: k, volume: Math.floor(Math.random() * 5000) + 100 }
            : k,
        ),
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
      body: JSON.stringify({
        userId,
        keyword: keywordData.keyword,
        volume: keywordData.volume,
        competition: keywordData.competition,
      }),
    });
    await fetchSavedKeywords();
    setIsSaving(null);
    toast.success(`'${keywordData.keyword}' added successfully`);
  };

  /* ---------- Remove keyword ---------- */
  const deleteKeyword = async (id) => {
    await fetch(`/api/keyword-research?id=${id}`, {
      method: "DELETE",
    });
    fetchSavedKeywords();
    toast.success("Keyword removed");
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

  const savedKeywordsSet = useMemo(
    () => new Set(saved.map((s) => s.keyword)),
    [saved],
  );

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Keyword <span className="text-lemon-hover">Planner</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Discovery & SEO Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Google Nodes Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Search & Suggestions */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Search Box */}
            <div className="bg-white rounded-[2rem] shadow-sm border-2 border-black/10 p-6 sm:p-10 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Search className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Target Discovery</h2>
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-lemon-hover transition-colors w-4 h-4" />
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    searchKeywords(e.target.value);
                  }}
                  placeholder="Enter business niche or service..."
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-lemon-glow transition-all outline-none"
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 className="text-lemon-hover w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-black/10 p-6 sm:p-8 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lemon-glow/10 rounded-lg border border-lemon-glow/20">
                    <TrendingUp className="w-4 h-4 text-lemon-hover" />
                  </div>
                  <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Intent Analysis</h2>
                </div>
                {suggestions.length > 0 && !isSearching && (
                  <span className="text-[9px] font-black bg-black text-lemon-glow px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {suggestions.length} Signals Found
                  </span>
                )}
              </div>

              <div className="flex-1 px-2">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Scanning Search Nodes...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-black/5">
                      <Target className="w-8 h-8 text-slate-100" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                      {input
                        ? "No high-ranking patterns found."
                        : "Initialize discovery by entering a keyword above."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-black/5 mb-4">
                      <div className="col-span-6">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Keyword Node</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Volume</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Comp.</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Action</span>
                      </div>
                    </div>

                    {suggestions.map((k, idx) => {
                      const isAdded = savedKeywordsSet.has(k.keyword);
                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 items-center p-4 rounded-xl border transition-all duration-300 ${
                            isAdded
                              ? "bg-slate-50 border-black/5"
                              : "bg-white border-black/5 hover:border-lemon-hover hover:shadow-lg"
                          }`}
                        >
                          <div className="col-span-6 flex items-center gap-3 pr-2">
                            <span className={`font-bold text-xs truncate ${isAdded ? "text-slate-300 line-through" : "text-black"}`}>
                              {k.keyword}
                            </span>
                            {k.competitionIndex > 80 && !isAdded && (
                              <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">High Potential</span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-[10px] font-black text-black">
                              {k.volume ? k.volume.toLocaleString() : "-"}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-center">
                             {k.competition && (
                                <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                                  k.competition === "LOW" ? "bg-green-50 text-green-600 border-green-100" :
                                  k.competition === "MEDIUM" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                                  "bg-red-50 text-red-600 border-red-100"
                                }`}>
                                  {k.competition}
                                </span>
                             )}
                          </div>
                          <div className="col-span-2 text-right">
                            {isAdded ? (
                              <div className="flex items-center justify-end text-green-500 gap-1 pr-1">
                                <Check className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Added</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => addKeyword(k)}
                                disabled={isSaving === k.keyword}
                                className="btn-lemon w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-none"
                              >
                                {isSaving === k.keyword ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Saved Keywords */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-black/5 p-6 sm:p-8 shadow-sm relative overflow-hidden">
               {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-3xl -mr-16 -mt-16" />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 border border-black/5 rounded-xl flex items-center justify-center">
                      <Database className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-black uppercase tracking-tight leading-none mb-1">Keyword Vault</h2>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Stored Assets</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-lemon-hover bg-lemon-glow/10 px-2.5 py-1 rounded-full">
                    {saved.length}
                  </span>
                </div>

                {saved.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-black/5 rounded-2xl p-10 text-center">
                    <div className="w-10 h-10 rounded-full border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                       <Plus className="w-4 h-4 text-slate-200" />
                    </div>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Vault is Empty</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 custom-scroll">
                    {saved
                      .slice()
                      .sort((a, b) => String(b._id).localeCompare(String(a._id)))
                      .map((k) => (
                        <div
                          key={k._id}
                          className="bg-slate-50 border border-black/5 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <p className="font-bold text-black text-[11px] uppercase tracking-tight truncate mb-2">
                                {k.keyword}
                              </p>
                              <div className="flex items-center gap-2">
                                {k.competition && (
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                                    k.competition === "LOW" ? "bg-green-100 text-green-700" :
                                    k.competition === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {k.competition}
                                  </span>
                                )}
                                {k.volume && (
                                   <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                                      <BarChart3 className="w-2.5 h-2.5" />
                                      {k.volume.toLocaleString()}
                                   </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteKeyword(k._id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden border border-lemon-glow/20">
               <div className="absolute top-0 right-0 w-24 h-24 bg-lemon-glow/10 rounded-full blur-3xl -mr-8 -mt-8" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-4 h-4 text-lemon-glow" />
                    <h4 className="text-[10px] font-black text-lemon-glow uppercase tracking-widest">AI Intelligence</h4>
                 </div>
                 <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    Vaulted keywords are automatically injected into your Magic Post prompts to maximize local SEO authority.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <SupportModal showToast={showToast} />
    </div>
  );
}
