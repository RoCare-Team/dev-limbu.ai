import React from "react";
import { BarChart3, X } from "lucide-react";

const SavedKeywordRow = React.memo(({ item, onDelete }) => {
  return (
    <div className="bg-slate-50 border border-black/5 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all group">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-bold text-black text-[11px] uppercase tracking-tight truncate mb-2">
            {item.keyword}
          </p>
          <div className="flex items-center gap-2">
            {item.competition && (
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                item.competition === "LOW" ? "bg-green-100 text-green-700" :
                item.competition === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {item.competition}
              </span>
            )}
            {item.volume !== undefined && item.volume !== null && (
               <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                  <BarChart3 className="w-2.5 h-2.5" />
                  {item.volume.toLocaleString()}
               </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(item._id)}
          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

SavedKeywordRow.displayName = "SavedKeywordRow";
export default SavedKeywordRow;
