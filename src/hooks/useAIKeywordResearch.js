"use client";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useAIKeywordResearch({ addKeyword, savedKeywordsSet, slug, locationName }) {
  const [businessName, setBusinessName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiKeywords, setAiKeywords] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [inferredCategory, setInferredCategory] = useState("");
  const [reportId, setReportId] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const generateKeywords = useCallback(async () => {
    const name = businessName.trim();
    if (!name) {
      toast.error("Please enter a business name");
      return;
    }

    const userId = getLocalStorage("userId");
    if (!userId) {
      toast.error("Please log in to use AI keyword research");
      return;
    }

    setIsGenerating(true);
    setGenerateError("");
    setAiKeywords([]);
    setAiSummary("");
    setInferredCategory("");
    setReportId(null);

    try {
      const res = await fetch("/api/keyword-research/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          businessName: name,
          slug,
          locationName,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setGenerateError(data.error || "Failed to generate keywords");
        toast.error(data.error || "Failed to generate keywords");
        return;
      }

      setReportId(data.data.reportId);
      setAiKeywords(data.data.keywords || []);
      setAiSummary(data.data.aiSummary || "");
      setInferredCategory(data.data.inferredCategory || "");
      toast.success(`${data.data.keywords?.length || 0} AI keywords generated!`);
    } catch (err) {
      console.error("AI generate error:", err);
      setGenerateError("Network error. Please try again.");
      toast.error("Could not generate keywords. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [businessName, slug, locationName]);

  const addAiKeyword = useCallback(
    async (kw) => {
      if (savedKeywordsSet.has(kw.keyword)) return;

      await addKeyword({
        keyword: kw.keyword,
        volume: kw.volume,
        competition: kw.competition,
        source: "ai",
      });
    },
    [addKeyword, savedKeywordsSet]
  );

  const addAllAiKeywords = useCallback(async () => {
    const toAdd = aiKeywords.filter((k) => !savedKeywordsSet.has(k.keyword));
    if (toAdd.length === 0) {
      toast("All keywords are already saved");
      return;
    }

    setIsSavingAll(true);
    let added = 0;

    for (const kw of toAdd) {
      const result = await addKeyword({
        keyword: kw.keyword,
        volume: kw.volume,
        competition: kw.competition,
        source: "ai",
      });
      if (result?.success) added++;
    }

    if (added > 0) {
      toast.success(`${added} keywords saved to your list`);
    }

    setIsSavingAll(false);
  }, [aiKeywords, savedKeywordsSet, addKeyword]);

  return {
    businessName,
    setBusinessName,
    isGenerating,
    aiKeywords,
    aiSummary,
    inferredCategory,
    generateError,
    generateKeywords,
    addAiKeyword,
    addAllAiKeywords,
    isSavingAll,
  };
}
