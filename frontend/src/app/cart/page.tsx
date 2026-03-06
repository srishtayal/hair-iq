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
  };
};

type VerifySignatureResponse = {
  success: true;
  data: {
    verified: boolean;
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

const loadRazorpayScript = async () => {
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const { cartItems, cartSubtotal, isAuthenticated, goToAuth, user, clearCart } = useStore();
  const subtotal = cartSubtotal;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      goToAuth("/cart");
      return;
    }

    if (!cartItems.length || cartSubtotal <= 0 || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay SDK");
      }

      const serverToken = localStorage.getItem("hairiq_server_token");
      if (!serverToken) {
        throw new Error("Missing login token. Please login again.");
      }

      const orderResponse = await apiRequest<RazorpayOrderResponse>(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify({
            amountInRupees: cartSubtotal,
          }),
        },
        serverToken
      );

      const checkout = new window.Razorpay({
        key: orderResponse.data.razorpayKeyId,
        order_id: orderResponse.data.razorpayOrderId,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "Hair IQ",
        description: "Cart checkout",
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
          alert("Payment verified successfully.");
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
      alert(message);
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
          </aside>
        </div>
      )}
    </div>
  );
}
