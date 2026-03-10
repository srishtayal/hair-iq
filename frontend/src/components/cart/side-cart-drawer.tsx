"use client";

import { useStore } from "@/context/store-context";
import { currency } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SideCartDrawer() {
  const { isSideCartOpen, closeSideCart, sideCartItem, getCartProduct, cartSubtotal, cartCount } = useStore();
  const product = sideCartItem ? getCartProduct(sideCartItem) : undefined;
  const variant = product?.variants.find((entry) => entry.id === sideCartItem?.variantId);

  return (
    <>
      <div
        onClick={closeSideCart}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
          isSideCartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isSideCartOpen}
      />

      <aside
        className={`fixed right-0 top-0 z-[95] h-full w-full max-w-md transform border-l border-black/10 bg-white shadow-2xl transition-transform duration-300 ${
          isSideCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isSideCartOpen}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Added to Cart</p>
            <h3 className="text-lg font-semibold text-coal">Your Cart</h3>
          </div>
          <button
            type="button"
            onClick={closeSideCart}
            className="rounded-full border border-black/15 p-2 text-coal transition hover:bg-gray-50"
            aria-label="Close side cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {sideCartItem && product ? (
            <article className="rounded-2xl border border-black/10 p-3">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
                  <Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-coal">{product.name}</p>
                  <p className="mt-1 text-xs text-gray-600">Variant: {variant?.label || "Default"}</p>
                  <p className="mt-1 text-xs text-gray-600">Qty: {sideCartItem.quantity}</p>
                  <p className="mt-2 text-sm font-semibold text-coal">{currency((variant?.price || product.basePrice) * sideCartItem.quantity)}</p>
                </div>
              </div>
            </article>
          ) : (
            <p className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Your latest added item will appear here.
            </p>
          )}

          <div className="rounded-2xl border border-black/10 bg-[#faf7f2] p-4">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Items in cart</span>
              <span>{cartCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-coal">
              <span>Subtotal</span>
              <span>{currency(cartSubtotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2 border-t border-black/10 px-5 py-4">
          <Link
            href="/cart"
            onClick={closeSideCart}
            className="block w-full rounded-full bg-coal px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-black"
          >
            View Cart
          </Link>
          <Link
            href="/cart"
            onClick={closeSideCart}
            className="block w-full rounded-full border border-black/20 bg-white px-4 py-3 text-center text-sm font-semibold text-coal transition hover:bg-gray-50"
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={closeSideCart}
            className="w-full rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-gray-600 transition hover:text-coal"
          >
            Continue Shopping
          </button>
        </div>
      </aside>
    </>
  );
}
