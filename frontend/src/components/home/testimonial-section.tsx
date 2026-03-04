import SectionHeader from "@/components/common/section-header";
import ReviewCard from "@/components/review/review-card";
import { reviews } from "@/data/reviews";

export default function TestimonialSection() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Client Reviews"
        title="What Hair IQ clients say"
        description="Verified customer feedback with premium service experience and transformation outcomes."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
