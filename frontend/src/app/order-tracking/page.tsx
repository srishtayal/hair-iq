"use client";

import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { useCallback, useEffect, useMemo, useState } from "react";

const SERVER_USER_KEY = "hairiq_server_user";

type ServerUser = {
  id: string;
  role: "customer" | "admin";
};

type TrackingOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  trackingId: string | null;
  totalItems: number;
  isCodOrder?: boolean;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
};

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  date: string;
};

const ORDER_FLOW_STEPS: Array<{ key: string; label: string; description: string }> = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    description: "Your order is confirmed and queued for preparation.",
  },
  {
    key: "processing",
    label: "Processing",
    description: "Your products are being quality-checked.",
  },
  {
    key: "packed",
    label: "Packed",
    description: "The order is packed and ready for dispatch.",
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "The package has been handed over to the courier.",
  },
  {
    key: "out_for_delivery",
    label: "Out For Delivery",
    description: "The courier partner is attempting delivery.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Order delivered successfully.",
  },
];

const COD_STATUS_OPTIONS = [
  { value: "COD_PENDING", label: "COD Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out For Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const normalizeStatus = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const displayStatus = (value: string) => {
  const normalized = normalizeStatus(value);
  if (normalized === "cod_pending" || normalized === "pending") {
    return "COD Pending";
  }

  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusTone = (status: string) => {
  const normalized = normalizeStatus(status);
  if (["delivered", "paid"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["cancelled", "returned", "failed", "refunded"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const getStepIndex = (status: string) => {
  const normalized = normalizeStatus(status);
  const map: Record<string, number> = {
    pending: 0,
    cod_pending: 0,
    confirmed: 0,
    processing: 1,
    packed: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
  };
  return map[normalized] ?? 0;
};

const buildTimeline = (order: TrackingOrder): TimelineStep[] => {
  const normalizedStatus = normalizeStatus(order.orderStatus);
  const currentIndex = getStepIndex(order.orderStatus);

  const timeline = ORDER_FLOW_STEPS.map((step, idx) => {
    const isCurrent = idx === currentIndex && !["cancelled", "returned"].includes(normalizedStatus);
    const isComplete = idx <= currentIndex;

    return {
      ...step,
      complete: isComplete,
      date:
        idx === 0
          ? formatDateTime(order.createdAt)
          : isCurrent
            ? formatDateTime(order.updatedAt || order.createdAt)
            : "Completed",
    };
  }).filter((step) => step.complete);

  if (normalizedStatus === "cancelled") {
    timeline.push({
      key: "cancelled",
      label: "Cancelled",
      description: "Order was cancelled before completion.",
      complete: true,
      date: formatDateTime(order.updatedAt || order.createdAt),
    });
  }

  if (normalizedStatus === "returned") {
    timeline.push({
      key: "returned",
      label: "Returned",
      description: "Order was marked as returned.",
      complete: true,
      date: formatDateTime(order.updatedAt || order.createdAt),
    });
  }

  return timeline;
};

export default function TrackingPage() {
  const [preferredOrderId, setPreferredOrderId] = useState("");
  const { authReady, isAuthenticated, goToAuth, user } = useStore();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [codOrders, setCodOrders] = useState<TrackingOrder[]>([]);
  const [statusDraftByOrderId, setStatusDraftByOrderId] = useState<Record<string, string>>({});
  const [trackingDraftByOrderId, setTrackingDraftByOrderId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderFromQuery = new URLSearchParams(window.location.search).get("order") || "";
    setPreferredOrderId(orderFromQuery);
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
    return token;
  }, [user]);

  const loadTrackingData = useCallback(async () => {
    if (!authReady || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAdminError("");

      const token = await ensureServerToken();
      if (!token) {
        setError("Unable to create login session. Please login again.");
        return;
      }

      const [ordersResponse, meResponse] = await Promise.all([
        apiRequest<{ success: true; data: TrackingOrder[] }>("/orders", { method: "GET" }, token),
        apiRequest<{ success: true; data: { user: ServerUser } }>("/auth/me", { method: "GET" }, token),
      ]);

      const nextOrders = ordersResponse.data || [];
      setOrders(nextOrders);
      setSelectedOrderId((prev) => {
        if (preferredOrderId && nextOrders.some((order) => order.id === preferredOrderId)) {
          return preferredOrderId;
        }
        return prev || nextOrders[0]?.id || "";
      });
      setIsAdmin(meResponse.data.user.role === "admin");

      if (meResponse.data.user.role === "admin") {
        const codResponse = await apiRequest<{ success: true; data: TrackingOrder[] }>("/orders/admin/cod", { method: "GET" }, token);
        const nextCodOrders = codResponse.data || [];
        setCodOrders(nextCodOrders);

        setStatusDraftByOrderId(
          nextCodOrders.reduce<Record<string, string>>((accumulator, order) => {
            accumulator[order.id] = order.orderStatus;
            return accumulator;
          }, {})
        );
        setTrackingDraftByOrderId(
          nextCodOrders.reduce<Record<string, string>>((accumulator, order) => {
            accumulator[order.id] = order.trackingId || "";
            return accumulator;
          }, {})
        );
      } else {
        setCodOrders([]);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load tracking details";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authReady, ensureServerToken, isAuthenticated, preferredOrderId]);

  useEffect(() => {
    const cachedUser = localStorage.getItem(SERVER_USER_KEY);
    if (!cachedUser) {
      return;
    }

    try {
      const parsed = JSON.parse(cachedUser) as ServerUser;
      setIsAdmin(parsed.role === "admin");
    } catch {
      localStorage.removeItem(SERVER_USER_KEY);
    }
  }, []);

  useEffect(() => {
    void loadTrackingData();
  }, [loadTrackingData]);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId("");
      return;
    }

    if (!selectedOrderId || !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId]
  );

  const timeline = useMemo(() => (selectedOrder ? buildTimeline(selectedOrder) : []), [selectedOrder]);

  const handleUpdateCodOrder = async (orderId: string) => {
    setAdminError("");

    try {
      setUpdatingOrderId(orderId);
      const token = await ensureServerToken();
      if (!token) {
        setAdminError("Unable to create login session. Please login again.");
        return;
      }

      const statusValue = statusDraftByOrderId[orderId];
      const trackingValue = trackingDraftByOrderId[orderId] ?? "";

      const response = await apiRequest<{ success: true; data: TrackingOrder }>(
        `/orders/${orderId}/cod-status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            orderStatus: statusValue,
            trackingId: trackingValue,
          }),
        },
        token
      );

      setCodOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, ...response.data } : order)));
      setOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, ...response.data } : order)));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Unable to update COD order status";
      setAdminError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!authReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-12 space-y-8">
        <SectionHeader
          eyebrow="Track Order"
          title="Login required"
          description="Create your account to track your orders."
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <button
            onClick={() => goToAuth("/order-tracking")}
            className="rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-coal"
          >
            Login / Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Track Order"
        title={selectedOrder ? `Order ${selectedOrder.id.slice(0, 8).toUpperCase()}` : "Order Tracking"}
        description="Live timeline for your shipment with latest status from the database."
      />

      {loading ? <p className="text-sm text-gray-600">Loading tracking details...</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!loading && !error && !selectedOrder ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6">
          <p className="text-sm font-medium text-coal">No orders found for this account.</p>
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
          {orders.length > 1 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Select Order</p>
              <select
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
              >
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id.slice(0, 8).toUpperCase()} | {formatDateTime(order.createdAt)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(selectedOrder.orderStatus)}`}>
              {displayStatus(selectedOrder.orderStatus)}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(selectedOrder.paymentStatus)}`}>
              Payment: {displayStatus(selectedOrder.paymentStatus)}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
            <p>
              <span className="font-semibold text-coal">Tracking ID:</span> {selectedOrder.trackingId || "Not assigned yet"}
            </p>
            <p>
              <span className="font-semibold text-coal">Order Total:</span> {currency(selectedOrder.totalAmount)}
            </p>
            <p>
              <span className="font-semibold text-coal">Items:</span> {selectedOrder.totalItems}
            </p>
            <p>
              <span className="font-semibold text-coal">Last Updated:</span> {formatDateTime(selectedOrder.updatedAt || selectedOrder.createdAt)}
            </p>
          </div>

          <div className="space-y-6 border-t border-white/20 pt-4">
            {timeline.map((step, idx) => (
              <div key={`${step.key}-${idx}`} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${step.complete ? "bg-champagne" : "bg-white/30"}`} />
                  {idx < timeline.length - 1 ? <div className="mt-2 h-12 w-px bg-white/20" /> : null}
                </div>
                <div className="pb-4">
                  <p className="font-semibold text-coal">{step.label}</p>
                  <p className="text-sm text-champagne">{step.date}</p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-coal">COD Order Controls (Admin)</h3>
            <p className="text-sm text-gray-600">Update COD order status and tracking details.</p>
          </div>

          {adminError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{adminError}</p> : null}

          {!codOrders.length ? (
            <p className="text-sm text-gray-600">No COD orders available right now.</p>
          ) : (
            <div className="space-y-3">
              {codOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Order</p>
                      <p className="font-semibold text-coal">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-600">
                        {order.user?.name || "Customer"} {order.user?.phone ? `| ${order.user.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(order.orderStatus)}`}>
                        {displayStatus(order.orderStatus)}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(order.paymentStatus)}`}>
                        Payment: {displayStatus(order.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <select
                      value={statusDraftByOrderId[order.id] ?? order.orderStatus}
                      onChange={(event) =>
                        setStatusDraftByOrderId((previous) => ({ ...previous, [order.id]: event.target.value }))
                      }
                      className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
                    >
                      {COD_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={trackingDraftByOrderId[order.id] ?? order.trackingId ?? ""}
                      onChange={(event) =>
                        setTrackingDraftByOrderId((previous) => ({ ...previous, [order.id]: event.target.value }))
                      }
                      className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
                      placeholder="Tracking ID (optional)"
                    />

                    <button
                      type="button"
                      onClick={() => void handleUpdateCodOrder(order.id)}
                      disabled={updatingOrderId === order.id}
                      className="rounded-full bg-coal px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
                    >
                      {updatingOrderId === order.id ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
