import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage, getSessionStorage } from "@/utils/storage";

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

function getActiveUserEmail() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedEmail") ||
        getSessionStorage("impersonatedEmail")
    : getLocalStorage("email") ||
        getLocalStorage("userEmail") ||
        getSessionStorage("email") ||
        getSessionStorage("userEmail");
}

export function usePinterest(router, searchParams) {
  const [pinterestProfiles, setPinterestProfiles] = useState([]);
  const [inhouseMappings, setInhouseMappings] = useState([]);
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

  const saveInhouseMappings = useCallback(async (mappings) => {
    const activeId = getActiveUserId();
    const email = getActiveUserEmail();
    if (!activeId || !email) {
      toast.error("User not found");
      return { success: false, error: "User not found" };
    }

    try {
      const res = await fetch("/api/pinterest/inhouse/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeId, email, mappings }),
      });
      const data = await res.json();

      if (data.success) {
        setInhouseMappings(data.mappings || []);
        toast.success("Inhouse Pinterest mapping saved");
      } else {
        toast.error(data.error || "Failed to save mapping");
      }

      return data;
    } catch (error) {
      console.error("Error saving inhouse Pinterest mappings:", error);
      toast.error("Network error while saving mapping");
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    const handlePinterestConnected = async () => {
      fetchPinterestProfiles();

      if (
        searchParams?.get("pinterest") === "connected" &&
        !toastShownRef.current
      ) {
        toastShownRef.current = true;

        // ===== NEW CODE START =====

        const activeId = getActiveUserId();
        const email = getActiveUserEmail();

        if (activeId && email?.toLowerCase() === "rocare7@gmail.com") {
          const locationDetails = JSON.parse(
            getLocalStorage("locationDetails") || "[]",
          );

          const profileRes = await fetch(
            `/api/pinterest/profiles?userId=${activeId}`,
          );

          const profileData = await profileRes.json();

          const pinterestProfile = profileData?.profiles?.[0];

          if (pinterestProfile && locationDetails.length) {
            const mappings = locationDetails.map((location) => ({
              locationId: location.locationId,
              accountId: location.accountId,

              locationName: location.title || location.name || "",

              locality: location.locality || "",

              city:
                location.storefrontAddress?.locality || location.locality || "",

              websiteUri: location.websiteUri || location.websiteUrl || "",

              visitUri: location.metadata?.mapsUri || location.reviewUri || "",

              pinterestProfileId: pinterestProfile.pinterestUserId,

              boardId: "",
              boardName:
                location.storefrontAddress?.locality || location.locality || "",
            }));

            await saveInhouseMappings(mappings);
          }
        }

        // ===== NEW CODE END =====

        toast.success("Pinterest connected successfully!");

        router.replace("/dashboard");
      }
    };

    handlePinterestConnected();
  }, [fetchPinterestProfiles, saveInhouseMappings, searchParams, router]);

  const handleDisconnectPinterest = useCallback(
    async (profileId) => {
      const activeId = getActiveUserId();
      if (!activeId) return;

      const previousProfiles = [...pinterestProfiles];
      setPinterestProfiles((prev) =>
        prev.filter((p) => p.pinterestUserId !== profileId),
      );

      try {
        const res = await fetch(
          `/api/pinterest/disconnect?userId=${activeId}&profileId=${profileId}`,
          {
            method: "POST",
          },
        );
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
    },
    [pinterestProfiles],
  );

  const publishPin = useCallback(
    async ({ title, description, boardId, mediaUrl, link, coverImageUrl }) => {
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
          cover_image_url: coverImageUrl,
        };

        console.log("📤 Publishing to Pinterest with payload:", payload);

        const res = await fetch("/api/pinterest/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
    },
    [],
  );

  const createPinterestBoard = useCallback(
    async ({ profileId, name, description }) => {
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
    },
    [],
  );

  const fetchInhouseMappings = useCallback(async () => {
    const activeId = getActiveUserId();
    const email = getActiveUserEmail();
    if (!activeId || !email) return { success: false };

    try {
      const res = await fetch(
        `/api/pinterest/inhouse/mappings?userId=${encodeURIComponent(activeId)}&email=${encodeURIComponent(email)}`,
      );
      const data = await res.json();

      if (data.success) {
        setInhouseMappings(data.mappings || []);
      }

      return data;
    } catch (error) {
      console.error("Error fetching inhouse Pinterest mappings:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const generateInhousePinterestContent = useCallback(async (imageUrl) => {
    try {
      const res = await fetch("/api/pinterest/inhouse/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to generate Pinterest content");
      }

      return data;
    } catch (error) {
      console.error("Error generating inhouse Pinterest content:", error);
      toast.error("Network error while generating Pinterest content");
      return { success: false, error: error.message };
    }
  }, []);

  const publishInhousePins = useCallback(
    async ({ post, boards, title, description, hashtags, media_url }) => {
      // ← boards aur media_url
      const activeId = getActiveUserId();
      const email = getActiveUserEmail();
      if (!activeId || !email) {
        toast.error("User not found");
        return { success: false, error: "User not found" };
      }

      try {
        const res = await fetch("/api/pinterest/inhouse/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeId,
            email,
            boards, // ← boardIds ki jagah boards bhejo
            title,
            description,
            hashtags,
            media_url, // ← mediaUrl ki jagah media_url
          }),
        });
        const data = await res.json();

        if (data.success) {
          toast.success(
            `Published to ${data.successCount || 0} Pinterest board(s)`,
          );
        } else {
          toast.error(data.error || "Failed to publish inhouse pins");
        }

        return data;
      } catch (error) {
        console.error("Error publishing inhouse Pinterest pins:", error);
        toast.error("Network error while publishing inhouse pins");
        return { success: false, error: error.message };
      }
    },
    [],
  );

  return {
    pinterestProfiles,
    setPinterestProfiles,
    inhouseMappings,
    loading,
    fetchPinterestProfiles,
    handleDisconnectPinterest,
    publishPin,
    createPinterestBoard,
    fetchInhouseMappings,
    saveInhouseMappings,
    generateInhousePinterestContent,
    publishInhousePins,
  };
}
