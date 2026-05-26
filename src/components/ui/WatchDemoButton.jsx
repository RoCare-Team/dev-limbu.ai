"use client";

import { useAuthStore } from "@/stores/useAuthStore";

const DEFAULT_VIDEO_URL =
  "https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl";

export default function WatchDemoButton({
  videoUrl = DEFAULT_VIDEO_URL,
  className = "",
  children = "Watch Demo",
}) {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);

  return (
    <button
      type="button"
      className={className}
      onClick={() => setSelectedVideo(videoUrl)}
    >
      {children}
    </button>
  );
}
