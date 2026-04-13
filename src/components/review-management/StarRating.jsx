import React, { memo } from "react";
import { Star } from "lucide-react";

const StarRating = memo(({ rating }) => {
  const filled =
    rating === "FIVE"
      ? 5
      : rating === "FOUR"
        ? 4
        : rating === "THREE"
          ? 3
          : rating === "TWO"
            ? 2
            : 1;
            
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={`${i < filled ? "text-lemon-hover fill-lemon-hover" : "text-slate-100 fill-slate-100"}`}
        />
      ))}
    </div>
  );
});

StarRating.displayName = "StarRating";

export default StarRating;
