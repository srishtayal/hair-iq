import SectionHeader from "@/components/common/section-header";

export default function AboutSection() {
  return (
    <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 md:p-10">
      <SectionHeader
        eyebrow="About Hair IQ"
        title="Crafted by experts who understand modern confidence"
        description="Hair IQ was created for men who demand realism, comfort, and style. We combine barber-backed craftsmanship with high-performance materials to build undetectable systems that fit active routines."
      />
      <div className="space-y-5 text-sm text-gray-600 md:text-base">
        <p>
          From consultation-inspired product design to easy-to-follow video education, every touchpoint is built to make your transformation simple.
        </p>
        <p>
          Our mission is straightforward: premium outcomes without the confusion. That means consistent quality control, clean packaging, and transparent
          guidance for first-time and experienced users.
        </p>
      </div>
    </section>
  );
}
