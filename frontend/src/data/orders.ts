import { Order, TimelineStep } from "@/types";

export const orders: Order[] = [
  { id: "HIQ-40291", createdAt: "2026-02-11", total: 288, status: "Shipped", items: 2 },
  { id: "HIQ-39872", createdAt: "2026-01-19", total: 159, status: "Delivered", items: 1 },
  { id: "HIQ-38640", createdAt: "2025-12-04", total: 92, status: "Delivered", items: 2 }
];

export const orderTimeline: TimelineStep[] = [
  {
    label: "Order Confirmed",
    date: "Feb 22, 2026 - 09:30 AM",
    complete: true,
    description: "Your order has been confirmed and payment is verified."
  },
  {
    label: "Processing",
    date: "Feb 22, 2026 - 01:10 PM",
    complete: true,
    description: "Hair IQ team is preparing and quality-checking your products."
  },
  {
    label: "Shipped",
    date: "Feb 23, 2026 - 05:45 PM",
    complete: true,
    description: "Package dispatched via premium express shipping."
  },
  {
    label: "Out for Delivery",
    date: "Expected Feb 26, 2026",
    complete: false,
    description: "Carrier will attempt delivery to your shipping address."
  },
  {
    label: "Delivered",
    date: "Pending",
    complete: false,
    description: "Marked complete once package is delivered successfully."
  }
];
