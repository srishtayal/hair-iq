import SectionHeader from "@/components/common/section-header";

export default function AboutUsPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="About Us"
        title="All Horizon"
        // description="All Horizon provides premium hair patch products with transparent policies, open delivery, and dedicated support."
      />

      <section className="max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">
          All Horizon provides premium hair patch products with transparent policies, open delivery, and dedicated support.
          We are focused on quality products, clear communication, and dependable service for every customer.
        </p>
        <p className="text-sm text-gray-700 md:text-base">For any query related to orders, policies, or support, contact us at Support@hairiq.in.</p>
      </section>
    </div>
  );
}
