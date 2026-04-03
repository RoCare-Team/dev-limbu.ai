"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { generateSlug } from "../../utils/generateSlug";
import { X } from "lucide-react";

export default function GoLiveButton({
  business,
  aiContent,
  mediaImages,
  onSuccess,
  customSlug,
}) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [userId, setUserId] = useState(null);

  const ROOT_DOMAIN =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUserId = window.localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const generateSlugFromBusiness = () => {
    return generateSlug(
      business?.title,
      business?.locality
    );
  };

  const displaySlug = customSlug || generateSlugFromBusiness();

  const handleGoLive = async () => {
    if (!session) {
      setError("You must be logged in to publish a website.");
      return;
    }

    if (!userId) {
      setError("User ID missing. Please log in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const slugToSend = customSlug || generateSlugFromBusiness();

      const response = await fetch("/api/save-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: slugToSend,
          business,
          aiContent,
          mediaImages,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to publish website. Please try again."
        );
      }

      if (onSuccess) {
        onSuccess(data.site);
      }

      const finalSlug = data?.site?.slug || slugToSend;

      // 🚀 SAFE REDIRECT LOGIC
      const isLocal =
        window.location.hostname.includes("localhost");

      const rootDomain = isLocal
        ? "limbu.local:3000"
        : ROOT_DOMAIN;

      const finalUrl = `${window.location.protocol}//${finalSlug}.${rootDomain}`;

      setTimeout(() => {
        window.location.href = finalUrl;
      }, 800);
    } catch (err) {
      console.error("Publish error:", err);
      setError(
        err.message ||
          "An error occurred while publishing your website."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex gap-3">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-red-900">
              Unable to Publish
            </p>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 flex items-center gap-3 justify-center">
          <div className="animate-spin">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-blue-700 text-sm font-medium">
            Publishing...
          </p>
        </div>
      )}

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

      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Publishing to:{" "}
          <span className="font-mono font-medium text-blue-600">
            {displaySlug}.{ROOT_DOMAIN}
          </span>
        </p>
      </div>

      {showPreview && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white shadow-2xl border border-gray-200 rounded-2xl p-5 z-50">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg text-gray-800">
              Publish Details
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Business Name
              </p>
              <p className="text-lg font-semibold">
                {business?.title}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">
                Location
              </p>
              <p className="text-lg font-semibold">
                {business?.locality}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">
                Website URL
              </p>
              <code className="text-sm bg-gray-100 p-2 rounded border text-blue-600 font-mono block break-all">
                {displaySlug}.{ROOT_DOMAIN}
              </code>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">
                Category
              </p>
              <p className="text-lg font-semibold">
                {business?.primaryCategory || "Business"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
