import Image from "next/image";
import { CheckCheck, ExternalLink, Mail, Phone, Signal, Wifi, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { POST_IMAGES } from "./media";

function Label({ icon: Icon, children }) {
  return (
    <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-700">
      <Icon size={14} className="text-amber-600" /> {children}
    </div>
  );
}

/* WhatsApp Business chat: automated reminder template -> customer books */
function WhatsAppPhone() {
  return (
    <div className="w-[236px]">
      <Label icon={FaWhatsapp}>WhatsApp Automation</Label>
      <div className="overflow-hidden rounded-[30px] border-[6px] border-slate-900 bg-[#efeae2] shadow-[0_24px_50px_-12px_rgba(15,23,42,0.4)]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#075e54] px-4 pt-1.5 text-[8px] font-bold text-white/90">
          <span>10:02</span>
          <span className="flex items-center gap-1">
            <Signal size={9} /> <Wifi size={9} />
          </span>
        </div>
        {/* Chat header */}
        <div className="flex items-center gap-2 bg-[#075e54] px-3 pb-2 pt-1.5 text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#facc15] text-[10px] font-black text-black">
            YB
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[11px] font-bold">
              Your Business
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#25D366]">
                <CheckCheck size={7} className="text-white" />
              </span>
            </div>
            <div className="text-[8px] text-white/70">online</div>
          </div>
          <Phone size={13} className="text-white/90" />
        </div>

        {/* Messages */}
        <div className="space-y-2 p-2.5">
          <div className="mx-auto w-fit rounded-md bg-white/70 px-2 py-0.5 text-[8px] font-semibold text-slate-500">
            TODAY
          </div>

          {/* Automated template message with buttons */}
          <div className="w-[88%] overflow-hidden rounded-xl rounded-tl-none bg-white shadow-sm">
            <div className="px-2.5 pt-2 text-[10px] leading-snug text-slate-800">
              <div className="mb-1 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-amber-600">
                <Zap size={9} className="fill-amber-500 text-amber-500" /> Automated
              </div>
              Hi Amit 👋 Your RO service is due this week. Book today and get <b>10% off</b>.
              <div className="mt-0.5 text-right text-[8px] text-slate-400">10:02 AM</div>
            </div>
            <div className="mt-1.5 grid grid-cols-2 border-t border-slate-100 text-center text-[9px] font-bold text-[#0a84d6]">
              <span className="border-r border-slate-100 py-1.5">Book Now</span>
              <span className="py-1.5">Call Us</span>
            </div>
          </div>

          {/* Customer reply */}
          <div className="ml-auto w-fit rounded-xl rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5 text-[10px] text-slate-800 shadow-sm">
            Book Now
            <span className="ml-2 inline-flex items-center gap-0.5 text-[8px] text-slate-400">
              10:04 <CheckCheck size={10} className="text-[#53bdeb]" />
            </span>
          </div>

          {/* Confirmation */}
          <div className="w-[80%] rounded-xl rounded-tl-none bg-white px-2.5 py-1.5 text-[10px] leading-snug text-slate-800 shadow-sm">
            Booked ✅ <b>Sunday, 11 AM</b>. Our technician will call before the visit.
            <div className="mt-0.5 text-right text-[8px] text-slate-400">10:04 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Email campaign as it lands in the customer's inbox, with results */
function EmailCard() {
  return (
    <div className="w-[248px]">
      <Label icon={Mail}>Emailer</Label>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_50px_-12px_rgba(15,23,42,0.3)]">
        {/* Sender row */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-[#facc15]">
            YB
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-bold text-slate-900">Your Business</div>
            <div className="truncate text-[8px] text-slate-400">to amit@gmail.com · 9:30 AM</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            Delivered
          </span>
        </div>

        <div className="p-3">
          <div className="text-[11px] font-black leading-snug text-slate-900">
            Summer offer: 20% off this week 🎉
          </div>
          <div className="relative mt-2 aspect-[16/8] overflow-hidden rounded-lg">
            <Image src={POST_IMAGES.social} alt="" fill sizes="240px" className="object-cover" />
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-600">
            Hi Amit, as a valued customer you get 20% off all drinks this week. Show this email at
            the counter or order online.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#facc15] px-3 py-1.5 text-[9px] font-black text-black">
            Order Now <ExternalLink size={9} />
          </span>
        </div>

        {/* Campaign results */}
        <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50 text-center">
          {[
            ["1,240", "Delivered"],
            ["38%", "Opened"],
            ["12%", "Clicked"],
          ].map(([v, l]) => (
            <div key={l} className="py-2">
              <div className="text-xs font-black text-slate-900">{v}</div>
              <div className="text-[8px] font-semibold text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Both outreach tools side by side */
export default function OutreachArt() {
  return (
    <div className="mx-auto flex w-full max-w-[540px] items-start justify-center gap-4 pb-2" aria-hidden="true">
      <WhatsAppPhone />
      <div className="mt-12">
        <EmailCard />
      </div>
    </div>
  );
}
