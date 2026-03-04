"use client";

import { AnimatePresence, motion } from "framer-motion";
// import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
// import Link from "next/link";
import { useEffect, useState } from "react";

type HeroOffer = {
  id: string;
  kicker: string;
  headline: string;
  copy: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

const offers: HeroOffer[] = [
  {
    id: "offer-1",
    kicker: "Limited Offer",
    headline: "Premium Hair Patches Made For Everyday Confidence",
    copy: "Natural blend, luxury finish, and simple upkeep designed for modern men.",
    ctaLabel: "Shop Now",
    ctaHref: "/products",
    image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "offer-2",
    kicker: "Best Seller",
    headline: "Flat 20% Off On HD Skin Base Collection",
    copy: "Invisible scalp finish and all-day hold for professional and active lifestyles.",
    ctaLabel: "Explore Collection",
    ctaHref: "/products",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "offer-3",
    kicker: "Bundle Offer",
    headline: "System + Bond Kit Combo Starting At $169",
    copy: "Complete transformation essentials in one premium bundle.",
    ctaLabel: "Claim Bundle",
    ctaHref: "/products",
    image: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&w=1800&q=80"
  }
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeOffer = offers[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // const prev = () => setActiveIndex((prevIdx) => (prevIdx - 1 + offers.length) % offers.length);
  // const next = () => setActiveIndex((prevIdx) => (prevIdx + 1) % offers.length);

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="relative overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeOffer.id}
            initial={{ opacity: 0.4, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="relative h-[calc(100vh-180px)] min-h-[560px] w-full md:h-[calc(100vh-200px)] md:min-h-[680px]"
          >
            <Image
              src={activeOffer.image}
              alt={activeOffer.headline}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {offers.map((offer, idx) => (
            <button
              key={offer.id}
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${idx === activeIndex ? "w-7 bg-champagne" : "w-2.5 bg-white/60"}`}
              aria-label={`Go to offer ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
