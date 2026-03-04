import SectionHeader from "@/components/common/section-header";

export default function OpenDeliveryPolicy() {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      <SectionHeader eyebrow="Policy" title="Return & Exchange Policy" />

      <div className="space-y-6 text-sm text-gray-700 md:text-base">
        <div className="space-y-3">
          <p>
            At our marketplace, every order comes with <span className="font-semibold text-coal">Open Delivery</span>.
          </p>
          <p>
            This means you can open the package at the time of delivery and check the product in front of the delivery
            executive before accepting it.
          </p>
          <p>
            Because you get the opportunity to inspect the product before taking it, we do not offer returns after the
            delivery has been accepted.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-coal">How Open Delivery Works</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>You may open the package at the time of delivery.</li>
            <li>You can verify the product, quantity, visible condition, and size.</li>
            <li>
              If there is any issue (damage, wrong item, missing quantity, size mismatch), you must refuse the
              delivery on the spot.
            </li>
            <li>Once the order is accepted after inspection, it is considered final and non-returnable.</li>
          </ul>
          <p>
            We strongly encourage customers to thoroughly check the product during delivery to avoid any inconvenience
            later.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-coal">Exchange Policy</h3>
          <p>We do not offer exchanges once the order has been accepted under Open Delivery.</p>
          <p>
            Since you are given the opportunity to inspect the product before accepting it, all sales are considered
            final after successful delivery acceptance.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-coal">Important Note</h3>
          <p>
            Our Open Delivery policy is designed to give you complete transparency and confidence before accepting your
            order.
          </p>
          <p>
            Please ensure you check your items carefully at the time of delivery, as post-acceptance returns or
            exchanges will not be entertained.
          </p>
        </div>
      </div>
    </section>
  );
}
