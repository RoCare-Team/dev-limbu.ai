"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";
import { generateUniversalSlug } from "@/utils/slugify";

export function useKeywordPlanner() {
  const [suggestions, setSuggestions] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(null);

  // 👇 NEW: same as useMagicQR — load locations from localStorage
  const [allLocations, setAllLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  useEffect(() => {
    const raw = getLocalStorage("locationDetails");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllLocations(parsed);
          setSelectedLocationId(parsed[0].locationId);
        }
      } catch (e) {
        console.error("localStorage parse error", e);
      }
    }
  }, []);

  // 👇 NEW: same derived logic as useMagicQR
  const selectedLocation = useMemo(() => {
    return (
      allLocations.find((loc) => loc.locationId === selectedLocationId) ||
      allLocations[0] ||
      null
    );
  }, [allLocations, selectedLocationId]);

  // 👇 NEW: user manually location switch kar sake, jaise MagicQR mein
  const handleLocationChange = useCallback((locationId) => {
    setSelectedLocationId(locationId);
  }, []);

  // 👇 NEW: exact same helper functions copied from useMagicQR
  const getLocationIdentifier = (location) => {
    return (location?.locationId || location?.name || "").toString();
  };

  const buildUniqueReviewSlug = useCallback((location, locations) => {
    if (!location) return "";

    const baseSlug = generateUniversalSlug(location);
    if (!baseSlug) return "";

    const currentId = getLocationIdentifier(location);
    const conflict = (locations || []).some((loc) => {
      const locId = getLocationIdentifier(loc);
      if (!loc || !locId || locId === currentId) return false;
      return generateUniversalSlug(loc) === baseSlug;
    });

    if (!conflict) {
      return baseSlug;
    }

    const idPart = currentId.substring(0, 5);
    return `${baseSlug}-${idPart}`;
  }, []);

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

        mappedSuggestions.sort((a, b) => b.volume - a.volume);
        setSuggestions(mappedSuggestions);
      } else if (data.success) {
        const generatedSuggestions = data.keywords.map((k) =>
          typeof k === "string"
            ? { keyword: k, volume: Math.floor(Math.random() * 5000) + 100 }
            : k,
        );

        generatedSuggestions.sort((a, b) => b.volume - a.volume);
        setSuggestions(generatedSuggestions);
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

    // 👇 FIX: exact same slug generation as useMagicQR's reviewUrl
    // Jo bhi location currently SELECTED hai, usi ke basis par slug banega
    const slug = buildUniqueReviewSlug(selectedLocation, allLocations);

    const tempKeyword = {
      _id: "temp_" + Date.now(),
      keyword: keywordData.keyword,
      slug,
      volume: keywordData.volume,
      competition: keywordData.competition
    };
    setSaved(prev => [tempKeyword, ...prev]);

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          keyword: keywordData.keyword,
          slug,
          volume: keywordData.volume,
          competition: keywordData.competition,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        toast.success(`'${keywordData.keyword}' saved to your list`);
        setSaved(prev => prev.map(k => k._id === tempKeyword._id ? data.data : k));
      } else {
        setSaved(prev => prev.filter(k => k._id !== tempKeyword._id));
        toast.error(data.error || "Failed to save. Try again.");
      }
    } catch (error) {
      console.error("Failed to add keyword:", error);
      setSaved(prev => prev.filter(k => k._id !== tempKeyword._id));
      toast.error("Something went wrong while saving.");
    } finally {
      setIsSaving(null);
    }
  }, [selectedLocation, allLocations, buildUniqueReviewSlug]);

  const deleteKeyword = useCallback(async (id) => {
    setSaved(prev => prev.filter(item => item._id !== id));

    try {
      const res = await fetch(`/api/keyword-research?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Keyword removed from your list");
      } else {
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
    return saved;
  }, [saved]);

  return {
    suggestions,
    sortedSaved,
    savedKeywordsSet,
    isSearching,
    isSaving,
    searchKeywords,
    addKeyword,
    deleteKeyword,
    // 👇 NEW exports — page mein location selector banane ke liye
    allLocations,
    selectedLocationId,
    selectedLocation,
    handleLocationChange,
  };
}