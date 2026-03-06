import SectionHeader from "@/components/common/section-header";

export default function ShippingPolicyPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Policy" title="Shipping Policy" />

      <section className="max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">
          <span className="font-semibold text-coal">Effective Date:</span> 01/01/2026
        </p>

        <p className="text-sm text-gray-700 md:text-base">All Horizon offers free shipping across India.</p>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Order Processing</h3>
          <p className="text-sm text-gray-700 md:text-base">
            Orders are typically processed within 1-3 business days after successful payment confirmation.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Delivery Timeline</h3>
          <p className="text-sm text-gray-700 md:text-base">Metro cities: 3-5 business days</p>
          <p className="text-sm text-gray-700 md:text-base">Other locations: 5-8 business days</p>
          <p className="text-sm text-gray-700 md:text-base">Delivery timelines may vary depending on location and logistics operations.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Shipping Charges</h3>
          <p className="text-sm text-gray-700 md:text-base">All Horizon provides free shipping on all orders.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Delivery Partners</h3>
          <p className="text-sm text-gray-700 md:text-base">
            We work with reliable logistics partners to ensure safe and timely delivery.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Delays</h3>
          <p className="text-sm text-gray-700 md:text-base">
            Delivery timelines may be affected due to unforeseen circumstances such as weather conditions, strikes, or logistics disruptions.
          </p>
        </div>
      </section>
    </div>
  );
}
