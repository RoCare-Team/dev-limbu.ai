"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFacebook } from "./useFacebook";
import { useInstagram } from "./useInstagram";
import { useLinkedin } from "./useLinkedin";
import { usePinterest } from "./usePinterest";
import { useYouTube } from "./useYouTube";

/**
 * Connected social accounts for the logged-in user, one entry per platform.
 * Reuses the dashboard's platform hooks, so connect/disconnect logic lives in
 * one place. `ready` is false until the first fetch finishes, so the UI can
 * show "Checking…" instead of flashing "Not connected".
 */
export function useSocialAccounts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fb = useFacebook(router, searchParams);
  const ig = useInstagram(router, searchParams);
  const li = useLinkedin(router, searchParams);
  const pin = usePinterest(router, searchParams);
  const yt = useYouTube(router, searchParams);

  const anyLoading = [fb, ig, li, pin, yt].some((h) => h.loading);
  const [ready, setReady] = useState(false);
  const sawLoading = useRef(false);

  useEffect(() => {
    if (anyLoading) sawLoading.current = true;
    else if (sawLoading.current) setReady(true);
  }, [anyLoading]);

  // Fallback: hooks skip fetching when no user is stored — don't spin forever.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return {
    ready,
    accounts: [
      // `names`: the connected pages / profiles, shown on the Social Media overview
      { id: "facebook", count: fb.facebookPages?.length || 0, names: (fb.facebookPages || []).map((p) => p.pageName).filter(Boolean) },
      { id: "instagram", count: ig.instagramPages?.length || 0, names: (ig.instagramPages || []).map((p) => p.igUsername && `@${p.igUsername}`).filter(Boolean) },
      { id: "linkedin", count: li.linkedinPages?.length || 0, names: (li.linkedinPages || []).map((p) => p.pageName).filter(Boolean) },
      { id: "youtube", count: yt.youtubeChannels?.length || 0, names: (yt.youtubeChannels || []).map((c) => c.channelTitle).filter(Boolean) },
      { id: "pinterest", count: pin.pinterestProfiles?.length || 0, names: (pin.pinterestProfiles || []).map((p) => p.username && `@${p.username}`).filter(Boolean) },
    ],
  };
}
