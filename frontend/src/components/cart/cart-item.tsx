"use client";

import { useStore } from "@/context/store-context";
import { currency } from "@/lib/utils";
import { CartItemType } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

export default function CartItem({ item }: { item: CartItemType }) {
  const { getCartProduct, updateCartQty, removeFromCart } = useStore();
  const product = getCartProduct(item);

  if (!product) return null;

  const variant = product.variants.find((variantItem) => variantItem.id === item.variantId) ?? product.variants[0];
  const unitPrice = product.basePrice > 0 ? product.basePrice : variant?.price ?? 0;
  const linePrice = unitPrice * item.quantity;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row">
      <div className="relative aspect-[9/10] w-full max-w-[180px] overflow-hidden rounded-xl sm:w-28">
        <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 100vw, 112px" className="object-cover" />
      </div>
      <div className="flex flex-1 items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-coal">{product.name}</p>
          <p className="text-sm text-gray-600">{variant?.label}</p>
          <p className="mt-2 text-sm font-semibold text-champagne">{currency(linePrice)}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 rounded-full border border-black/20 bg-white px-2 py-1">
            <button onClick={() => updateCartQty(item.itemId, Math.max(item.quantity - 1, 1))} className="p-1 text-coal" aria-label="Decrease quantity">
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm text-coal">{item.quantity}</span>
            <button onClick={() => updateCartQty(item.itemId, item.quantity + 1)} className="p-1 text-coal" aria-label="Increase quantity">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button onClick={() => removeFromCart(item.itemId)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-coal">
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
