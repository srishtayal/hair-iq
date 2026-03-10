import { Star } from "lucide-react";

export default function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const fillAmount = Math.max(0, Math.min(1, clampedRating - idx));
        return (
          <span key={idx} className="relative inline-flex h-4 w-4">
            <Star className="absolute inset-0 h-4 w-4 text-gray-300/80" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillAmount * 100}%` }}>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.55)]" />
            </span>
          </span>
        );
      })}
      <span className="ml-1 text-xs font-semibold text-gray-600">{clampedRating.toFixed(1)}</span>
    </div>
  );
}
