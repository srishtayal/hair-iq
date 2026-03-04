"use client";

import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { orders } from "@/data/orders";
import { currency } from "@/lib/utils";

const wishlistItems = ["Royal Skin HD", "Precision Bond Kit"];

export default function ProfilePage() {
  const { logout, user } = useStore();

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader eyebrow="My Account" title="Profile Dashboard" description="Manage your orders, addresses, wishlist, and account details." />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-coal hover:bg-black hover:text-white"
        >
          Log out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft">
          <h3 className="font-semibold text-coal">Recent Orders</h3>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-black/10 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-coal">{order.id}</p>
                  <p className="text-champagne">{order.status}</p>
                </div>
                <p className="mt-1 text-gray-600">{order.createdAt}</p>
                <p className="text-gray-600">
                  {order.items} items | {currency(order.total)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft">
            <h3 className="font-semibold text-coal">Saved Addresses</h3>
            <p className="mt-3 text-sm text-gray-600">Home: 1124 Maple Creek Drive, Austin, TX 78704</p>
            <p className="mt-1 text-sm text-gray-600">Office: 244 W 38th Street, New York, NY 10018</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft">
            <h3 className="font-semibold text-coal">Wishlist Snapshot</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {wishlistItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft">
            <h3 className="font-semibold text-coal">Account Details</h3>
            <p className="mt-3 text-sm text-gray-600">Name: {user?.displayName || "Not set"}</p>
            <p className="text-sm text-gray-600">Email: {user?.email || "Not set"}</p>
            <p className="text-sm text-gray-600">Phone: {user?.phoneNumber || "Not set"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
