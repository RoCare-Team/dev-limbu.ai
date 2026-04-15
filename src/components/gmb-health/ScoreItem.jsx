import React from "react";

const ScoreItem = React.memo(({ factor, score, outOf, details, dataSnapshot }) => {
  const percentage = outOf > 0 ? Math.round((score / outOf) * 100) : 0;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = (percentage) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 60) return "#fb923c"; // orange
    return "#ef4444"; // red
  };

  const strokeColor = getStrokeColor(percentage);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col text-center transition-all hover:shadow-lg hover:scale-105 min-w-[200px] h-full">
      <div className="flex-grow">
        <div className="relative w-20 h-20 mb-3 mx-auto">
          <svg className="w-full h-full" viewBox="0 0 60 60">
            <circle
              className="text-gray-200"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="30"
              cy="30"
            />
            <circle
              className="transform -rotate-90 origin-center"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke={strokeColor}
              fill="transparent"
              r="28"
              cx="30"
              cy="30"
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color: strokeColor }}
          >
            {percentage}%
          </span>
        </div>
        <h4 className="font-bold text-gray-800 text-sm leading-tight">
          {factor}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {score}/{outOf} pts
        </p>
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 w-full space-y-3 text-left">
          {details.map((detail, index) => (
            <div key={index} className="text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">{detail.item}</span>
                <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  {detail.score}/{detail.outOf}
                </span>
              </div>
              <div className="text-right text-gray-500 text-[11px] mt-0.5">
                {detail.item === "Post Consistency (30 Days)" &&
                  `(${detail.postsLast30Days} in 30d / ${dataSnapshot.totalPosts} total)`}
                {detail.item === "Photos & Media" &&
                  `(${detail.mediaLast90Days} in 90d / ${detail.totalMedia} total)`}
                {detail.item === "Services Coverage" &&
                  `(${detail.totalServices} services listed)`}
                {detail.item === "Additional Categories" &&
                  `(${detail.totalAdditionalCategories} categories)`}
                {detail.item === "Total Reviews" &&
                  `(${detail.total} total reviews)`}
                {detail.item === "Reply Rate" &&
                  `(${detail.replyRate}% reply rate)`}
                {detail.item === "Business Description" &&
                  `(${detail.length} characters)`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ScoreItem.displayName = "ScoreItem";
export default ScoreItem;
