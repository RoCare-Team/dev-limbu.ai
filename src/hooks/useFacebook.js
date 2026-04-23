import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useFacebook(router, searchParams) {
  const [facebookPages, setFacebookPages] = useState([]);

  const fetchFacebookPages = useCallback(async () => {
    try {
      const userId = getLocalStorage("userId");
      if (!userId) return;

      const res = await fetch(`/api/facebook/pages?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setFacebookPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      toast.error("Failed to fetch Facebook pages");
    }
  }, []);

  useEffect(() => {
    fetchFacebookPages();
    if (searchParams?.get("fb") === "connected") {
      toast.success("Facebook Page connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchFacebookPages, searchParams, router]);

  const handleDisconnectFacebook = useCallback(async (pageId) => {
    if (!confirm("Are you sure you want to disconnect this page?")) return;
    setFacebookPages((prev) => prev.filter((p) => p.pageId !== pageId));
    toast.success("Facebook page disconnected");
    try {
      const userId = getLocalStorage("userId");
      await fetch(
        `/api/facebook/disconnect?userId=${userId}&pageId=${pageId}`,
        { method: "POST" },
      );
    } catch (error) {
      console.error("Error disconnecting Facebook page:", error);
    }
  }, []);

  return {
    facebookPages,
    setFacebookPages,
    fetchFacebookPages,
    handleDisconnectFacebook,
  };
}
