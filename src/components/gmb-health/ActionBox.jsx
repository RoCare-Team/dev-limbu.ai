import React from "react";
import { AlertCircle, CheckCircle, ChevronRight, TrendingDown } from "lucide-react";

const ActionBox = React.memo(({ title, items, danger, onRedirect }) => {
  const bgStyle = danger
    ? {
      background: "linear-gradient(to bottom right, #fef2f2, #fff7ed)",
      borderColor: "#fecaca",
    }
    : {
      background: "linear-gradient(to bottom right, #f0fdf4, #ecfdf5)",
      borderColor: "#bbf7d0",
    };

  const titleColor = danger ? "#b91c1c" : "#15803d";

  return (
    <div className="rounded-xl p-5 border-2" style={bgStyle}>
      <h4
        className="font-bold mb-4 text-lg flex items-center gap-2"
        style={{ color: titleColor }}
      >
        {danger ? "❌" : "✓"} {title}
      </h4>
      <ul className="space-y-3 text-sm">
        {items.filter(Boolean).map((item, i) => {
          const isObj = typeof item === "object";
          const text = isObj ? item.text : item;
          const subtext = isObj ? item.subtext : null;
          const severity = isObj ? item.severity : null;
          const signalKey = isObj ? item.signalKey : null;

          let severityBadge = null;
          if (danger && severity) {
            const badgeColors = {
              high: "bg-red-100 text-red-700 border-red-200",
              medium: "bg-orange-100 text-orange-700 border-orange-200",
              low: "bg-yellow-100 text-yellow-700 border-yellow-200",
            };
            severityBadge = (
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColors[severity.toLowerCase()] || badgeColors.low}`}
              >
                {severity}
              </span>
            );
          }

          return (
            <li
              key={i}
              className={`flex gap-3 items-start ${danger && signalKey ? "cursor-pointer hover:bg-red-100 p-1.5 -mx-1.5 rounded-lg transition-colors group" : ""}`}
              onClick={() => {
                if (danger && signalKey && onRedirect) onRedirect(signalKey);
              }}
            >
              <div className="mt-0.5">
                {danger ? (
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#dc2626" }}
                  />
                ) : (
                  <CheckCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#16a34a" }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {text}
                    {danger && signalKey && (
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </span>
                  {severityBadge}
                </div>
                {subtext && (
                  <span className="text-xs text-slate-500 font-medium">
                    {subtext}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {danger && (
        <p className="text-[11px] mt-4 font-bold flex items-center gap-2 text-red-600/70 italic uppercase tracking-wider">
          <TrendingDown className="w-3.5 h-3.5" />
          Fixing these can significantly improve your local ranking.
        </p>
      )}
    </div>
  );
});

ActionBox.displayName = "ActionBox";
export default ActionBox;
