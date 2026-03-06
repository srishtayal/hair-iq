"use client";

import CartItem from "@/components/cart/cart-item";
import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useState } from "react";

type RazorpayOrderResponse = {
  success: true;
  data: {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
    codEnabled: boolean;
  };
};

type VerifySignatureResponse = {
  success: true;
  data: {
    verified: boolean;
  };
};

type VerifyFirebaseResponse = {
  success: true;
  data: {
    token: string;
    user: { id: string; name: string; phone: string; email: string | null; role: string };
    needsProfile: boolean;
    isNewUser: boolean;
  };
};

type RazorpayHandlerPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  one_click_checkout?: boolean;
  show_coupons?: boolean;
  handler: (response: RazorpayHandlerPayload) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

type MagicLineItem = {
  sku: string;
  variant_id: string;
  price: number;
  offer_price: number;
  tax_amount: number;
  quantity: number;
  name: string;
  description: string;
  image_url: string;
  product_url?: string;
};

const loadRazorpayScript = async (useMagicCheckout: boolean) => {
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = useMagicCheckout
      ? "https://checkout.razorpay.com/v1/magic-checkout.js"
      : "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const { cartItems, cartSubtotal, isAuthenticated, goToAuth, user, clearCart, getCartProduct } = useStore();
  const subtotal = cartSubtotal;
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const codEnabled = process.env.NEXT_PUBLIC_RAZORPAY_ENABLE_COD === "true";

  const getServerToken = async () => {
    const existing = localStorage.getItem("hairiq_server_token");
    if (existing) {
      return existing;
    }

    if (!user) {
      throw new Error("Please login to continue checkout.");
    }

    const firebaseIdToken = await user.getIdToken(true);
    const authResponse = await apiRequest<VerifyFirebaseResponse>("/auth/verify-firebase", {
      method: "POST",
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });

    localStorage.setItem("hairiq_server_token", authResponse.data.token);
    return authResponse.data.token;
  };

  const buildMagicLineItems = (): MagicLineItem[] => {
    return cartItems.map((item) => {
      const product = getCartProduct(item);
      if (!product) {
        throw new Error("Some cart items are unavailable. Refresh and try again.");
      }

      const variant = product.variants.find((entry) => entry.id === item.variantId) ?? product.variants[0];
      const unitPrice = Math.round((variant?.price ?? product.basePrice) * 100);

      if (unitPrice <= 0) {
        throw new Error(`Invalid price for ${product.name}`);
      }

      const productUrl =
        typeof window !== "undefined" && product.slug ? `${window.location.origin}/products/${product.slug}` : undefined;

      return {
        sku: variant?.id || item.variantId,
        variant_id: item.variantId,
        price: unitPrice,
        offer_price: unitPrice,
        tax_amount: 0,
        quantity: item.quantity,
        name: product.name,
        description: product.shortDescription || product.description || product.name,
        image_url: product.images[0] || "https://images.unsplash.com/photo-1503951458645-643d53bfd90f",
        ...(productUrl ? { product_url: productUrl } : {}),
      };
    });
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckoutSuccess(null);

    if (!isAuthenticated) {
      goToAuth("/cart");
      return;
    }

    if (!cartItems.length) {
      alert("Your cart is empty.");
      return;
    }

    if (cartSubtotal <= 0) {
      alert("Unable to checkout because total amount is 0. Please update product pricing.");
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const sdkLoaded = await loadRazorpayScript(codEnabled);
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay SDK");
      }

      let serverToken = await getServerToken();
      const lineItems = codEnabled ? buildMagicLineItems() : undefined;

      let orderResponse: RazorpayOrderResponse;
      try {
        orderResponse = await apiRequest<RazorpayOrderResponse>(
          "/payments/create-order",
          {
            method: "POST",
            body: JSON.stringify({
              amountInRupees: cartSubtotal,
              lineItems,
            }),
          },
          serverToken
        );
      } catch (requestError) {
        // Retry once in case backend JWT has expired.
        localStorage.removeItem("hairiq_server_token");
        serverToken = await getServerToken();
        orderResponse = await apiRequest<RazorpayOrderResponse>(
          "/payments/create-order",
          {
            method: "POST",
            body: JSON.stringify({
              amountInRupees: cartSubtotal,
              lineItems,
            }),
          },
          serverToken
        );
      }

      const checkout = new window.Razorpay({
        key: orderResponse.data.razorpayKeyId,
        order_id: orderResponse.data.razorpayOrderId,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "Hair IQ",
        description: "Cart checkout",
        one_click_checkout: orderResponse.data.codEnabled,
        show_coupons: orderResponse.data.codEnabled,
        prefill: {
          name: user?.displayName || undefined,
          email: user?.email || undefined,
          contact: user?.phoneNumber || undefined,
        },
        theme: {
          color: "#d4b894",
        },
        handler: async (paymentResponse) => {
          await apiRequest<VerifySignatureResponse>("/orders/verify-signature", {
            method: "POST",
            body: JSON.stringify(paymentResponse),
          });

          clearCart();
          setCheckoutSuccess("Payment verified successfully.");
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      setCheckoutError(message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="Cart" title="Review your selection" description="Update quantities, verify prices, and continue to secure checkout." />

      {!cartItems.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Add premium hair systems or care essentials to begin checkout."
          ctaLabel="Explore products"
          ctaHref="/products"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItem key={item.itemId} item={item} />
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft lg:sticky lg:top-24">
            <h3 className="font-semibold text-coal">Price Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500 line-through">{currency(200)}</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-coal">
                <span>Total</span>
                <span className="font-semibold">{currency(cartSubtotal)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-5 w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessing ? "Processing..." : "Proceed to Checkout"}
            </button>
            {codEnabled ? <p className="mt-2 text-xs text-gray-600">COD is enabled in Razorpay Magic Checkout.</p> : null}
            {checkoutError ? <p className="mt-3 text-sm text-red-700">{checkoutError}</p> : null}
            {checkoutSuccess ? <p className="mt-3 text-sm text-green-700">{checkoutSuccess}</p> : null}
          </aside>
        </div>
      )}
    </div>
  );
}
