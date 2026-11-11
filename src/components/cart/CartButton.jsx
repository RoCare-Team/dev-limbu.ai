"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

/** Header cart icon with the item count; opens the cart drawer. */
export default function CartButton({ className = "" }) {
  const count = useCartStore((s) => s.items.length);
  const open = useCartStore((s) => s.open);
  // The count comes from localStorage, so only show it after mount (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Cart${mounted && count ? `, ${count} item${count > 1 ? "s" : ""}` : ""}`}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black/5 ${className}`}
    >
      <ShoppingCart size={18} />
      {mounted && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#facc15] px-1 text-[10px] font-black text-black ring-2 ring-white">
          {count}
        </span>
      )}
    </button>
  );
}
