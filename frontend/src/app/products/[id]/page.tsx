"use client";

import EmptyState from "@/components/common/empty-state";
import RatingStars from "@/components/common/rating-stars";
import SectionHeader from "@/components/common/section-header";
import ProductCard from "@/components/product/product-card";
import ReviewCard from "@/components/review/review-card";
import VideoModal from "@/components/video/video-modal";
import { useStore } from "@/context/store-context";
import { reviews } from "@/data/reviews";
import { fetchProductBySlug } from "@/lib/product-api";
import { currency } from "@/lib/utils";
import { Product } from "@/types";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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

const toLongDescriptionBullets = (value: string) => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const rawLines = normalized.includes("\n") ? normalized.split("\n") : normalized.split("•");

  return rawLines
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•]\s*/, "").replace(/^\d+[\).\s-]+/, "").trim())
    .filter(Boolean);
};

const renderBoldText = (value: string) => {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const isBoldToken = part.startsWith("**") && part.endsWith("**") && part.length > 4;
    if (isBoldToken) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
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
  const { products, productsLoading, addToCart, toggleWishlist, isWishlisted, getCartQuantity, setCartQuantity } = useStore();

  const fallbackProduct = useMemo(() => products.find((item) => item.slug === slug), [products, slug]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryLookup, setDeliveryLookup] = useState<DeliveryLookup>({});
  const [deliveryLookupLoading, setDeliveryLookupLoading] = useState(true);
  const [deliveryLookupError, setDeliveryLookupError] = useState("");
  const [isOpenPolicyVideoOpen, setIsOpenPolicyVideoOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement | null>(null);

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
  const similarProducts = useMemo(() => {
    if (!resolvedProduct) return [];

    const sameCategory = products.filter((item) => item.id !== resolvedProduct.id && item.category === resolvedProduct.category);
    const otherProducts = products.filter((item) => item.id !== resolvedProduct.id && item.category !== resolvedProduct.category);

    return [...sameCategory, ...otherProducts].slice(0, 3);
  }, [products, resolvedProduct]);

  useEffect(() => {
    setSelectedMediaIndex(0);
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

    const deliveryDays = FAST_DELIVERY_STATES.has(state) ? 3 : 5;
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

  const longDescriptionBullets = useMemo(
    () => toLongDescriptionBullets(resolvedProduct?.description || ""),
    [resolvedProduct?.description]
  );

  const productMedia = useMemo(() => {
    if (!resolvedProduct) return [];

    const imageMedia = resolvedProduct.images.map((url, index) => ({
      id: `img-${index}`,
      type: "image" as const,
      url,
    }));

    const videoMedia = (resolvedProduct.videos || []).map((url, index) => ({
      id: `video-${index}`,
      type: "video" as const,
      url,
    }));

    return [...imageMedia, ...videoMedia];
  }, [resolvedProduct]);

  useEffect(() => {
    const thumbs = thumbnailsRef.current;
    if (!thumbs) return;

    const activeThumb = thumbs.querySelector<HTMLButtonElement>(`button[data-thumb-index='${selectedMediaIndex}']`);
    activeThumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedMediaIndex]);

  const scrollToIndex = (idx: number) => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const clamped = Math.max(0, Math.min(idx, gallery.children.length - 1));
    const next = gallery.children.item(clamped) as HTMLElement | null;
    if (!next) return;

    setSelectedMediaIndex(clamped);
    gallery.scrollTo({ left: next.offsetLeft, behavior: "smooth" });
  };

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

  const selectedVariantId = selectedVariant || resolvedProduct.variants[0]?.id;
  const selectedVariantQty = selectedVariantId ? getCartQuantity(resolvedProduct.id, selectedVariantId) : 0;

  return (
    <div className="pt-12 space-y-8">
      <div className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="min-w-0 mx-auto w-full max-w-none space-y-4 sm:max-w-[640px]">
            <div className="relative">
              <div
                ref={galleryRef}
                onScroll={(event) => {
                  const container = event.currentTarget;
                  const scrollCenter = container.scrollLeft + container.clientWidth / 2;
                  let nearestIndex = 0;
                  let nearestDistance = Number.POSITIVE_INFINITY;

                  Array.from(container.children).forEach((child, index) => {
                    const element = child as HTMLElement;
                    const childCenter = element.offsetLeft + element.clientWidth / 2;
                    const distance = Math.abs(childCenter - scrollCenter);
                    if (distance < nearestDistance) {
                      nearestDistance = distance;
                      nearestIndex = index;
                    }
                  });

                  if (nearestIndex !== selectedMediaIndex) {
                    setSelectedMediaIndex(nearestIndex);
                  }
                }}
                className="flex aspect-[9/10] snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl border border-white/10 bg-white/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {productMedia.map((media, idx) => (
                  <div key={media.id} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
                    {media.type === "video" ? (
                      <video
                        key={media.url}
                        src={media.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={media.url || resolvedProduct.images[0]}
                        alt={`${resolvedProduct.name} ${idx + 1}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition duration-300 hover:scale-[1.04]"
                      />
                    )}
                  </div>
                ))}
              </div>
              {productMedia.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => scrollToIndex(selectedMediaIndex === 0 ? productMedia.length - 1 : selectedMediaIndex - 1)}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2 text-white backdrop-blur"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToIndex((selectedMediaIndex + 1) % productMedia.length)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2 text-white backdrop-blur"
                    aria-label="Next media"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>
            <div ref={thumbnailsRef} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {productMedia.map((media, idx) => (
                <button
                  key={media.id}
                  data-thumb-index={idx}
                  onClick={() => scrollToIndex(idx)}
                  className={`relative aspect-[9/10] w-20 shrink-0 overflow-hidden rounded-xl border sm:w-[88px] ${
                    selectedMediaIndex === idx ? "border-champagne" : "border-white/10"
                  }`}
                  aria-label={`View media ${idx + 1}`}
                >
                  {media.type === "video" ? (
                    <>
                      <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      <span className="absolute bottom-2 right-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-white">
                        VIDEO
                      </span>
                    </>
                  ) : (
                    <Image src={media.url} alt={`${resolvedProduct.name} ${idx + 1}`} fill sizes="96px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-champagne">{resolvedProduct.category}</p>
            <h1 className="font-display text-4xl text-coal">{resolvedProduct.name}</h1>
            <div className="flex items-center gap-2">
              <RatingStars rating={resolvedProduct.rating} />
              <span className="text-xs text-gray-600">({resolvedProduct.reviewCount})</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Product Info</p>
              <p className="text-sm text-gray-600 md:text-base">{resolvedProduct.shortDescription}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-coal">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {resolvedProduct.variants.map((variantItem) => (
                  <button
                    key={variantItem.id}
                    onClick={() => setSelectedVariant(variantItem.id)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selectedVariant === variantItem.id
                        ? "border-champagne bg-champagne/10 text-coal"
                        : "border-white/10 bg-white/5 text-gray-600"
                    }`}
                  >
                    {variantItem.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-2xl font-semibold text-coal">{currency(resolvedProduct.basePrice)}</p>
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
            <button
              type="button"
              onClick={() => setIsOpenPolicyVideoOpen(true)}
              className="w-full rounded-2xl border border-emerald-500/35 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100/70"
              aria-label="Play open delivery policy video"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Open Delivery: CLICK ME!</p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">Inspect the product at delivery before accepting it.</p>
            </button>
            {/* <Link
              href="#open-delivery-tab"
              className="inline-flex rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-coal transition hover:bg-gray-50"
            >
              Open Delivery Tab - Click Me
            </Link> */}
            <div className="flex flex-wrap gap-3">
              {selectedVariantId && selectedVariantQty > 0 ? (
                <div className="flex items-center gap-2 rounded-full border border-black/20 bg-white px-2 py-1">
                  <button
                    onClick={() => setCartQuantity(resolvedProduct.id, selectedVariantId, selectedVariantQty - 1)}
                    className="rounded-full p-1 text-coal transition hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-coal">{selectedVariantQty}</span>
                  <button
                    onClick={() => setCartQuantity(resolvedProduct.id, selectedVariantId, selectedVariantQty + 1)}
                    className="rounded-full p-1 text-coal transition hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(resolvedProduct.id, selectedVariantId)}
                  className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-coal hover:bg-[#e3c39d]"
                >
                  Add to Cart
                </button>
              )}
              <button
                onClick={() => toggleWishlist(resolvedProduct.id)}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-coal hover:bg-white/10"
              >
                {isWishlisted(resolvedProduct.id) ? "Remove from Wishlist" : "Save to Wishlist"}
              </button>
            </div>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Description</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 md:text-base">
            {longDescriptionBullets.map((point, index) => (
              <li key={`${point}-${index}`}>{renderBoldText(point)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow="Reviews" title="Customer feedback" />
          <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {reviews.slice(0, 12).map((review) => (
              <div key={review.id} className="w-[300px] min-w-[300px] sm:w-[340px] sm:min-w-[340px]">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
          <Link href="/reviews" className="inline-flex rounded-full border border-black/20 bg-white px-6 py-2.5 text-sm font-semibold text-coal transition hover:bg-gray-50">
            View All Reviews
          </Link>
        </section>

        <section className="space-y-6">
          <SectionHeader eyebrow="More To Explore" title="Similar products" />
          <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
            {similarProducts.map((similarProduct) => (
              <ProductCard key={similarProduct.id} product={similarProduct} mode="listing" />
            ))}
          </div>
        </section>

        <section id="open-delivery-tab" className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <SectionHeader eyebrow="Policy" title="Open Delivery Policy" />

          <div className="space-y-3 text-sm text-gray-700 md:text-base">
            <p>
              At our marketplace, every order comes with <span className="font-semibold text-coal">Open Delivery</span>.
            </p>
            <p>
              This means you can open the package at the time of delivery and check the product in front of the delivery executive
              before accepting it.
            </p>
            <p>
              Because you get the opportunity to inspect the product before taking it, we do not offer returns after the delivery has
              been accepted.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700 md:text-base">
            <h3 className="text-base font-semibold text-coal md:text-lg">How Open Delivery Works</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>You may open the package at the time of delivery.</li>
              <li>You can verify the product, quantity, visible condition, and size.</li>
              <li>If there is any issue (damage, wrong item, missing quantity, size mismatch), you must refuse the delivery on the spot.</li>
              <li>Once the order is accepted after inspection, it is considered final and non-returnable.</li>
            </ul>
            <p>We strongly encourage customers to thoroughly check the product during delivery to avoid any inconvenience later.</p>
          </div>

          <div className="space-y-3 text-sm text-gray-700 md:text-base">
            <h3 className="text-base font-semibold text-coal md:text-lg">Exchange Policy</h3>
            <p>We do not offer exchanges once the order has been accepted under Open Delivery.</p>
            <p>
              Since you are given the opportunity to inspect the product before accepting it, all sales are considered final after
              successful delivery acceptance.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700 md:text-base">
            <h3 className="text-base font-semibold text-coal md:text-lg">Important Note</h3>
            <p>Our Open Delivery policy is designed to give you complete transparency and confidence before accepting your order.</p>
            <p>
              Please ensure you check your items carefully at the time of delivery, as post-acceptance returns or exchanges will not be
              entertained.
            </p>
          </div>
        </section>

        <VideoModal
          open={isOpenPolicyVideoOpen}
          onClose={() => setIsOpenPolicyVideoOpen(false)}
          embedUrl="/videos/open-delivery.mp4"
          title="Open Delivery Policy"
        />
      </div>
    </div>
  );
}
