"use client";

import { Send } from "lucide-react";
import { ToolCard } from "@/components/home/ToolCard";
import ToolGrid from "@/components/home/ToolGrid";
import { useLeadModalStore } from "@/stores/useLeadModalStore";

/** "Get a Free Quote" button that opens the enquiry form for `service`. */
export function LeadButton({ service, label }) {
  const open = useLeadModalStore((s) => s.open);
  return (
    <button
      type="button"
      onClick={() => open(service)}
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
    >
      <Send size={15} className="text-[#facc15]" /> {label}
    </button>
  );
}

/** Tool cards that open the enquiry form (pre-filled with the card) instead of a link. */
export function LeadToolGrid({ items, service }) {
  const open = useLeadModalStore((s) => s.open);
  return (
    <ToolGrid className="mt-6 sm:mt-8 lg:mt-10">
      {items.map((item) => (
        <ToolCard key={item.key} item={item} onCardClick={() => open(service, item.label)} />
      ))}
    </ToolGrid>
  );
}
