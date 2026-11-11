import Image from "next/image";
import { Bell, Home, Search, ShoppingBag, Star, User } from "lucide-react";
import { FaAndroid, FaApple } from "react-icons/fa";
import { Stage, Chip } from "./shared";
import { POST_IMAGES } from "./media";

/* A business's own shopping app on a phone, with a push notification */
export default function AppArt() {
  return (
    <Stage>
      <div className="mx-auto w-[260px] overflow-hidden rounded-[32px] border-[7px] border-slate-900 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="text-sm font-black text-slate-900">YourBrand</span>
          <span className="relative">
            <Bell size={15} className="text-slate-700" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
          </span>
        </div>
        <div className="mx-3 flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] text-slate-400">
          <Search size={11} /> Search products
        </div>
        <div className="relative mx-3 mt-3 aspect-[16/10] overflow-hidden rounded-xl">
          <Image src={POST_IMAGES.social} alt="" fill sizes="240px" className="object-cover" />
          <span className="absolute bottom-2 left-2 rounded-md bg-[#facc15] px-2 py-0.5 text-[9px] font-black text-black">20% OFF today</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {["Cold Coffee", "Mint Mojito"].map((name, i) => (
            <div key={name} className="rounded-lg border border-slate-100 p-2">
              <div className={`h-12 rounded-md ${i ? "bg-emerald-50" : "bg-amber-50"}`} />
              <p className="mt-1.5 text-[10px] font-bold text-slate-900">{name}</p>
              <p className="flex items-center gap-0.5 text-[9px] text-slate-500">
                <Star size={8} className="fill-amber-400 text-amber-400" /> 4.8 · ₹{i ? 149 : 129}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-around border-t border-slate-100 py-2 text-slate-400">
          <Home size={14} className="text-slate-900" />
          <ShoppingBag size={14} />
          <User size={14} />
        </div>
      </div>
      <Chip className="-left-2 top-44 sm:left-0" icon={Bell} title="Your order is on the way!" sub="Push notification" />
      <div className="absolute bottom-8 right-0 z-10 flex gap-2 sm:right-4">
        <span className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white shadow-lg">
          <FaAndroid size={14} className="text-[#3DDC84]" /> Play Store
        </span>
        <span className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white shadow-lg">
          <FaApple size={14} /> App Store
        </span>
      </div>
    </Stage>
  );
}
