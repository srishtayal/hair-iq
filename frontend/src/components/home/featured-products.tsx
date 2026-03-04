import SectionHeader from "@/components/common/section-header";
import ProductCard from "@/components/product/product-card";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  const featured = products.filter((product) => product.featured);

  return (
    <section className="space-y-8">
      <SectionHeader eyebrow="Featured" title="Luxury picks from our best-selling range" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
