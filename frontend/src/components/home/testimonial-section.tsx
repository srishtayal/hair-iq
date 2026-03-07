import SectionHeader from "@/components/common/section-header";
import ReviewCard from "@/components/review/review-card";
import { reviews } from "@/data/reviews";
import Link from "next/link";

export default function TestimonialSection() {
  const featuredReviews = reviews.slice(0, 12);

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Client Reviews"
        title="What Hair IQ clients say"
        description="Verified customer feedback with premium service experience and transformation outcomes."
      />
      <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {featuredReviews.map((review) => (
          <div key={review.id} className="w-[300px] min-w-[300px] sm:w-[340px] sm:min-w-[340px]">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
      <Link
        href="/reviews"
        className="inline-flex rounded-full border border-black/20 bg-white px-6 py-2.5 text-sm font-semibold text-coal transition hover:bg-gray-50"
      >
        View All Reviews
      </Link>
    </section>
  );
}
