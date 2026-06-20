"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  Calendar,
  X,
  ChevronDown,
  MapPin,
  Facebook,
  Instagram,
  Wallet,
  Check,
  Image as ImageIcon,
  Video,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  postHasVideoAsset,
  postImageUrl,
  postVideoUrl,
} from "@/lib/postMediaUrls";

const RECOMMENDED_GMB = [9, 10, 13, 14];
const RECOMMENDED_INSTA = [11, 12, 18, 19, 20];
const RECOMMENDED_FB = [13, 14, 18, 19];

const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialSchedule = () => {
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return {
    date: formatInputDate(next),
    slot: next.getHours(),
  };
};

const getInstagramId = (account = {}) =>
  account.igId || account.igUserId || account.id;

const ScheduleModal = React.memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    post,
    availableLocations = [],
    facebookPages = [],
    instagramAccounts = [],
    fetchFacebookPages,
    fetchInstagramAccounts,
    loadingFb,
    loadingIg,
    userWallet,
    setShowInsufficientBalance,
    setRequiredCoins,
  }) => {
    const [date, setDate] = useState(() => getInitialSchedule().date);
    const [slot, setSlot] = useState(() => getInitialSchedule().slot);

    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState("gmb");

    const [selectedGmb, setSelectedGmb] = useState([]);
    const [selectedFb, setSelectedFb] = useState([]);
    const [selectedIg, setSelectedIg] = useState([]);
    const [mediaMode, setMediaMode] = useState("image");

    // --- GMB Post Configuration States ---
    const [checkmark, setCheckmark] = useState(["post", "photo"]);
    const [postType, setPostType] = useState("standard");
    const [ctaType, setCtaType] = useState("book");
    const [customUrl, setCustomUrl] = useState(() => {
      const defaultLoc = availableLocations.find((l) => l.websiteUrl);
      return defaultLoc ? defaultLoc.websiteUrl : "";
    });
    const [eventTitle, setEventTitle] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [locationSearch, setLocationSearch] = useState("");

    const hasImageAsset = useMemo(() => Boolean(postImageUrl(post)), [post]);
    const hasVideoAsset = useMemo(() => postHasVideoAsset(post), [post]);
    const videoUrl = useMemo(() => postVideoUrl(post), [post]);

    const handleCheckmarkChange = useCallback((option) => {
      if (option === "video") {
        setCheckmark(["video"]);
        setMediaMode("video");
      } else if (option === "both") {
        setCheckmark(["post", "photo"]);
        setMediaMode("image");
      } else {
        setMediaMode("image");
        setCheckmark((prev) => {
          const filtered = prev.filter((item) => item !== "video");
          if (filtered.includes(option)) {
            return filtered.filter((item) => item !== option);
          } else {
            return [...filtered, option];
          }
        });
      }
    }, []);

    const getPayload = useCallback(() => {
      if (checkmark.includes("video")) return "video";
      const hasPost = checkmark.includes("post");
      const hasPhoto = checkmark.includes("photo");
      if (hasPost && hasPhoto) return "both";
      if (hasPost) return "post";
      if (hasPhoto) return "photo";
      return "post";
    }, [checkmark]);

    // Pre-select existing targets when editing
    useEffect(() => {
      if (post) {
        setSelectedGmb([]);
        setSelectedFb([]);
        setSelectedIg([]);
        setPostType(post.gmbPostMeta?.postType || "standard");
        setCtaType(post.gmbPostMeta?.ctaType || "book");
        setCustomUrl(post.gmbPostMeta?.customUrl || "");
        setEventTitle(post.gmbPostMeta?.eventTitle || "");
        setEventStartDate(post.gmbPostMeta?.startDate || "");
        setEventEndDate(post.gmbPostMeta?.endDate || "");

        if (post.checkmark) {
          if (post.checkmark === "both") setCheckmark(["post", "photo"]);
          else if (post.checkmark === "video") setCheckmark(["video"]);
          else setCheckmark([post.checkmark]);
        }
        if (post.checkmark === "video" && postHasVideoAsset(post)) {
          setMediaMode("video");
        } else if (!postImageUrl(post) && postHasVideoAsset(post)) {
          setMediaMode("video");
          setCheckmark(["video"]);
        } else {
          setMediaMode("image");
          if (post.checkmark === "video") setCheckmark(["post", "photo"]);
        }
        if (post.locations && post.locations.length > 0) {
          // Match post locations with available locations using locationId or id
          const matchedGmbIds = post.locations
            .map((postLoc) => {
              const found = availableLocations.find(
                (availLoc) =>
                  availLoc.locationId === postLoc.locationId ||
                  availLoc.id === postLoc.id,
              );
              return found ? found.id : postLoc.id; // Fallback to postLoc.id if not found, though ideally it should be found
            })
            .filter(Boolean); // Remove any nulls/undefined

          setSelectedGmb(matchedGmbIds);
        }
        if (post.fbPages && post.fbPages.length > 0) {
          setSelectedFb(post.fbPages.map((pg) => pg.pageId));
        }
        if (post.igPages && post.igPages.length > 0) {
          setSelectedIg(post.igPages.map(getInstagramId).filter(Boolean));
        }
        if (post.scheduledDate) {
          const d = new Date(post.scheduledDate);
          setDate(formatInputDate(d));
          setSlot(d.getHours());
        }
      }
    }, [post, availableLocations]);

    useEffect(() => {
      if (
        activeTab === "fb" &&
        facebookPages.length === 0 &&
        fetchFacebookPages
      ) {
        fetchFacebookPages();
      }
      if (
        activeTab === "ig" &&
        instagramAccounts.length === 0 &&
        fetchInstagramAccounts
      ) {
        fetchInstagramAccounts();
      }
    }, [
      activeTab,
      facebookPages.length,
      instagramAccounts.length,
      fetchFacebookPages,
      fetchInstagramAccounts,
    ]);

    const totalCost = useMemo(
      () => selectedGmb.length * 20,
      [selectedGmb.length],
    );

    const handleConfirm = useCallback(() => {
      if (
        selectedGmb.length === 0 &&
        selectedFb.length === 0 &&
        selectedIg.length === 0
      ) {
        alert("Please select at least one platform or account.");
        return;
      }

      const [year, month, day] = date.split("-").map(Number);
      const scheduledTime = new Date(
        year,
        month - 1,
        day,
        parseInt(slot, 10),
        0,
        0,
        0,
      );

      if (
        Number.isNaN(scheduledTime.getTime()) ||
        scheduledTime <= new Date()
      ) {
        alert("Please select a future date and time.");
        return;
      }

      if (mediaMode === "video" && !videoUrl) {
        alert("This post does not have a video to schedule.");
        return;
      }
      if (mediaMode === "image" && !hasImageAsset) {
        alert("This post does not have an image to schedule.");
        return;
      }

      const payloadCheckmark = mediaMode === "video" ? "video" : getPayload();

      if (selectedGmb.length > 0 && payloadCheckmark !== "video") {
        if (postType === "event") {
          if (!eventTitle.trim()) {
            alert("Please provide an Event Title.");
            return;
          }
          if (!eventStartDate || !eventEndDate) {
            alert("Please provide both Start and End dates for the event.");
            return;
          }
          if (new Date(eventEndDate) < new Date(eventStartDate)) {
            alert("Event End date cannot be before Start date.");
            return;
          }
        }
        if (ctaType !== "call_now" && !customUrl.trim() && ctaType !== "book") {
          // Some CTAs really need a URL, though we fallback to websiteUrl, it's good to ensure it's not totally empty if we can.
          // Let's rely on the backend/fallback logic mostly, but if they explicitly clear it, maybe warn them.
          // (Omitted strict check to match LocationSelectionModal's lenient behavior).
        }
      }

      if (userWallet < totalCost) {
        setRequiredCoins(totalCost);
        setShowInsufficientBalance(true);
        return;
      }

      const payload = {
        postId: post._id,
        status: "scheduled",
        scheduledTime: scheduledTime.toISOString(),

        platforms: {
          gmb: selectedGmb,
          fb: selectedFb,
          ig: selectedIg,
          checkmark: payloadCheckmark,
          mediaType: mediaMode,

          meta: {
            postType,
            ctaType,
            customUrl,
            eventTitle,
            startDate: eventStartDate,
            endDate: eventEndDate,
          },
        },
      };

      console.log("Schedule Payload:", payload);

      onConfirm(post._id, "scheduled", scheduledTime.toISOString(), {
        gmb: selectedGmb,
        fb: selectedFb,
        ig: selectedIg,
        checkmark: payloadCheckmark,
        mediaType: mediaMode,
        meta: {
          postType,
          ctaType,
          customUrl,
          eventTitle,
          startDate: eventStartDate,
          endDate: eventEndDate,
        },
      });
      onClose();
    }, [
      userWallet,
      totalCost,
      date,
      slot,
      mediaMode,
      videoUrl,
      hasImageAsset,
      getPayload,
      onConfirm,
      post?._id,
      selectedGmb,
      selectedFb,
      selectedIg,
      postType,
      ctaType,
      customUrl,
      eventTitle,
      eventStartDate,
      eventEndDate,
      onClose,
      setRequiredCoins,
      setShowInsufficientBalance,
    ]);

    const timeSlots = useMemo(() => {
      return Array.from({ length: 24 }, (_, i) => {
        const formatTime = (hour) => {
          const ampm = hour >= 12 ? "PM" : "AM";
          const h = hour % 12 || 12;
          return `${h}:00 ${ampm}`;
        };
        return {
          value: i,
          label: `${formatTime(i)} - ${formatTime((i + 1) % 24)}`,
          isGmb: RECOMMENDED_GMB.includes(i),
          isInsta: RECOMMENDED_INSTA.includes(i),
          isFb: RECOMMENDED_FB.includes(i),
        };
      });
    }, []);

    const isSlotDisabled = useCallback(
      (slotValue) => {
        const now = new Date();
        const [y, m, d] = date.split("-").map(Number);
        const isToday =
          y === now.getFullYear() &&
          m - 1 === now.getMonth() &&
          d === now.getDate();

        if (isToday) {
          return slotValue <= now.getHours();
        }
        return false;
      },
      [date],
    );

    const toggleSelection = useCallback((id, list, setList) => {
      setList((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    }, []);

    const toggleAll = useCallback(
      (items, selected, setSelected, idKey = "id") => {
        const getId =
          typeof idKey === "function" ? idKey : (item) => item[idKey];
        const ids = items.map(getId).filter(Boolean);

        if (selected.length === ids.length) {
          setSelected([]);
        } else {
          setSelected(ids);
        }
      },
      [],
    );

    const verifiedLocations = useMemo(
      () => availableLocations.filter((loc) => loc.isVerified),
      [availableLocations],
    );

    const filteredLocations = useMemo(() => {
      if (!locationSearch.trim()) return availableLocations;
      const q = locationSearch.toLowerCase();
      return availableLocations.filter((loc) => {
        const fields = [
          loc.title,
          loc.locationName,
          loc.storeName,
          loc.name,
          loc.locality,
          loc.address,
        ];
        return fields.some((field) => field && field.toLowerCase().includes(q));
      });
    }, [availableLocations, locationSearch]);

    if (!isOpen) return null;

    const tabs = [
      {
        id: "gmb",
        label: "Google",
        icon: MapPin,
        cost: "20 Coins/Loc",
        count: selectedGmb.length,
      },
      {
        id: "fb",
        label: "Facebook",
        icon: Facebook,
        cost: "Free",
        count: selectedFb.length,
      },
      {
        id: "ig",
        label: "Instagram",
        icon: Instagram,
        cost: "Free",
        count: selectedIg.length,
      },
    ];

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-start justify-center p-4 sm:p-6 font-sans overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-y-auto border border-slate-200 animate-scaleIn">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <Calendar className="w-6 h-6 text-[#EAB308]" />
                Schedule Post
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Select when and where this post will go live.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row overflow-visible bg-slate-50/50">
            {/* Left Panel: Date & Time */}
            <div className="w-full md:w-2/5 p-6 border-r border-slate-100 bg-white  overflow-visible">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                Timing
              </h3>

              <div className="space-y-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const day = String(now.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      })()}
                      className="w-full pl-4 pr-10 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#EAB308] outline-none text-slate-800 font-semibold bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                {/* Time Dropdown */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Time Slot
                    </label>
                    <span className="text-[10px] font-bold text-[#EAB308] uppercase tracking-widest bg-[#EAB308]/10 px-2 py-0.5 rounded border border-[#EAB308]/20">
                      Follows best practices
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                      className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl bg-slate-50 hover:bg-white text-left flex justify-between items-center text-slate-800 font-semibold focus:outline-none focus:border-[#EAB308] transition-colors"
                    >
                      <span>
                        {timeSlots.find((s) => s.value === parseInt(slot))
                          ?.label || "Select Time"}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showTimeDropdown ? "rotate-180 text-[#EAB308]" : ""}`}
                      />
                    </button>

                    {showTimeDropdown && (
                      <div className="absolute z-50 w-full top-full mt-2 bg-white border rounded-xl shadow-2xl max-h-60 overflow-y-auto touch-auto">
                        <div className="p-1.5">
                          {timeSlots
                            .filter((s) => !isSlotDisabled(s.value))
                            .map((s) => {
                              const isSelected = parseInt(slot) === s.value;
                              const isRecommended =
                                s.isGmb || s.isInsta || s.isFb;

                              return (
                                <div
                                  key={s.value}
                                  onClick={() => {
                                    setSlot(s.value);
                                    setShowTimeDropdown(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer mb-0.5
                                  ${
                                    isSelected
                                      ? "bg-[#EAB308] text-black font-bold shadow-sm"
                                      : isRecommended
                                        ? "bg-amber-50/50 text-amber-900 font-semibold hover:bg-amber-100/50"
                                        : "text-slate-600 hover:bg-slate-100 font-medium"
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    {s.label}
                                    <span className="flex gap-1">
                                      {s.isGmb && (
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-blue-500"}`}
                                          title="Good for Google"
                                        />
                                      )}
                                      {s.isInsta && (
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-pink-500"}`}
                                          title="Good for Instagram"
                                        />
                                      )}
                                      {s.isFb && (
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-blue-600"}`}
                                          title="Good for Facebook"
                                        />
                                      )}
                                    </span>
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-black" />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Media
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!hasImageAsset}
                      onClick={() => {
                        setMediaMode("image");
                        if (checkmark.includes("video"))
                          setCheckmark(["post", "photo"]);
                      }}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                        mediaMode === "image"
                          ? "border-[#EAB308] bg-[#EAB308]/10 text-slate-950"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      } ${!hasImageAsset ? "opacity-40 cursor-not-allowed hover:border-slate-200" : ""}`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </button>
                    <button
                      type="button"
                      disabled={!hasVideoAsset}
                      onClick={() => {
                        setMediaMode("video");
                        setCheckmark(["video"]);
                      }}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                        mediaMode === "video"
                          ? "border-[#EAB308] bg-[#EAB308]/10 text-slate-950"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      } ${!hasVideoAsset ? "opacity-40 cursor-not-allowed hover:border-slate-200" : ""}`}
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    We highlight the best time slots based on your selected
                    platforms. Look for the colored dots: <br />
                    <span className="inline-flex items-center gap-1 mt-2 text-blue-900 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{" "}
                      Google
                    </span>
                    <span className="inline-flex items-center gap-1 mt-2 ml-3 text-pink-700 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />{" "}
                      Instagram
                    </span>
                    <span className="inline-flex items-center gap-1 mt-2 ml-3 text-blue-700 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />{" "}
                      Facebook
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel: Platforms */}
            <div className="w-full md:w-3/5 flex flex-col bg-slate-50/30">
              {/* Tabs - Modern Segmented Control */}
              <div className="p-4 sm:p-6 pb-0">
                <div className="flex bg-slate-200/60 p-1 rounded-2xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2.5 px-2 text-sm font-bold flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 relative ${
                        activeTab === tab.id
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <tab.icon
                          className={`w-4 h-4 ${activeTab === tab.id ? "text-[#EAB308]" : ""}`}
                        />
                        {tab.label}
                        {tab.count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md leading-none ml-1 ${activeTab === tab.id ? "bg-[#EAB308] text-black" : "bg-slate-300 text-slate-700"}`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-widest font-black ${activeTab === tab.id ? "text-slate-400" : "text-slate-400"}`}
                      >
                        {tab.cost}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-visible p-4 sm:p-6 custom-scrollbar">
                {/* GMB Content */}
                {activeTab === "gmb" && (
                  <div className="space-y-4">
                    {/* Media Checkmarks */}
                    {mediaMode === "image" ? (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-3 block">
                          Google Format
                        </label>
                        <div className="flex flex-wrap items-center gap-6">
                          {["post", "photo", "both"].map((opt) => (
                            <label
                              key={opt}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  opt === "both"
                                    ? checkmark.includes("post") &&
                                      checkmark.includes("photo")
                                    : checkmark.includes(opt)
                                }
                                onChange={() => handleCheckmarkChange(opt)}
                                className="w-5 h-5 rounded-lg border-2 border-slate-200 accent-[#EAB308] transition-all"
                              />
                              <span className="text-[11px] font-black uppercase tracking-widest text-black/70 group-hover:text-black">
                                {opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#A16207]">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-900">
                            Video selected
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Google will use video format.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Post Configuration for GMB */}
                    {mediaMode === "image" && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                            Post Type
                          </label>
                          <select
                            value={postType}
                            onChange={(e) => setPostType(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#EAB308]"
                          >
                            <option value="standard">Standard</option>
                            <option value="event">Event</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                            Button CTA
                          </label>
                          <select
                            value={ctaType}
                            onChange={(e) => setCtaType(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#EAB308]"
                          >
                            <option value="book">Book</option>
                            <option value="order_online">Order Online</option>
                            <option value="buy">Buy</option>
                            <option value="learn_more">Learn More</option>
                            <option value="sign_up">Sign Up</option>
                            <option value="call_now">Call Now</option>
                          </select>
                        </div>

                        {ctaType !== "call_now" && (
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                              Custom URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={customUrl}
                              onChange={(e) => setCustomUrl(e.target.value)}
                              placeholder="https://yourwebsite.com/booking"
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#EAB308]"
                            />
                          </div>
                        )}

                        {postType === "event" && (
                          <>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                                Event Title
                              </label>
                              <input
                                type="text"
                                list="event-titles-schedule"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="e.g. Summer Sale, Special Offer..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#EAB308]"
                              />
                              <datalist id="event-titles-schedule">
                                <option value="Grand Opening" />
                                <option value="Special Offer" />
                                <option value="Summer Sale" />
                                <option value="Winter Clearance" />
                                <option value="Holiday Special" />
                                <option value="Weekend Discount" />
                                <option value="Flash Sale" />
                                <option value="New Arrival" />
                              </datalist>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={eventStartDate}
                                onChange={(e) =>
                                  setEventStartDate(e.target.value)
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#EAB308]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 block">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={eventEndDate}
                                onChange={(e) =>
                                  setEventEndDate(e.target.value)
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#EAB308]"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Available Locations
                      </span>
                      <button
                        onClick={() =>
                          toggleAll(
                            verifiedLocations,
                            selectedGmb,
                            setSelectedGmb,
                            "id",
                          )
                        }
                        className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {selectedGmb.length === verifiedLocations.length &&
                        verifiedLocations.length > 0
                          ? "Deselect All"
                          : "Select All Verified"}
                      </button>
                    </div>

                    {/* Location Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Search by business name or address..."
                        className="w-full pl-10 pr-9 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#EAB308] transition-colors"
                      />
                      {locationSearch && (
                        <button
                          onClick={() => setLocationSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {filteredLocations.map((loc) => {
                      const isVerified = loc.isVerified;
                      const isSelected = selectedGmb.includes(loc.id);
                      return (
                        <div
                          key={loc.id}
                          onClick={() =>
                            isVerified &&
                            toggleSelection(loc.id, selectedGmb, setSelectedGmb)
                          }
                          className={`flex items-start sm:items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${!isVerified ? "opacity-50 bg-slate-100 cursor-not-allowed border-transparent" : "cursor-pointer"} ${isSelected ? "border-[#EAB308] bg-[#EAB308]/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"}`}
                        >
                          <div
                            className={`mt-1 sm:mt-0 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? "bg-[#EAB308] border-[#EAB308]" : "border-slate-300 bg-white"}`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start sm:items-center gap-2 flex-col sm:flex-row">
                              <p
                                className={`text-base font-bold truncate ${!isVerified ? "text-slate-500" : "text-slate-900"}`}
                              >
                                {" "}
                                {loc.title ||
                                  loc.locationName ||
                                  loc.storeName ||
                                  loc.name}{" "}
                                {loc.locality}
                              </p>
                              {!isVerified && (
                                <span className="text-[10px] bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest shrink-0">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate mt-0.5 font-medium">
                              {loc.address}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredLocations.length === 0 &&
                      availableLocations.length > 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                          <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">
                            No locations match "{locationSearch}".
                          </p>
                        </div>
                      )}
                    {availableLocations.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">
                          No Google locations found.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Facebook Content */}
                {activeTab === "fb" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Connected Pages
                      </span>
                      <button
                        onClick={() =>
                          toggleAll(
                            facebookPages,
                            selectedFb,
                            setSelectedFb,
                            "pageId",
                          )
                        }
                        className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {selectedFb.length === facebookPages.length &&
                        facebookPages.length > 0
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {loadingFb ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : facebookPages.length > 0 ? (
                      facebookPages.map((page) => {
                        const isSelected = selectedFb.includes(page.pageId);
                        return (
                          <div
                            key={page.pageId}
                            onClick={() =>
                              toggleSelection(
                                page.pageId,
                                selectedFb,
                                setSelectedFb,
                              )
                            }
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"}`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-base font-bold text-slate-900">
                                {page.pageName}
                              </span>
                            </div>
                            <Facebook
                              className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <Facebook className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">
                          No Facebook pages connected.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Instagram Content */}
                {activeTab === "ig" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Connected Accounts
                      </span>
                      <button
                        onClick={() =>
                          toggleAll(
                            instagramAccounts,
                            selectedIg,
                            setSelectedIg,
                            getInstagramId,
                          )
                        }
                        className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {selectedIg.length === instagramAccounts.length &&
                        instagramAccounts.length > 0
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {loadingIg ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                      </div>
                    ) : instagramAccounts.length > 0 ? (
                      instagramAccounts.map((acc) => {
                        const accountId = getInstagramId(acc);
                        const isSelected = selectedIg.includes(accountId);
                        return (
                          <div
                            key={accountId}
                            onClick={() =>
                              accountId &&
                              toggleSelection(
                                accountId,
                                selectedIg,
                                setSelectedIg,
                              )
                            }
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? "border-pink-500 bg-pink-50 shadow-sm" : "border-slate-100 bg-white hover:border-pink-200 hover:shadow-sm"}`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? "bg-pink-600 border-pink-600" : "border-slate-300 bg-white"}`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-base font-bold text-slate-900">
                                {acc.igUsername}
                              </span>
                            </div>
                            <Instagram
                              className={`w-5 h-5 ${isSelected ? "text-pink-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <Instagram className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">
                          No Instagram accounts connected.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0">
            <div className="flex items-center gap-4 w-full sm:w-auto bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                  Total Cost
                </span>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-2xl font-black leading-none ${userWallet < totalCost ? "text-red-500" : "text-slate-900"}`}
                  >
                    {totalCost}
                  </span>
                  <span className="text-xs font-bold text-slate-400 mb-0.5">
                    Coins
                  </span>
                </div>
              </div>

              {userWallet < totalCost && (
                <div className="pl-4 border-l border-slate-200 flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                    Balance
                  </span>
                  <span className="text-sm font-bold text-red-500 leading-none mt-1">
                    {userWallet}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>

              {userWallet < totalCost ? (
                <Link href="/wallet" className="flex-1 sm:flex-none">
                  <button className="w-full px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 text-sm shadow-slate-900/20">
                    <Wallet className="w-4 h-4" />
                    Recharge
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={
                    selectedGmb.length === 0 &&
                    selectedFb.length === 0 &&
                    selectedIg.length === 0
                  }
                  className="flex-1 sm:flex-none px-8 py-3.5 bg-[#EAB308] text-black rounded-2xl font-black uppercase tracking-wide hover:bg-[#FACC15] hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-[#EAB308]/20"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ScheduleModal.displayName = "ScheduleModal";

export default ScheduleModal;