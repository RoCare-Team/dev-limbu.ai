"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import GoLiveButton from "@/components/GoLiveButton";
import { Edit, Save, Plus, Trash2, Loader2, X, ArrowLeft } from "lucide-react";

// ✅ Consistent Slug Generator
const createSlug = (title = "", locality = "", address = "") => {
  return [title, locality, address]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function BuildWebsitePage() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [business, setBusiness] = useState(null);
  const [aiContent, setAiContent] = useState(null);
  const [mediaImages, setMediaImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");
  const { data: session } = useSession();

  // ✅ Load Locations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");

    if (!stored) {
      // setError("No business locations found."); // Don't show error immediately, let user see empty state or loading
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setLocations(parsed);

      if (parsed.length === 1) {
        setSelectedLocation(parsed[0]);
      }
    } catch (e) {
      console.error("Failed to parse locations", e);
    }
  }, []);

  // ✅ Fetch Existing Site Data
  useEffect(() => {
    const fetchExistingSite = async () => {
      if (!selectedLocation) return;

      try {
        const address = selectedLocation.storefrontAddress?.addressLines?.[0] || "";
        const slug = createSlug(selectedLocation.title, selectedLocation.locality, address);
        
        console.log("Fetching site for slug:", slug);

        const res = await fetch(`/api/get-site?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.business || data.site?.business)) {
            const siteData = data.site || data;
            setBusiness(siteData.business);
            setAiContent(siteData.aiContent);
            setMediaImages(siteData.mediaImages || []);
            setCurrentSlug(siteData.slug || slug);
          }
        } else {
          console.log("No existing site found for this location.");
          // Reset state if no site found, so user can generate
          setBusiness(null);
          setAiContent(null);
          setMediaImages([]);
          setCurrentSlug("");
        }
      } catch (err) {
        console.log("Error checking for existing site:", err);
      }
    };

    fetchExistingSite();
  }, [selectedLocation]);

  // ✅ Save Site Data
  const handleSave = async () => {
    if (!business || !aiContent) return;
    setIsSaving(true);
    try {
      let slugToSave = currentSlug;
      if (!slugToSave) {
        const address = business.address || business.storefrontAddress?.addressLines?.[0] || "";
        slugToSave = createSlug(business.title, business.locality, address);
      }

      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugToSave,
          business,
          aiContent,
          mediaImages,
          userId: session?.user?.email,
          locationId: selectedLocation?.locationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save website");
      
      setIsEditing(false);
      setCurrentSlug(slugToSave); // Ensure slug is set after save
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Update Content Helper
  const updateContent = (section, key, value, index = null) => {
    setAiContent((prev) => {
      const newData = { ...prev };
      if (index !== null) {
        // Handle array updates (services, customSections)
        const list = [...(newData[section] || [])];
        list[index] = { ...list[index], [key]: value };
        newData[section] = list;
      } else {
        // Handle object updates (hero, about)
        newData[section] = { ...newData[section], [key]: value };
      }
      return newData;
    });
  };

  // ✅ Add/Remove Custom Sections
  const addCustomSection = () => {
    setAiContent((prev) => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        { title: "New Section", content: "Add your content here." },
      ],
    }));
  };

  const removeCustomSection = (index) => {
    setAiContent((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index),
    }));
  };

// ✅ Generate Website
const handleGenerate = async () => {
  if (!selectedLocation) return;

  try {
    setLoading(true);
    setError(null);

    // 🔐 Safe access token extraction
    const accessToken =
      session?.accessToken ||
      session?.user?.accessToken ||
      session?.user?.token ||
      null;

    const locality =
      selectedLocation.storefrontAddress?.locality?.trim() || "";

    const address =
      selectedLocation.storefrontAddress?.addressLines?.[0]?.trim() || "";

    const slugToUse = createSlug(
      selectedLocation.title,
      locality,
      address
    );

    console.log("Generated slug:", slugToUse);

    setCurrentSlug(slugToUse);

    const useShortSlug = false;
    const apiUrl = useShortSlug
      ? `/api/review-page/${slugToUse}?short=true`
      : `/api/review-page/${slugToUse}`;

    // 1️⃣ Fetch Business Data
    const businessRes = await fetch(apiUrl);

    const businessData = await businessRes.json();

    if (!businessRes.ok) {
      throw new Error(
        businessData?.error || "Business fetch failed"
      );
    }

    setBusiness(businessData);

    // 2️⃣ Generate AI Website Content
    const aiRes = await fetch("/api/ai-genrated-website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: businessData.title,
        locality: businessData.locality,
        primaryCategory:
          businessData.primaryCategory,
        additionalCategories:
          businessData.additionalCategories || [],
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      throw new Error(
        aiData?.error || "AI generation failed"
      );
    }

    setAiContent(aiData.content);

    // 3️⃣ Fetch Google Media (Optional)
    let images = [];
    if (accessToken) {
      try {
        const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${selectedLocation.accountId}/locations/${selectedLocation.locationId}/media`;

        const mediaRes = await fetch(mediaUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const mediaData = await mediaRes.json();

        if (mediaRes.ok) {
          images =
            mediaData.mediaItems
              ?.filter((item) => item.mediaFormat === "PHOTO")
              ?.map((item) => item.sourceUrl) || [];

          setMediaImages(images);
        } else {
          console.warn("Media fetch failed:", mediaData);
        }
      } catch (mediaError) {
        console.warn("Media fetch error:", mediaError);
      }
    } else {
      console.warn("⚠️ No access token found, skipping media fetch");
    }

    // 4️⃣ Auto-Save Generated Website
    try {
      const saveRes = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugToUse,
          business: businessData,
          aiContent: aiData.content,
          mediaImages: images,
          userId: session?.user?.email,
          locationId: selectedLocation?.locationId,
        }),
      });

      if (!saveRes.ok) {
        console.error("Auto-save failed");
      }
    } catch (saveErr) {
      console.error("Auto-save error:", saveErr);
    }
  } catch (err) {
    console.error("Generate error:", err);
    setError(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};



  const heroImage = mediaImages[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

  // ✅ Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="animate-spin mb-6 mx-auto text-blue-600">
            <Loader2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Building Your Website</h2>
          <p className="text-gray-600">
            Our AI is crafting content, selecting images, and structuring your layout. 
            This usually takes about 30 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-red-500 mb-4 mx-auto">
            <X className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ✅ Selection State
  if (!aiContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Build Your Business Website
            </h1>
            <p className="text-lg text-gray-600">
              Select a location to instantly generate a professional website using AI.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {locations.length > 0 ? (
              <div className="relative">
                <select
                  className="block w-full pl-4 pr-10 py-4 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl border-2 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                  onChange={(e) => setSelectedLocation(locations.find(loc => loc.locationId === e.target.value))}
                  value={selectedLocation?.locationId || ""}
                >
                  <option value="">Select a Business Location</option>
                  {locations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId}>
                      {loc.title} {loc.locality ? `- ${loc.locality}` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                No locations found. Please connect your Google Business Profile first.
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedLocation}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all duration-200 ${
                selectedLocation 
                  ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {selectedLocation ? "✨ Generate AI Website" : "Select a Location to Start"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Website Preview
  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
              setAiContent(null);
              setBusiness(null);
            }
          }}
          className="bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-50 transition border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 transition transform hover:scale-105"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-700 transition transform hover:scale-105"
          >
            <Edit className="w-4 h-4" />
            Edit Content
          </button>
        )}
      </div>

      <div className="font-sans text-gray-800">
        {/* HERO SECTION */}
        <section
          className="relative text-white min-h-[80vh] flex items-center justify-center text-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

          <div className="relative z-10 px-6 max-w-5xl mx-auto">
            {business?.logoUrl && (
              <img
                src={business.logoUrl}
                alt="Logo"
                className="mx-auto mb-8 h-24 w-auto object-contain drop-shadow-lg"
              />
            )}

            {isEditing ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <input
                  value={aiContent.hero?.headline || ""}
                  onChange={(e) => updateContent("hero", "headline", e.target.value)}
                  className="w-full text-4xl md:text-6xl font-bold text-center bg-transparent border-b-2 border-white/30 focus:border-white outline-none placeholder-white/50 pb-2"
                  placeholder="Enter Headline"
                />
                <textarea
                  value={aiContent.hero?.subheadline || ""}
                  onChange={(e) => updateContent("hero", "subheadline", e.target.value)}
                  className="w-full text-xl md:text-2xl text-center bg-transparent border-b-2 border-white/30 focus:border-white outline-none resize-none placeholder-white/50 pb-2"
                  rows={2}
                  placeholder="Enter Subheadline"
                />
                <div className="flex justify-center">
                  <input
                    value={aiContent.hero?.ctaPrimary || ""}
                    onChange={(e) => updateContent("hero", "ctaPrimary", e.target.value)}
                    className="text-center bg-white/20 backdrop-blur-sm border border-white/50 rounded-lg px-6 py-2 text-white placeholder-white/50 focus:bg-white/30 transition"
                    placeholder="Button Text"
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
                  {aiContent.hero?.headline}
                </h1>
                <p className="text-xl md:text-2xl mb-10 text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                  {aiContent.hero?.subheadline}
                </p>
                <a
                  href={`tel:${business.phoneNumbers?.primaryPhone}`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  {aiContent.hero?.ctaPrimary}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            {isEditing ? (
              <div className="space-y-6">
                <input
                  value={aiContent.about?.title || ""}
                  onChange={(e) => updateContent("about", "title", e.target.value)}
                  className="w-full text-4xl font-bold text-center border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 text-gray-900"
                  placeholder="Section Title"
                />
                <textarea
                  value={aiContent.about?.content || ""}
                  onChange={(e) => updateContent("about", "content", e.target.value)}
                  className="w-full text-lg text-gray-600 text-center border p-4 rounded-xl focus:border-blue-500 outline-none resize-none min-h-[200px]"
                  placeholder="About Content"
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
                  {aiContent.about?.title}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {aiContent.about?.content}
                </p>
              </>
            )}
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
              Our Services
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              {aiContent.services?.map((service, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={mediaImages[i + 1] || `https://source.unsplash.com/800x600/?${service.title.split(' ')[0]},business`}
                      alt={service.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>

                  <div className="p-8">
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          value={service.title}
                          onChange={(e) => updateContent("services", "title", e.target.value, i)}
                          className="w-full font-bold text-xl border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                        />
                        <textarea
                          value={service.description}
                          onChange={(e) => updateContent("services", "description", e.target.value, i)}
                          className="w-full text-gray-600 text-sm border p-2 rounded focus:border-blue-500 outline-none resize-none"
                          rows={4}
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-xl mb-3 text-gray-900">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {service.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CUSTOM SECTIONS */}
        {aiContent.customSections?.map((section, i) => (
          <section key={i} className="py-24 px-6 border-t border-gray-100 relative group bg-white">
            <div className="max-w-4xl mx-auto text-center">
              {isEditing && (
                <button
                  onClick={() => removeCustomSection(i)}
                  className="absolute top-8 right-8 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition"
                  title="Remove Section"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              
              {isEditing ? (
                <div className="space-y-6">
                  <input
                    value={section.title}
                    onChange={(e) => updateContent("customSections", "title", e.target.value, i)}
                    className="w-full text-3xl font-bold text-center border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2"
                    placeholder="Section Title"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => updateContent("customSections", "content", e.target.value, i)}
                    className="w-full text-lg text-gray-600 text-center border p-4 rounded-xl focus:border-blue-500 outline-none resize-none min-h-[150px]"
                    placeholder="Section Content"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">{section.title}</h2>
                  <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </>
              )}
            </div>
          </section>
        ))}

        {/* ADD SECTION BUTTON */}
        {isEditing && (
          <div className="py-12 text-center bg-gray-50 border-t border-dashed border-gray-300">
            <button
              onClick={addCustomSection}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Section
            </button>
          </div>
        )}

        {/* CONTACT SECTION */}
        <section className="py-24 px-6 bg-gray-900 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
            <div className="space-y-4 text-lg text-gray-300">
              <p className="flex items-center justify-center gap-2">
                <span className="text-2xl">📍</span> 
                {business.storefrontAddress?.addressLines?.[0] || business.address}
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-2xl">📞</span> 
                <a href={`tel:${business.phoneNumbers?.primaryPhone}`} className="hover:text-white transition">
                  {business.phoneNumbers?.primaryPhone}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 text-center text-sm text-gray-500 bg-gray-950 border-t border-gray-800">
          <p>© {new Date().getFullYear()} {business.title}. All rights reserved.</p>
        </footer>
      </div>

      {/* GO LIVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-lg">
          <GoLiveButton 
            business={business}
            aiContent={aiContent}
            mediaImages={mediaImages}
            customSlug={currentSlug}
            onSuccess={(site) => {
              console.log("Website published:", site);
              setIsEditing(false);
              // Optionally redirect or show success modal
            }}
          />
        </div>
      </div>
      <div className="h-24"></div> {/* Spacer for fixed bottom bar */}
    </div>
  );
}
