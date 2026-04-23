import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useInstagram(router, searchParams) {
  const [instagramPages, setInstagramPages] = useState([]);

  const fetchInstagramPages = useCallback(async () => {
    try {
      const userId = getLocalStorage("userId");
      if (!userId) return;

      const res = await fetch(`/api/instagram/pages?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setInstagramPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching Instagram pages:", error);
    }
  }, []);

  useEffect(() => {
    fetchInstagramPages();
    if (searchParams?.get("ig") === "connected") {
      toast.success("Instagram Account connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchInstagramPages, searchParams, router]);

  const handleDisconnectInstagram = useCallback(async (igId) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    setInstagramPages((prev) => prev.filter((p) => p.igId !== igId));
    toast.success("Instagram account disconnected");
    try {
      const userId = getLocalStorage("userId");
      await fetch(`/api/instagram/disconnect?userId=${userId}&igId=${igId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error disconnecting Instagram account:", error);
    }
  }, []);

  return {
    instagramPages,
    setInstagramPages,
    fetchInstagramPages,
    handleDisconnectInstagram,
  };
}
