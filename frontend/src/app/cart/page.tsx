"use client";

import CartItem from "@/components/cart/cart-item";
import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { currency } from "@/lib/utils";

export default function CartPage() {
  const { cartItems, cartSubtotal, isAuthenticated, goToAuth } = useStore();
  const subtotal = cartItems.length ? cartSubtotal - 12 : 0;

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Cart" title="Review your selection" description="Update quantities, verify prices, and continue to secure checkout." />

      {!cartItems.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Add premium hair systems or care essentials to begin checkout."
          ctaLabel="Explore products"
          ctaHref="/products"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItem key={item.itemId} item={item} />
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft lg:sticky lg:top-24">
            <h3 className="font-semibold text-coal">Price Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{currency(12)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-coal">
                <span>Total</span>
                <span className="font-semibold">{currency(cartSubtotal)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  goToAuth("/cart");
                  return;
                }
              }}
              className="mt-5 w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal"
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
