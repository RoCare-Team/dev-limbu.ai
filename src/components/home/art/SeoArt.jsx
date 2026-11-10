import { BarChart3, Search } from "lucide-react";
import { Stage, Window, Chip } from "./shared";

/* Google search with the business ranked #1 */
export default function SeoArt() {
  return (
    <Stage>
      <Window url="google.com/search?q=best+ro+service+near+me">
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 shadow-sm">
            <Search size={14} className="text-slate-400" />
            <span className="text-[11px] font-medium text-slate-600">best ro service near me</span>
          </div>
          <div className="mt-3 rounded-xl border-2 border-amber-200 bg-amber-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-black text-white">
                #1
              </span>
              <span className="text-[10px] text-emerald-700">yourbusiness.com</span>
            </div>
            <div className="mt-1 text-sm font-bold text-blue-700">
              RO Service & Repair Near You | Same-Day Visit
            </div>
            <div className="text-[10px] text-slate-500">
              Trusted RO experts · 4.8★ · Free inspection, call now.
            </div>
          </div>
          {[1, 2].map((n) => (
            <div key={n} className="mt-3 px-1 opacity-60">
              <div className="h-2 w-28 rounded-full bg-emerald-200" />
              <div className="mt-1.5 h-2.5 w-56 rounded-full bg-blue-200" />
              <div className="mt-1.5 h-2 w-64 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </Window>
      <Chip
        className="-right-1 bottom-2"
        icon={BarChart3}
        title="Traffic +210%"
        sub="organic visits"
      />
    </Stage>
  );
}
