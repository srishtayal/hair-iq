import RatingStars from "@/components/common/rating-stars";
import { Review } from "@/types";
import Image from "next/image";

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-[280px] flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-white/5 p-5">
      <div>
        <p className="line-clamp-1 text-sm font-semibold text-coal">{review.user}</p>
        <p className="line-clamp-1 text-xs text-gray-600">{review.location}</p>
      </div>
      <RatingStars rating={review.rating} className="mt-4" />
      <p className="mt-3 min-h-[40px] line-clamp-2 text-sm font-semibold text-coal">{review.title}</p>
      <p className="mt-2 min-h-[80px] line-clamp-4 text-sm text-gray-600">{review.content}</p>
    </article>
  );
}
