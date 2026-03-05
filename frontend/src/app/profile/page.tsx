"use client";

import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { orders } from "@/data/orders";
import { apiRequest } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useEffect, useState } from "react";

const wishlistItems = ["Royal Skin HD", "Precision Bond Kit"];
const SERVER_USER_KEY = "hairiq_server_user";

type ServerUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
};

export default function ProfilePage() {
  const { logout, user, authReady, isAuthenticated, goToAuth } = useStore();
  const [serverUser, setServerUser] = useState<ServerUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }

    const token = localStorage.getItem("hairiq_server_token");
    if (!token) {
      setUserError("Please login again to view profile details.");
      return;
    }

    const storedUser = localStorage.getItem(SERVER_USER_KEY);
    if (storedUser) {
      try {
        setServerUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(SERVER_USER_KEY);
      }
    }

    const loadProfile = async () => {
      try {
        setUserLoading(true);
        const response = await apiRequest<{ success: true; data: { user: ServerUser } }>("/auth/me", { method: "GET" }, token);
        setServerUser(response.data.user);
        localStorage.setItem(SERVER_USER_KEY, JSON.stringify(response.data.user));
        setUserError("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load account details";
        setUserError(message);
      } finally {
        setUserLoading(false);
      }
    };

    void loadProfile();
  }, [authReady, isAuthenticated]);

  if (authReady && !isAuthenticated) {
    return (
      <div className="pt-12 space-y-8">
        <SectionHeader eyebrow="My Account" title="Login required" description="Sign in to view your profile details." />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <button
            onClick={() => goToAuth("/profile")}
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
            {userLoading ? <p className="mt-3 text-sm text-gray-600">Loading account details...</p> : null}
            <p className="mt-3 text-sm text-gray-600">Name: {serverUser?.name || user?.displayName || "Not set"}</p>
            <p className="text-sm text-gray-600">Email: {serverUser?.email || user?.email || "Not set"}</p>
            <p className="text-sm text-gray-600">Phone: {serverUser?.phone || user?.phoneNumber || "Not set"}</p>
            {serverUser?.role ? <p className="text-sm text-gray-600">Role: {serverUser.role}</p> : null}
            {userError ? <p className="mt-2 text-sm text-red-700">{userError}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
