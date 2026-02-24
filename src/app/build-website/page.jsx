"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import GoLiveButton from "@/components/GoLiveButton";
import { Edit, Save, Plus, Trash2, Loader2, X, ArrowLeft, Phone, MapPin, Mail, Clock, MessageCircle, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorTheme, setColorTheme] = useState({
    primary: { from: 'from-blue-600', to: 'to-indigo-600' },
    secondary: { from: 'from-indigo-600', to: 'to-purple-600' },
    accent: { from: 'from-green-500', to: 'to-green-600' },
    name: 'Ocean Blue'
  });
  const { data: session } = useSession();

  // Predefined Color Themes
  const colorThemes = [
    {
      name: 'Ocean Blue',
      primary: { from: 'from-blue-600', to: 'to-indigo-600', hex: '#2563eb' },
      secondary: { from: 'from-indigo-600', to: 'to-purple-600', hex: '#4f46e5' },
      accent: { from: 'from-green-500', to: 'to-green-600', hex: '#22c55e' }
    },
    {
      name: 'Sunset Orange',
      primary: { from: 'from-orange-500', to: 'to-red-600', hex: '#f97316' },
      secondary: { from: 'from-red-500', to: 'to-pink-600', hex: '#ef4444' },
      accent: { from: 'from-green-500', to: 'to-green-600', hex: '#22c55e' }
    },
    {
      name: 'Forest Green',
      primary: { from: 'from-green-600', to: 'to-emerald-600', hex: '#16a34a' },
      secondary: { from: 'from-emerald-600', to: 'to-teal-600', hex: '#059669' },
      accent: { from: 'from-blue-500', to: 'to-blue-600', hex: '#3b82f6' }
    },
    {
      name: 'Royal Purple',
      primary: { from: 'from-purple-600', to: 'to-violet-600', hex: '#9333ea' },
      secondary: { from: 'from-violet-600', to: 'to-fuchsia-600', hex: '#7c3aed' },
      accent: { from: 'from-pink-500', to: 'to-pink-600', hex: '#ec4899' }
    },
    {
      name: 'Crimson Red',
      primary: { from: 'from-red-600', to: 'to-rose-600', hex: '#dc2626' },
      secondary: { from: 'from-rose-600', to: 'to-pink-600', hex: '#e11d48' },
      accent: { from: 'from-yellow-500', to: 'to-yellow-600', hex: '#eab308' }
    },
    {
      name: 'Teal Wave',
      primary: { from: 'from-teal-600', to: 'to-cyan-600', hex: '#0d9488' },
      secondary: { from: 'from-cyan-600', to: 'to-blue-600', hex: '#0891b2' },
      accent: { from: 'from-amber-500', to: 'to-amber-600', hex: '#f59e0b' }
    },
    {
      name: 'Slate Professional',
      primary: { from: 'from-slate-700', to: 'to-gray-800', hex: '#334155' },
      secondary: { from: 'from-gray-700', to: 'to-slate-800', hex: '#374151' },
      accent: { from: 'from-blue-500', to: 'to-blue-600', hex: '#3b82f6' }
    },
    {
      name: 'Golden Luxury',
      primary: { from: 'from-amber-600', to: 'to-yellow-600', hex: '#d97706' },
      secondary: { from: 'from-yellow-600', to: 'to-orange-600', hex: '#ca8a04' },
      accent: { from: 'from-rose-500', to: 'to-rose-600', hex: '#f43f5e' }
    }
  ];

  // ✅ Load Locations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");

    if (!stored) {
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
      setCurrentSlug(slugToSave);
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
        const list = [...(newData[section] || [])];
        list[index] = { ...list[index], [key]: value };
        newData[section] = list;
      } else {
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

      const accessToken =
        session?.accessToken ||
        session?.user?.accessToken ||
        session?.user?.token ||
        null;

      const locality =
        selectedLocation.storefrontAddress?.locality?.trim() || "";

      const address =
        selectedLocation.storefrontAddress?.addressLines?.[0]?.trim() || "";

      const slugToUse = createSlug(selectedLocation.title, selectedLocation.locality, address);

      console.log("Generated slug:", slugToUse);

      setCurrentSlug(slugToUse);

      const useShortSlug = false;
      const apiUrl = useShortSlug
        ? `/api/review-page/${slugToUse}?short=true`
        : `/api/review-page/${slugToUse}`;

      // 1️⃣ Fetch Business Data
      const businessRes = await fetch(apiUrl);
      const businessData = await businessRes.json();
      console.log("businessData",businessData);
      

      if (!businessRes.ok) {
        throw new Error(businessData?.error || "Business fetch failed");
      }

      setBusiness(businessData);

      // 2️⃣ Generate AI Website Content
      const aiRes = await fetch("/api/ai-genrated-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: businessData.title,
          locality: businessData.locality,
          primaryCategory: businessData.primaryCategory,
          additionalCategories: businessData.additionalCategories || [],
        }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData?.error || "AI generation failed");
      }

      setAiContent(aiData.content);

      // 3️⃣ Fetch Google Media
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

  // ✅ Format phone number for WhatsApp
  const getWhatsAppLink = (phone) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  // ✅ Reusable Loading Overlay
  const LoadingOverlay = () => (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ y: -800, opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden"
    >
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md border border-gray-100 relative">
        {/* 🚀 Floating Rocket */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mb-6 flex justify-center"
        >
          <Rocket className="w-20 h-20 text-blue-600" />
        </motion.div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Launching Your Website 🚀
        </h2>

        <p className="text-gray-600 leading-relaxed">
          AI is generating content, images, and structure.
          Sit tight — we’re almost ready for takeoff!
        </p>

        {/* Fire Effect */}
        <motion.div
          animate={{ scaleY: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.4 }}
          className="w-4 h-8 bg-gradient-to-b from-orange-400 to-red-600 mx-auto mt-3 rounded-b-full"
        />
      </div>
    </motion.div>
  );

  // ✅ Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border border-red-100">
          <div className="text-red-500 mb-4 mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <AnimatePresence>
          {loading && <LoadingOverlay />}
        </AnimatePresence>

        <div className="max-w-3xl w-full space-y-8 bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
         <div className="text-center">
  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  </div>

  <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 leading-tight">
    Build Your Professional Business Website with Limbu AI
  </h1>

  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
    Launch your AI-powered business website in minutes with 
    <span className="font-semibold text-blue-600"> Free Domain </span> 
    and 
    <span className="font-semibold text-indigo-600"> Free High-Speed  Server</span>. 
    No coding required. Perfect for startups, local businesses, and entrepreneurs who want to grow online fast.
  </p>

  <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
    Select your location and let Limbu AI instantly generate a fully responsive, SEO-optimized website tailored for your business.
  </p>
</div>

          <div className="mt-10 space-y-6">
            {locations.length > 0 ? (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Your Business Location
                </label>
                <select
                  className="block w-full pl-5 pr-10 py-4 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-white hover:border-blue-300 transition-all cursor-pointer appearance-none shadow-sm"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-blue-600 mt-8">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="font-medium">No locations found</p>
                <p className="text-sm mt-2">Please connect your Google Business Profile first.</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedLocation}
              className={`w-full flex justify-center items-center gap-3 py-5 px-6 border-0 rounded-xl shadow-lg text-lg font-bold text-white transition-all duration-300 ${
                selectedLocation 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0" 
                  : "bg-gray-300 cursor-not-allowed opacity-60"
              }`}
            >
              {selectedLocation ? (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Website
                </>
              ) : (
                "Select a Location to Start"
              )}
            </button>

            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">30s</div>
                  <div className="text-xs text-gray-600 mt-1">Generation Time</div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600">AI</div>
                  <div className="text-xs text-gray-600 mt-1">Powered Content</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-xs text-gray-600 mt-1">Customizable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Website Preview with Enhanced Design
  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
              setAiContent(null);
              setBusiness(null);
            }
          }}
          className="bg-white text-gray-700 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-all border border-gray-200 font-medium hover:shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Color Theme Button */}
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="bg-white text-gray-700 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-all border border-gray-200 font-medium hover:shadow-xl"
          title="Change Color Theme"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Colors
        </button>

        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 font-semibold`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className={`bg-gradient-to-r ${colorTheme.primary.from} ${colorTheme.primary.to} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 font-semibold`}
          >
            <Edit className="w-4 h-4" />
            Edit Content
          </button>
        )}
      </div>

      {/* Color Picker Panel */}
      {showColorPicker && (
        <div className="fixed top-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Color Themes</h3>
            <button
              onClick={() => setShowColorPicker(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {colorThemes.map((theme, index) => (
              <button
                key={index}
                onClick={() => {
                  setColorTheme(theme);
                  setShowColorPicker(false);
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                  colorTheme.name === theme.name 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-sm">{theme.name}</span>
                  {colorTheme.name === theme.name && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 h-8 rounded-lg shadow-sm"
                    style={{ background: `linear-gradient(to right, ${theme.primary.hex}, ${theme.secondary.hex})` }}
                  ></div>
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: theme.accent.hex }}
                  ></div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Current theme: <span className="font-semibold text-gray-700">{colorTheme.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      {business?.phoneNumbers?.primaryPhone && (
        <a
          href={getWhatsAppLink(business.phoneNumbers.primaryPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed right-6 bottom-28 z-50 bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white p-4 rounded-full shadow-2xl hover:opacity-90 transition-all transform hover:scale-110 group animate-bounce-slow`}
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
            Chat with us on WhatsApp
          </span>
        </a>
      )}

      <div className="font-sans text-gray-800">
        {/* HERO SECTION - Enhanced with Centered Logo */}
        <section
          className="relative text-white min-h-screen flex items-center justify-center text-center overflow-hidden"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Enhanced Overlay with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-indigo-900/75 to-purple-900/85"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          {/* Logo - Top Left Corner */}
          {business?.logoUrl && (
            <div className="absolute top-6 left-6 z-20 animate-in fade-in slide-in-from-top duration-700">
              <div className="bg-white p-4 rounded-2xl shadow-2xl">
                <img
                  src={business.logoUrl}
                  alt={`${business.title} Logo`}
                  className="h-16 w-auto max-w-[200px] object-contain"
                  style={{ 
                    objectFit: 'contain',
                    maxHeight: '64px'
                  }}
                />
              </div>
            </div>
          )}

          <div className="relative z-10 px-6 max-w-6xl mx-auto w-full py-20">

            {isEditing ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                <input
                  value={aiContent.hero?.headline || ""}
                  onChange={(e) => updateContent("hero", "headline", e.target.value)}
                  className="w-full text-4xl md:text-6xl font-bold text-center bg-white/10 backdrop-blur-md border-2 border-white/30 focus:border-white rounded-2xl outline-none placeholder-white/50 p-4 text-white"
                  placeholder="Enter Headline"
                />
                <textarea
                  value={aiContent.hero?.subheadline || ""}
                  onChange={(e) => updateContent("hero", "subheadline", e.target.value)}
                  className="w-full text-xl md:text-2xl text-center bg-white/10 backdrop-blur-md border-2 border-white/30 focus:border-white rounded-2xl outline-none resize-none placeholder-white/50 p-4 text-white"
                  rows={2}
                  placeholder="Enter Subheadline"
                />
                <div className="flex justify-center">
                  <input
                    value={aiContent.hero?.ctaPrimary || ""}
                    onChange={(e) => updateContent("hero", "ctaPrimary", e.target.value)}
                    className="text-center bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-xl px-6 py-3 text-white placeholder-white/50 focus:bg-white/30 transition"
                    placeholder="Button Text"
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 max-w-5xl mx-auto">
                <h1 className="text-5xl md:text-7xl lg:text-6xl font-extrabold tracking-tight drop-shadow-2xl leading-tight">
                  {aiContent.hero?.headline}
                </h1>
                <p className="text-xl md:text-3xl text-gray-100 leading-relaxed drop-shadow-lg font-light">
                  {aiContent.hero?.subheadline}
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                  <a
                    href={`tel:${business.phoneNumbers?.primaryPhone}`}
                    className={`inline-flex items-center gap-3 bg-gradient-to-r ${colorTheme.primary.from} ${colorTheme.primary.to} hover:opacity-90 text-white px-10 py-5 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-2xl`}
                  >
                    <Phone className="w-6 h-6" />
                    {aiContent.hero?.ctaPrimary}
                  </a>
                  <a
                    href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-3 bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} hover:opacity-90 text-white px-10 py-5 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-2xl`}
                  >
                    <MessageCircle className="w-6 h-6" />
                    WhatsApp Us
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block">
                <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.primary.hex || '#3b82f6' }}>About Us</span>
                {isEditing ? (
                  <input
                    value={aiContent.about?.title || ""}
                    onChange={(e) => updateContent("about", "title", e.target.value)}
                    className="w-full text-4xl md:text-5xl font-bold text-center border-b-2 border-blue-500 focus:border-indigo-600 outline-none pb-2 text-gray-900 mb-6"
                    placeholder="Section Title"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    {aiContent.about?.title}
                  </h2>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={aiContent.about?.content || ""}
                onChange={(e) => updateContent("about", "content", e.target.value)}
                className="w-full text-lg text-gray-700 text-center border-2 border-gray-200 p-6 rounded-2xl focus:border-blue-500 outline-none resize-none min-h-[250px]"
                placeholder="About Content"
              />
            ) : (
              <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap text-center">
                  {aiContent.about?.content}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="py-32 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.primary.hex || '#3b82f6' }}>What We Offer</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our comprehensive range of professional services designed to meet your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiContent.services?.map((service, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2"
                >
                  <div className="h-64 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <img
                      src={mediaImages[i + 1] || `https://source.unsplash.com/800x600/?${service.title.split(' ')[0]},professional,business`}
                      alt={service.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
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
                          className="w-full font-bold text-2xl border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2"
                        />
                        <textarea
                          value={service.description}
                          onChange={(e) => updateContent("services", "description", e.target.value, i)}
                          className="w-full text-gray-600 border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none resize-none"
                          rows={4}
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-2xl mb-4 text-gray-900 group-hover:text-opacity-90 transition-colors service-title">
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

        {/* GALLERY SECTION */}
        {mediaImages.length > 3 && (
          <section className="py-32 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.primary.hex || '#3b82f6' }}>Our Work</span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Gallery
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Take a look at our projects and the quality of work we deliver
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaImages.slice(0, 12).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <span className="text-white font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        View Image
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CUSTOM SECTIONS */}
        {aiContent.customSections?.map((section, i) => (
          <section key={i} className="py-32 px-6 border-t border-gray-100 relative group bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-5xl mx-auto text-center">
              {isEditing && (
                <button
                  onClick={() => removeCustomSection(i)}
                  className="absolute top-8 right-8 text-red-400 hover:text-red-600 hover:bg-red-50 p-3 rounded-full transition-all shadow-lg"
                  title="Remove Section"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              
              <div className="mb-12">
                <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.primary.hex || '#3b82f6' }}>Additional Info</span>
                {isEditing ? (
                  <input
                    value={section.title}
                    onChange={(e) => updateContent("customSections", "title", e.target.value, i)}
                    className="w-full text-4xl md:text-5xl font-bold text-center border-b-2 border-blue-500 focus:border-indigo-600 outline-none pb-2 mb-6"
                    placeholder="Section Title"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{section.title}</h2>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={section.content}
                  onChange={(e) => updateContent("customSections", "content", e.target.value, i)}
                  className="w-full text-lg text-gray-700 text-center border-2 border-gray-200 p-6 rounded-2xl focus:border-blue-500 outline-none resize-none min-h-[200px]"
                  placeholder="Section Content"
                />
              ) : (
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </div>
              )}
            </div>
          </section>
        ))}

        {/* ADD SECTION BUTTON */}
        {isEditing && (
          <div className="py-16 text-center bg-gray-50 border-y-2 border-dashed border-gray-300">
            <button
              onClick={addCustomSection}
              className={`inline-flex items-center gap-3 px-10 py-5 border-2 border-dashed hover:bg-opacity-10 rounded-2xl transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
              style={{
                borderColor: colorTheme.primary.hex || '#3b82f6',
                color: colorTheme.primary.hex || '#3b82f6'
              }}
            >
              <Plus className="w-6 h-6" />
              Add New Section
            </button>
          </div>
        )}

        {/* CONTACT FORM SECTION */}
        <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.primary.hex || '#3b82f6' }}>Get In Touch</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Request a Free Quote
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Fill out the form below and we'll get back to you as soon as possible
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className={`bg-gradient-to-br ${colorTheme.primary.from} ${colorTheme.primary.to} p-10 rounded-3xl text-white shadow-2xl`}>
                  <h3 className="text-3xl font-bold mb-6">Contact Information</h3>
                  <p className="text-blue-100 mb-8 text-lg">
                    Feel free to reach out to us through any of these channels
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Phone</p>
                        <a href={`tel:${business.phoneNumbers?.primaryPhone}`} className="text-blue-100 hover:text-white transition">
                          {business.phoneNumbers?.primaryPhone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Address</p>
                        <p className="text-blue-100">
                          {business.storefrontAddress?.addressLines?.[0] || business.address}
                          {business.locality && `, ${business.locality}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">WhatsApp</p>
                        <a 
                          href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-100 hover:text-white transition"
                        >
                          Chat with us instantly
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/20">
                    <p className="text-blue-100 text-sm mb-4">Connect with us</p>
                    <div className="flex gap-4">
                      <a
                        href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 hover:bg-white/30 p-3 rounded-xl backdrop-blur-sm transition"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('name');
                  const phone = formData.get('phone');
                  const email = formData.get('email');
                  const service = formData.get('service');
                  const message = formData.get('message');
                  
                  // Create WhatsApp message
                  const whatsappMessage = `Hi! I'm interested in your services.%0A%0AName: ${name}%0APhone: ${phone}%0AEmail: ${email}%0AService: ${service}%0AMessage: ${message}`;
                  const whatsappUrl = `${getWhatsAppLink(business.phoneNumbers?.primaryPhone)}&text=${whatsappMessage}`;
                  
                  window.open(whatsappUrl, '_blank');
                }}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        placeholder="Your phone number"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Required
                    </label>
                    <select
                      id="service"
                      name="service"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition appearance-none bg-white"
                    >
                      <option value="">Select a service</option>
                      {aiContent.services?.map((service, i) => (
                        <option key={i} value={service.title}>{service.title}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition resize-none"
                      placeholder="Tell us about your requirements..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className={`w-full bg-gradient-to-r ${colorTheme.primary.from} ${colorTheme.primary.to} hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send via WhatsApp
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    Your message will be sent via WhatsApp
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="py-32 px-6 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="font-semibold text-sm uppercase tracking-wider mb-4 block" style={{ color: colorTheme.secondary.hex || '#4f46e5' }}>Get In Touch</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                We're here to help and answer any question you might have
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-4 rounded-xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {business.storefrontAddress?.addressLines?.[0] || business.address}
                      {business.locality && `, ${business.locality}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-500 p-4 rounded-xl">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Call Us</h3>
                    <a href={`tel:${business.phoneNumbers?.primaryPhone}`} className="text-gray-300 hover:text-white transition-colors text-lg">
                      {business.phoneNumbers?.primaryPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12 flex flex-wrap justify-center gap-4">
              <a
                href={`tel:${business.phoneNumbers?.primaryPhone}`}
                className={`inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl hover:shadow-white/20`}
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
              <a
                href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-3 bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl`}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 bg-gray-950 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-gray-400">
                  © {new Date().getFullYear()} <span className="text-white font-semibold">{business.title}</span>. All rights reserved.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm">Powered by AI</span>
                <div className="h-4 w-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm">Professional Website</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* GO LIVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/98 backdrop-blur-xl border-t-2 border-gray-200 flex justify-center z-40 shadow-2xl">
        <div className="w-full max-w-2xl">
          <GoLiveButton 
            business={business}
            aiContent={aiContent}
            mediaImages={mediaImages}
              customSlug={currentSlug} // ✅ Ensures the slug generated here is used
            onSuccess={(site) => {
              console.log("Website published:", site);
              setIsEditing(false);
            }}
          />
        </div>
      </div>
      <div className="h-24"></div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-in-from-top {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-bottom-8 {
          from {
            transform: translateY(32px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-top {
          animation-name: slide-in-from-top;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        .slide-in-from-bottom-8 {
          animation-name: slide-in-from-bottom-8;
        }
        .duration-500 {
          animation-duration: 500ms;
        }
        .duration-700 {
          animation-duration: 700ms;
        }
        .group:hover .service-title {
          color: ${colorTheme.primary.hex || '#3b82f6'} !important;
        }
      `}</style>
    </div>
  );
}