import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

/**
 * Helper to get the correct User ID for Meta APIs.
 * This logic ensures impersonation works perfectly.
 */
function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser") // ID of the user being impersonated
    : getLocalStorage("userId");          // Own user ID
}

export function useFacebook(router, searchParams) {
  const [facebookPages, setFacebookPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const toastShownRef = useRef(false);

  const fetchFacebookPages = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/facebook/pages?userId=${activeId}`);
      const data = await res.json();

      if (data.success) {
        setFacebookPages(data.pages || []);
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on mount or when redirecting back from FB login
  useEffect(() => {
    fetchFacebookPages();
    if (searchParams?.get("fb") === "connected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Facebook Page connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchFacebookPages, searchParams, router]);

  const handleDisconnectFacebook = useCallback(async (pageId) => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    // Optimistic UI Update
    const previousPages = [...facebookPages];
    setFacebookPages((prev) => prev.filter((p) => p.pageId !== pageId));

    try {
      const res = await fetch(`/api/facebook/disconnect?userId=${activeId}&pageId=${pageId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Facebook page disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting Facebook page:", error);
      toast.error("Failed to disconnect. Reverting...");
      setFacebookPages(previousPages); // Rollback on error
    }
  }, [facebookPages]);

  return {
    facebookPages,
    setFacebookPages,
    loading,
    fetchFacebookPages,
    handleDisconnectFacebook,
  };
}