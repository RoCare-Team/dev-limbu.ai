"use client";

import { useCallback, useState } from "react";
import AuthLink from "./AuthLink";
import { ArrowRight, Coins, Image as ImageIcon, Minus, Plus, Box, Type, UserRound } from "lucide-react";
import SampleReel from "./SampleReel";
import VideoSampleModal from "./VideoSampleModal";
import {
  VIDEO_MAX_SECONDS,
  VIDEO_MIN_SECONDS,
  VIDEO_PRICING,
  VIDEO_STEP_SECONDS,
  videoCoins,
} from "@/lib/videoPricing";
import { SAMPLE_VIDEOS } from "@/lib/videoSamples";

const ICONS = {
  text_to_video: Type,
  image_to_video: ImageIcon,
  ai_avatar_video: UserRound,
  cgi_video: Box,
};


function PricingCard({ item, modalOpen, onOpen }) {
  const [seconds, setSeconds] = useState(VIDEO_MIN_SECONDS);
  const Icon = ICONS[item.key];
  const total = videoCoins(item.coinsPerSecond, seconds);

  const change = (delta) =>
    setSeconds((s) =>
      Math.min(VIDEO_MAX_SECONDS, Math.max(VIDEO_MIN_SECONDS, s + delta))
    );

  return (
    <div className="group relative flex h-full flex-col rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/[0.07] hover:ring-[#facc15]/50 hover:shadow-[0_20px_60px_rgba(250,204,21,0.15)]">
      {/* SAMPLE VIDEOS */}
      <SampleReel
        videos={SAMPLE_VIDEOS[item.key]}
        label={item.title}
        paused={modalOpen}
        onOpen={onOpen}
      />

      <div className="flex flex-1 flex-col px-2 pb-2">
        {/* TITLE + RATE */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15]/10 ring-1 ring-[#facc15]/30">
            {Icon && <Icon size={18} className="text-[#facc15]" />}
          </div>
          <div className="min-w-0">
            <h3
              className="truncate font-bold uppercase leading-tight tracking-tight text-white"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
              }}
            >
              {item.title}
            </h3>
            <span className="text-[11px] font-semibold text-white/45">
              {item.coinsPerSecond * VIDEO_MIN_SECONDS} coins · {VIDEO_MIN_SECONDS}s
            </span>
          </div>
        </div>

        <p className="mt-3 grow text-xs font-medium leading-relaxed text-white/55 sm:text-sm">
          {item.description}
        </p>

        {/* DURATION PICKER */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Video Length
            </span>
            <span className="text-[11px] font-semibold text-white/40">
              {item.coinsPerSecond} coins / sec
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => change(-VIDEO_STEP_SECONDS)}
              disabled={seconds <= VIDEO_MIN_SECONDS}
              aria-label={`Decrease ${item.title} length`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white ring-1 ring-white/15 transition-colors hover:ring-[#facc15] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 text-center text-lg font-black text-white">{seconds}s</div>
            <button
              type="button"
              onClick={() => change(VIDEO_STEP_SECONDS)}
              disabled={seconds >= VIDEO_MAX_SECONDS}
              aria-label={`Increase ${item.title} length`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white ring-1 ring-white/15 transition-colors hover:ring-[#facc15] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>

          <input
            type="range"
            min={VIDEO_MIN_SECONDS}
            max={VIDEO_MAX_SECONDS}
            step={VIDEO_STEP_SECONDS}
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            aria-label={`${item.title} length in seconds`}
            className="mt-3 w-full accent-[#facc15]"
          />
          <div className="flex justify-between text-[10px] font-semibold text-white/35">
            <span>{VIDEO_MIN_SECONDS}s</span>
            <span>{VIDEO_MAX_SECONDS}s</span>
          </div>
        </div>

        {/* TOTAL */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#facc15]/10 px-4 py-3 ring-1 ring-[#facc15]/30">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-white/70">Total</span>
          <span className="flex items-center gap-1.5 text-lg font-black text-white">
            <Coins size={18} className="text-[#facc15]" />
            {total} coins
          </span>
        </div>

        <AuthLink
          href={item.href}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-2.5 text-sm font-black uppercase tracking-wide text-black transition-all hover:gap-3 hover:bg-[#fde047]"
        >
          Create Video <ArrowRight size={16} />
        </AuthLink>
      </div>
    </div>
  );
}

export default function VideoPricingCalculator() {
  // { key, index } of the sample shown in the modal, or null.
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  const openItem = open && VIDEO_PRICING.find((item) => item.key === open.key);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VIDEO_PRICING.map((item) => (
          <PricingCard
            key={item.key}
            item={item}
            modalOpen={Boolean(open)}
            onOpen={(index) => setOpen({ key: item.key, index })}
          />
        ))}
      </div>

      {openItem && (
        <VideoSampleModal
          item={openItem}
          videos={SAMPLE_VIDEOS[openItem.key]}
          startIndex={open.index}
          onClose={close}
        />
      )}
    </>
  );
}
