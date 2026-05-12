/** Detect video file URLs (not HLS etc.). */
export function looksLikeVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)) return true;
  // Common CDN paths without a filename extension
  if (/\/video\/(upload|deliver)\//i.test(u)) return true;
  return false;
}

/** Post has a playable video asset (attached video, video-only post, or legacy mediaType). */
export function postHasVideoAsset(post) {
  if (!post) return false;
  if (post.videoOutput && typeof post.videoOutput === "string") {
    const v = post.videoOutput.trim();
    if (v && (looksLikeVideoUrl(v) || /^https?:\/\//i.test(v)))
      return true;
  }
  if (post.mediaType === "video") return true;
  if (post.aiOutput && looksLikeVideoUrl(post.aiOutput)) return true;
  return false;
}

/** Primary still image URL (GMB / image tab). */
export function postImageUrl(post) {
  if (!post?.aiOutput || typeof post.aiOutput !== "string") return "";
  if (looksLikeVideoUrl(post.aiOutput)) return "";
  return post.aiOutput.trim();
}

/** Video URL for player or Meta video endpoints. */
export function postVideoUrl(post) {
  if (!post) return "";
  if (post.videoOutput && typeof post.videoOutput === "string") {
    const v = post.videoOutput.trim();
    if (!v) return "";
    if (looksLikeVideoUrl(v)) return v;
    if (/^https?:\/\//i.test(v)) return v;
  }
  if (post.aiOutput && looksLikeVideoUrl(post.aiOutput)) {
    return post.aiOutput.trim();
  }
  return "";
}

/** What to send to Facebook / Instagram (prefer video when present). */
export function metaPublishMedia(post) {
  const v = postVideoUrl(post);
  if (v) return { type: "video", url: v };
  const img = post?.aiOutput && typeof post.aiOutput === "string" ? post.aiOutput.trim() : "";
  if (img) return { type: "image", url: img };
  return { type: "none", url: "" };
}
