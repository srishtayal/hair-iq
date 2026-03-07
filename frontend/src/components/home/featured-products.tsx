"use client";

import { Skeleton } from "@/components/common/skeleton";
import SectionHeader from "@/components/common/section-header";
import ProductCard from "@/components/product/product-card";
import { useStore } from "@/context/store-context";
import Link from "next/link";

export default function FeaturedProducts() {
  const { products, productsLoading } = useStore();
  const featured = products.filter((product) => product.featured);
  const sourceItems = featured.length ? featured : products;
  const displayItems = sourceItems.slice(0, 4);

  return (
    <section className="space-y-8">
      <SectionHeader eyebrow="Featured" title="Luxury picks from our best-selling range" />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
        {productsLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className={`h-[360px] ${idx === 3 ? "sm:hidden" : ""}`} />
            ))
          : displayItems.map((product, idx) => (
              <div key={product.id} className={idx === 3 ? "sm:hidden" : ""}>
                <ProductCard product={product} mode="listing" />
              </div>
            ))}
      </div>
      <div className="flex justify-center">
        <Link
          href="/products"
          className="rounded-full border border-black/20 bg-white px-6 py-2.5 text-sm font-semibold text-coal transition hover:bg-champagne"
        >
          View All
        </Link>
      </div>
    </section>
  );
}
