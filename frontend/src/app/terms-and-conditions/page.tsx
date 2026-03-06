import SectionHeader from "@/components/common/section-header";

export default function TermsAndConditionsPage() {
  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Policy" title="Terms and Conditions" />

      <section className="max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm text-gray-700 md:text-base">
          <span className="font-semibold text-coal">Effective Date:</span> 01/01/2026
        </p>

        <p className="text-sm text-gray-700 md:text-base">
          Welcome to All Horizon. By accessing or using our website and services, you agree to the following terms and conditions.
        </p>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">General</h3>
          <p className="text-sm text-gray-700 md:text-base">
            All Horizon operates this website and offers products and services through it. By placing an order on our website, you agree to
            comply with these terms.
          </p>
          <p className="text-sm text-gray-700 md:text-base">We reserve the right to modify or update these terms at any time without prior notice.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Products</h3>
          <p className="text-sm text-gray-700 md:text-base">
            All products listed on the website are subject to availability. We reserve the right to discontinue or limit quantities of any
            product.
          </p>
          <p className="text-sm text-gray-700 md:text-base">Product images shown on the website are for representation purposes. Actual products may slightly vary.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Pricing</h3>
          <p className="text-sm text-gray-700 md:text-base">All prices are listed in Indian Rupees (INR).</p>
          <p className="text-sm text-gray-700 md:text-base">
            All Horizon reserves the right to update pricing or cancel orders in case of pricing errors or technical issues.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Order Confirmation</h3>
          <p className="text-sm text-gray-700 md:text-base">Orders are confirmed only after successful payment processing.</p>
          <p className="text-sm text-gray-700 md:text-base">
            We reserve the right to cancel orders if fraudulent activity or incorrect information is suspected.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">User Responsibility</h3>
          <p className="text-sm text-gray-700 md:text-base">
            Users agree to provide accurate and complete information while placing orders.
          </p>
          <p className="text-sm text-gray-700 md:text-base">
            Misuse of the website or fraudulent transactions may result in cancellation of orders.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Intellectual Property</h3>
          <p className="text-sm text-gray-700 md:text-base">
            All website content including logos, text, graphics and images belong to All Horizon and cannot be used without permission.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Limitation of Liability</h3>
          <p className="text-sm text-gray-700 md:text-base">
            All Horizon shall not be liable for any indirect or consequential damages resulting from the use of our website or products.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl text-coal">Governing Law</h3>
          <p className="text-sm text-gray-700 md:text-base">These terms shall be governed by the laws of India.</p>
        </div>
      </section>
    </div>
  );
}
