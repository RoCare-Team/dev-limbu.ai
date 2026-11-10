"use client";

import { useEffect, useState } from "react";

// Shown one after another in the "posting…" modal.
export const POSTING_MESSAGES = ["Please wait...", "Posting...", "Uploading...", "Finalizing..."];
const MESSAGE_INTERVAL_MS = 1500;
const COUNTDOWN_SECONDS = 20;

/**
 * Animation state for the post-publishing modal while `isPosting` is true:
 * a 20 s countdown, a rotating status message and "..." dots.
 */
export function usePostingProgress(isPosting) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isPosting) return;

    setTimeLeft(COUNTDOWN_SECONDS);
    setMsgIndex(0);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    const messages = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % POSTING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(countdown);
      clearInterval(messages);
      clearInterval(dotTimer);
    };
  }, [isPosting]);

  return { messages: POSTING_MESSAGES, msgIndex, timeLeft, dots };
}
