import { CartItemType, Product } from "@/types";

// The widget key is intentionally configured only in the deployment environment.
// Without it, native Shopify checkout remains the checkout fallback.
export const INDISELL_WIDGET_KEY = process.env.NEXT_PUBLIC_INDISELL_WIDGET_KEY || "";
export const INDISELL_ENABLED = INDISELL_WIDGET_KEY.length > 0;
export const INDISELL_WIDGET_SRC = INDISELL_ENABLED
  ? process.env.NEXT_PUBLIC_INDISELL_WIDGET_SRC || `https://cart.indisell.io/widget.js?mk=${INDISELL_WIDGET_KEY}`
  : "";

export type IndiSellCartItem = {
  id: number;
  variant_id: number;
  quantity: number;
  price: number;
  line_price: number;
  final_line_price: number;
  title: string;
  product_title: string;
  image?: string;
};

export type IndiSellCart = {
  currency: string;
  total_price: number;
  items_subtotal_price: number;
  item_count: number;
  items: IndiSellCartItem[];
};

declare global {
  interface Window {
    IndiSellConfig?: Record<string, unknown>;
    IndiSellCheckout?: { open: (cart: IndiSellCart) => void };
  }
}

const numericVariantId = (variantId: string): number | null => {
  const value = Number(String(variantId).split("/").pop());
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

const rupeesToPaise = (rupees: number) => Math.round((Number(rupees) || 0) * 100);

// IndiSell accepts the same cart shape as Shopify's cart.js endpoint, with
// monetary amounts in paise and numeric Shopify variant IDs.
export const buildIndiSellCart = (
  cartItems: CartItemType[],
  getProduct: (item: CartItemType) => Product | undefined
): IndiSellCart | null => {
  const items: IndiSellCartItem[] = [];

  for (const item of cartItems) {
    const product = getProduct(item);
    const variantId = numericVariantId(item.variantId);
    if (!product || variantId === null) return null;

    const variant = product.variants.find((candidate) => candidate.id === item.variantId);
    const unitPrice = product.basePrice > 0 ? product.basePrice : variant?.price ?? 0;
    const price = rupeesToPaise(unitPrice);
    const linePrice = price * item.quantity;

    items.push({
      id: variantId,
      variant_id: variantId,
      quantity: item.quantity,
      price,
      line_price: linePrice,
      final_line_price: linePrice,
      title: variant?.label && variant.label !== "Default" ? `${product.name} - ${variant.label}` : product.name,
      product_title: product.name,
      image: product.images[0],
    });
  }

  if (!items.length) return null;

  const total = items.reduce((sum, item) => sum + item.line_price, 0);
  return {
    currency: "INR",
    total_price: total,
    items_subtotal_price: total,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
  };
};

export const openIndiSellCheckout = (cart: IndiSellCart) => {
  if (typeof window === "undefined" || typeof window.IndiSellCheckout?.open !== "function") return false;
  window.IndiSellCheckout.open(cart);
  return true;
};
