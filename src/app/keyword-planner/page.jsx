"use client";
import React, { useCallback } from "react";
import {
  Plus,
  TrendingUp,
  Loader2,
  ArrowLeft,
  Sparkles,
  Target,
  Database
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { List } from "react-window";
import { useKeywordPlanner } from "@/hooks/useKeywordPlanner";
import SupportModal from "@/components/SupportModal";
import SavedKeywordRow from "@/components/keywords-planner/SavedKeywordRow";
import SearchInputBox from "@/components/keywords-planner/SearchInputBox";
import VirtualizedRow from "@/components/keywords-planner/VirtualizedRow";

export default function KeywordPage() {
  const {
    suggestions,
    sortedSaved,
    savedKeywordsSet,
    isSearching,
    isSaving,
    searchKeywords,
    addKeyword,
    deleteKeyword
  } = useKeywordPlanner();

  const handleShowToast = useCallback((message, type) => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-right" />

      {/* ── Background Patterns ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{ background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)" }}
      />

      {/* Header Section */}
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
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Find what your customers are searching for</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Live Search Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Search Panel */}
          <div className="lg:col-span-8 space-y-8">

            {/* Isolated Search Box Component */}
            <SearchInputBox onSearch={searchKeywords} isSearching={isSearching} />

            {/* Suggestions List */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-black/10 p-6 sm:p-8 h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lemon-glow/10 rounded-lg border border-lemon-glow/20">
                    <TrendingUp className="w-4 h-4 text-lemon-hover" />
                  </div>
                  <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Customer Search Results</h2>
                </div>
                {suggestions.length > 0 && !isSearching && (
                  <span className="text-[9px] font-black bg-black text-lemon-glow px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {suggestions.length} Ideas Found
                  </span>
                )}
              </div>

              <div className="flex-1 px-2 flex flex-col min-h-0">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Looking for ideas...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-black/5">
                      <Target className="w-8 h-8 text-amber-300" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                      Start by typing a business or service above to discover powerful keywords.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Sticky Header */}
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-black/5 shrink-0">
                      <div className="col-span-6">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Search Word</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Popularity</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Difficulty</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Save</span>
                      </div>
                    </div>

                    {/* Virtualized Scrollable List */}
                    <div className="flex-1 mt-2">
                      <List
                        style={{ height: "340px", width: "100%" }}
                        className="custom-scroll"
                        rowCount={suggestions.length}
                        rowHeight={74}
                        rowComponent={VirtualizedRow}
                        rowProps={{
                          suggestions,
                          savedKeywordsSet,
                          isSaving,
                          addKeyword,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Sidebar: Saved Keywords */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-black/5 p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-3xl -mr-16 -mt-16" />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 border border-black/5 rounded-xl flex items-center justify-center">
                      <Database className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-black uppercase tracking-tight leading-none mb-1">Saved Keywords</h2>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Your List</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-lemon-hover bg-lemon-glow/10 px-2.5 py-1 rounded-full">
                    {sortedSaved.length}
                  </span>
                </div>

                {sortedSaved.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-black/5 rounded-2xl p-10 text-center">
                    <div className="w-10 h-10 rounded-full border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-4 h-4 text-slate-200" />
                    </div>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Your list is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 custom-scroll">
                    {sortedSaved.map((item) => (
                      <SavedKeywordRow
                        key={item._id}
                        item={item}
                        onDelete={deleteKeyword}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Tip Box */}
            <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden border border-lemon-glow/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-lemon-glow/10 rounded-full blur-3xl -mr-8 -mt-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-4 h-4 text-lemon-glow" />
                  <h4 className="text-[10px] font-black text-lemon-glow uppercase tracking-widest">Smart Tip</h4>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Saved words are used to help your business show up better on Google when you create posts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupportModal showToast={handleShowToast} />
    </div>
  );
}