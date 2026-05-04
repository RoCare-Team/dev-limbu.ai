import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

export function useLinkedin(router, searchParams) {
  const [linkedinPages, setLinkedinPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const toastShownRef = useRef(false);

  const fetchLinkedinPages = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/linkedin/pages?userId=${activeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLinkedinPages(data.pages || []);
        }
      }
    } catch (error) {
      console.error("Error fetching LinkedIn pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedinPages();
    if (searchParams?.get("linkedin") === "connected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("LinkedIn connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchLinkedinPages, searchParams, router]);

  const handleDisconnectLinkedin = useCallback(async (pageId) => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    const previousPages = [...linkedinPages];
    setLinkedinPages((prev) => prev.filter((p) => p.pageId !== pageId));

    try {
      const res = await fetch(`/api/linkedin/disconnect?userId=${activeId}&pageId=${pageId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("LinkedIn disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      toast.error("Failed to disconnect. Reverting...");
      setLinkedinPages(previousPages);
    }
  }, [linkedinPages]);

  const publishLinkedinPost = useCallback(async ({ text, mediaUrl, mediaType, pageId }) => {
    const activeId = getActiveUserId();
    if (!activeId) {
      toast.error("User ID not found");
      return { success: false, error: "User ID not found" };
    }

    try {
      const response = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeId,
          pageId,
          text,
          mediaUrl,
          mediaType
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Posted to LinkedIn successfully!");
        return { success: true, data };
      } else {
        toast.error(data.error || "Failed to post to LinkedIn");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Error publishing to LinkedIn:", error);
      toast.error("An unexpected error occurred");
      return { success: false, error: error.message };
    }
  }, []);

  return {
    linkedinPages,
    setLinkedinPages,
    loading,
    fetchLinkedinPages,
    handleDisconnectLinkedin,
    publishLinkedinPost,
  };
}