import Image from "next/image";
import { CreditCard, Smartphone, Star } from "lucide-react";
import { Stage, Window, Chip } from "./shared";
import { POST_IMAGES } from "./media";

/* A finished business website on desktop, with its mobile version beside it */
export default function WebDevArt() {
  return (
    <Stage>
      <div className="pr-16">
        <Window url="yourbusiness.com">
          {/* Site nav */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-xs font-black text-slate-900">YourBusiness</span>
            <span className="flex gap-3 text-[9px] font-semibold text-slate-500">
              <span>Home</span>
              <span>Services</span>
              <span>Shop</span>
              <span>Contact</span>
            </span>
          </div>
          {/* Hero */}
          <div className="grid grid-cols-[1.1fr_1fr] items-center gap-3 bg-gradient-to-br from-slate-50 to-amber-50 px-4 py-4">
            <div>
              <div className="text-sm font-black leading-tight text-slate-900">
                Fresh drinks, delivered fast
              </div>
              <div className="mt-1 flex items-center gap-0.5 text-[9px] font-semibold text-slate-500">
                <Star size={9} className="fill-amber-400 text-amber-400" /> 4.9 · 2,300+ orders
              </div>
              <span className="mt-2 inline-block rounded-md bg-slate-900 px-2.5 py-1 text-[9px] font-bold text-white">
                Order Now
              </span>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src={POST_IMAGES.social} alt="" fill sizes="200px" className="object-cover" />
            </div>
          </div>
          {/* Products */}
          <div className="grid grid-cols-3 gap-2 p-4">
            {["Mojito", "Berry Cooler", "Lemon Fizz"].map((name, i) => (
              <div key={name} className="rounded-lg border border-slate-100 p-1.5">
                <div
                  className={`h-10 rounded-md ${"bg-slate-100"}`}
                />
                <div className="mt-1 text-[9px] font-bold text-slate-800">{name}</div>
                <div className="text-[9px] font-semibold text-slate-900">₹{[149, 179, 129][i]}</div>
              </div>
            ))}
          </div>
        </Window>
      </div>

      {/* Mobile version */}
      <div className="absolute bottom-0 right-2 w-[120px] overflow-hidden rounded-[20px] border-[4px] border-slate-900 bg-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.45)]">
        <div className="px-2 py-1.5 text-[8px] font-black text-slate-900">YourBusiness</div>
        <div className="relative aspect-square">
          <Image src={POST_IMAGES.social} alt="" fill sizes="120px" className="object-cover" />
        </div>
        <div className="p-2">
          <div className="text-[9px] font-black leading-tight text-slate-900">Fresh drinks, delivered fast</div>
          <div className="mt-1.5 rounded bg-slate-900 py-1 text-center text-[8px] font-bold text-white">
            Order Now
          </div>
        </div>
      </div>

      <Chip
        className="-top-3 right-20"
        icon={Smartphone}
        title="Mobile-ready"
        sub="looks great on phones"
      />
      <Chip
        className="-bottom-1 left-4"
        icon={CreditCard}
        title="Payments on"
        sub="UPI, cards, net banking"
      />
    </Stage>
  );
}
