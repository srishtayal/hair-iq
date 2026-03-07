"use client";

import RatingStars from "@/components/common/rating-stars";
import { useStore } from "@/context/store-context";
import { currency } from "@/lib/utils";
import { Product } from "@/types";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProductCardProps = {
  product: Product;
  mode?: "default" | "listing";
};

export default function ProductCard({ product, mode = "default" }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted, getCartQuantity } = useStore();
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const defaultVariantId = product.variants[0]?.id;
  const currentPrice = product.basePrice > 0 ? product.basePrice : product.variants[0]?.price ?? 0;
  const defaultVariantQty = defaultVariantId ? getCartQuantity(product.id, defaultVariantId) : 0;

  const handleVariantSelect = (variantId: string) => {
    if (!variantId) return;
    addToCart(product.id, variantId);
    setShowVariantPicker(false);
  };

  if (mode === "listing") {
    return (
      <motion.article whileHover={{ y: -3 }} className="group overflow-hidden rounded-2xl border border-black/10 bg-white p-2.5 sm:p-3">
        <Link href={`/products/${product.slug}`} className="relative block aspect-[9/10] overflow-hidden rounded-xl bg-[#f3f3f3]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {product.featured ? (
            <span className="absolute left-0 top-0 rounded-br-lg bg-coal px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:text-xs">
              Best Seller
            </span>
          ) : null}
        </Link>

        <div className="space-y-2.5 px-1 pt-3">
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 block text-base font-semibold leading-snug text-coal sm:text-lg"
          >
            {product.name}
          </Link>

          <div className="flex items-center gap-2">
            <RatingStars rating={product.rating} />
            <span className="text-xs text-gray-600 sm:text-sm">({product.reviewCount})</span>
          </div>

          <div>
            {/* <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Price</p> */}
            <p className="text-xl font-semibold leading-none text-coal sm:text-xl">{currency(currentPrice)}</p>
          </div>

          {!showVariantPicker ? (
            <button
              onClick={() => setShowVariantPicker(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              <ShoppingBag className="h-4 w-4" />
              Quick Add
            </button>
          ) : (
            <div className="space-y-2">
              <select
                defaultValue=""
                onChange={(event) => handleVariantSelect(event.target.value)}
                className="w-full rounded-full border border-black/20 bg-white px-4 py-2.5 text-sm text-coal outline-none"
              >
                <option value="" disabled>
                  Select a variant
                </option>
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                    {variant.label}
                    {variant.stock <= 0 ? " (Out of stock)" : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowVariantPicker(false)}
                className="w-full text-xs font-medium text-gray-600 underline underline-offset-4"
              >
                Cancel
              </button>
            </div>
          )}

          {defaultVariantId && defaultVariantQty > 0 ? (
            <p className="text-center text-xs font-medium text-emerald-700">
              In cart: {defaultVariantQty}
            </p>
          ) : null}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article whileHover={{ y: -6 }} className="group overflow-hidden rounded-2xl border border-graphite/10 bg-white/5">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[9/10]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-champagne text-champagne" : "text-white"}`} />
        </button>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-champagne">{product.category}</p>
            <Link href={`/products/${product.slug}`} className="mt-1 block font-semibold text-coal hover:text-champagne">
              {product.name}
            </Link>
          </div>
          <p className="font-semibold text-coal">{currency(product.basePrice)}</p>
        </div>

        <RatingStars rating={product.rating} />

        {!showVariantPicker ? (
          <button
            onClick={() => setShowVariantPicker(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-coal transition hover:bg-champagne"
          >
            <ShoppingBag className="h-4 w-4" />
            Quick Add
          </button>
        ) : (
          <div className="space-y-2">
            <select
              defaultValue=""
              onChange={(event) => handleVariantSelect(event.target.value)}
              className="w-full rounded-full border border-black/20 bg-white px-4 py-2 text-sm text-coal outline-none"
            >
              <option value="" disabled>
                Select a variant
              </option>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                  {variant.label}
                  {variant.stock <= 0 ? " (Out of stock)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowVariantPicker(false)}
              className="w-full text-xs font-medium text-gray-600 underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
