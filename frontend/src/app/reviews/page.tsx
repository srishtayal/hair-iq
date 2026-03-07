"use client";

import SectionHeader from "@/components/common/section-header";
import ReviewCard from "@/components/review/review-card";
import { reviews } from "@/data/reviews";
import { useMemo, useState } from "react";

const PAGE_SIZE = 12;

export default function ReviewsPage() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleReviews = useMemo(() => reviews.slice(0, visibleCount), [visibleCount]);
  const hasMore = visibleCount < reviews.length;

  return (
    <div className="space-y-8 pt-10">
      <SectionHeader
        eyebrow="Customer Stories"
        title="All Reviews"
        description="Verified customer feedback with ratings, comments, and media where available."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((previous) => Math.min(previous + PAGE_SIZE, reviews.length))}
            className="rounded-full border border-black/20 bg-white px-6 py-2.5 text-sm font-semibold text-coal transition hover:bg-gray-50"
          >
            Load More Reviews
          </button>
        </div>
      ) : null}
    </div>
  );
}
