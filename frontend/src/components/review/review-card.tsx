import RatingStars from "@/components/common/rating-stars";
import { Review } from "@/types";
import Image from "next/image";

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
      {review.media ? (
        <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-black/5">
          {review.media.type === "video" ? (
            <video src={review.media.url} controls playsInline preload="none" className="h-full w-full object-cover" />
          ) : (
            <Image src={review.media.url} alt={`${review.user} review`} fill sizes="320px" className="object-cover" />
          )}
        </div>
      ) : null}
    </article>
  );
}
