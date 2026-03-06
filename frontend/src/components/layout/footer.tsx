import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-coal">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-display text-2xl text-white">All Horizon</p>
          <p className="mt-3 text-sm text-gray-300">Premium hair patch systems with transparent open delivery and dedicated customer support.</p>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-champagne">Links</p>
          <div className="space-y-2 text-sm text-gray-300">
            <Link href="/about-us" className="block hover:text-white">
              About Us
            </Link>
            <Link href="/contact-us" className="block hover:text-white">
              Contact Us
            </Link>
            <Link href="/terms-and-conditions" className="block hover:text-white">
              Terms and Conditions
            </Link>
            <Link href="/privacy-policy" className="block hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/shipping-policy" className="block hover:text-white">
              Shipping Policy
            </Link>
            <Link href="/cancellation-and-refund-policy" className="block hover:text-white">
              Cancellation and Refund Policy
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-champagne">Contact Information</p>
          <div className="space-y-2 text-sm text-gray-300">
            <p>All Horizon</p>
            <p>Support@hairiq.in</p>
            <p>+91 8826429145</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">(c) {new Date().getFullYear()} All Horizon. All rights reserved.</div>
    </footer>
  );
}
