import { useState } from "react";
import { useSession } from "next-auth/react";
import { generateSlug } from "../../utils/generateSlug";
import { X } from "lucide-react";

/**
 * GoLiveButton Component
 * 
 * Features:
 * - Loading state with visual feedback
 * - Error handling with user-friendly messages
 * - Success animation
 * - Slug validation and preview
 * - Accessible button design
 * 
 * Props:
 * - business: Business object with title, locality, storefrontAddress
 * - aiContent: AI-generated content object
 * - mediaImages: Array of image URLs
 * - onSuccess: Callback after successful publication
 * - customSlug: Optional slug to override generation
 */
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

  // Generate slug from business data
  const generateSlugFromBusiness = () => {
    return generateSlug(
      business.title,
      business.locality,
      business.address || business.storefrontAddress?.addressLines?.[0]
    );
  };

  const displaySlug = customSlug || generateSlugFromBusiness();

  const handleGoLive = async () => {
    if (!session) {
      setError("You must be logged in to publish a website.");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to publish website. Please try again."
        );
      }

      // Success - trigger callback and redirect
      if (onSuccess) {
        onSuccess(data.site);
      }

      // Use the slug from the server response to ensure we redirect to the actual saved URL
      const finalSlug = data.site?.slug || slugToSend;
      
      // Construct URL dynamically to support dev/prod environments
      const protocol = window.location.protocol;
      const host = window.location.host;
      
      const rootDomain = host.includes("localhost") ? "localhost:3000" : "limbu.ai";
      const finalSiteUrl = `${protocol}//${finalSlug}.${rootDomain}`;

      // Show success message and redirect
      setTimeout(() => {
        window.location.href = finalSiteUrl;
      }, 1000);

    } catch (err) {
      console.error("Publish error:", err);
      setError(
        err.message || "An error occurred while publishing your website."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2 flex gap-3">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-red-900">Unable to Publish</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 flex items-center gap-3 justify-center">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-blue-700 text-sm font-medium">
            Publishing...
          </p>
        </div>
      )}

      {/* Button Container */}
      <div className="flex flex-row gap-3 items-center">
        <button
          onClick={handleGoLive}
          disabled={isLoading || !business || !aiContent}
          className={`flex-1 px-6 py-3 rounded-xl text-base font-bold shadow-lg transition-all duration-300 ${
            isLoading
              ? "bg-green-600 text-white cursor-wait opacity-80"
              : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-95 cursor-pointer"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-busy={isLoading}
          aria-disabled={!business || !aiContent}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291..."
                />
              </svg>
              Publishing...
            </span>
          ) : (
            "🚀 Go Live"
          )}
        </button>

        {/* Preview Button */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={isLoading}
          className="px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 text-sm"
        >
          {showPreview ? "Close" : "Details"}
        </button>
      </div>

      {/* Compact URL Preview */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Publishing to: <span className="font-mono font-medium text-blue-600">{displaySlug}.limbu.ai</span>
        </p>
      </div>

      {/* Slug Preview Details */}
      {showPreview && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white shadow-2xl border border-gray-200 rounded-2xl p-5 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h3 className="font-bold text-lg text-gray-800">Publish Details</h3>
             <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Business Name</p>
              <p className="text-lg font-semibold">{business?.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Location</p>
              <p className="text-lg font-semibold">{business?.locality}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Website URL</p>
              <code className="text-sm bg-white p-2 rounded border border-gray-200 text-blue-600 font-mono block break-all">
                {displaySlug}.limbu.ai
              </code>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Category</p>
              <p className="text-lg font-semibold">
                {business?.primaryCategory || "Business"}
              </p>
            </div>
          </div>

          {business?.phoneNumbers?.primaryPhone && (
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Phone</p>
              <a
                href={`tel:${business.phoneNumbers.primaryPhone}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                {business.phoneNumbers.primaryPhone}
              </a>
            </div>
          )}

          <p className="text-sm text-gray-600">
            ℹ️ Your website will be live immediately after publishing. You can
            update it anytime.
          </p>
          
          <p className="text-xs text-gray-400 mt-3">
            By clicking "Go Live", you agree to publish this website publicly.
          </p>
        </div>
      )}
    </div>
  );
}
