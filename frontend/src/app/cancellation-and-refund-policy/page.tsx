import SectionHeader from "@/components/common/section-header";

export default function CancellationAndRefundPolicyPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Policy" title="Cancellation and Refund Policy" />

      <section className="max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">
          <span className="font-semibold text-coal">Effective Date:</span> 01/01/2026
        </p>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Order Cancellation</h3>
          <p className="text-sm text-gray-700 md:text-base">Orders can be cancelled before they are shipped.</p>
          <p className="text-sm text-gray-700 md:text-base">Once an order has been dispatched, cancellation will not be possible.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Refunds</h3>
          <p className="text-sm text-gray-700 md:text-base">Refunds may be issued in the following situations:</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 md:text-base">
            <li>Order cancelled before shipment</li>
            <li>Product unavailable after payment</li>
            <li>Order cancelled by All Horizon</li>
          </ul>
          <p className="text-sm text-gray-700 md:text-base">
            Approved refunds will be processed within 5-7 business days to the original payment method.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Damaged or Incorrect Product</h3>
          <p className="text-sm text-gray-700 md:text-base">
            If a customer receives a damaged or incorrect product, they must contact customer support within 48 hours of delivery.
          </p>
          <p className="text-sm text-gray-700 md:text-base">After verification, a replacement or refund may be issued.</p>
        </div>
      </section>
    </div>
  );
}
