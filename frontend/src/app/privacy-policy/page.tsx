import SectionHeader from "@/components/common/section-header";

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Policy" title="Privacy Policy" />

      <section className="max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">
          <span className="font-semibold text-coal">Effective Date:</span> 01/01/2026
        </p>

        <p className="text-sm text-gray-700 md:text-base">
          All Horizon respects the privacy of its customers and is committed to protecting personal information.
        </p>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Information We Collect</h3>
          <p className="text-sm text-gray-700 md:text-base">We may collect the following information:</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 md:text-base">
            <li>Name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Shipping and billing address</li>
            <li>Order details</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Use of Information</h3>
          <p className="text-sm text-gray-700 md:text-base">Information collected may be used to:</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 md:text-base">
            <li>Process and deliver orders</li>
            <li>Provide customer support</li>
            <li>Improve website services</li>
            <li>Send order updates</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Data Protection</h3>
          <p className="text-sm text-gray-700 md:text-base">We implement reasonable security measures to protect customer data.</p>
          <p className="text-sm text-gray-700 md:text-base">
            Payments are processed securely through trusted payment gateway providers including Razorpay.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Third Party Sharing</h3>
          <p className="text-sm text-gray-700 md:text-base">Customer information is not sold or rented to third parties.</p>
          <p className="text-sm text-gray-700 md:text-base">
            Information may be shared with shipping partners and payment processors only for order fulfillment.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Cookies</h3>
          <p className="text-sm text-gray-700 md:text-base">Our website may use cookies to improve the browsing experience.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Policy Updates</h3>
          <p className="text-sm text-gray-700 md:text-base">All Horizon reserves the right to update this policy at any time.</p>
        </div>
      </section>
    </div>
  );
}
