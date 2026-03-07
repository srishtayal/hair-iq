import SectionHeader from "@/components/common/section-header";

export default function AboutSection() {
  return (
    <section className="grid gap-8 md:grid-cols-2 md:gap-10">
      <SectionHeader
        eyebrow="About Hair IQ"
        title="India&apos;s largest wholesale hair patch manufacturer, now delivering directly to your doorstep"
        description="At Hair IQ, we&apos;ve been part of the hair patch industry for a long time and became India&apos;s largest wholesale manufacturer."
      />
      <div className="space-y-5 text-sm text-gray-600 md:text-base">
        <p>
          We recently expanded into home service in Delhi NCR after identifying a major market gap.
        </p>
        <p>
          We now realize that scaling a technician team nationwide will take time, so we are launching a B2C website with open delivery.
        </p>
        <p>
          We guarantee the best prices in the market because we eliminate middlemen and deliver directly from our factory in Bangladesh to your door.
        </p>
      </div>
    </section>
  );
}
