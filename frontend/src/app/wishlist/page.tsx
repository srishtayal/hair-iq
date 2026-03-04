"use client";

import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { currency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function WishlistPage() {
  const { products, productsLoading, wishlist, moveWishlistToCart, toggleWishlist, authReady, isAuthenticated, goToAuth } = useStore();
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id));

  if (!authReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-12 space-y-8">
        <SectionHeader eyebrow="Wishlist" title="Login required" description="Create your account to access your wishlist." />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <button
            onClick={() => goToAuth("/wishlist")}
            className="rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-coal"
          >
            Login / Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Wishlist" title="Saved for later" description="Move saved items to cart whenever you're ready." />

      {productsLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <p className="text-sm text-gray-600">Loading wishlist items...</p>
        </div>
      ) : null}

      {!productsLoading && !wishlistProducts.length ? (
        <EmptyState
          title="Wishlist is empty"
          description="Save your favorite units and care products for quick access."
          ctaLabel="Browse products"
          ctaHref="/products"
        />
      ) : !productsLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {wishlistProducts.map((product) => (
            <article key={product.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl">
                <Image src={product.images[0]} alt={product.name} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-1 items-center justify-between gap-3">
                <div>
                  <Link href={`/products/${product.slug}`} className="font-semibold text-coal hover:text-champagne">
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-600">{currency(product.basePrice)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => moveWishlistToCart(product.id)}
                    className="rounded-full bg-champagne px-4 py-2 text-xs font-semibold text-coal"
                  >
                    Move to Cart
                  </button>
                  <button onClick={() => toggleWishlist(product.id)} className="text-xs text-gray-600 hover:text-coal">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
