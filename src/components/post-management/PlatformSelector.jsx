"use client";

import React, { useCallback, useMemo } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Pinterest, YouTube } from "@mui/icons-material";

const PLATFORMS = [
  {
    id: "gmb",
    label: "Google My Business",
    icon: (
      <img
        src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
        alt="Google"
        className="w-5 h-5 object-contain"
      />
    ),
    activeClass:
      "bg-slate-100 border-[#EAB308] shadow-[0_0_15px_rgba(253,224,71,0.2)] scale-110",
  },

  {
    id: "fb",
    label: "Facebook",
    icon: <Facebook className="w-5 h-5 fill-current" />,
    activeClass:
      "bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2] shadow-[0_0_15px_rgba(24,119,242,0.3)] scale-110",
  },

  {
    id: "ig",
    label: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    activeClass:
      "bg-gradient-to-tr from-[#FFD600]/20 via-[#FF0169]/20 to-[#D300C5]/20 border-[#FF0169] text-[#FF0169] shadow-[0_0_15px_rgba(255,1,105,0.3)] scale-110",
  },

  {
    id: "pin",
    label: "Pinterest",
    icon: <Pinterest className="w-5 h-5 fill-current" />,
    activeClass:
      "bg-[#E60023]/20 border-[#E60023] text-[#E60023] shadow-[0_0_15px_rgba(230,0,35,0.3)] scale-110",
  },

  {
    id: "li",
    label: "LinkedIn",
    icon: <Linkedin className="w-5 h-5 fill-current" />,
    activeClass:
      "bg-[#0A66C2]/20 border-[#0A66C2] text-[#0A66C2] shadow-[0_0_15px_rgba(10,102,194,0.3)] scale-110",
  },

  {
    id: "yt",
    label: "YouTube",
    icon: <YouTube className="w-5 h-5 fill-current" />,
    activeClass:
      "bg-[#FF0000]/20 border-[#FF0000] text-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.3)] scale-110",
  },
];

const PlatformSelector = React.memo(
  ({ selectedPlatforms, setSelectedPlatforms }) => {
    const togglePlatform = useCallback(
      (platform) => {
        setSelectedPlatforms((prev) =>
          prev.includes(platform)
            ? prev.filter((p) => p !== platform)
            : [...prev, platform],
        );
      },
      [setSelectedPlatforms],
    );

    const allSelected = useMemo(
      () => ["gmb", "fb", "ig"].every((p) => selectedPlatforms.includes(p)),
      [selectedPlatforms],
    );

    const toggleAll = useCallback(
      (e) => {
        if (e.target.checked) {
          setSelectedPlatforms(["gmb", "fb", "ig"]);
        } else {
          setSelectedPlatforms([]);
        }
      },
      [setSelectedPlatforms],
    );

    return (
      <div
        className="flex flex-nowrap overflow-x-auto sm:flex-wrap items-center gap-4 px-4 py-3 sm:px-6 sm:py-2 rounded-2xl border col-span-2 order-last sm:order-none w-full sm:w-auto justify-start sm:justify-center sm:ml-4 shadow-xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderColor: "rgba(253, 224, 71, 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* All */}
        <label className="flex items-center gap-3 cursor-pointer group flex-shrink-0">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="peer sr-only"
            />
            <div className="w-5 h-5 rounded border-2 border-slate-200 peer-checked:border-[#EAB308] peer-checked:bg-[#EAB308] transition-all flex items-center justify-center">
              {allSelected && (
                <svg
                  className="w-3.5 h-3.5 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span
            className="text-sm font-medium tracking-widest uppercase text-slate-900/70 group-hover:text-slate-900 transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            All
          </span>
        </label>
        {/* Platform Items */}
        {PLATFORMS.map((platform) => (
          <label
            key={platform.id}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0"
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
              className="sr-only peer"
            />

            <div
              className={`w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl border transition-all duration-300 ${
                selectedPlatforms.includes(platform.id)
                  ? platform.activeClass
                  : "bg-slate-50 border-slate-200 text-slate-900/40 grayscale opacity-60 group-hover:opacity-100 group-hover:border-white/30"
              }`}
            >
              <div className="scale-75 sm:scale-100">{platform.icon}</div>
            </div>
          </label>
        ))}
      </div>
    );
  },
);

PlatformSelector.displayName = "PlatformSelector";

export default PlatformSelector;
