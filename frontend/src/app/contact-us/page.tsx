import SectionHeader from "@/components/common/section-header";

export default function ContactUsPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Contact Us" title="Contact Us" />

      <section className="max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">If you have questions regarding orders, policies, or services, please contact us.</p>

        <div className="space-y-1 text-sm text-gray-700 md:text-base">
          <p>
            <span className="font-semibold text-coal">Company Name:</span> All Horizon
          </p>
          <p>
            <span className="font-semibold text-coal">Email:</span> Support@hairiq.in
          </p>
          <p>
            <span className="font-semibold text-coal">Phone:</span> 8826429145
          </p>
        </div>

        <div className="space-y-1 text-sm text-gray-700 md:text-base">
          <p className="font-semibold text-coal">Customer Support Hours:</p>
          <p>Monday to Saturday</p>
          <p>10:00 AM - 7:00 PM</p>
        </div>

        <p className="text-sm text-gray-700 md:text-base">We aim to respond to all queries within 24-48 business hours.</p>
      </section>
    </div>
  );
}
