"use client";

import { Skeleton } from "@/components/common/skeleton";
import SectionHeader from "@/components/common/section-header";
import ProductCard from "@/components/product/product-card";
import { useStore } from "@/context/store-context";

export default function FeaturedProducts() {
  const { products, productsLoading } = useStore();
  const featured = products.filter((product) => product.featured);
  const displayItems = featured.length ? featured : products.slice(0, 3);

  return (
    <section className="space-y-8">
      <SectionHeader eyebrow="Featured" title="Luxury picks from our best-selling range" />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
        {productsLoading
          ? Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-[360px]" />)
          : displayItems.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
