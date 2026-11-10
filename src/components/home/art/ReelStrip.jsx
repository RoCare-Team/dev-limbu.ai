"use client";

import { useCallback, useState } from "react";
import SampleReel from "../../SampleReel";
import VideoSampleModal from "../../VideoSampleModal";
import { VIDEO_MIN_SECONDS, VIDEO_PRICING, videoCoins } from "@/lib/videoPricing";
import { SAMPLE_VIDEOS } from "@/lib/videoSamples";

/**
 * One playing sample reel per video tool. Reels load and play only while on
 * screen (SampleReel); clicking one opens it with sound in the video modal.
 */
export default function ReelStrip() {
  const [open, setOpen] = useState(null); // { key, index }
  const close = useCallback(() => setOpen(null), []);
  const openItem = open && VIDEO_PRICING.find((item) => item.key === open.key);

  return (
    <>
      <div className="grid grid-cols-4 items-start gap-3">
        {VIDEO_PRICING.map((item, i) => (
          <div key={item.key} className={i % 2 === 1 ? "mt-8" : ""}>
            <div className="rounded-[22px] border-[4px] border-slate-900 bg-slate-900 shadow-[0_18px_40px_-10px_rgba(15,23,42,0.45)]">
              <SampleReel
                videos={SAMPLE_VIDEOS[item.key]}
                label={item.title.replace(" Video", "")}
                paused={Boolean(open)}
                onOpen={(index) => setOpen({ key: item.key, index })}
                frameClassName="aspect-[9/16] w-full rounded-[18px]"
                compact
              />
            </div>
            <div className="mt-2 text-center">
              <div className="text-[11px] font-black leading-tight text-slate-900">{item.title}</div>
              <div className="text-[10px] font-bold text-amber-700">
                {videoCoins(item.coinsPerSecond, VIDEO_MIN_SECONDS)} coins · {VIDEO_MIN_SECONDS}s
              </div>
            </div>
          </div>
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
