"use client";

/**
 * Approve → publish for AI-video pages whose videos live in their own history
 * collection (Text To Video, AI Avatar Video). Each history row carries its linked
 * Post as `row.post`; rows without one get it created the moment the user clicks
 * Approve / Reject (PATCH to the history endpoint).
 *
 * Usage:
 *   const posting = useVideoHistoryPosting({ userId, history, setHistory, fetchPosts, showToast,
 *                                            historyEndpoint: "/api/video-generation-history" });
 *   {posting.modals}
 *   row.post
 *     ? <PostCard post={row.post} {...posting.cardProps} />
 *     : <UnlinkedVideoCard ... onApprove={posting.approveUnlinked} onReject={posting.rejectUnlinked}
 *                          busy={posting.enablingId === row._id} />
 */

import { useCallback, useMemo, useState } from "react";
import { useVideoPostingFlow } from "@/hooks/useVideoPostingFlow";

export function useVideoHistoryPosting({
  userId,
  history,
  setHistory,
  fetchPosts,
  showToast,
  historyEndpoint,
}) {
  const [enablingId, setEnablingId] = useState(null);

  // The posting flow works on Posts; history rows own them, so updates are mapped back in.
  const posts = useMemo(() => history.map((row) => row.post).filter(Boolean), [history]);
  const setPosts = useCallback(
    (updater) => {
      setHistory((prev) => {
        const current = prev.map((row) => row.post).filter(Boolean);
        const next = typeof updater === "function" ? updater(current) : updater;
        const byId = new Map((next || []).map((p) => [String(p._id), p]));
        return prev.map((row) =>
          row.post ? { ...row, post: byId.get(String(row.post._id)) || row.post } : row
        );
      });
    },
    [setHistory]
  );

  const { cardProps, modals } = useVideoPostingFlow({
    userId,
    posts,
    setPosts,
    fetchPosts,
    showToast,
  });

  // Created only when the user acts on the card, so opening the page never
  // floods their post library with Posts for every past video.
  const ensurePostForRow = useCallback(
    async (row) => {
      setEnablingId(row._id);
      try {
        const res = await fetch(historyEndpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row._id, userId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.data?.post) {
          throw new Error(data.error || "Could not prepare this video for posting.");
        }
        setHistory((prev) => prev.map((r) => (r._id === row._id ? data.data : r)));
        return data.data.post;
      } catch (err) {
        console.error(err);
        showToast(err.message || "Could not prepare this video for posting.", "error");
        return null;
      } finally {
        setEnablingId(null);
      }
    },
    [historyEndpoint, userId, setHistory, showToast]
  );

  // Same call PostCard's Approve makes, so the card flips to approved and shows
  // all the posting buttons.
  const approveUnlinked = useCallback(
    async (row) => {
      const post = await ensurePostForRow(row);
      if (!post) return;
      await cardProps.onUpdateStatus(post._id, "approved", null, [], undefined, null, [], [], "video");
    },
    [ensurePostForRow, cardProps]
  );

  const rejectUnlinked = useCallback(
    async (row) => {
      const post = await ensurePostForRow(row);
      if (!post) return;
      cardProps.onReject(post._id);
    },
    [ensurePostForRow, cardProps]
  );

  return { cardProps, modals, enablingId, approveUnlinked, rejectUnlinked };
}
