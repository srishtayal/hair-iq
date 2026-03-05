import SectionHeader from "@/components/common/section-header";
import ReviewCard from "@/components/review/review-card";
import { reviews } from "@/data/reviews";

export default function TestimonialSection() {
  const featuredReviews = reviews.slice(0, 7);

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
    </section>
  );
}
