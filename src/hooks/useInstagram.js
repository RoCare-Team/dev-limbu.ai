import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

/**
 * Helper to get the correct User ID for Meta APIs.
 */
function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser") 
    : getLocalStorage("userId");
}

export function useInstagram(router, searchParams) {
  const [instagramPages, setInstagramPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInstagramPages = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/instagram/pages?userId=${activeId}`);
      const data = await res.json();

      if (data.success) {
        setInstagramPages(data.pages || []);
      }
    } catch (error) {
      console.error("Error fetching Instagram pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on mount or when redirecting back from IG login
  useEffect(() => {
    fetchInstagramPages();
    if (searchParams?.get("ig") === "connected") {
      toast.success("Instagram Account connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchInstagramPages, searchParams, router]);

  const handleDisconnectInstagram = useCallback(async (igId) => {
    const activeId = getActiveUserId();
    if (!activeId || !confirm("Are you sure you want to disconnect this account?")) return;

    // Optimistic UI update
    const previousPages = [...instagramPages];
    setInstagramPages((prev) => prev.filter((p) => p.igId !== igId));

    try {
      const res = await fetch(`/api/instagram/disconnect?userId=${activeId}&igId=${igId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Instagram account disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting Instagram account:", error);
      toast.error("Failed to disconnect. Reverting...");
      setInstagramPages(previousPages); // Rollback on error
    }
  }, [instagramPages]);

  return {
    instagramPages,
    setInstagramPages,
    loading,
    fetchInstagramPages,
    handleDisconnectInstagram,
  };
}