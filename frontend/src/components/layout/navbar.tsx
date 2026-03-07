"use client";

import { useStore } from "@/context/store-context";
import { cn } from "@/lib/utils";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/videos", label: "Videos" },
  { href: "/order-tracking", label: "Tracking" }
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist, isAuthenticated } = useStore();

  const authHref = (path: string) => `/auth?next=${encodeURIComponent(path)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="border-b border-black/10 bg-coal px-4 py-2 text-center text-xs font-medium text-white md:text-sm">
        Free Delivery |  <span className="text-champagne">10%</span> Off On Prepaid Orders
      </div>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <button className="rounded-lg border border-graphite/20 p-2 text-coal md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const protectedHref =
              link.href === "/order-tracking" && !isAuthenticated ? authHref(link.href) : link.href;

            return (
              <Link
                key={link.href}
                href={protectedHref}
                className={cn(
                  "text-sm font-medium text-smoke transition hover:text-coal",
                  pathname === link.href && "text-coal"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:absolute md:left-1/2 md:-translate-x-1/2">
          <Image src="/images/HairIQ-logo.png" alt="Hair IQ" width={120} height={34} className="object-contain md:w-[140px]" priority />
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href={isAuthenticated ? "/wishlist" : authHref("/wishlist")}
            className="relative rounded-full border border-black/15 p-2 text-smoke hover:text-coal"
          >
            <Heart className="h-4 w-4" />
            {!!wishlist.length && (
              <span className="absolute -right-1 -top-1 rounded-full bg-champagne px-1.5 text-[10px] font-bold text-coal">{wishlist.length}</span>
            )}
          </Link>
          <Link href="/cart" className="relative rounded-full border border-black/15 p-2 text-smoke hover:text-coal">
            <ShoppingBag className="h-4 w-4" />
            {!!cartCount && (
              <span className="absolute -right-1 -top-1 rounded-full bg-champagne px-1.5 text-[10px] font-bold text-coal">{cartCount}</span>
            )}
          </Link>
          <Link href={isAuthenticated ? "/profile" : authHref("/profile")} className="rounded-full border border-black/15 p-2 text-smoke hover:text-coal">
            <User className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={isAuthenticated ? "/wishlist" : authHref("/wishlist")}
            className="relative rounded-full border border-black/15 p-2 text-smoke hover:text-coal"
          >
            <Heart className="h-4 w-4" />
            {!!wishlist.length && (
              <span className="absolute -right-1 -top-1 rounded-full bg-champagne px-1.5 text-[10px] font-bold text-coal">{wishlist.length}</span>
            )}
          </Link>
          <Link href="/cart" className="relative rounded-full border border-black/15 p-2 text-smoke hover:text-coal">
            <ShoppingBag className="h-4 w-4" />
            {!!cartCount && (
              <span className="absolute -right-1 -top-1 rounded-full bg-champagne px-1.5 text-[10px] font-bold text-coal">{cartCount}</span>
            )}
          </Link>
        </div>
      </nav>

      <div className="overflow-hidden border-t border-black/10 bg-[#f8f0e6] py-2">
        <div className="ticker-track whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-coal md:text-sm">
          {/* <span className="mx-6">Flat 20% Off On HD Skin Base</span>
          <span className="mx-6">Buy 1 Get Maintenance Kit At 50% Off</span>
          <span className="mx-6">Use Code HIQ25 On Orders Above $150</span>
          <span className="mx-6">Chat On WhatsApp For Support: +91 98735 04614</span>
          <span className="mx-6">Express Shipping Available Across India</span> */}
          <span className="mx-6">Home Service Available In Delhi NCR</span>
          <span className="mx-6">Best Price Guaranteed</span>
          <span className="mx-6">Chat On WhatsApp For Support: +91 98735 04614</span>
          <span className="mx-6">Shipping Available Across India</span>
          <span className="mx-6">Home Service Available In Delhi NCR</span>
          <span className="mx-6">Best Price Guaranteed</span>
          <span className="mx-6">Chat On WhatsApp For Support: +91 98735 04614</span>
          <span className="mx-6">Shipping Available Across India</span>
           
        </div>
      </div>

      {open && (
        <div className="border-t border-graphite/10 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => {
              const protectedHref =
                link.href === "/order-tracking" && !isAuthenticated ? authHref(link.href) : link.href;

              return (
                <Link key={link.href} href={protectedHref} onClick={() => setOpen(false)} className="text-sm text-gray-600 hover:text-coal">
                  {link.label}
                </Link>
              );
            })}
            <Link href={isAuthenticated ? "/profile" : authHref("/profile")} onClick={() => setOpen(false)} className="text-sm text-smoke hover:text-coal">
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
