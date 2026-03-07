"use client";

import { AnimatePresence, motion } from "framer-motion";
// import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { X } from "lucide-react";
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
  isDelhiNcrPoster?: boolean;
};

const offers: HeroOffer[] = [
  {
    id: "offer-1",
    kicker: "Limited Offer",
    headline: "Premium Hair Patches Made For Everyday Confidence",
    copy: "Natural blend, luxury finish, and simple upkeep designed for modern men.",
    ctaLabel: "Shop Now",
    ctaHref: "/products",
    image: "/images/hero/3.png",
    isDelhiNcrPoster: true,
  },
  {
    id: "offer-2",
    kicker: "Best Seller",
    headline: "Flat 20% Off On HD Skin Base Collection",
    copy: "Invisible scalp finish and all-day hold for professional and active lifestyles.",
    ctaLabel: "Explore Collection",
    ctaHref: "/products",
    image: "/images/hero/2.png"
  },
  {
    id: "offer-3",
    kicker: "Bundle Offer",
    headline: "System + Bond Kit Combo Starting At $169",
    copy: "Complete transformation essentials in one premium bundle.",
    ctaLabel: "Claim Bundle",
    ctaHref: "/products",
    image: "/images/hero/1.png"
  }
];

type BookingFormState = {
  name: string;
  phone: string;
  area: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
};

const PHONE_REGEX = /^\d{9,10}$/;

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [formState, setFormState] = useState<BookingFormState>({
    name: "",
    phone: "",
    area: "",
    address: "",
    preferredDate: "",
    preferredTime: "",
  });
  const activeOffer = offers[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  // const prev = () => setActiveIndex((prevIdx) => (prevIdx - 1 + offers.length) % offers.length);
  // const next = () => setActiveIndex((prevIdx) => (prevIdx + 1) % offers.length);

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setBookingError("");
  };

  const submitBooking = async () => {
    setBookingError("");
    setBookingSuccess("");

    const requiredEntries = Object.entries(formState).filter(([, value]) => !value.trim());
    if (requiredEntries.length) {
      setBookingError("Please fill all fields before submitting.");
      return;
    }

    const digitsOnlyPhone = formState.phone.replace(/\D/g, "");
    const normalizedPhone = digitsOnlyPhone.length > 10 ? digitsOnlyPhone.slice(-10) : digitsOnlyPhone;
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setBookingError("Please enter a valid phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest<{ success: true; data: { id: string } }>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...formState,
          phone: normalizedPhone,
        }),
      });
      setBookingSuccess("Thank you! Our team will call you shortly to confirm your booking.");
      setFormState({
        name: "",
        phone: "",
        area: "",
        address: "",
        preferredDate: "",
        preferredTime: "",
      });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Unable to submit booking request.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="relative aspect-[1200/500] w-full"
          >
            <Image
              src={activeOffer.image}
              alt={activeOffer.headline}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {activeOffer.isDelhiNcrPoster ? (
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="absolute inset-0"
                aria-label="Open Delhi NCR home service booking form"
              />
            ) : null}
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
      <AnimatePresence>
        {isBookingModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4"
          >
            <motion.div
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
            >
              <button
                type="button"
                onClick={closeBookingModal}
                className="absolute right-3 top-3 rounded-full border border-black/20 p-2 text-coal"
                aria-label="Close booking form"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold text-coal">Book Home Service (Delhi NCR)</h3>
              <p className="mt-1 text-sm text-gray-600">Fill in your details and our team will call you.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Name"
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  placeholder="Phone Number"
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="text"
                  value={formState.area}
                  onChange={(event) => setFormState((previous) => ({ ...previous, area: event.target.value }))}
                  placeholder="Area"
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="text"
                  value={formState.address}
                  onChange={(event) => setFormState((previous) => ({ ...previous, address: event.target.value }))}
                  placeholder="Address"
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal sm:col-span-2"
                />
                <input
                  type="date"
                  value={formState.preferredDate}
                  onChange={(event) => setFormState((previous) => ({ ...previous, preferredDate: event.target.value }))}
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal"
                />
                <input
                  type="time"
                  value={formState.preferredTime}
                  onChange={(event) => setFormState((previous) => ({ ...previous, preferredTime: event.target.value }))}
                  className="rounded-xl border border-black/15 px-3 py-2.5 text-sm text-coal outline-none focus:border-coal"
                />
              </div>
              {bookingError ? <p className="mt-3 text-sm text-red-700">{bookingError}</p> : null}
              {bookingSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{bookingSuccess}</p> : null}
              <button
                type="button"
                onClick={() => void submitBooking()}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Booking"}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
