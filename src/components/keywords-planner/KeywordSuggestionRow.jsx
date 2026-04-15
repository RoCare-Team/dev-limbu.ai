import React from "react";
import { Check, Loader2, Plus } from "lucide-react";

const KeywordSuggestionRow = React.memo(({ item, isAdded, isSaving, onAdd, style }) => {
  return (
    <div style={style} className="p-1">
      <div
        className={`grid grid-cols-12 items-center p-4 h-full rounded-xl border transition-all duration-300 ${isAdded
            ? "bg-slate-50 border-black/5"
            : "bg-white border-black/5 hover:border-lemon-hover hover:shadow-lg"
          }`}
      >
        <div className="col-span-6 flex items-center gap-3 pr-2">
          <span className={`font-bold text-xs truncate ${isAdded ? "text-slate-300 line-through" : "text-black"}`}>
            {item.keyword}
          </span>
          {item.competitionIndex > 80 && !isAdded && (
            <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">Best Choice</span>
          )}
        </div>
        <div className="col-span-2 text-center">
          <span className="text-[10px] font-black text-black">
            {item.volume ? item.volume.toLocaleString() : "-"}
          </span>
        </div>
        <div className="col-span-2 flex justify-center">
          {item.competition && (
            <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${item.competition === "LOW" ? "bg-green-50 text-green-600 border-green-100" :
                item.competition === "MEDIUM" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                  "bg-red-50 text-red-600 border-red-100"
              }`}>
              {item.competition}
            </span>
          )}
        </div>
        <div className="col-span-2 text-right">
          {isAdded ? (
            <div className="flex items-center justify-end text-green-500 gap-1 pr-1">
              <Check className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Saved</span>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              disabled={isSaving === item.keyword}
              className="btn-lemon w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-none flex items-center justify-center"
            >
              {isSaving === item.keyword ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

KeywordSuggestionRow.displayName = "KeywordSuggestionRow";
export default KeywordSuggestionRow;
