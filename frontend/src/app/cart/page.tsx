"use client";

import CartItem from "@/components/cart/cart-item";
import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

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

type VerifyFirebaseResponse = {
  success: true;
  data: {
    token: string;
    user: { id: string; name: string; phone: string; email: string | null; role: string };
    needsProfile: boolean;
    isNewUser: boolean;
  };
};

type CodOrderResponse = {
  success: true;
  data: {
    orderId: string;
    totalAmount: number;
    paymentMethod: "cod";
    paymentStatus: "COD_PENDING";
    orderStatus: "COD_PENDING";
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

type PaymentMethod = "online" | "cod";

type CodCustomerDetails = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

type OrderPlacedPopup = {
  title: string;
  message: string;
  orderId?: string;
  amount?: number;
};

const PINCODE_REGEX = /^\d{6}$/;

const sanitizeCsvCell = (value: string) => value.replace(/^"|"$/g, "").trim();

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

const parseCodPincodes = (rawCsv: string) => {
  const codPincodes = new Set<string>();
  const lines = rawCsv.split(/\r?\n/);

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = lines[lineIndex]?.trim();
    if (!row) continue;

    const columns = splitCsvLine(row);
    if (columns.length < 4) continue;

    const pincode = sanitizeCsvCell(columns[0]);
    const codFlag = sanitizeCsvCell(columns[3]).toUpperCase();

    if (!PINCODE_REGEX.test(pincode)) continue;
    if (codFlag !== "Y") continue;

    codPincodes.add(pincode);
  }

  return codPincodes;
};

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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [orderPlacedPopup, setOrderPlacedPopup] = useState<OrderPlacedPopup | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [codDetails, setCodDetails] = useState<CodCustomerDetails>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [codPincodes, setCodPincodes] = useState<Set<string> | null>(null);
  const [codPincodeLoading, setCodPincodeLoading] = useState(false);
  const [codPincodeError, setCodPincodeError] = useState("");

  useEffect(() => {
    setCodDetails((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.displayName || "",
      phone: prev.phone || user?.phoneNumber || "",
    }));
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadCodPincodeLookup = async () => {
      try {
        setCodPincodeLoading(true);
        setCodPincodeError("");

        const response = await fetch("/B2C_Pincodes_List.csv");
        if (!response.ok) {
          throw new Error("Unable to load pincode data.");
        }

        const csvText = await response.text();
        const codLookup = parseCodPincodes(csvText);
        if (!active) return;
        setCodPincodes(codLookup);
      } catch (error) {
        if (!active) return;
        setCodPincodeError(error instanceof Error ? error.message : "Unable to load pincode data.");
      } finally {
        if (active) {
          setCodPincodeLoading(false);
        }
      }
    };

    void loadCodPincodeLookup();

    return () => {
      active = false;
    };
  }, []);

  const normalizedCodPincode = useMemo(
    () => codDetails.pincode.replace(/\D/g, "").slice(0, 6),
    [codDetails.pincode]
  );

  const codAvailabilityMessage = useMemo(() => {
    if (paymentMethod !== "cod") return "";
    if (!normalizedCodPincode) return "Enter your pincode to check COD availability.";
    if (!PINCODE_REGEX.test(normalizedCodPincode)) return "Please enter a valid 6-digit pincode.";
    if (codPincodeLoading) return "Checking COD availability...";
    if (codPincodeError) return codPincodeError;
    if (!codPincodes) return "Checking COD availability...";

    return codPincodes.has(normalizedCodPincode)
      ? "COD is available for your location."
      : "Coming soon to your location!";
  }, [paymentMethod, normalizedCodPincode, codPincodeLoading, codPincodeError, codPincodes]);

  const isCodServiceable = useMemo(() => {
    if (paymentMethod !== "cod") return true;
    if (!PINCODE_REGEX.test(normalizedCodPincode)) return false;
    if (!codPincodes) return false;
    return codPincodes.has(normalizedCodPincode);
  }, [paymentMethod, normalizedCodPincode, codPincodes]);

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

  const validateCodDetails = () => {
    const requiredFields: Array<keyof CodCustomerDetails> = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "pincode",
    ];

    const missing = requiredFields.filter((field) => !codDetails[field].trim());
    if (missing.length) {
      throw new Error(`Please fill: ${missing.join(", ")}`);
    }
  };

  const createOnlineOrder = async (serverToken: string) => {
    try {
      return await apiRequest<RazorpayOrderResponse>(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify({
            amountInRupees: cartSubtotal,
          }),
        },
        serverToken
      );
    } catch {
      localStorage.removeItem("hairiq_server_token");
      const refreshedToken = await getServerToken();
      return apiRequest<RazorpayOrderResponse>(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify({
            amountInRupees: cartSubtotal,
          }),
        },
        refreshedToken
      );
    }
  };

  const handleOnlineCheckout = async () => {
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay SDK");
      }

      const serverToken = await getServerToken();
      const orderResponse = await createOnlineOrder(serverToken);

      const checkout = new window.Razorpay({
        key: orderResponse.data.razorpayKeyId,
        order_id: orderResponse.data.razorpayOrderId,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "Hair IQ",
        description: "Online payment",
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
          setOrderPlacedPopup({
            title: "Order placed successfully",
            message: "Your online payment is confirmed. We will process your order shortly.",
            amount: cartSubtotal,
          });
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
      throw error;
    }
  };

  const handleCodCheckout = async () => {
    validateCodDetails();
    if (!isCodServiceable) {
      throw new Error("Coming soon to your location!");
    }

    const serverToken = await getServerToken();

    const normalizedItems = cartItems.map((item) => ({
      productVariantId: item.variantId,
      quantity: item.quantity,
    }));

    const codResponse = await apiRequest<CodOrderResponse>(
      "/orders/cod",
      {
        method: "POST",
        body: JSON.stringify({
          items: normalizedItems,
          customerDetails: codDetails,
        }),
      },
      serverToken
    );

    clearCart();
    setCheckoutSuccess(`COD order placed. Order ID: ${codResponse.data.orderId}. Status: COD_PENDING`);
    setOrderPlacedPopup({
      title: "Order placed successfully",
      message: "Your COD order has been placed.",
      orderId: codResponse.data.orderId,
      amount: codResponse.data.totalAmount,
    });
    setIsProcessing(false);
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

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === "online") {
        await handleOnlineCheckout();
      } else {
        await handleCodCheckout();
      }
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
            <div className="mt-5 space-y-2 rounded-xl border border-black/10 bg-white/70 p-3">
              <p className="text-sm font-semibold text-coal">Choose payment method</p>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-coal">
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                Pay Online (Razorpay)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-coal">
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                Cash on Delivery (COD)
              </label>
            </div>

            {paymentMethod === "cod" ? (
              <div className="mt-4 space-y-2 rounded-xl border border-black/10 bg-white/70 p-3">
                <p className="text-sm font-semibold text-coal">Shipping details for COD</p>
                <input
                  type="text"
                  value={codDetails.fullName}
                  onChange={(event) => setCodDetails((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="text"
                  value={codDetails.phone}
                  onChange={(event) => setCodDetails((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="text"
                  value={codDetails.addressLine1}
                  onChange={(event) => setCodDetails((prev) => ({ ...prev, addressLine1: event.target.value }))}
                  placeholder="Address line 1"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="text"
                  value={codDetails.addressLine2}
                  onChange={(event) => setCodDetails((prev) => ({ ...prev, addressLine2: event.target.value }))}
                  placeholder="Address line 2 (optional)"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={codDetails.city}
                    onChange={(event) => setCodDetails((prev) => ({ ...prev, city: event.target.value }))}
                    placeholder="City"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                  />
                  <input
                    type="text"
                    value={codDetails.state}
                    onChange={(event) => setCodDetails((prev) => ({ ...prev, state: event.target.value }))}
                    placeholder="State"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                  />
                </div>
                <input
                  type="text"
                  value={normalizedCodPincode}
                  onChange={(event) =>
                    setCodDetails((prev) => ({ ...prev, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))
                  }
                  placeholder="Pincode"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                />
                <p
                  className={`text-xs ${
                    codAvailabilityMessage === "Coming soon to your location!"
                      ? "font-semibold text-amber-700"
                      : codAvailabilityMessage === "COD is available for your location."
                        ? "text-emerald-700"
                        : "text-gray-600"
                  }`}
                >
                  {codAvailabilityMessage}
                </p>
              </div>
            ) : null}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || (paymentMethod === "cod" && !isCodServiceable)}
              className="mt-5 w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessing
                ? paymentMethod === "online"
                  ? "Opening Razorpay..."
                  : "Placing COD order..."
                : paymentMethod === "online"
                  ? "Proceed to Online Payment"
                  : "Place COD Order"}
            </button>
            {checkoutError ? <p className="mt-3 text-sm text-red-700">{checkoutError}</p> : null}
            {checkoutSuccess ? <p className="mt-3 text-sm text-green-700">{checkoutSuccess}</p> : null}
          </aside>
        </div>
      )}

      {orderPlacedPopup ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/15 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-coal">{orderPlacedPopup.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{orderPlacedPopup.message}</p>
            {orderPlacedPopup.orderId ? (
              <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-coal">
                Order ID: {orderPlacedPopup.orderId.slice(0, 8).toUpperCase()}
              </p>
            ) : null}
            {typeof orderPlacedPopup.amount === "number" ? (
              <p className="mt-2 text-sm text-gray-700">Amount: {currency(orderPlacedPopup.amount)}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setOrderPlacedPopup(null)}
              className="mt-5 w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white hover:bg-black"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
