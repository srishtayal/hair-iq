import RatingStars from "@/components/common/rating-stars";
import { Review } from "@/types";

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-2xl border border-graphite/10 bg-white/5 p-5">
      <div>
        <p className="text-sm font-semibold text-coal">{review.user}</p>
        <p className="text-xs text-gray-600">{review.location}</p>
      </div>
      <RatingStars rating={review.rating} className="mt-4" />
      <p className="mt-3 text-sm font-semibold text-coal">{review.title}</p>
      <p className="mt-2 text-sm text-gray-600">{review.content}</p>
    </article>
  );
}
