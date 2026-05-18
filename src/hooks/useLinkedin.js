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

  /**
   * Fetch LinkedIn Connections
   */
  const fetchLinkedinPages = useCallback(async () => {
    const activeId = getActiveUserId();

    if (!activeId) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/linkedin/pages?userId=${activeId}&type=manual`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch LinkedIn connections");
      }

      const data = await res.json();

      if (data.success) {
        setLinkedinPages(data.pages || []);
      } else {
        setLinkedinPages([]);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn pages:", error);

      toast.error("Failed to load LinkedIn connections");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial Load
   */
  useEffect(() => {
    fetchLinkedinPages();

    if (
      searchParams?.get("linkedin") === "connected" &&
      !toastShownRef.current
    ) {
      toastShownRef.current = true;

      const connectionType = searchParams?.get("connectionType");

      if (connectionType === "page") {
        toast.success("LinkedIn page connected successfully!");
      } else if (connectionType === "profile") {
        toast.success("LinkedIn profile connected successfully!");
      } else {
        toast.success("LinkedIn connected successfully!");
      }

      router.replace("/dashboard");
    }
  }, [fetchLinkedinPages, searchParams, router]);

  /**
   * Disconnect LinkedIn
   */
  const handleDisconnectLinkedin = useCallback(
    async (pageId) => {
      const activeId = getActiveUserId();

      if (!activeId) {
        toast.error("User ID not found");
        return;
      }

      const previousPages = [...linkedinPages];

      // Optimistic Update
      setLinkedinPages((prev) => prev.filter((p) => p.pageId !== pageId));

      try {
        const res = await fetch(
          `/api/linkedin/disconnect?userId=${activeId}&pageId=${pageId}`,
          {
            method: "POST",
          },
        );

        const data = await res.json();

        if (data.success) {
          toast.success("LinkedIn disconnected successfully!");
        } else {
          throw new Error(data.error || "Failed to disconnect LinkedIn");
        }
      } catch (error) {
        console.error("Error disconnecting LinkedIn:", error);

        toast.error("Failed to disconnect. Restoring connection...");

        // Rollback
        setLinkedinPages(previousPages);
      }
    },
    [linkedinPages],
  );

  /**
   * Publish LinkedIn Post
   */
  const publishLinkedinPost = useCallback(
    async ({ text, mediaUrl = "", mediaType = "", pageId }) => {
      const activeId = getActiveUserId();

      if (!activeId) {
        toast.error("User ID not found");

        return {
          success: false,
          error: "User ID not found",
        };
      }

      if (!pageId) {
        toast.error("LinkedIn page/profile not selected");

        return {
          success: false,
          error: "Page ID missing",
        };
      }

      try {
        const response = await fetch("/api/linkedin/post", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: activeId,
            pageId,
            text,
            mediaUrl,
            mediaType,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Posted to LinkedIn successfully!");

          return {
            success: true,
            data,
          };
        }

        toast.error(data.error || "Failed to publish LinkedIn post");

        return {
          success: false,
          error: data.error,
        };
      } catch (error) {
        console.error("Error publishing to LinkedIn:", error);

        toast.error("Unexpected error while publishing");

        return {
          success: false,
          error: error.message,
        };
      }
    },
    [],
  );

  /**
   * Filter Helpers
   */
  const linkedinProfiles = linkedinPages.filter(
    (item) => item.type === "profile",
  );

  const linkedinOrganizations = linkedinPages.filter(
    (item) => item.type === "organization",
  );

  return {
    // State
    linkedinPages,
    linkedinProfiles,
    linkedinOrganizations,

    setLinkedinPages,
    loading,

    // Actions
    fetchLinkedinPages,
    handleDisconnectLinkedin,
    publishLinkedinPost,
  };
}
