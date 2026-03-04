"use client";

import EmptyState from "@/components/common/empty-state";
import RatingStars from "@/components/common/rating-stars";
import SectionHeader from "@/components/common/section-header";
import OpenDeliveryPolicy from "@/components/product/open-delivery-policy";
import ReviewCard from "@/components/review/review-card";
import { useStore } from "@/context/store-context";
import { products } from "@/data/products";
import { reviews } from "@/data/reviews";
import { currency } from "@/lib/utils";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.id as string;
  const product = useMemo(() => products.find((item) => item.slug === slug), [slug]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0]?.id ?? "");
  const { addToCart, toggleWishlist, isWishlisted } = useStore();

  useEffect(() => {
    setSelectedImage(0);
    setSelectedVariant(product?.variants[0]?.id ?? "");
  }, [product]);

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="The selected product may have been moved or removed from the catalog."
        ctaLabel="Back to products"
        ctaHref="/products"
      />
    );
  }

  const variant = product.variants.find((variantItem) => variantItem.id === selectedVariant) ?? product.variants[0];

  return (
    <div className="pt-12 space-y-8">
      <div className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, idx) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square overflow-hidden rounded-xl border ${
                    selectedImage === idx ? "border-champagne" : "border-white/10"
                  }`}
                >
                  <Image src={image} alt={`${product.name} ${idx + 1}`} fill sizes="25vw" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-champagne">{product.category}</p>
            <h1 className="font-display text-4xl text-coal">{product.name}</h1>
            <RatingStars rating={product.rating} />
            <p className="text-sm text-gray-600 md:text-base">{product.description}</p>

            <div>
              <p className="mb-2 text-sm font-semibold text-coal">Select Variant</p>
              <div className="space-y-2">
                {product.variants.map((variantItem) => (
                  <button
                    key={variantItem.id}
                    onClick={() => setSelectedVariant(variantItem.id)}
                    className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                      selectedVariant === variantItem.id
                        ? "border-champagne bg-champagne/10 text-coal"
                        : "border-white/10 bg-white/5 text-gray-600"
                    }`}
                  >
                    {variantItem.label} - {currency(variantItem.price)}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-2xl font-semibold text-coal">{currency(variant?.price ?? product.basePrice)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addToCart(product.id, variant?.id)}
                className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-coal hover:bg-[#e3c39d]"
              >
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-coal hover:bg-white/10"
              >
                {isWishlisted(product.id) ? "Remove from Wishlist" : "Save to Wishlist"}
              </button>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <SectionHeader eyebrow="Reviews" title="Customer feedback" />
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        <OpenDeliveryPolicy />
      </div>
    </div>
  );
}
