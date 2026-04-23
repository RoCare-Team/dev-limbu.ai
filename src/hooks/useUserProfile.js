"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getLocalStorage } from "@/utils/storage";

export function useUserProfile() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [aiImages, setAiImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
  });

  const userId = useMemo(() => getLocalStorage("userId"), []);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/auth/signup?userId=${userId}`);
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("User fetch failed");
    }
  }, [userId]);

  const fetchPostsAndImages = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/post-status?userId=${userId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const allPosts = data.data;

        // Set counts
        setAllCounts({
          total: allPosts.length,
          approved: allPosts.filter((p) => p.status === "approved").length,
          pending: allPosts.filter((p) => p.status === "pending").length,
          scheduled: allPosts.filter((p) => p.status === "scheduled").length,
          posted: allPosts.filter((p) => p.status === "posted").length,
        });

        // Set AI images
        const images = allPosts
          .filter((post) => post.aiOutput && post.aiOutput.trim() !== "")
          .map((post) => ({
            id: post._id,
            url: post.aiOutput,
            prompt: post.caption || "No caption",
            createdAt: post.createdAt,
            status: post.status,
          }));
        images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAiImages(images);
      }
    } catch (err) {
      console.error("Post/Images fetch failed");
    } finally {
      setLoadingImages(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
    } finally {
      setLoadingTx(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
    fetchPostsAndImages();
    fetchTransactions();
  }, [fetchUser, fetchPostsAndImages, fetchTransactions]);

  return {
    userData,
    transactions,
    loadingTx,
    aiImages,
    loadingImages,
    allCounts,
    userId
  };
}
