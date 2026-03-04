import { Star } from "lucide-react";

export default function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const filled = idx + 1 <= Math.round(rating);
        return <Star key={idx} className={`h-4 w-4 ${filled ? "fill-champagne text-champagne" : "text-gray-600/40"}`} />;
      })}
    </div>
  );
}
