import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-coal">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-display text-2xl text-white">Hair IQ</p>
          <p className="mt-3 text-sm text-gray-300">Premium men&apos;s hair patch systems crafted for confidence, comfort, and natural realism.</p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-champagne">Explore</p>
          <div className="space-y-2 text-sm text-gray-300">
            <Link href="/products" className="block hover:text-white">
              Shop Products
            </Link>
            <Link href="/videos" className="block hover:text-white">
              Video Library
            </Link>
            <Link href="/order-tracking" className="block hover:text-white">
              Order Tracking
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-champagne">Support</p>
          <div className="space-y-2 text-sm text-gray-300">
            <p>care@hairiq.com</p>
            <p>Mon-Sat / 9:00 AM - 8:00 PM</p>
            <p>+1 (800) 555-4410</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">(c) {new Date().getFullYear()} Hair IQ. All rights reserved.</div>
    </footer>
  );
}
