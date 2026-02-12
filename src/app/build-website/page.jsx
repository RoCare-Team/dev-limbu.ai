"use client";

import { useEffect, useState } from "react";
import { generateSlug } from "../../../utils/generateSlug";
import { useSession } from "next-auth/react";
import GoLiveButton from "@/components/GoLiveButton";

export default function BuildWebsitePage() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [business, setBusiness] = useState(null);
  const [aiContent, setAiContent] = useState(null);
  const [mediaImages, setMediaImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  // ✅ Load Locations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");

    if (!stored) {
      setError("No business locations found.");
      return;
    }

    const parsed = JSON.parse(stored);
    setLocations(parsed);

    if (parsed.length === 1) {
      setSelectedLocation(parsed[0]);
    }
  }, []);

  // ✅ Generate Website
  const handleGenerate = async () => {
    if (!selectedLocation) return;

    try {
      const accessToken = session?.accessToken;

      setLoading(true);
      setError(null);

      // 1️⃣ Generate slug
      const slug = generateSlug(
        selectedLocation.title,
        selectedLocation.locality
      );

      // 2️⃣ Fetch Business Data
      const businessRes = await fetch(`/api/review-page/${slug}`);
      const businessData = await businessRes.json();

      console.log("businessData",businessData);
      

      if (!businessRes.ok) {
        throw new Error(businessData?.error || "Business fetch failed");
      }

      setBusiness(businessData);

      // 3️⃣ Fetch AI Content
      const aiRes = await fetch("/api/ai-genrated-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: businessData.title,
          locality: businessData.locality,
          primaryCategory: businessData.primaryCategory,
          additionalCategories:
            businessData.additionalCategories || [],
        }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData?.error || "AI generation failed");
      }

      setAiContent(aiData.content);

      // 4️⃣ 🔥 Fetch Google Media Properly

      if (!accessToken) {
        throw new Error("Access token missing.");
      }

      const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${selectedLocation.accountId}/locations/${selectedLocation.locationId}/media`;

      const mediaRes = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const mediaData = await mediaRes.json();

      if (!mediaRes.ok) {
        console.error("Media API Error:", mediaData);
        throw new Error(
          mediaData?.error?.message || "Media fetch failed"
        );
      }

      const images =
        mediaData.mediaItems
          ?.filter((item) => item.mediaFormat === "PHOTO")
          ?.map((item) => item.sourceUrl) || [];

      setMediaImages(images);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hero Image (First Google Image OR fallback)
  const heroImage =
    mediaImages[0] ||
    "https://source.unsplash.com/1600x900/?business";

  // ✅ Loading
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-6">
        {/** optional logo while loading */}
        {selectedLocation?.logoUrl && (
          <img
            src={selectedLocation.logoUrl}
            alt={selectedLocation?.title || "Logo"}
            className="h-20 object-contain mb-6"
          />
        )}

        <div className="animate-spin mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Waiting — limbu.ai is something big...</h2>
        <p className="text-gray-600 max-w-xl">We're generating your business website now. This may take a few moments while we fetch images and prepare your content.</p>
      </div>
    );
  }

  // ✅ Error
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        ❌ {error}
      </div>
    );
  }

  // ✅ Step 1 – Business Selection
  if (!aiContent) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h1 className="text-3xl font-bold mb-8">
          Select Business
        </h1>

        {locations.length > 1 && (
          <select
            className="w-full border px-4 py-3 rounded"
            onChange={(e) =>
              setSelectedLocation(
                locations.find(
                  (loc) =>
                    loc.locationId === e.target.value
                )
              )
            }
          >
            <option value="">Choose Business</option>

            {locations.map((loc) => (
              <option
                key={loc.locationId}
                value={loc.locationId}
              >
                {loc.title} - {loc.locality}
              </option>
            ))}
          </select>
        )}

        {selectedLocation && (
          <button
            onClick={handleGenerate}
            className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
          >
            🚀 Generate AI Website
          </button>
        )}
      </div>
    );
  }

  // ✅ Final Website Render
  return (
   <>
    <div className="font-sans text-gray-800">

      {/* HERO */}
      <section
        className="relative text-white py-32 text-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative z-10 px-6">

          {/* LOGO */}
          {business?.logoUrl && (
            <img
              src={business.logoUrl}
              alt="Business Logo"
              className="mx-auto mb-6 h-20 object-contain"
            />
          )}

          <h1 className="text-4xl md:text-6xl font-bold">
            {aiContent.hero?.headline}
          </h1>

          <p className="mt-6 text-xl">
            {aiContent.hero?.subheadline}
          </p>

          <a
            href={`tel:${business.phoneNumbers?.primaryPhone}`}
            className="inline-block mt-8 bg-white text-black px-8 py-3 rounded-lg font-semibold"
          >
            {aiContent.hero?.ctaPrimary}
          </a>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">
          {aiContent.about?.title}
        </h2>
        <p className="text-gray-600">
          {aiContent.about?.content}
        </p>
      </section>

      {/* SERVICES WITH GOOGLE IMAGES */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Services
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {aiContent.services?.map((service, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                {mediaImages[i + 1] && (
                  <img
                    src={mediaImages[i + 1]}
                    alt={service.title}
                    className="h-48 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <h3 className="font-semibold text-lg">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-gray-600 text-sm">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Contact {business.title}
        </h2>

        <p>
          📍 {business.storefrontAddress?.addressLines?.[0]}
        </p>
        <p className="mt-2">
          ☎ {business.phoneNumbers?.primaryPhone}
        </p>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-sm bg-gray-100">
        © {new Date().getFullYear()} {business.title}. All rights reserved.
      </footer>

      

    </div>

    {/* GO LIVE BUTTON */}
    <div className="max-w-2xl mx-auto px-6 py-16">
      <GoLiveButton 
        business={business}
        aiContent={aiContent}
        mediaImages={mediaImages}
        onSuccess={(site) => {
          console.log("Website published:", site);
        }}
      />
    </div>

   </>
  );
}
