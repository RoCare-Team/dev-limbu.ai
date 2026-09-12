"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/hooks/useAppSession";
import { resolveSiteUserId, isChatbotSiteOwnerId } from "@/lib/resolveSiteUserId";
import { buildLocalBusinessSchema } from "@/lib/websiteSchema";
import { getWhatsAppLink } from "@/utils/whatsappLink";
import GoLiveButton from "@/components/GoLiveButton";
import {
  Edit,
  Save,
  Plus,
  Trash2,
  Loader2,
  X,
  ArrowLeft,
  Phone,
  MapPin,
  Mail,
  Clock,
  MessageCircle,
  Rocket,
  Building2,
  Sparkles,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ✅ Default social platforms shown in the editor (title + icon + empty link, hidden by default)
const SOCIAL_PLATFORMS = [
  { key: "instagram", title: "Instagram" },
  { key: "facebook", title: "Facebook" },
  { key: "linkedin", title: "LinkedIn" },
  { key: "youtube", title: "YouTube" },
  { key: "twitter", title: "Twitter / X" },
];

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
};

// ✅ Build a complete socialLinks object (all platforms) so it always persists
const buildSocialLinksObject = (aiContent) => {
  const saved = aiContent?.socialLinks || {};
  const obj = {};
  SOCIAL_PLATFORMS.forEach((p) => {
    obj[p.key] = {
      title: saved[p.key]?.title || p.title,
      url: saved[p.key]?.url || "",
      show:
        typeof saved[p.key]?.show === "boolean" ? saved[p.key].show : false,
    };
  });
  return obj;
};

// ✅ Return aiContent guaranteed to contain a full socialLinks object
const withSocialLinks = (aiContent) => ({
  ...(aiContent || {}),
  socialLinks: buildSocialLinksObject(aiContent),
});

// ✅ Merge any saved socialLinks with the default platform list (array for editor)
const getSocialLinks = (aiContent) => {
  const saved = aiContent?.socialLinks || {};
  return SOCIAL_PLATFORMS.map((p) => ({
    key: p.key,
    title: saved[p.key]?.title || p.title,
    url: saved[p.key]?.url || "",
    show:
      typeof saved[p.key]?.show === "boolean" ? saved[p.key].show : false,
  }));
};

// ✅ Consistent Slug Generator (business name + locality only)
const createSlug = (title = "", locality = "") => {
  return [title, locality]
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
  console.log("business in website build", business);
  const [aiContent, setAiContent] = useState(null);
  console.log("ai contant in website build", aiContent);
  const [mediaImages, setMediaImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");
  const [aiGeneratedImages, setAiGeneratedImages] = useState(new Set());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorTheme, setColorTheme] = useState({
    primary: { from: "from-blue-600", to: "to-indigo-600" },
    secondary: { from: "from-indigo-600", to: "to-purple-600" },
    accent: { from: "from-green-500", to: "to-green-600" },
    name: "Ocean Blue",
  });
  const { data: session } = useSession();
  const [userId, setUserId] = useState(null);
  const [chatbotPhone, setChatbotPhone] = useState("");

  const siteOwnerId = useMemo(
    () =>
      resolveSiteUserId({
        userId,
        phone: chatbotPhone,
        email: session?.user?.email,
      }),
    [userId, chatbotPhone, session?.user?.email]
  );

  const sitePublishType = isChatbotSiteOwnerId(siteOwnerId) ? "chatbot" : undefined;

  // Predefined Color Themes
  const colorThemes = [
    {
      name: "Ocean Blue",
      primary: { from: "from-blue-600", to: "to-indigo-600", hex: "#2563eb" },
      secondary: {
        from: "from-indigo-600",
        to: "to-purple-600",
        hex: "#4f46e5",
      },
      accent: { from: "from-green-500", to: "to-green-600", hex: "#22c55e" },
    },
    {
      name: "Sunset Orange",
      primary: { from: "from-orange-500", to: "to-red-600", hex: "#f97316" },
      secondary: { from: "from-red-500", to: "to-pink-600", hex: "#ef4444" },
      accent: { from: "from-green-500", to: "to-green-600", hex: "#22c55e" },
    },
    {
      name: "Forest Green",
      primary: { from: "from-green-600", to: "to-emerald-600", hex: "#16a34a" },
      secondary: {
        from: "from-emerald-600",
        to: "to-teal-600",
        hex: "#059669",
      },
      accent: { from: "from-blue-500", to: "to-blue-600", hex: "#3b82f6" },
    },
    {
      name: "Royal Purple",
      primary: { from: "from-purple-600", to: "to-violet-600", hex: "#9333ea" },
      secondary: {
        from: "from-violet-600",
        to: "to-fuchsia-600",
        hex: "#7c3aed",
      },
      accent: { from: "from-pink-500", to: "to-pink-600", hex: "#ec4899" },
    },
    {
      name: "Crimson Red",
      primary: { from: "from-red-600", to: "to-rose-600", hex: "#dc2626" },
      secondary: { from: "from-rose-600", to: "to-pink-600", hex: "#e11d48" },
      accent: { from: "from-yellow-500", to: "to-yellow-600", hex: "#eab308" },
    },
    {
      name: "Teal Wave",
      primary: { from: "from-teal-600", to: "to-cyan-600", hex: "#0d9488" },
      secondary: { from: "from-cyan-600", to: "to-blue-600", hex: "#0891b2" },
      accent: { from: "from-amber-500", to: "to-amber-600", hex: "#f59e0b" },
    },
    {
      name: "Slate Professional",
      primary: { from: "from-slate-700", to: "to-gray-800", hex: "#334155" },
      secondary: { from: "from-gray-700", to: "to-slate-800", hex: "#374151" },
      accent: { from: "from-blue-500", to: "to-blue-600", hex: "#3b82f6" },
    },
    {
      name: "Golden Luxury",
      primary: { from: "from-amber-600", to: "to-yellow-600", hex: "#d97706" },
      secondary: {
        from: "from-yellow-600",
        to: "to-orange-600",
        hex: "#ca8a04",
      },
      accent: { from: "from-rose-500", to: "to-rose-600", hex: "#f43f5e" },
    },
  ];

  // ✅ Load Locations from localStorage (+ WhatsApp phone from connect flow)
  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");
    const storedUserId = localStorage.getItem("userId");
    const urlPhone =
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("phone") || "").replace(
            /\D/g,
            ""
          )
        : "";
    const storedPhone = (localStorage.getItem("chatbotPhone") || "").replace(/\D/g, "");
    const phoneDigits = urlPhone || storedPhone;
    if (phoneDigits) {
      setChatbotPhone(phoneDigits);
      try {
        localStorage.setItem("chatbotPhone", phoneDigits);
      } catch {
        /* ignore */
      }
    }

    if (!stored) {
      // Still set userId even if no locations found
      if (storedUserId) {
        setUserId(storedUserId);
      }
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

    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // ✅ Fetch Existing Site Data
  useEffect(() => {
    const fetchExistingSite = async () => {
      if (!selectedLocation) return;

      try {
        const address =
          selectedLocation.storefrontAddress?.addressLines?.[0] || "";
        const slug = createSlug(
          selectedLocation.title,
          selectedLocation.locality,
          address,
        );

        console.log("Fetching site for slug:", slug);

        const res = await fetch(`/api/get-site?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.business || data.site?.business)) {
            const siteData = data.site || data;
            setBusiness(siteData.business);
            setAiContent(withSocialLinks(siteData.aiContent));
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
    if (!siteOwnerId) {
      setError("User ID or phone missing. Connect Google Business or log in again.");
      return;
    }
    setIsSaving(true);
    try {
      let slugToSave = currentSlug;
      if (!slugToSave) {
        slugToSave = createSlug(business.title, business.locality);
      }

      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugToSave,
          business,
          aiContent: withSocialLinks(aiContent),
          schemaData: buildLocalBusinessSchema(business, aiContent, slugToSave),
          mediaImages,
          userId: siteOwnerId,
          phone: chatbotPhone || undefined,
          email: session?.user?.email || undefined,
          type: sitePublishType,
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

  // ✅ Update a social link field (url / show / title) for a platform
  const updateSocialLink = (key, field, value) => {
    setAiContent((prev) => {
      const prevSocial = prev?.socialLinks || {};
      const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
      return {
        ...prev,
        socialLinks: {
          ...prevSocial,
          [key]: {
            title: prevSocial[key]?.title || platform?.title || key,
            url: prevSocial[key]?.url || "",
            show:
              typeof prevSocial[key]?.show === "boolean"
                ? prevSocial[key].show
                : false,
            [field]: value,
          },
        },
      };
    });
  };

  // ✅ Generate Website
  const handleGenerate = async () => {
    if (!selectedLocation) return;
    if (!siteOwnerId) {
      setError("User ID or phone missing. Connect Google Business or log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken =
        session?.accessToken ||
        session?.user?.accessToken ||
        session?.user?.token ||
        null;

      const slugToUse = createSlug(
        selectedLocation.title,
        selectedLocation.locality,
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
      console.log("businessData", businessData);

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

      // Ensure socialLinks object always exists so it is editable + saved
      aiData.content = withSocialLinks(aiData.content);
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

      // 3.5️⃣ If no media images found, generate AI images using DALL-E
      if (images.length === 0) {
        try {
          console.log("No media images found — generating AI images...");
          const imageKeywords = aiData.content?.imageKeywords || [];
          const genRes = await fetch("/api/generate-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessType:
                businessData.primaryCategory || "professional business",
              businessName: businessData.title,
              locality: businessData.locality || "",
              count: 2,
              imageKeywords,
            }),
          });
          if (genRes.ok) {
            const genData = await genRes.json();
            if (genData.images?.length > 0) {
              images = genData.images;
              setMediaImages(images);
              setAiGeneratedImages(new Set(genData.images));
              console.log("✅ AI images generated:", genData.images);
            }
          }
        } catch (genErr) {
          console.warn("AI image generation failed:", genErr);
        }
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
            schemaData: buildLocalBusinessSchema(
              businessData,
              aiData.content,
              slugToUse
            ),
            mediaImages: images,
            userId: siteOwnerId,
            phone: chatbotPhone || undefined,
            email: session?.user?.email || undefined,
            type: sitePublishType,
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

  const socialLinks = getSocialLinks(aiContent);
  const activeSocialLinks = socialLinks.filter((s) => s.show && s.url);

  const validMediaImages = mediaImages.filter(Boolean);
  const heroImage =
    validMediaImages[0] ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";
  const galleryImages = validMediaImages.slice(0, 10);

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
          AI is generating content, images, and structure. Sit tight — we’re
          almost ready for takeoff!
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
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
        <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>

        <div className="max-w-3xl w-full space-y-8 bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-lightPrimary  rounded-2xl mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>

            <h1 className="text-5xl font-extrabold text-dark mb-4 leading-tight">
              Build Your Professional Business Website with Limbu AI
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Launch your AI-powered business website in minutes with
              <span className="font-semibold text-lightPrimary">
                {" "}
                Free Domain{" "}
              </span>
              and
              <span className="font-semibold text-lightPrimary">
                {" "}
                Free High-Speed Server
              </span>
              . No coding required. Perfect for startups, local businesses, and
              entrepreneurs who want to grow online fast.
            </p>

            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Select your location and let Limbu AI instantly generate a fully
              responsive, SEO-optimized website tailored for your business.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            {locations.length > 0 ? (
              <div className="relative">
                <label className="block text-sm font-semibold text-dark mb-2">
                  Choose Your Business Location
                </label>
                <select
                  className="block w-full pl-5 pr-10 py-4 text-base border-2 text-dark border-gray-200 focus:outline-none focus:ring-2 focus:ring-lightPrimary focus:border-transparent sm:text-sm rounded-xl bg-white hover:border-lightPrimary transition-all cursor-pointer appearance-none shadow-sm"
                  onChange={(e) =>
                    setSelectedLocation(
                      locations.find(
                        (loc) => loc.locationId === e.target.value,
                      ),
                    )
                  }
                  value={selectedLocation?.locationId || ""}
                >
                  <option value="">Select a Business Location</option>
                  {locations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId}>
                      {loc.title} {loc.locality ? `- ${loc.locality}` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-lightPrimary mt-8">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="font-medium">No locations found</p>
                <p className="text-sm mt-2">
                  Please connect your Google Business Profile first.
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedLocation}
              className={`w-full flex justify-center items-center gap-3 py-5 px-6 border-0 rounded-xl shadow-lg text-lg font-bold text-dark transition-all duration-300 ${
                selectedLocation
                  ? "bg-lightPrimary hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0"
                  : "bg-gray-300 cursor-not-allowed opacity-60"
              }`}
            >
              {selectedLocation ? (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate AI Website
                </>
              ) : (
                "Select a Location to Start"
              )}
            </button>

            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-dark rounded-xl">
                  <div className="text-2xl font-bold text-lightPrimary">
                    30s
                  </div>
                  <div className="text-xs text-lightPrimary mt-1">
                    Generation Time
                  </div>
                </div>
                <div className="p-4 bg-lightPrimary rounded-xl">
                  <div className="text-2xl font-bold text-dark">AI</div>
                  <div className="text-xs text-dark mt-1">Powered Content</div>
                </div>
                <div className="p-4 bg-dark rounded-xl">
                  <div className="text-2xl font-bold text-lightPrimary">
                    100%
                  </div>
                  <div className="text-xs text-lightPrimary mt-1">
                    Customizable
                  </div>
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
      <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>

      {/* Toolbar */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => {
            if (
              confirm(
                "Are you sure you want to go back? Unsaved changes will be lost.",
              )
            ) {
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
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          Colors
        </button>

        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 font-semibold`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#020817] hover:bg-[#03112b] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 font-semibold"
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
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-sm">
                    {theme.name}
                  </span>
                  {colorTheme.name === theme.name && (
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-8 rounded-lg shadow-sm"
                    style={{
                      background: `linear-gradient(to right, ${theme.primary.hex}, ${theme.secondary.hex})`,
                    }}
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
              Current theme:{" "}
              <span className="font-semibold text-gray-700">
                {colorTheme.name}
              </span>
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
        {/* HERO SECTION - Split Layout (Left Content + Right Image) */}
        <section className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
          {/* Logo - Top Left Corner */}
          {business?.logoUrl && (
            <div className="absolute top-6 left-6 z-30 animate-in fade-in slide-in-from-top duration-700">
              <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100">
                <img
                  src={business.logoUrl}
                  alt={`${business.title} Logo`}
                  className="h-16 w-auto max-w-[200px] object-contain"
                  style={{
                    objectFit: "contain",
                    maxHeight: "64px",
                  }}
                />
              </div>
            </div>
          )}

          {/* Main Split Layout */}
          <div className="grid lg:grid-cols-2 min-h-screen bg-[#020817] relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute top-32 right-1/3 w-48 h-48 bg-green-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl"></div>

            {/* LEFT SIDE - CONTENT */}
            <div className="relative z-10 flex items-center px-6 sm:px-10 lg:px-16 py-24 lg:py-16">
              <div className="max-w-2xl w-full">
                {isEditing ? (
                  <div className="space-y-6">
                    <input
                      value={aiContent.hero?.headline || ""}
                      onChange={(e) =>
                        updateContent("hero", "headline", e.target.value)
                      }
                      className="w-full text-4xl md:text-6xl font-bold bg-slate-900/80 border-2 border-slate-700 focus:border-blue-500 rounded-2xl outline-none p-4 text-white"
                      placeholder="Enter Headline"
                    />

                    <textarea
                      value={aiContent.hero?.subheadline || ""}
                      onChange={(e) =>
                        updateContent("hero", "subheadline", e.target.value)
                      }
                      className="w-full text-xl text-gray-300 bg-slate-900/80 border-2 border-slate-700 focus:border-blue-500 rounded-2xl outline-none resize-none p-4"
                      rows={3}
                      placeholder="Enter Subheadline"
                    />

                    <input
                      value={aiContent.hero?.ctaPrimary || ""}
                      onChange={(e) =>
                        updateContent("hero", "ctaPrimary", e.target.value)
                      }
                      className="w-full text-lg bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 border-2 border-slate-600 focus:border-cyan-400 rounded-xl outline-none px-6 py-4 text-white placeholder:text-slate-300 shadow-lg"
                      placeholder="Button Text"
                    />
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-slate-800/70 border border-slate-700 px-5 py-2 rounded-full text-blue-400 font-semibold text-sm backdrop-blur-md">
                      <span>💧</span>
                      Pure Water. Better Life.
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-white">
                      {(() => {
                        const words = (aiContent.hero?.headline || "").split(
                          " ",
                        );
                        if (words.length >= 2) {
                          return (
                            <>
                              {words.slice(0, 2).join(" ")} <br />
                              <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                                {words.slice(2).join(" ")}
                              </span>
                            </>
                          );
                        }
                        return aiContent.hero?.headline;
                      })()}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                      {aiContent.hero?.subheadline}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4 pt-2">
                      <a
                        href={`tel:${business.phoneNumbers?.primaryPhone}`}
                        className="inline-flex items-center gap-3 bg-white text-[#020817] px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all transform hover:scale-105"
                      >
                        <Phone className="w-5 h-5" />
                        {aiContent.hero?.ctaPrimary} -{" "}
                        {business.phoneNumbers?.primaryPhone}
                      </a>

                      <a
                        href={getWhatsAppLink(
                          business.phoneNumbers?.primaryPhone,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-3 bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:opacity-90 transition-all transform hover:scale-105`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp Us
                      </a> 
                    </div>
                  </div>
                )}
              </div>
            </div>

        {/* RIGHT SIDE - HERO IMAGE */}
<div className="relative z-10 flex items-stretch h-full">
  {/* Full Width Image - Completely Attached to Section */}
  <div className="relative w-full min-h-screen overflow-hidden">
    {/* Green Glow Behind Image */}
    <div className="absolute -top-8 -left-8 w-40 h-40 bg-green-500/40 blur-3xl z-0"></div>

    <img
      src={galleryImages[0] || heroImage}
      alt={business?.title || "Business Hero Image"}
      className="relative z-10 w-full h-full min-h-screen object-cover"
      onError={(e) => {
        e.target.src =
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
      }}
    />
  </div>
</div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-32 px-6 bg-white overflow-hidden">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      {/* LEFT SIDE - CONTENT */}
      <div>
        <div className="mb-8">
          <span
            className="font-semibold text-sm uppercase tracking-wider mb-4 block"
            style={{ color: colorTheme.primary.hex || "#3b82f6" }}
          >
            About Us
          </span>

          {isEditing ? (
            <input
              value={aiContent.about?.title || ""}
              onChange={(e) =>
                updateContent("about", "title", e.target.value)
              }
              className="w-full text-4xl md:text-6xl font-bold border-b-2 border-blue-500 focus:border-indigo-600 outline-none pb-2 text-gray-900 mb-6"
              placeholder="Section Title"
            />
          ) : (
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {aiContent.about?.title}
            </h2>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={aiContent.about?.content || ""}
            onChange={(e) =>
              updateContent("about", "content", e.target.value)
            }
            className="w-full text-lg text-gray-700 border-2 border-gray-200 p-6 rounded-2xl focus:border-blue-500 outline-none resize-none min-h-[250px]"
            placeholder="About Content"
          />
        ) : (
          <>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
              {aiContent.about?.content}
            </p>

            <a
              href={`tel:${business.phoneNumbers?.primaryPhone}`}
              className="inline-flex items-center gap-3 bg-[#020817] text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-[#03112b] transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              Get Started
            </a>
          </>
        )}
      </div>

      {/* RIGHT SIDE - DYNAMIC IMAGE */}
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -top-6 -left-6 w-40 h-40 bg-blue-100 rounded-full blur-3xl"></div>

        {/* Image Card */}
        <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
          <img
            src={
              galleryImages[1] ||
              galleryImages[0] ||
              heroImage
            }
            alt={aiContent.about?.title || "About Us"}
            className="w-full h-[500px] object-cover"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";
            }}
          />
        </div>
      </div>
    </div>
  </div>
</section>

        {/* SERVICES SECTION */}
        <section className="py-32 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span
                className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                style={{ color: colorTheme.primary.hex ||  "#020817" }}
              >
                What We Offer
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our comprehensive range of professional services
                designed to meet your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiContent.services?.map((service, i) => {
                const accentColors = [
                  colorTheme.primary.hex || "#2563eb",
                  colorTheme.secondary.hex || "#4f46e5",
                  colorTheme.accent.hex || "#22c55e",
                ];
                const accent = accentColors[i % accentColors.length];
                return (
                  <div
                    key={i}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2 flex flex-col"
                  >
                    {/* Gradient accent bar */}
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background: `linear-gradient(to right, ${accent}, ${colorTheme.secondary.hex || "#4f46e5"})`,
                      }}
                    />

                    {/* Content */}
                    <div className="p-7 flex-1 flex flex-col">
                      {isEditing ? (
                        <div className="space-y-4">
                          <input
                            value={service.title}
                            onChange={(e) =>
                              updateContent(
                                "services",
                                "title",
                                e.target.value,
                                i,
                              )
                            }
                            className="w-full font-bold text-xl border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2"
                          />
                          <textarea
                            value={service.description}
                            onChange={(e) =>
                              updateContent(
                                "services",
                                "description",
                                e.target.value,
                                i,
                              )
                            }
                            className="w-full text-gray-600 border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none resize-none"
                            rows={4}
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-xl mb-3 text-gray-900 transition-colors duration-300 service-title">
                            {service.title}
                          </h3>
                          <p className="text-gray-500 leading-relaxed text-sm flex-1">
                            {service.description}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GALLERY SECTION — shows with any images (including AI-generated) */}
        {galleryImages.length > 0 && (
          <section className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16">
                <span
                  className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                  style={{ color: colorTheme.primary.hex ||  "#020817" }}
                >
                  Our Work
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Gallery
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Take a look at our projects and the quality of work we deliver
                </p>
                {/* Image count badge */}
                <div className="mt-6 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 shadow-sm">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">
                    {galleryImages.length} Photo
                    {galleryImages.length !== 1 ? "s" : ""}
                  </span>
                  {aiGeneratedImages.size > 0 && (
                    <span className="ml-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                      ✨ AI Generated
                    </span>
                  )}
                </div>
              </div>

              {/* Masonry-style grid */}
              {galleryImages.length === 1 ? (
                // Single image — full width featured
                <div className="max-w-3xl mx-auto">
                  <div className="relative overflow-hidden rounded-3xl group cursor-pointer shadow-2xl">
                    <img
                      src={galleryImages[0]}
                      alt="Gallery 1"
                      className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                      <span className="text-white font-semibold text-lg">
                        View Image
                      </span>
                    </div>
                    {aiGeneratedImages.has(galleryImages[0]) && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        ✨ AI Generated
                      </div>
                    )}
                  </div>
                </div>
              ) : galleryImages.length === 2 ? (
                // Two images — side by side
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {galleryImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-2xl group cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span className="text-white font-semibold">
                          View Image
                        </span>
                      </div>
                      {aiGeneratedImages.has(image) && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          ✨ AI
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // 3+ images — masonry grid: first image featured (2×2), rest 1×1
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                  {galleryImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-2xl group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 ${
                        index === 0 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5"
                        style={{
                          background: `linear-gradient(to top, ${colorTheme.primary.hex || "#2563eb"}cc, transparent)`,
                        }}
                      >
                        <span className="text-white font-semibold text-sm transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                          View Image
                        </span>
                      </div>
                      {/* AI badge */}
                      {aiGeneratedImages.has(image) && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          ✨ AI
                        </div>
                      )}
                      {/* Index badge on featured image */}
                      {index === 0 && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* CUSTOM SECTIONS */}
        {aiContent.customSections?.map((section, i) => (
          <section
            key={i}
            className="py-32 px-6 border-t border-gray-100 relative group bg-gradient-to-b from-white to-gray-50"
          >
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
                <span
                  className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                  style={{ color: colorTheme.primary.hex || "#3b82f6" }}
                >
                  Additional Info
                </span>
                {isEditing ? (
                  <input
                    value={section.title}
                    onChange={(e) =>
                      updateContent(
                        "customSections",
                        "title",
                        e.target.value,
                        i,
                      )
                    }
                    className="w-full text-4xl md:text-5xl font-bold text-center border-b-2 border-blue-500 focus:border-indigo-600 outline-none pb-2 mb-6"
                    placeholder="Section Title"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    {section.title}
                  </h2>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={section.content}
                  onChange={(e) =>
                    updateContent(
                      "customSections",
                      "content",
                      e.target.value,
                      i,
                    )
                  }
                  className="w-full text-lg text-gray-700 text-center border-2 border-gray-200 p-6 rounded-2xl focus:border-blue-500 outline-none resize-none min-h-[200px]"
                  placeholder="Section Content"
                />
              ) : (
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
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
                borderColor: colorTheme.primary.hex || "#3b82f6",
                color: colorTheme.primary.hex || "#3b82f6",
              }}
            >
              <Plus className="w-6 h-6" />
              Add New Section
            </button>
          </div>
        )}

        {/* SOCIAL LINKS EDITOR (edit mode only) */}
        {isEditing && (
          <section className="py-16 px-6 bg-gray-50 border-y border-gray-200">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span
                  className="font-semibold text-sm uppercase tracking-wider mb-2 block"
                  style={{ color: colorTheme.primary.hex || "#3b82f6" }}
                >
                  Social Media
                </span>
                <h2 className="text-3xl font-bold text-gray-900">
                  Social Links
                </h2>
                <p className="text-gray-500 mt-2">
                  Add your profile links and choose which ones show on the live
                  website.
                </p>
              </div>

              <div className="space-y-4">
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICONS[social.key];
                  return (
                    <div
                      key={social.key}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3 sm:w-40 shrink-0">
                        {Icon && (
                          <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                            <Icon className="w-5 h-5" />
                          </span>
                        )}
                        <span className="font-semibold text-gray-800">
                          {social.title}
                        </span>
                      </div>

                      <input
                        type="url"
                        value={social.url}
                        onChange={(e) =>
                          updateSocialLink(social.key, "url", e.target.value)
                        }
                        placeholder={`https://${social.key}.com/yourbusiness`}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition text-sm"
                      />

                      <label className="flex items-center gap-2 cursor-pointer select-none sm:w-28 shrink-0">
                        <input
                          type="checkbox"
                          checked={social.show}
                          onChange={(e) =>
                            updateSocialLink(
                              social.key,
                              "show",
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">
                          {social.show ? "Visible" : "Hidden"}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CONTACT FORM SECTION */}
       <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
  <div className="max-w-6xl mx-auto">
    {/* Section Heading */}
    <div className="text-center mb-16">
      <span
        className="font-semibold text-sm uppercase tracking-wider mb-4 block"
        style={{ color: colorTheme.primary.hex ||  "#020817"  }}
      >
        Get In Touch
      </span>

      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Request a Free Quote
      </h2>

      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Fill out the form below and we'll get back to you as soon as possible
      </p>
    </div>

    {/* Main Card */}
    <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.08)] overflow-hidden">
  <div className="grid lg:grid-cols-2 min-h-[850px]">
        {/* LEFT PANEL - DESIGN ONLY (No Image) */}
       <div
  className="relative hidden lg:flex flex-col justify-center p-12 bg-[#020817] text-white"
>
          {/* Decorative Shapes */}
          <div className="absolute top-10 right-10 w-24 h-24 bg-[#020817]/30 rounded-full blur-2xl"></div>
<div className="absolute bottom-10 left-10 w-32 h-32 bg-[#020817]/40 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
              <span>✨</span>
              Quick Response Guaranteed
            </div>

            <h3 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 text-white">
              Let's Build
              <br />
              Something
              <br />
              Amazing.
            </h3>

            <p className="text-white/90 text-lg leading-relaxed mb-10">
              Fill out the form and our team will contact you on WhatsApp with
              the best solution for your requirements.
            </p>

            {/* Contact Info */}
<div className="space-y-6">
  <div className="flex items-start gap-4">
    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <Phone className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/70 text-sm mb-1">Phone</p>
      <p className="font-semibold text-lg leading-tight break-words">
        {business.phoneNumbers?.primaryPhone}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-4">
    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <MapPin className="w-6 h-6 text-white mt-2" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/70 text-sm mb-1">Address</p>
      <p className="font-semibold text-lg leading-relaxed break-words">
        {business.storefrontAddress?.addressLines?.[0] ||
          business.address}
        {business.locality && `, ${business.locality}`}
      </p>
    </div>
  </div>

  <div className="flex items-start gap-4">
    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <MessageCircle className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white/70 text-sm mb-1">WhatsApp</p>
      <p className="font-semibold text-lg leading-tight break-words">
        Chat with us instantly
      </p>
    </div>
  </div>
</div>
          </div>
        </div>

        {/* RIGHT PANEL - FORM (KEEP YOUR EXISTING FORM EXACTLY AS IT IS) */}
<div className="p-8 md:p-12 flex items-center bg-white">
  <div className="w-full">
    <h3 className="text-3xl font-bold text-gray-900 mb-2">
      Contact Form
    </h3>

    <p className="text-gray-500 mb-8">
      Complete the form and send your details via WhatsApp.
    </p>

    {/* IMPORTANT:
        Is div ke andar aap apna PURA existing form code paste karo.
        Sirf form tag nahi, balki Full Name se lekar Send via WhatsApp
        button tak ka complete code same paste karna hai.
    */}
    <div className="bg-white p-0 rounded-none shadow-none border-0">
      {/* ===== START: APNA EXISTING FORM YAHAN PASTE KAREIN ===== */}
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const formEl = e.target;
          const formData = new FormData(formEl);
          const name = formData.get("name");
          const phone = formData.get("phone");
          const email = formData.get("email");
          const service = formData.get("service");
          const message = formData.get("message");

          // ✅ Save the contact-form lead to the database
          try {
            await fetch("/api/website-leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug: currentSlug,
                name,
                phone,
                email,
                service,
                message,
              }),
            });
          } catch (leadErr) {
            console.error("Lead save error:", leadErr);
          }

          const whatsappMessage = `Hi! I'm interested in your services.\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`;
          const whatsappUrl = getWhatsAppLink(
            business.phoneNumbers?.primaryPhone,
            { text: whatsappMessage }
          );

          window.open(whatsappUrl, "_blank");
          formEl.reset();
        }}
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
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
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
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
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
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
          <label
            htmlFor="service"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Service Required
          </label>
          <select
            id="service"
            name="service"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition appearance-none bg-white"
          >
            <option value="">Select a service</option>
            {aiContent.services?.map((service, i) => (
              <option key={i} value={service.title}>
                {service.title}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
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
          className="w-full bg-[#020817] hover:bg-[#03112b] text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <MessageCircle className="w-5 h-5" />
          Send via WhatsApp
        </button>

        <p className="text-sm text-gray-500 text-center">
          Your message will be sent via WhatsApp
        </p>
      </form>
      {/* ===== END: APNA EXISTING FORM ===== */}
    </div>
  </div>
</div>  
      </div>
    </div>
  </div>
</section>

        {/* CONTACT SECTION */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
  {/* Background Effects */}
  <div className="absolute inset-0 opacity-10">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    />
  </div>

  {/* Glow Effects */}
  <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>

  <div className="max-w-6xl mx-auto relative z-10">
    {/* Heading */}
    <div className="text-center mb-12">
      <span
        className="inline-block font-semibold text-sm uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4"
        style={{ color: colorTheme.secondary.hex || "#6366f1" }}
      >
        Get In Touch
      </span>

      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        Contact Us
      </h2>

      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
        We're here to help and answer any question you might have.
      </p>
    </div>

    {/* Contact Cards */}
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {/* Address Card */}
      <div className="group bg-white/8 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl hover:bg-white/12 transition-all duration-300">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <MapPin className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold mb-2">Visit Us</h3>
            <p className="text-slate-300 leading-relaxed break-words">
              {business.storefrontAddress?.addressLines?.[0] ||
                business.address}
              {business.locality && `, ${business.locality}`}
            </p>
          </div>
        </div>
      </div>

      {/* Phone Card */}
      <div className="group bg-white/8 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl hover:bg-white/12 transition-all duration-300">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Phone className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold mb-2">Call Us</h3>
            <a
              href={`tel:${business.phoneNumbers?.primaryPhone}`}
              className="text-slate-300 hover:text-white transition-colors text-xl font-semibold break-words"
            >
              {business.phoneNumbers?.primaryPhone}
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="text-center mt-10 flex flex-wrap justify-center gap-4">
      <a
        href={`tel:${business.phoneNumbers?.primaryPhone}`}
        className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
      >
        <Phone className="w-5 h-5" />
        Call Now
      </a>

      <a
        href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-3 bg-gradient-to-r ${colorTheme.accent.from} ${colorTheme.accent.to} text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl`}
      >
        <MessageCircle className="w-5 h-5" />
        WhatsApp
      </a>
    </div>
  </div>
</section>

        {/* FOOTER */}
        <footer className="relative bg-[#020817] border-t border-white/10 overflow-hidden">
  {/* Background Glow */}
  <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
  <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl"></div>

  <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
    {/* Top Section */}
    <div className="grid lg:grid-cols-3 gap-10 items-start mb-10">
      {/* Business Info */}
      <div className="lg:col-span-2">
        <div className="flex items-center gap-4 mb-5">
          {/* Logo */}
          {business?.logoUrl ? (
            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center">
              <img
                src={business.logoUrl}
                alt={business.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${colorTheme.primary.from} ${colorTheme.primary.to} flex items-center justify-center shadow-lg`}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}

          {/* Business Name */}
          <div>
            <h3 className="text-2xl font-bold text-white">
              {business.title}
            </h3>
            <p className="text-gray-400 text-sm">
              Professional Business Website
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 leading-relaxed max-w-2xl">
          Delivering professional services with quality, trust, and
          customer satisfaction. Contact us today for expert support and
          personalized solutions.                   
        </p>

        {/* Social Links */}
        {activeSocialLinks.length > 0 && (
          <div className="flex items-center gap-3 mt-6">
            {activeSocialLinks.map((social) => {
              const Icon = SOCIAL_ICONS[social.key];
              return (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.title}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all transform hover:scale-110"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Contact */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <h4 className="text-white font-bold text-lg mb-4">
          Quick Contact
        </h4>

        <div className="space-y-4">
          <a
            href={`tel:${business.phoneNumbers?.primaryPhone}`}
            className="flex items-center gap-3 text-gray-300 hover:text-white transition"
          >
            <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="break-all">
              {business.phoneNumbers?.primaryPhone}
            </span>
          </a>

          <a
            href={getWhatsAppLink(
              business.phoneNumbers?.primaryPhone
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition"
          >
            <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span>Chat on WhatsApp</span>
          </a>

          <div className="flex items-start gap-3 text-gray-300">
            <MapPin className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm leading-relaxed break-words">
              {business.storefrontAddress?.addressLines?.[0] ||
                business.address}
              {business.locality && `, ${business.locality}`} 
           </span>
          </div>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8"></div>

    {/* Bottom Section */}
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-gray-400 text-sm text-center md:text-left">
        © {new Date().getFullYear()}{" "}
        <span className="text-white font-semibold">  
          {business.title}
        </span>
        . All rights reserved.
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Powered by AI</span>
        </div>

        <div className="h-4 w-px bg-gray-700"></div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-40  0" />
          <span>Professional Website</span>
        </div>
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
            phone={chatbotPhone}
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
          0%,
          100% {
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
          0%,
          100% {
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
          color: ${colorTheme.primary.hex || "#3b82f6"} !important;
        }
      `}</style>
    </div>
  );
}
