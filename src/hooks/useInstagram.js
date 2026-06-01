import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

export function useInstagram(router, searchParams) {
  const [instagramPages, setInstagramPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const toastShownRef = useRef(false);

  const fetchInstagramPages = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/instagram/pages?userId=${activeId}`);
      const data = await res.json();
      if (data.success) setInstagramPages(data.pages || []);
    } catch (error) {
      console.error("Error fetching Instagram pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstagramPages();
    if (searchParams?.get("ig") === "connected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Instagram Account connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchInstagramPages, searchParams, router]);

  // ✅ Single page disconnect
  const handleDisconnectInstagram = useCallback(async (igId) => {
    const activeId = getActiveUserId();
    if (!activeId || !igId) return;

    let previousPages = [];

    setInstagramPages((prev) => {
      previousPages = prev;
      return prev.filter((p) => p.igId !== igId);
    });

    try {
      const res = await fetch(`/api/instagram/disconnect?userId=${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igId }),  // ✅ body mein igId
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Instagram profile disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect. Reverting...");
      setInstagramPages(previousPages);  // rollback
    }
  }, []);

  // ✅ Sab pages ek saath disconnect
  const handleMetaLogout = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    let previousPages = [];

    // Optimistic — sab clear karo
    setInstagramPages((prev) => {
      previousPages = prev;
      return [];
    });

    try {
      const res = await fetch(`/api/instagram/disconnect?userId=${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),  // ✅ empty body = sab delete
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`All Instagram profiles disconnected`);
      } else {
        throw new Error(data.error || "Failed to disconnect all");
      }
    } catch (error) {
      console.error("Meta logout error:", error);
      toast.error("Failed to disconnect all. Reverting...");
      setInstagramPages(previousPages);  // rollback
    }
  }, []);

  return {
    instagramPages,
    setInstagramPages,
    loading,
    fetchInstagramPages,
    handleDisconnectInstagram,
    handleMetaLogout,  // ✅ export karna mat bhoolna
  };
}