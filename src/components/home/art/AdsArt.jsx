import Image from "next/image";
import { MousePointerClick } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { Stage, Window, Chip } from "./shared";
import { POST_IMAGES } from "./media";

/* Sponsored ad with results */
export default function AdsArt() {
  return (
    <Stage>
      <Window url="facebook.com · Sponsored">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <FaFacebook size={22} className="text-[#1877F2]" />
            <div>
              <div className="text-xs font-bold text-slate-900">Your Business</div>
              <div className="text-[10px] text-slate-400">Sponsored</div>
            </div>
          </div>
          <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
            <Image src={POST_IMAGES.ads} alt="" fill sizes="480px" className="object-cover" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Book a visit today</span>
            <span className="rounded-lg bg-[#1877F2] px-3 py-1.5 text-[10px] font-bold text-white">
              Call Now
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["12.4k", "Reach"],
              ["842", "Clicks"],
              ["126", "Calls"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-slate-50 py-2">
                <div className="text-sm font-black text-slate-900">{v}</div>
                <div className="text-[9px] font-semibold text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Window>
      <Chip
        className="-left-1 top-24"
        icon={MousePointerClick}
        title="3.4x more leads"
        sub="vs last month"
      />
    </Stage>
  );
}
