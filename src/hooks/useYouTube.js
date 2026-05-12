import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

/**
 * Helper to get the correct User ID for YouTube APIs.
 * This logic ensures impersonation works perfectly.
 */
function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser") // ID of the user being impersonated
    : getLocalStorage("userId");          // Own user ID
}

export function useYouTube(router, searchParams) {
  const [youtubeChannels, setYoutubeChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const toastShownRef = useRef(false);

  const fetchYouTubeChannels = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/youtube/channels?userId=${activeId}&type=manual`);
      const data = await res.json();

      if (data.success) {
        setYoutubeChannels(data.channels || []);
      }
    } catch (error) {
      console.error("Error fetching YouTube channels:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on mount or when redirecting back from YouTube login
  useEffect(() => {
    fetchYouTubeChannels();
    if (searchParams?.get("youtube") === "connected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("YouTube channel connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchYouTubeChannels, searchParams, router]);

  const handleDisconnectYouTube = useCallback(async (channelId) => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    // Optimistic UI Update
    const previousChannels = [...youtubeChannels];
    setYoutubeChannels((prev) => prev.filter((c) => c.channelId !== channelId));

    try {
      const res = await fetch(`/api/youtube/disconnect?userId=${activeId}&channelId=${channelId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("YouTube channel disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting YouTube channel:", error);
      toast.error("Failed to disconnect. Reverting...");
      setYoutubeChannels(previousChannels); // Rollback on error
    }
  }, [youtubeChannels]);

  return {
    youtubeChannels,
    setYoutubeChannels,
    loading,
    fetchYouTubeChannels,
    handleDisconnectYouTube,
  };
}