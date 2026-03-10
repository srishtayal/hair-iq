"use client";

import { motion } from "framer-motion";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const SERVER_USER_KEY = "hairiq_server_user";
const LOCAL_ORDER_HISTORY_KEY = "hairiq_local_orders";

type ServerUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type AddressRecord = {
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

type AddressPayload = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type OrderSummary = {
  id: string;
  createdAt: string;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  orderStatus: string;
  paymentStatus: string;
  totalItems: number;
  items: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      slug: string;
      category: string;
    } | null;
    variant: {
      id: string;
      size: string | null;
      color: string | null;
      density: string | null;
      price: number;
      sku: string;
    } | null;
  }>;
  isLocalOrder?: boolean;
};

const emptyAddress: AddressPayload = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const inputClassName =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none transition placeholder:text-gray-400 focus:border-coal focus:ring-2 focus:ring-champagne/30";

const statusTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (["delivered", "completed", "paid"].some((value) => normalized.includes(value))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["cancelled", "failed", "refunded"].some((value) => normalized.includes(value))) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (["processing", "pending", "placed"].some((value) => normalized.includes(value))) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-black/10 bg-gray-100 text-gray-700";
};

const formatOrderDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isPastOrderStatus = (status: string) => {
  const normalized = status.toLowerCase();
  return ["delivered", "completed", "cancelled", "failed", "refunded", "returned"].some((value) =>
    normalized.includes(value)
  );
};

const accountPerks = ["Priority Support", "Fast Reorders", "Secure Checkout"];

const normalizeAddress = (address: AddressRecord) =>
  [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2 || "",
    address.city,
    address.state,
    address.pincode,
  ]
    .map((part) => part.trim().toLowerCase())
    .join("|");

const dedupeAddresses = (addresses: AddressRecord[]) => {
  const unique: AddressRecord[] = [];
  const seen = new Set<string>();
  for (const address of addresses) {
    const key = normalizeAddress(address);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(address);
  }
  return unique;
};

const mapProfileError = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("mobile number cannot be changed")) {
    return "Mobile number is locked to your login and cannot be changed from profile.";
  }
  if (normalized.includes("already saved")) {
    return "This address is already saved. Please edit the existing one instead.";
  }
  if (normalized.includes("missing required fields")) {
    return "Please fill all required address fields before saving.";
  }
  if (normalized.includes("unauthorized") || normalized.includes("login")) {
    return "Your session expired. Please login again.";
  }
  return message;
};

export default function ProfilePage() {
  const { logout, user, authReady, isAuthenticated, goToAuth, addToCart } = useStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersTab, setOrdersTab] = useState<"active" | "past">("active");
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressPayload>(emptyAddress);

  const applyUserToForm = useCallback((value: ServerUser) => {
    setProfileName(value.name || "");
    setProfilePhone(value.phone || "");
    setProfileEmail(value.email || "");
  }, []);

  const ensureServerToken = useCallback(async () => {
    let token = localStorage.getItem("hairiq_server_token");
    if (token) {
      return token;
    }

    if (!user) {
      return null;
    }

    const idToken = await user.getIdToken();
    const response = await apiRequest<{
      success: true;
      data: {
        token: string;
        user: ServerUser;
      };
    }>("/auth/verify-firebase", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    token = response.data.token;
    localStorage.setItem("hairiq_server_token", token);
    localStorage.setItem(SERVER_USER_KEY, JSON.stringify(response.data.user));
    applyUserToForm(response.data.user);
    return token;
  }, [applyUserToForm, user]);

  const loadProfileData = useCallback(async () => {
    if (!authReady || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const cachedUser = localStorage.getItem(SERVER_USER_KEY);
      if (cachedUser) {
        try {
          applyUserToForm(JSON.parse(cachedUser));
        } catch {
          localStorage.removeItem(SERVER_USER_KEY);
        }
      }

      const token = await ensureServerToken();
      if (!token) {
        setError("Unable to create login session. Please login again.");
        return;
      }

      const [meResponse, ordersResponse, addressesResponse] = await Promise.all([
        apiRequest<{ success: true; data: { user: ServerUser } }>("/auth/me", { method: "GET" }, token),
        apiRequest<{ success: true; data: OrderSummary[] }>("/orders", { method: "GET" }, token),
        apiRequest<{ success: true; data: AddressRecord[] }>("/addresses", { method: "GET" }, token),
      ]);

      applyUserToForm(meResponse.data.user);
      localStorage.setItem(SERVER_USER_KEY, JSON.stringify(meResponse.data.user));
      const localHistoryRaw = localStorage.getItem(LOCAL_ORDER_HISTORY_KEY);
      const localHistory = localHistoryRaw ? (JSON.parse(localHistoryRaw) as OrderSummary[]) : [];
      const mergedOrders = [...(ordersResponse.data || [])];
      const existingIds = new Set(mergedOrders.map((order) => order.id));
      localHistory.forEach((order) => {
        if (!order?.id || existingIds.has(order.id)) return;
        mergedOrders.push({ ...order, isLocalOrder: true });
      });

      setOrders(mergedOrders);
      setAddresses(dedupeAddresses(addressesResponse.data));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load profile details";
      setError(mapProfileError(message));
    } finally {
      setLoading(false);
    }
  }, [applyUserToForm, authReady, ensureServerToken, isAuthenticated]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!profileName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setSavingProfile(true);
      const token = await ensureServerToken();
      if (!token) {
        setError("Unable to create login session. Please login again.");
        return;
      }

      const response = await apiRequest<{
        success: true;
        data: {
          token: string;
          user: ServerUser;
        };
      }>(
        "/auth/complete-profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: profileName.trim(),
            email: profileEmail.trim() || null,
          }),
        },
        token
      );

      localStorage.setItem("hairiq_server_token", response.data.token);
      localStorage.setItem(SERVER_USER_KEY, JSON.stringify(response.data.user));
      applyUserToForm(response.data.user);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save profile";
      setError(mapProfileError(message));
    } finally {
      setSavingProfile(false);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const startEditAddress = (address: AddressRecord) => {
    setEditingAddressId(address.id);
    setAddressForm({
      fullName: address.fullName,
      phone: profilePhone || address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
  };

  const handleSaveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const lockedPhone = profilePhone.trim();

    if (
      !addressForm.fullName.trim() ||
      !lockedPhone ||
      !addressForm.addressLine1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      setError("Please fill all required address fields.");
      return;
    }

    try {
      setSavingAddress(true);
      const token = await ensureServerToken();
      if (!token) {
        setError("Unable to create login session. Please login again.");
        return;
      }

      const payload = {
        fullName: addressForm.fullName.trim(),
        phone: lockedPhone,
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim() || null,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        isDefault: addressForm.isDefault,
      };

      if (editingAddressId) {
        await apiRequest<{ success: true; data: AddressRecord }>(`/addresses/${editingAddressId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }, token);
      } else {
        await apiRequest<{ success: true; data: AddressRecord }>("/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        }, token);
      }

      const latestAddresses = await apiRequest<{ success: true; data: AddressRecord[] }>("/addresses", { method: "GET" }, token);
      setAddresses(dedupeAddresses(latestAddresses.data));
      resetAddressForm();
    } catch (addressError) {
      const message = addressError instanceof Error ? addressError.message : "Failed to save address";
      setError(mapProfileError(message));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setError("");

    try {
      setDeletingAddressId(addressId);
      const token = await ensureServerToken();
      if (!token) {
        setError("Unable to create login session. Please login again.");
        return;
      }

      await apiRequest<{ success: true; data: { removed: boolean } }>(`/addresses/${addressId}`, { method: "DELETE" }, token);
      setAddresses((prev) => prev.filter((address) => address.id !== addressId));

      if (editingAddressId === addressId) {
        resetAddressForm();
      }
    } catch (addressError) {
      const message = addressError instanceof Error ? addressError.message : "Failed to delete address";
      setError(mapProfileError(message));
    } finally {
      setDeletingAddressId(null);
    }
  };

  const { activeOrders, pastOrders } = useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      activeOrders: sortedOrders.filter((order) => !isPastOrderStatus(order.orderStatus)),
      pastOrders: sortedOrders.filter((order) => isPastOrderStatus(order.orderStatus)),
    };
  }, [orders]);

  const handleReorder = (order: OrderSummary) => {
    order.items.forEach((item) => {
      if (!item.product?.id || !item.variant?.id) return;

      for (let counter = 0; counter < item.quantity; counter += 1) {
        addToCart(item.product.id, item.variant.id);
      }
    });

    router.push("/cart");
  };

  const orderCards = useMemo(() => {
    const renderOrders = (orderList: OrderSummary[], emptyTitle: string, emptyDescription: string) => {
      if (!orderList.length) {
        return (
          <div className="rounded-2xl border border-dashed border-black/20 bg-gradient-to-br from-white to-orange-50/40 p-6 text-center">
            <p className="text-sm font-medium text-coal">{emptyTitle}</p>
            <p className="mt-1 text-xs text-gray-600">{emptyDescription}</p>
          </div>
        );
      }

      return orderList.map((order) => (
        <motion.article
          key={order.id}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-black/10 bg-white p-3 text-sm shadow-sm transition hover:border-black/20 sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Order ID</p>
              <p className="truncate font-semibold text-coal">{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-xs text-gray-500">{formatOrderDate(order.createdAt)}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(order.orderStatus)}`}>
              {order.orderStatus}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(order.paymentStatus)}`}>
              Payment: {order.paymentStatus}
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-black/10 pt-3">
            {order.items.length ? (
              order.items.map((item) => (
                <div key={item.id} className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-coal">{item.product?.name || "Product"}</p>
                    <p className="text-xs text-gray-600">
                      Qty {item.quantity}
                      {item.variant?.sku ? ` | SKU ${item.variant.sku}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-coal">{currency(item.lineTotal || item.priceAtPurchase * item.quantity)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No line items available.</p>
            )}
          </div>

          <div className="mt-4 space-y-1 border-t border-black/10 pt-3">
            <div className="flex items-center justify-between text-gray-600">
              <p>Items</p>
              <p>{currency(Math.max(0, order.totalAmount - order.shippingAmount + order.discountAmount))}</p>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <p>Shipping</p>
              <p>{currency(order.shippingAmount || 0)}</p>
            </div>
            {order.discountAmount > 0 ? (
              <div className="flex items-center justify-between text-emerald-700">
                <p>Discount</p>
                <p>-{currency(order.discountAmount)}</p>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-base font-semibold text-coal">
              <p>Total</p>
              <p>{currency(order.totalAmount)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleReorder(order)}
            className="mt-4 w-full rounded-full border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-coal transition hover:bg-gray-50"
          >
            Reorder
          </button>
        </motion.article>
      ));
    };

    return {
      active: renderOrders(
        activeOrders,
        "No active orders.",
        "Your ongoing and recently placed orders will appear here."
      ),
      past: renderOrders(pastOrders, "No past orders.", "Delivered and closed orders will appear here."),
    };
  }, [activeOrders, pastOrders]);

  const profileCompletion = useMemo(() => {
    const fields = [profileName, profilePhone, profileEmail];
    const completed = fields.filter((field) => field.trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
  }, [profileEmail, profileName, profilePhone]);

  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault) ?? null, [addresses]);
  const profileDisplayName = profileName || "Hair IQ Member";

  if (authReady && !isAuthenticated) {
    return (
      <div className="space-y-8 pt-12">
        <SectionHeader eyebrow="My Account" title="Login required" description="Sign in to view your profile details." />
        <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-white via-orange-50/70 to-champagne/30 p-8 shadow-sm">
          <p className="max-w-xl text-sm text-gray-600">Access your profile, saved addresses, and previous orders in one place.</p>
          <button
            onClick={() => goToAuth("/profile")}
            className="mt-5 rounded-full bg-coal px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            Login / Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-5 pt-6 md:space-y-8 md:pb-6 md:pt-10">
      <SectionHeader eyebrow="My Account" title="Profile Dashboard" description="Manage your details, addresses, and past orders." />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-white via-orange-50/70 to-white p-4 shadow-sm sm:p-5 md:p-7"
      >
        <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-champagne/35 blur-3xl" />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="relative z-[1] space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Account overview</p>
            <h3 className="font-display text-xl text-coal sm:text-2xl md:text-3xl">{profileDisplayName}</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
              <p>{profilePhone || "Add your phone number"}</p>
              <p>{profileEmail || "Add an email for order updates"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {accountPerks.map((perk) => (
                <span key={perk} className="rounded-full border border-black/15 bg-white/90 px-3 py-1 text-xs font-medium text-coal">
                  {perk}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="relative z-[1] h-fit w-full rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-coal transition hover:bg-black hover:text-white sm:w-auto"
          >
            Log out
          </button>
        </div>

        <div className="relative z-[1] mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white/90 p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Orders</p>
            <p className="mt-1 text-2xl font-semibold text-coal">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/90 p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Addresses</p>
            <p className="mt-1 text-2xl font-semibold text-coal">{addresses.length}</p>
            <p className="text-xs text-gray-500">{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : "No default yet"}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-black/10 bg-white/90 p-3 sm:col-span-1 sm:p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Profile completion</p>
            <p className="mt-1 text-2xl font-semibold text-coal">{profileCompletion}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-champagne via-amber-400 to-ember transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-gray-600">Loading profile...</p> : null}

      <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-coal">Personal Details</h3>
              <p className="text-sm text-gray-600">Keep your essentials updated for faster checkout and delivery updates.</p>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSaveProfile}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Full name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className={inputClassName}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Phone number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  readOnly
                  className={`${inputClassName} cursor-not-allowed bg-gray-100`}
                  placeholder="Mobile number linked to your login"
                />
                <p className="text-xs text-gray-500">Mobile number is locked to your login and cannot be changed here.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Email (optional)</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  className={inputClassName}
                  placeholder="Enter email"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-coal">{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
              <p className="text-sm text-gray-600">Manage shipping details once and reuse them in future orders.</p>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSaveAddress}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Full name</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    className={inputClassName}
                    placeholder="Recipient name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Phone</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    readOnly
                    className={`${inputClassName} cursor-not-allowed bg-gray-100`}
                    placeholder="Mobile number linked to your account"
                  />
                  <p className="text-xs text-gray-500">This number is auto-used from your login.</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Address line 1</label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                  className={inputClassName}
                  placeholder="Street, house number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Address line 2 (optional)</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
                  className={inputClassName}
                  placeholder="Landmark, area"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
                    className={inputClassName}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, state: event.target.value }))}
                    className={inputClassName}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Pincode</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, pincode: event.target.value }))}
                    className={inputClassName}
                    placeholder="Pincode"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-orange-50/50 px-3 py-2 text-sm text-coal">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                />
                Set as default address
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60 sm:flex-1"
                >
                  {savingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Add Address"}
                </button>
                {editingAddressId ? (
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="w-full rounded-full border border-black/20 bg-white px-4 py-3 text-sm font-semibold text-coal transition hover:bg-gray-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-coal">Orders</h3>
              <div className="flex w-full rounded-full border border-black/10 bg-gray-50 p-1 sm:inline-flex sm:w-auto">
                <button
                  type="button"
                  onClick={() => setOrdersTab("active")}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                    ordersTab === "active" ? "bg-coal text-white" : "text-gray-600 hover:text-coal"
                  }`}
                >
                  Active ({activeOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersTab("past")}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                    ordersTab === "past" ? "bg-coal text-white" : "text-gray-600 hover:text-coal"
                  }`}
                >
                  Past ({pastOrders.length})
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">{ordersTab === "active" ? orderCards.active : orderCards.past}</div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <h3 className="font-semibold text-coal">Saved Addresses</h3>
            <div className="mt-4 space-y-3">
              {addresses.length ? (
                addresses.map((address) => (
                  <article key={address.id} className="rounded-2xl border border-black/10 bg-orange-50/35 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-coal">{address.fullName}</p>
                      {address.isDefault ? (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-gray-600">{address.phone}</p>
                    <p className="text-gray-600">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    </p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditAddress(address)}
                        className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-coal transition hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAddress(address.id)}
                        disabled={deletingAddressId === address.id}
                        className="rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingAddressId === address.id ? "Removing..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/20 bg-gradient-to-br from-white to-orange-50/40 p-6 text-center">
                  <p className="text-sm font-medium text-coal">No saved addresses.</p>
                  <p className="mt-1 text-xs text-gray-600">Add an address to speed up checkout.</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
