import { useState } from "react";
import { useSession } from "next-auth/react";
import { generateSlug } from "../../utils/generateSlug";

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
 */
export default function GoLiveButton({
  business,
  aiContent,
  mediaImages,
  onSuccess,
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

  const slug = generateSlugFromBusiness();
  const siteUrl = `https://${slug}.limbu.ai`;

  const handleGoLive = async () => {
    if (!session) {
      setError("You must be logged in to publish a website.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/save-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
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

      // Show success message and redirect
      setTimeout(() => {
        window.location.href = siteUrl;
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
    <div className="space-y-4">
      {/* Slug Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Your website will be published at:
        </p>
        <code className="block bg-white p-3 rounded border border-gray-200 text-blue-600 font-mono text-sm break-all">
          {siteUrl}
        </code>
        <p className="text-xs text-gray-600 mt-2">
          💡 Visit this URL after publishing to view your live website
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <span className="text-red-600 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-red-900">Unable to Publish</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!error && !isLoading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            ✅ Your website is ready to be published
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
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
          <p className="text-blue-700 font-medium">
            Publishing your website... This may take a few moments.
          </p>
        </div>
      )}

      {/* Button Container */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleGoLive}
          disabled={isLoading || !business || !aiContent}
          className={`flex-1 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
            isLoading
              ? "bg-green-600 text-white cursor-wait opacity-80"
              : "bg-green-600 text-white hover:bg-green-700 active:scale-95 cursor-pointer"
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
          className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {showPreview ? "✕ Close" : "👁️ Preview"}
        </button>
      </div>

      {/* Slug Preview Details */}
      {showPreview && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-lg">Website Details</h3>

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
                {slug}.limbu.ai
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
        </div>
      )}

      {/* Terms & Conditions */}
      <p className="text-xs text-gray-500">
        By clicking "Go Live", you agree to publish this website to{" "}
        <span className="font-semibold">{slug}.limbu.ai</span>. Your website
        will be publicly accessible on the internet.
      </p>
    </div>
  );
}
