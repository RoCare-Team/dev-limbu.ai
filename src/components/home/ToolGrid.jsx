"use client";

import { Children, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Tool cards of a home section.
 *  - Phones: a swipeable slider, two cards stacked per slide, with dots, so a
 *    section with 9 tools takes one screen instead of nine.
 *  - Tablet / desktop: the usual 2 / 3 column grid.
 * `slide` sets the slide width on phones and `grid` the larger-screen columns
 * (full Tailwind class strings, so they survive the build). `bleed` lets the
 * slider run to the edge of a parent padded by 16px (px-4) or 12px (px-3).
 */
export default function ToolGrid({
  children,
  className = "",
  slide = "auto-cols-[82%]",
  grid = "sm:grid-cols-2 lg:grid-cols-3",
  bleed = "-mx-4 px-4 scroll-px-4",
}) {
  const items = Children.toArray(children);
  const rows = items.length > 3 ? 2 : 1; // 2–3 tools: one row is enough
  const pages = Math.ceil(items.length / rows);
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const col = el.firstElementChild?.getBoundingClientRect().width || 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setActive(atEnd ? pages - 1 : Math.min(pages - 1, Math.round(el.scrollLeft / (col + 12))));
      setEdge({ start: el.scrollLeft <= 2, end: atEnd });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pages]);

  const goTo = (i) => {
    const el = ref.current;
    const col = el?.children[i * rows];
    if (el && col) el.scrollTo({ left: col.offsetLeft - el.firstElementChild.offsetLeft, behavior: "smooth" });
  };

  // Arrow: move one column left (-1) or right (+1)
  const step = (dir) => {
    const el = ref.current;
    const col = el?.firstElementChild?.getBoundingClientRect().width || 0;
    el?.scrollBy({ left: dir * (col + 12), behavior: "smooth" });
  };

  const arrow = (dir, hidden) =>
    pages > 1 && (
      <button
        type="button"
        aria-label={dir < 0 ? "Previous" : "Next"}
        onClick={() => step(dir)}
        className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur transition-all duration-200 active:scale-90 sm:hidden ${
          dir < 0 ? "-left-2" : "-right-2"
        } ${hidden ? "pointer-events-none scale-75 opacity-0" : "opacity-100"}`}
      >
        {dir < 0 ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
      </button>
    );

  return (
    <div className={className}>
      <div className="relative">
      {arrow(-1, edge.start)}
      {arrow(1, edge.end)}
      <div
        ref={ref}
        className={`${bleed} grid snap-x snap-mandatory ${items.length === 1 ? "auto-cols-[100%]" : slide} grid-flow-col gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          rows === 2 ? "grid-rows-2" : "grid-rows-1"
        } sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-rows-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 ${grid}`}
      >
        {items.map((child, i) => (
          <div key={child.key ?? i} className="min-w-0 snap-start">
            {child}
          </div>
        ))}
      </div>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden" aria-hidden="true">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-amber-500" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
