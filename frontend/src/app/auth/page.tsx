"use client";

import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { auth, hasFirebaseConfig } from "@/lib/firebase-client";
import { FirebaseError } from "firebase/app";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const COUNTRY_CODE = "+91";
const AUTH_VERIFICATION_ID_KEY = "hairiq_auth_verification_id";
const AUTH_PHONE_KEY = "hairiq_auth_phone";

const normalizeIndianPhoneDigits = (raw: string) => {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length > 10) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
};

export default function AuthPage() {
  const router = useRouter();
  const { user, authReady } = useStore();

  const [phoneDigits, setPhoneDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState<string>(() => "/");
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRequestInFlightRef = useRef(false);

  const fullPhoneNumber = useMemo(() => `${COUNTRY_CODE}${phoneDigits}`, [phoneDigits]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      setNextPath(next && next.startsWith("/") ? next : "/");
    } catch {
      setNextPath("/");
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      router.replace(nextPath);
    }
  }, [authReady, nextPath, router, user]);

  const clearRecaptchaVerifier = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // Ignore cleanup race conditions during Fast Refresh.
    }
    recaptchaVerifierRef.current = null;
    window.recaptchaVerifier = undefined;
  };

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  const requestOtp = async () => {
    if (!auth || !recaptchaVerifierRef.current || otpRequestInFlightRef.current) {
      return;
    }

    otpRequestInFlightRef.current = true;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);
      sessionStorage.setItem(AUTH_VERIFICATION_ID_KEY, result.verificationId);
      sessionStorage.setItem(AUTH_PHONE_KEY, fullPhoneNumber);

      router.push(`/auth/verify?next=${encodeURIComponent(nextPath)}&phone=${encodeURIComponent(fullPhoneNumber)}`);
    } catch (sendError) {
      const firebaseError = sendError as FirebaseError;
      const code = firebaseError?.code ?? "unknown";
      setError(`Failed to send OTP (${code}). Please complete reCAPTCHA again.`);
      otpRequestInFlightRef.current = false;
      setLoading(false);
      clearRecaptchaVerifier();
      setShowRecaptcha(false);
    }
  };

  const initRecaptchaVerifier = async () => {
    if (!auth) return;
    const container = document.getElementById("recaptcha-container");
    if (!container) {
      throw new Error("recaptcha-container not mounted");
    }

    clearRecaptchaVerifier();
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "normal",
      callback: () => {
        void requestOtp();
      },
      "expired-callback": () => {
        setMessage("reCAPTCHA expired. Please verify again.");
        otpRequestInFlightRef.current = false;
      },
    });

    recaptchaVerifierRef.current = verifier;
    window.recaptchaVerifier = verifier;
    await verifier.render();
  };

  useEffect(() => {
    if (!showRecaptcha || !auth || recaptchaVerifierRef.current) {
      return;
    }

    void initRecaptchaVerifier().catch(() => {
      setError("Unable to load reCAPTCHA. Refresh and try again.");
      setShowRecaptcha(false);
    });
  }, [showRecaptcha]);

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{10}$/.test(phoneDigits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!auth) {
      setError("Authentication is unavailable. Check Firebase public environment variables.");
      return;
    }

    setShowRecaptcha(true);
    setMessage("Complete reCAPTCHA to continue.");
    otpRequestInFlightRef.current = false;
    setLoading(false);
  };

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Sign In"
        title="Login with mobile OTP"
        description="Create your account or login to continue to checkout, wishlist, and tracking."
      />

      <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        {!hasFirebaseConfig ? (
          <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Authentication is currently unavailable because Firebase configuration is missing.
          </p>
        ) : null}

        <form className="space-y-3" onSubmit={handleSendOtp}>
          <label className="text-sm font-medium text-coal" htmlFor="phone-number">
            Mobile number
          </label>
          <div className="flex gap-2">
            <div className="flex w-28 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-3 py-3 text-sm text-coal">
              <span aria-hidden>🇮🇳</span>
              <span>{COUNTRY_CODE}</span>
            </div>
            <input
              id="phone-number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phoneDigits}
              onChange={(event) => setPhoneDigits(normalizeIndianPhoneDigits(event.target.value))}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
              placeholder="10-digit mobile number"
            />
          </div>
          <button
            type="submit"
            disabled={!auth}
            className="w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:opacity-60"
          >
            Send OTP
          </button>
        </form>

        <div id="recaptcha-container" className={showRecaptcha ? "pt-1" : "hidden"} />

        {loading ? <p className="text-sm text-coal">Sending OTP...</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
