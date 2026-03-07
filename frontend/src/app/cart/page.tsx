"use client";

import CartItem from "@/components/cart/cart-item";
import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import { BadgeCheck, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type OrderPlacedPopup = {
  title: string;
  message: string;
  orderId?: string;
  amount?: number;
};

const PINCODE_REGEX = /^\d{6}$/;
const LOCAL_ORDER_HISTORY_KEY = "hairiq_local_orders";
const MANUAL_ADDRESS_ID = "__manual_address__";

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

const toCodCustomerDetails = (address: SavedAddress): CodCustomerDetails => ({
  fullName: address.fullName || "",
  phone: address.phone || "",
  addressLine1: address.addressLine1 || "",
  addressLine2: address.addressLine2 || "",
  city: address.city || "",
  state: address.state || "",
  pincode: address.pincode || "",
});

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
  const { cartItems, cartSubtotal, isAuthenticated, goToAuth, user, clearCart, getCartProduct } = useStore();
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(MANUAL_ADDRESS_ID);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");

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

  const getServerToken = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadSavedAddresses = async () => {
      if (!isAuthenticated || !user) {
        setSavedAddresses([]);
        setSelectedAddressId(MANUAL_ADDRESS_ID);
        return;
      }

      try {
        setAddressesLoading(true);
        setAddressesError("");
        const token = await getServerToken();
        const response = await apiRequest<{ success: true; data: SavedAddress[] }>("/addresses", { method: "GET" }, token);
        if (!active) return;

        const addresses = response.data;
        setSavedAddresses(addresses);

        if (!addresses.length) {
          setSelectedAddressId(MANUAL_ADDRESS_ID);
          return;
        }

        const preferredAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
        setSelectedAddressId((previous) => {
          if (previous !== MANUAL_ADDRESS_ID && addresses.some((address) => address.id === previous)) {
            return previous;
          }
          return preferredAddress.id;
        });
      } catch (error) {
        if (!active) return;
        setAddressesError(error instanceof Error ? error.message : "Unable to load saved addresses.");
      } finally {
        if (active) {
          setAddressesLoading(false);
        }
      }
    };

    void loadSavedAddresses();

    return () => {
      active = false;
    };
  }, [getServerToken, isAuthenticated, user]);

  const selectedSavedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddressId) ?? null,
    [savedAddresses, selectedAddressId]
  );

  const effectiveCodDetails = useMemo(() => {
    if (selectedSavedAddress) {
      return toCodCustomerDetails(selectedSavedAddress);
    }

    return codDetails;
  }, [codDetails, selectedSavedAddress]);

  const normalizedCodPincode = useMemo(
    () => effectiveCodDetails.pincode.replace(/\D/g, "").slice(0, 6),
    [effectiveCodDetails.pincode]
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

  const validateCodDetails = (details: CodCustomerDetails) => {
    const requiredFields: Array<keyof CodCustomerDetails> = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "pincode",
    ];

    const missing = requiredFields.filter((field) => !details[field].trim());
    if (missing.length) {
      throw new Error(`Please fill: ${missing.join(", ")}`);
    }

    const normalizedPhone = details.phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      throw new Error("Please enter a valid phone number.");
    }
  };

  const isManualAddressIncomplete = useMemo(() => {
    if (selectedAddressId !== MANUAL_ADDRESS_ID) return false;

    const requiredFields: Array<keyof CodCustomerDetails> = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "pincode",
    ];

    const hasMissingRequired = requiredFields.some((field) => !codDetails[field].trim());
    const normalizedPhone = codDetails.phone.replace(/\D/g, "");
    const normalizedPincode = codDetails.pincode.replace(/\D/g, "");

    return hasMissingRequired || normalizedPhone.length < 10 || normalizedPincode.length !== 6;
  }, [codDetails, selectedAddressId]);

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

  const persistLocalOrderHistory = (payload: { orderId: string; paymentStatus: string; orderStatus: string }) => {
    const orderItems = cartItems
      .map((item) => {
        const product = getCartProduct(item);
        const variant = product?.variants.find((variantItem) => variantItem.id === item.variantId);
        if (!product || !variant) return null;
        const unitPrice = product.basePrice > 0 ? product.basePrice : variant.price;

        return {
          id: `${payload.orderId}-${item.itemId}`,
          quantity: item.quantity,
          priceAtPurchase: unitPrice,
          lineTotal: unitPrice * item.quantity,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
          },
          variant: {
            id: variant.id,
            size: null,
            color: null,
            density: null,
            price: unitPrice,
            sku: variant.label,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const nextOrder = {
      id: payload.orderId,
      createdAt: new Date().toISOString(),
      totalAmount: cartSubtotal,
      shippingAmount: 0,
      discountAmount: 0,
      orderStatus: payload.orderStatus,
      paymentStatus: payload.paymentStatus,
      totalItems: cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0),
      items: orderItems,
      isLocalOrder: true,
    };

    try {
      const existing = localStorage.getItem(LOCAL_ORDER_HISTORY_KEY);
      const parsed = existing ? JSON.parse(existing) : [];
      const safeParsed = Array.isArray(parsed) ? parsed : [];
      const withoutDuplicate = safeParsed.filter((order) => order?.id !== nextOrder.id);
      localStorage.setItem(LOCAL_ORDER_HISTORY_KEY, JSON.stringify([nextOrder, ...withoutDuplicate].slice(0, 20)));
    } catch {
      // Non-blocking: checkout success should not fail due to local history write issues.
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
          const verificationResponse = await apiRequest<VerifySignatureResponse>("/orders/verify-signature", {
            method: "POST",
            body: JSON.stringify(paymentResponse),
          });

          if (!verificationResponse?.data?.verified) {
            throw new Error("Payment verification failed. Your cart is still saved, please retry.");
          }

          clearCart();
          persistLocalOrderHistory({
            orderId: paymentResponse.razorpay_order_id,
            paymentStatus: "paid",
            orderStatus: "confirmed",
          });
          setCheckoutSuccess("Payment verified successfully.");
          setOrderPlacedPopup({
            title: "Order placed successfully",
            message: "Your online payment is confirmed. We will process your order shortly.",
            orderId: paymentResponse.razorpay_order_id,
            amount: cartSubtotal,
          });
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setCheckoutError("Payment was not completed. Your cart is still saved so you can retry checkout.");
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
    const customerDetails = effectiveCodDetails;
    validateCodDetails(customerDetails);
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
          customerDetails,
        }),
      },
      serverToken
    );

    clearCart();
    persistLocalOrderHistory({
      orderId: codResponse.data.orderId,
      paymentStatus: "COD_PENDING",
      orderStatus: "COD_PENDING",
    });
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

    if (selectedAddressId === MANUAL_ADDRESS_ID) {
      validateCodDetails(codDetails);
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

  const totalItemsCount = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="space-y-6 bg-[#f2f3f5] pb-28 pt-8 md:space-y-8 md:bg-transparent md:pb-6 md:pt-12">
      <SectionHeader eyebrow="Cart" title="Review your selection" description="Update quantities, verify prices, and continue to secure checkout." />

      {!cartItems.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Add premium hair systems or care essentials to begin checkout."
          ctaLabel="Explore products"
          ctaHref="/products"
        />
      ) : (
        <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1fr_390px]">
          <div className="space-y-3 md:space-y-4">
            {cartItems.map((item) => (
              <CartItem key={item.itemId} item={item} />
            ))}
          </div>

          <aside className="h-fit space-y-4 xl:sticky xl:top-24">
            <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-coal">Shipping Address</h3>
                <Link href="/profile" className="text-xs font-semibold text-coal underline underline-offset-4">
                  Manage
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                {addressesLoading ? <p className="text-sm text-gray-600">Loading saved addresses...</p> : null}
                {addressesError ? <p className="text-sm text-red-700">{addressesError}</p> : null}

                {savedAddresses.length
                  ? savedAddresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block cursor-pointer rounded-xl border p-3 text-sm transition ${
                          selectedAddressId === address.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-black/10 bg-white hover:border-black/25"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-coal">{address.fullName}</p>
                              {address.isDefault ? (
                                <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-gray-700">
                              {address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                            </p>
                            <p className="text-gray-700">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="mt-1 text-gray-700">Mobile: {address.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  : null}

                <label
                  className={`block cursor-pointer rounded-xl border p-3 text-sm transition ${
                    selectedAddressId === MANUAL_ADDRESS_ID
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-black/10 bg-white hover:border-black/25"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="saved-address"
                      checked={selectedAddressId === MANUAL_ADDRESS_ID}
                      onChange={() => setSelectedAddressId(MANUAL_ADDRESS_ID)}
                      className="h-4 w-4"
                    />
                    <p className="font-medium text-coal">Use a different address</p>
                  </div>
                </label>
              </div>

              {selectedAddressId === MANUAL_ADDRESS_ID ? (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  </div>
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
                    value={codDetails.pincode}
                    onChange={(event) =>
                      setCodDetails((prev) => ({ ...prev, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))
                    }
                    placeholder="Pincode"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-coal outline-none focus:border-coal"
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-coal">Bill Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Total MRP</span>
                  <span>{currency(subtotal + 200)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Discount</span>
                  <span className="text-emerald-700">-{currency(200)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="flex items-center gap-2">
                    <span className="text-gray-500 line-through">{currency(200)}</span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-base font-semibold text-coal">
                  <span>Total</span>
                  <span>{currency(cartSubtotal)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-coal">Choose payment method</p>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm text-coal">
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                  />
                  Pay Online (Razorpay)
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm text-coal">
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
                <p
                  className={`mt-3 text-xs ${
                    codAvailabilityMessage === "Coming soon to your location!"
                      ? "font-semibold text-amber-700"
                      : codAvailabilityMessage === "COD is available for your location."
                        ? "text-emerald-700"
                        : "text-gray-600"
                  }`}
                >
                  {codAvailabilityMessage}
                </p>
              ) : null}
            </section>

            <section className="grid grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-white p-3 text-center text-xs text-gray-700 shadow-sm">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-5 w-5 text-emerald-700" />
                <p>Fast Delivery</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <BadgeCheck className="h-5 w-5 text-emerald-700" />
                <p>Trusted Quality</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <p>Secure Payment</p>
              </div>
            </section>

            <button
              onClick={handleCheckout}
              disabled={isProcessing || isManualAddressIncomplete || (paymentMethod === "cod" && !isCodServiceable)}
              className="hidden w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:cursor-not-allowed disabled:opacity-70 lg:block"
            >
              {isProcessing
                ? paymentMethod === "online"
                  ? "Opening Razorpay..."
                  : "Placing COD order..."
                : paymentMethod === "online"
                  ? "Continue To Payment"
                  : "Place COD Order"}
            </button>
            {checkoutError ? <p className="text-sm text-red-700">{checkoutError}</p> : null}
            {checkoutSuccess ? <p className="text-sm text-green-700">{checkoutSuccess}</p> : null}
          </aside>
        </div>
      )}

      {cartItems.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mb-2 flex items-center justify-between text-sm">
            <p className="text-gray-700">
              {totalItemsCount} item{totalItemsCount > 1 ? "s" : ""}
            </p>
            <p className="font-semibold text-coal">{currency(cartSubtotal)}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isProcessing || isManualAddressIncomplete || (paymentMethod === "cod" && !isCodServiceable)}
            className="w-full rounded-xl bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProcessing
              ? paymentMethod === "online"
                ? "Opening Razorpay..."
                : "Placing COD order..."
              : paymentMethod === "online"
                ? "Continue To Payment"
                : "Place COD Order"}
          </button>
        </div>
      ) : null}

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
