"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useKeywordPlanner() {
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null);

  const fetchSavedKeywords = useCallback(async () => {
    const userId = getLocalStorage("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/api/keyword-research?userId=${userId}`);
      const data = await res.json();
      if (data.success) setSaved(data.data);
    } catch (error) {
      console.error("Failed to fetch saved keywords:", error);
    }
  }, []);

  const searchKeywords = useCallback(async (value) => {
    if (!value) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
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
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Could not find ideas right now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addKeyword = useCallback(async (keywordData) => {
    setIsSaving(keywordData.keyword);
    const userId = getLocalStorage("userId");

    // OPTIMISTIC UPDATE: Turant list mein add kar do
    const tempKeyword = {
      _id: "temp_" + Date.now(),
      keyword: keywordData.keyword,
      volume: keywordData.volume,
      competition: keywordData.competition
    };
    setSaved(prev => [tempKeyword, ...prev]); // Add to top

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          keyword: keywordData.keyword,
          volume: keywordData.volume,
          competition: keywordData.competition,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        toast.success(`'${keywordData.keyword}' saved to your list`);
        // Silently replace the temp item with the real database item
        setSaved(prev => prev.map(k => k._id === tempKeyword._id ? data.data : k));
      } else {
        // Error aane par revert kar do
        setSaved(prev => prev.filter(k => k._id !== tempKeyword._id));
        toast.error(data.error || "Failed to save. Try again.");
      }
    } catch (error) {
      console.error("Failed to add keyword:", error);
      // Error aane par revert kar do
      setSaved(prev => prev.filter(k => k._id !== tempKeyword._id));
      toast.error("Something went wrong while saving.");
    } finally {
      setIsSaving(null);
    }
  }, []);
  const deleteKeyword = useCallback(async (id) => {
    // OPTIMISTIC UPDATE: Turant list se hata do
    setSaved(prev => prev.filter(item => item._id !== id));

    try {
      const res = await fetch(`/api/keyword-research?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Keyword removed from your list");
      } else {
        // Fail hone par wapas laane ke liye list fetch karlo
        fetchSavedKeywords();
      }
    } catch (error) {
      console.error("Failed to delete keyword:", error);
      fetchSavedKeywords();
      toast.error("Could not remove the word. Try again.");
    }
  }, [fetchSavedKeywords]);

  useEffect(() => {
    fetchSavedKeywords();
  }, [fetchSavedKeywords]);

  const savedKeywordsSet = useMemo(
    () => new Set(saved.map((s) => s.keyword)),
    [saved],
  );

  const sortedSaved = useMemo(() => {
    // Keep them in the order they were inserted, or based on a real timestamp 
    // Rather than alphabetical sorting of IDs which breaks when temp ID changes to Mongo ID
    return saved; // They are already added sequentially via setSaved
  }, [saved]);

  return {
    suggestions,
    sortedSaved,
    savedKeywordsSet,
    isSearching,
    isSaving,
    searchKeywords,
    addKeyword,
    deleteKeyword
  };
}
