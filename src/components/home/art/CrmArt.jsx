import { BellRing, IndianRupee, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Stage, Window, Chip } from "./shared";

const COLUMNS = [
  {
    title: "New lead",
    tone: "bg-sky-50 text-sky-700",
    cards: [
      { name: "Rohit Mehta", note: "Google Ads · Kitchen RO", src: "G" },
      { name: "Priya Sharma", note: "Website form", src: "W" },
    ],
  },
  {
    title: "Follow-up",
    tone: "bg-amber-50 text-amber-700",
    cards: [{ name: "Amit Verma", note: "Call back 5 PM", src: "M", whatsapp: true }],
  },
  {
    title: "Won",
    tone: "bg-emerald-50 text-emerald-700",
    cards: [{ name: "Neha Kapoor", note: "₹18,500 paid", src: "W" }],
  },
];

/* A sales pipeline board inside a custom CRM */
export default function CrmArt() {
  return (
    <Stage>
      <Window url="crm.yourbusiness.com">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <span className="text-xs font-black text-slate-900">Sales Pipeline</span>
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white">+ Add lead</span>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${col.tone}`}>{col.title}</span>
              <div className="mt-2 space-y-2">
                {col.cards.map((card) => (
                  <div key={card.name} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[8px] font-black text-[#facc15]">
                        {card.name[0]}
                      </span>
                      <span className="truncate text-[10px] font-bold text-slate-900">{card.name}</span>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-slate-500">{card.note}</p>
                    <div className="mt-1.5 flex gap-1 text-slate-400">
                      <Phone size={9} />
                      {card.whatsapp && <FaWhatsapp size={9} className="text-emerald-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Window>
      <Chip className="-left-2 bottom-2 sm:-left-6" icon={BellRing} title="Follow-up reminder" sub="Amit · 5:00 PM" />
      <Chip className="-right-2 -top-3 sm:-right-4" icon={IndianRupee} title="₹2.4L this month" sub="from 38 won deals" />
    </Stage>
  );
}
