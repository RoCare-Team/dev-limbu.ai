"use client";

import { ADMIN_SECTIONS } from "@/lib/adminAccess";

/**
 * Section-wise access picker.
 *
 * Reads the same catalog the sidebar renders from (lib/adminAccess.js), so a
 * page can never exist in the menu but be un-pickable here. `value` is a flat
 * array of item keys; the section row is only a convenience toggle.
 */
export default function AccessPicker({ value = [], onChange, disabled = false }) {
  const selected = new Set(value);

  const toggleItem = (key) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange([...next]);
  };

  const toggleSection = (section, allOn) => {
    const next = new Set(selected);
    for (const item of section.items) {
      allOn ? next.delete(item.key) : next.add(item.key);
    }
    onChange([...next]);
  };

  return (
    <div className="space-y-3">
      {ADMIN_SECTIONS.map((section) => {
        const keys = section.items.map((i) => i.key);
        const picked = keys.filter((k) => selected.has(k)).length;
        const allOn = picked === keys.length;

        return (
          <div key={section.key} className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{section.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {picked}/{keys.length}
                </span>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleSection(section, allOn)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {allOn ? "Clear section" : "Select all"}
              </button>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    selected.has(item.key)
                      ? "border-indigo-300 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    disabled={disabled}
                    checked={selected.has(item.key)}
                    onChange={() => toggleItem(item.key)}
                  />
                  <span className="truncate">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-slate-500">
        Nothing ticked? The user gets their role&apos;s default access instead of an empty panel.
      </p>
    </div>
  );
}
