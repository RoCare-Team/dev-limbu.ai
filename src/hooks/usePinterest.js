import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

export function usePinterest(router, searchParams) {
  const [pinterestProfiles, setPinterestProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const toastShownRef = useRef(false);

  const fetchPinterestProfiles = useCallback(async () => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/pinterest/profiles?userId=${activeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPinterestProfiles(data.profiles || []);
        }
      }
    } catch (error) {
      console.error("Error fetching Pinterest profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPinterestProfiles();
    if (searchParams?.get("pinterest") === "connected" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Pinterest connected successfully!");
      router.replace("/dashboard");
    }
  }, [fetchPinterestProfiles, searchParams, router]);

  const handleDisconnectPinterest = useCallback(async (profileId) => {
    const activeId = getActiveUserId();
    if (!activeId) return;

    const previousProfiles = [...pinterestProfiles];
    setPinterestProfiles((prev) => prev.filter((p) => p.pinterestUserId !== profileId));

    try {
      const res = await fetch(`/api/pinterest/disconnect?userId=${activeId}&profileId=${profileId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Pinterest profile disconnected");
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting Pinterest:", error);
      toast.error("Failed to disconnect. Reverting...");
      setPinterestProfiles(previousProfiles);
    }
  }, [pinterestProfiles]);

  const publishPin = useCallback(async ({ title, description, boardId, mediaUrl, link, coverImageUrl }) => {
    const activeId = getActiveUserId();
    if (!activeId) {
      toast.error("User not found");
      return { success: false };
    }

    try {
      const payload = {
        userId: activeId,
        title,
        description,
        board_id: boardId,
        media_url: mediaUrl,
        link,
        cover_image_url: coverImageUrl
      };

      console.log("📤 Publishing to Pinterest with payload:", payload);

      const res = await fetch("/api/pinterest/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Successfully pinned to Pinterest!");
        return { success: true, pin: data.pin };
      } else {
        toast.error(data.error || "Failed to publish pin");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Error publishing pin:", error);
      toast.error("Network error while publishing pin");
      return { success: false, error: error.message };
    }
  }, []);

  const createPinterestBoard = useCallback(async ({ profileId, name, description }) => {
    const activeId = getActiveUserId();
    if (!activeId) {
      toast.error("User not found");
      return { success: false, error: "User not found" };
    }

    try {
      const res = await fetch("/api/pinterest/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeId,
          profileId,
          name,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const error = data.error || "Failed to create Pinterest board";
        toast.error(error);
        return { success: false, error };
      }

      setPinterestProfiles((prev) =>
        prev.map((profile) =>
          profile.pinterestUserId === profileId
            ? { ...profile, boards: [...(profile.boards || []), data.board] }
            : profile,
        ),
      );
      toast.success("Pinterest board created");
      return { success: true, board: data.board };
    } catch (error) {
      console.error("Error creating Pinterest board:", error);
      const message = "Network error while creating Pinterest board";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    pinterestProfiles,
    setPinterestProfiles,
    loading,
    fetchPinterestProfiles,
    handleDisconnectPinterest,
    publishPin,
    createPinterestBoard,
  };
}
