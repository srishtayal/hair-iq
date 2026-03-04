"use client";

import EmptyState from "@/components/common/empty-state";
import RatingStars from "@/components/common/rating-stars";
import SectionHeader from "@/components/common/section-header";
import OpenDeliveryPolicy from "@/components/product/open-delivery-policy";
import ReviewCard from "@/components/review/review-card";
import { useStore } from "@/context/store-context";
import { reviews } from "@/data/reviews";
import { fetchProductBySlug } from "@/lib/product-api";
import { currency } from "@/lib/utils";
import { Product } from "@/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.id as string;
  const { products, productsLoading, addToCart, toggleWishlist, isWishlisted } = useStore();

  const fallbackProduct = useMemo(() => products.find((item) => item.slug === slug), [products, slug]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      if (!slug) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const item = await fetchProductBySlug(slug);
        if (!active) return;
        setProduct(item);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Unable to load product";
        setErrorMessage(message);
        setProduct(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [slug]);

  const resolvedProduct = product ?? fallbackProduct;

  useEffect(() => {
    setSelectedImage(0);
    setSelectedVariant(resolvedProduct?.variants[0]?.id ?? "");
  }, [resolvedProduct?.id]);

  if (!resolvedProduct && (loading || productsLoading)) {
    return null;
  }

  if (!resolvedProduct) {
    return (
      <EmptyState
        title="Product not found"
        description={errorMessage ?? "The selected product may have been moved or removed from the catalog."}
        ctaLabel="Back to products"
        ctaHref="/products"
      />
    );
  }

  const variant = resolvedProduct.variants.find((variantItem) => variantItem.id === selectedVariant) ?? resolvedProduct.variants[0];

  return (
    <div className="pt-12 space-y-8">
      <div className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src={resolvedProduct.images[selectedImage]}
                alt={resolvedProduct.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {resolvedProduct.images.map((image, idx) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square overflow-hidden rounded-xl border ${
                    selectedImage === idx ? "border-champagne" : "border-white/10"
                  }`}
                >
                  <Image src={image} alt={`${resolvedProduct.name} ${idx + 1}`} fill sizes="25vw" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-champagne">{resolvedProduct.category}</p>
            <h1 className="font-display text-4xl text-coal">{resolvedProduct.name}</h1>
            <RatingStars rating={resolvedProduct.rating} />
            <p className="text-sm text-gray-600 md:text-base">{resolvedProduct.description}</p>

            <div>
              <p className="mb-2 text-sm font-semibold text-coal">Select Variant</p>
              <div className="space-y-2">
                {resolvedProduct.variants.map((variantItem) => (
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

            <p className="text-2xl font-semibold text-coal">{currency(variant?.price ?? resolvedProduct.basePrice)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addToCart(resolvedProduct.id, variant?.id)}
                className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-coal hover:bg-[#e3c39d]"
              >
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(resolvedProduct.id)}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-coal hover:bg-white/10"
              >
                {isWishlisted(resolvedProduct.id) ? "Remove from Wishlist" : "Save to Wishlist"}
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
