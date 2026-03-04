"use client";

import { categories } from "@/data/products";

type Props = {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSort: string;
  onSortChange: (value: string) => void;
};

export default function FilterSidebar({ selectedCategory, onCategoryChange, selectedSort, onSortChange }: Props) {
  return (
    <aside className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-champagne">Category</p>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedCategory === category ? "bg-champagne text-coal" : "bg-white/5 text-gray-600 hover:text-coal"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-champagne">Sort</p>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-coal"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </aside>
  );
}
