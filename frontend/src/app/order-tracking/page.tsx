"use client";

import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { orderTimeline } from "@/data/orders";

export default function TrackingPage() {
  const { authReady, isAuthenticated, goToAuth } = useStore();

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
        title="Order HIQ-40291"
        description="Live timeline for your latest shipment. Updated status and milestone history."
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <div className="space-y-6">
          {orderTimeline.map((step, idx) => (
            <div key={step.label} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${step.complete ? "bg-champagne" : "bg-white/30"}`} />
                {idx < orderTimeline.length - 1 ? <div className="mt-2 h-12 w-px bg-white/20" /> : null}
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
    </div>
  );
}
