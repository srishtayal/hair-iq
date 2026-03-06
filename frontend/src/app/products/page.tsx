"use client";

import { Skeleton } from "@/components/common/skeleton";
import SectionHeader from "@/components/common/section-header";
import OpenDeliveryPolicy from "@/components/product/open-delivery-policy";
import ProductCard from "@/components/product/product-card";
import { useStore } from "@/context/store-context";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AvailabilityOption = "in-stock" | "out-of-stock";
type PriceOption = "under-80" | "80-130" | "above-130";

export default function ProductsPage() {
  const { products, productsLoading, productsError } = useStore();
  const [selectedSort, setSelectedSort] = useState("featured");
  const [activeFilter, setActiveFilter] = useState<"availability" | "price" | null>(null);

  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityOption[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<PriceOption[]>([]);

  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isInStock = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    return product?.variants.some((variant) => variant.stock > 0) ?? false;
  };

  const outOfStockCount = useMemo(() => products.filter((product) => !isInStock(product.id)).length, [products]);
  const inStockTotal = useMemo(() => products.filter((product) => isInStock(product.id)).length, [products]);

  const toggleAvailability = (value: AvailabilityOption) => {
    setSelectedAvailability((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const togglePrice = (value: PriceOption) => {
    setSelectedPrice((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const filteredProducts = useMemo(() => {
    const availabilityFiltered = products.filter((product) => {
      if (!selectedAvailability.length) return true;
      const stockStatus: AvailabilityOption = isInStock(product.id) ? "in-stock" : "out-of-stock";
      return selectedAvailability.includes(stockStatus);
    });

    const priceFiltered = availabilityFiltered.filter((product) => {
      if (!selectedPrice.length) return true;

      return selectedPrice.some((priceRange) => {
        if (priceRange === "under-80") return product.basePrice < 80;
        if (priceRange === "80-130") return product.basePrice >= 80 && product.basePrice <= 130;
        return product.basePrice > 130;
      });
    });

    return [...priceFiltered].sort((a, b) => {
      if (selectedSort === "price-asc") return a.basePrice - b.basePrice;
      if (selectedSort === "price-desc") return b.basePrice - a.basePrice;
      if (selectedSort === "best-selling") return b.reviewCount - a.reviewCount;
      if (selectedSort === "rating") return b.rating - a.rating;
      return Number(b.featured ?? false) - Number(a.featured ?? false);
    });
  }, [products, selectedSort, selectedAvailability, selectedPrice]);

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Shop Hair Systems"
        title="Premium collection for every lifestyle"
        // description="Browse breathable lace, HD skin bases, and maintenance essentials built for long-lasting confidence."
      />

      <div className="space-y-5">
        <div ref={filterRef} className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-12 text-sm text-coal">
              <div className="flex items-center gap-6">
                <span className="text-base">Filter:</span>
                <button
                  onClick={() => setActiveFilter((prev) => (prev === "availability" ? null : "availability"))}
                  className="inline-flex items-center gap-1 border-b border-coal pb-0.5 font-medium"
                >
                  Availability
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveFilter((prev) => (prev === "price" ? null : "price"))}
                  className="inline-flex items-center gap-1 font-medium"
                >
                  Price
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-coal">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sort by:</span>
                <div className="relative">
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="appearance-none bg-transparent pr-6 font-medium outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="best-selling">Best selling</option>
                    <option value="price-asc">Price, low to high</option>
                    <option value="price-desc">Price, high to low</option>
                    <option value="rating">Top rated</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <span className="text-base">{filteredProducts.length} products</span>
            </div>
          </div>

          {activeFilter === "availability" ? (
            <div className="absolute left-4 top-[56px] z-20 w-full max-w-[360px] rounded-3xl border border-black/15 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 px-4 py-3">
                <p className="text-lg text-coal">{selectedAvailability.length} selected</p>
                <button onClick={() => setSelectedAvailability([])} className="text-sm text-coal underline underline-offset-4">
                  Reset
                </button>
              </div>
              <div className="space-y-4 px-4 py-4">
                <label className="flex cursor-pointer items-center gap-3 text-base text-coal">
                  <input
                    type="checkbox"
                    checked={selectedAvailability.includes("in-stock")}
                    onChange={() => toggleAvailability("in-stock")}
                    className="h-4 w-4 rounded border-black/30"
                  />
                  In stock ({inStockTotal})
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-base text-coal">
                  <input
                    type="checkbox"
                    checked={selectedAvailability.includes("out-of-stock")}
                    onChange={() => toggleAvailability("out-of-stock")}
                    className="h-4 w-4 rounded border-black/30"
                  />
                  Out of stock ({outOfStockCount})
                </label>
              </div>
            </div>
          ) : null}

          {activeFilter === "price" ? (
            <div className="absolute left-4 top-[56px] z-20 w-full max-w-[360px] rounded-3xl border border-black/15 bg-white shadow-xl md:left-[140px]">
              <div className="flex items-center justify-between border-b border-black/15 px-4 py-3">
                <p className="text-lg text-coal">{selectedPrice.length} selected</p>
                <button onClick={() => setSelectedPrice([])} className="text-sm text-coal underline underline-offset-4">
                  Reset
                </button>
              </div>
              <div className="space-y-4 px-4 py-4">
                <label className="flex cursor-pointer items-center gap-3 text-base text-coal">
                  <input
                    type="checkbox"
                    checked={selectedPrice.includes("under-80")}
                    onChange={() => togglePrice("under-80")}
                    className="h-4 w-4 rounded border-black/30"
                  />
                  Under $80
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-base text-coal">
                  <input
                    type="checkbox"
                    checked={selectedPrice.includes("80-130")}
                    onChange={() => togglePrice("80-130")}
                    className="h-4 w-4 rounded border-black/30"
                  />
                  $80 - $130
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-base text-coal">
                  <input
                    type="checkbox"
                    checked={selectedPrice.includes("above-130")}
                    onChange={() => togglePrice("above-130")}
                    className="h-4 w-4 rounded border-black/30"
                  />
                  Above $130
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
          {productsLoading
            ? Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-[360px]" />)
            : filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!productsLoading && productsError ? <p className="text-sm text-red-600">{productsError}</p> : null}
      </div>

      <OpenDeliveryPolicy />
    </div>
  );
}
