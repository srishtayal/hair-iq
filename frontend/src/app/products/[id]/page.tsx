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

type DeliveryLookup = Record<string, string>;

const PINCODE_REGEX = /^\d{6}$/;
const FAST_DELIVERY_STATES = new Set(["DELHI", "HARYANA", "UP", "UTTAR PRADESH"]);

const sanitizeCell = (value: string) => value.replace(/^"|"$/g, "").trim();

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const parseDeliveryLookup = (rawCsv: string): DeliveryLookup => {
  const lookup: DeliveryLookup = {};
  const lines = rawCsv.split(/\r?\n/);

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = lines[lineIndex]?.trim();
    if (!row) continue;

    const columns = splitCsvLine(row);
    if (columns.length < 5) continue;

    const pincode = sanitizeCell(columns[0]);
    const state = sanitizeCell(columns[2]).toUpperCase();
    const cod = sanitizeCell(columns[3]).toUpperCase();
    const prepaid = sanitizeCell(columns[4]).toUpperCase();

    if (!PINCODE_REGEX.test(pincode)) continue;
    if (cod !== "Y" && prepaid !== "Y") continue;

    if (!lookup[pincode]) {
      lookup[pincode] = state;
    }
  }

  return lookup;
};

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
  const [pincode, setPincode] = useState("");
  const [deliveryLookup, setDeliveryLookup] = useState<DeliveryLookup>({});
  const [deliveryLookupLoading, setDeliveryLookupLoading] = useState(true);
  const [deliveryLookupError, setDeliveryLookupError] = useState("");

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

  useEffect(() => {
    let active = true;

    const loadDeliveryLookup = async () => {
      try {
        setDeliveryLookupLoading(true);
        setDeliveryLookupError("");

        const response = await fetch("/B2C_Pincodes_List.csv");
        if (!response.ok) {
          throw new Error("Unable to load pincode data.");
        }

        const csvText = await response.text();
        const lookup = parseDeliveryLookup(csvText);

        if (!active) return;
        setDeliveryLookup(lookup);
      } catch (error) {
        if (!active) return;
        setDeliveryLookupError(error instanceof Error ? error.message : "Unable to load pincode data.");
      } finally {
        if (active) {
          setDeliveryLookupLoading(false);
        }
      }
    };

    void loadDeliveryLookup();

    return () => {
      active = false;
    };
  }, []);

  const normalizedPincode = useMemo(() => pincode.replace(/\D/g, "").slice(0, 6), [pincode]);

  const deliveryEstimateMessage = useMemo(() => {
    if (!normalizedPincode) {
      return "Enter your 6-digit pincode to check delivery date.";
    }

    if (!PINCODE_REGEX.test(normalizedPincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    if (deliveryLookupLoading) {
      return "Checking pincode coverage...";
    }

    if (deliveryLookupError) {
      return deliveryLookupError;
    }

    const state = deliveryLookup[normalizedPincode];
    if (!state) {
      return `Currently not deliverable to ${normalizedPincode}.`;
    }

    const deliveryDays = FAST_DELIVERY_STATES.has(state) ? 4 : 6;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

    const formattedDate = estimatedDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `Estimated delivery by ${formattedDate} (${deliveryDays} days).`;
  }, [deliveryLookup, deliveryLookupError, deliveryLookupLoading, normalizedPincode]);

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
            <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-white via-orange-50/70 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Delivery Estimate</p>
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={normalizedPincode}
                  onChange={(event) => setPincode(event.target.value)}
                  placeholder="Enter pincode"
                  className="w-full rounded-full border border-black/20 bg-white px-4 py-2.5 text-sm text-coal outline-none transition sm:max-w-[220px] focus:border-coal"
                />
                <p className="text-sm font-medium text-coal">{deliveryEstimateMessage}</p>
              </div>
            </section>
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
