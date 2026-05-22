"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { generateSlug } from "../../utils/generateSlug";
import { resolveSiteUserId, isChatbotSiteOwnerId } from "@/lib/resolveSiteUserId";
import { X, CheckCircle, ExternalLink, Copy, Check } from "lucide-react";

export default function GoLiveButton({
  business,
  aiContent,
  mediaImages,
  onSuccess,
  customSlug,
  phone: phoneProp,
}) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUserId = window.localStorage.getItem("userId");
      if (storedUserId) setUserId(storedUserId);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const generateSlugFromBusiness = () => {
    return generateSlug(business?.title, business?.locality);
  };

  const displaySlug = customSlug || generateSlugFromBusiness();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = liveUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoLive = async () => {
    if (!session) {
      setError("You must be logged in to publish a website.");
      return;
    }

    const ownerPhone =
      phoneProp ||
      business?.primaryPhone ||
      business?.phoneNumbers?.primaryPhone ||
      (typeof window !== "undefined" ? localStorage.getItem("chatbotPhone") : null);

    const effectiveUserId = resolveSiteUserId({
      userId,
      phone: ownerPhone,
      email: session?.user?.email,
    });

    if (!effectiveUserId) {
      setError("User ID or phone missing. Connect Google Business or log in again.");
      return;
    }

    if (!business || !aiContent) {
      setError("Website data is missing. Please generate the website first.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const slugToSend = customSlug || generateSlugFromBusiness();

      const response = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugToSend,
          business,
          aiContent,
          mediaImages,
          userId: effectiveUserId,
          phone: ownerPhone || undefined,
          email: session?.user?.email || undefined,
          type: isChatbotSiteOwnerId(effectiveUserId) ? "chatbot" : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to publish website. Please try again."
        );
      }

      // ✅ Call parent success callback
      if (onSuccess) onSuccess(data.site);

      const finalSlug = data?.site?.slug || slugToSend;

      // ✅ Build correct final URL
      const isLocal = window.location.hostname === "localhost" ||
                      window.location.hostname === "127.0.0.1";

      const rootDomain = isLocal ? `localhost:3000` : ROOT_DOMAIN;

      // On localhost: use path-based routing /slug
      // On production: use subdomain slug.limbu.ai
      const finalUrl = isLocal
        ? `${window.location.protocol}//${rootDomain}/${finalSlug}`
        : `https://${finalSlug}.${rootDomain}`;

      setLiveUrl(finalUrl);
      setIsPublished(true);

      // ✅ Open in new tab — safe, doesn't break current page
      setTimeout(() => {
        window.open(finalUrl, "_blank", "noopener,noreferrer");
      }, 400);

    } catch (err) {
      console.error("Publish error:", err);
      setError(err.message || "An error occurred while publishing your website.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex gap-3 items-start">
          <span className="text-red-500 text-lg mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-900 text-sm">Unable to Publish</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Loading Banner ── */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 mb-3 flex items-center gap-3 justify-center">
          <div className="animate-spin">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-blue-700 text-sm font-medium">
            Publishing your website...
          </p>
        </div>
      )}

      {/* ── SUCCESS STATE ── */}
      {isPublished && liveUrl ? (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-2">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="font-bold text-green-900 text-base">
              Your website is LIVE! 🎉
            </p>
          </div>

          {/* URL display */}
          <div className="bg-white border border-green-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-gray-500 mb-0.5">Live URL</p>
            <p className="text-sm font-mono font-semibold text-blue-600 break-all">
              {liveUrl}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener,noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Live Site
            </a>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition text-sm font-semibold ${
                copied
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "border-green-300 text-green-700 hover:bg-green-100"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy URL
                </>
              )}
            </button>
          </div>

          {/* Re-publish option */}
          <button
            onClick={() => {
              setIsPublished(false);
              setLiveUrl("");
              setError(null);
            }}
            className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition underline"
          >
            Publish again with changes
          </button>
        </div>

      ) : (
        /* ── DEFAULT STATE — Go Live button ── */
        <div className="flex flex-row gap-3 items-center">
          <button
            onClick={handleGoLive}
            disabled={isLoading || !business || !aiContent}
            className={`flex-1 px-6 py-3 rounded-xl text-base font-bold shadow-lg transition-all duration-300 ${
              isLoading
                ? "bg-green-600 text-white cursor-wait opacity-80"
                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-95"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? "Publishing..." : "🚀 Go Live"}
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={isLoading}
            className="px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 text-sm"
          >
            {showPreview ? "Close" : "Details"}
          </button>
        </div>
      )}

      {/* ── URL preview text ── */}
      {!isPublished && (
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            Publishing to:{" "}
            <span className="font-mono font-medium text-blue-600">
              {displaySlug}.{ROOT_DOMAIN}
            </span>
          </p>
        </div>
      )}

      {/* ── Details Panel ── */}
      {showPreview && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white shadow-2xl border border-gray-200 rounded-2xl p-5 z-50">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg text-gray-800">Publish Details</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Business Name</p>
              <p className="text-base font-semibold text-gray-900">{business?.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Location</p>
              <p className="text-base font-semibold text-gray-900">{business?.locality}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-600 font-medium mb-1">Website URL</p>
              <code className="text-sm bg-gray-100 p-2 rounded border text-blue-600 font-mono block break-all">
                {displaySlug}.{ROOT_DOMAIN}
              </code>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Category</p>
              <p className="text-base font-semibold text-gray-900">
                {business?.primaryCategory || "Business"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPreview(false);
              handleGoLive();
            }}
            disabled={isLoading || !business || !aiContent}
            className="mt-5 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            🚀 Confirm & Go Live
          </button>
        </div>
      )}
    </div>
  );
}