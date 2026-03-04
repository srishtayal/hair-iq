"use client";

import SectionHeader from "@/components/common/section-header";
import { useStore } from "@/context/store-context";
import { apiRequest } from "@/lib/api";
import { auth } from "@/lib/firebase-client";
import { FirebaseError } from "firebase/app";
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

type AuthPayload = {
  token: string;
  user: { id: string; name: string; phone: string; email: string | null; role: string };
  needsProfile: boolean;
  isNewUser: boolean;
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authReady } = useStore();

  const [phoneNumber, setPhoneNumber] = useState("+1");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [serverToken, setServerToken] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/";
  }, [searchParams]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (user && !needsProfile) {
      router.replace(nextPath);
    }
  }, [authReady, nextPath, router, user, needsProfile]);

  const clearRecaptchaVerifier = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // Ignore cleanup race conditions during Fast Refresh.
    }
    recaptchaVerifierRef.current = null;
    window.recaptchaVerifier = undefined;
  };

  const initRecaptchaVerifier = async () => {
    if (typeof window === "undefined") return null;

    clearRecaptchaVerifier();

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "normal",
    });

    recaptchaVerifierRef.current = verifier;
    window.recaptchaVerifier = verifier;
    await verifier.render();
    return verifier;
  };

  useEffect(() => {
    void initRecaptchaVerifier();

    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!phoneNumber.startsWith("+") || phoneNumber.length < 8) {
      setError("Enter a valid phone number with country code. Example: +14155550123");
      return;
    }

    try {
      setLoading(true);
      const verifier = await initRecaptchaVerifier();
      if (!verifier) {
        setError("Recaptcha not ready. Refresh and try again.");
        return;
      }

      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      setMessage("OTP sent. Enter the 6-digit code.");
    } catch (sendError) {
      const firebaseError = sendError as FirebaseError;
      const errorCode = firebaseError?.code ?? "unknown";
      if (errorCode === "auth/invalid-app-credential") {
        await initRecaptchaVerifier();
      }
      const errorMessage =
        errorCode === "auth/invalid-app-credential"
          ? "Failed to send OTP (auth/invalid-app-credential). reCAPTCHA session was invalid/expired. Please solve reCAPTCHA again and retry."
          : errorCode === "auth/network-request-failed"
            ? "Failed to send OTP (auth/network-request-failed). Check internet, disable VPN/ad-blocker, and retry."
            : `Failed to send OTP (${errorCode}). Check Firebase Phone Auth setup and authorized domains.`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!confirmationResult) {
      setError("Please request OTP first.");
      return;
    }

    if (otp.length < 6) {
      setError("Enter valid OTP.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      const response = await apiRequest<{ success: true; data: AuthPayload }>("/auth/verify-firebase", {
        method: "POST",
        body: JSON.stringify({
          idToken,
        }),
      });

      const payload = response.data;
      localStorage.setItem("hairiq_server_token", payload.token);

      if (payload.needsProfile) {
        setNeedsProfile(true);
        setServerToken(payload.token);
        setProfileName(payload.user.name === "User" ? "" : payload.user.name || "");
        setProfilePhone(payload.user.phone || phoneNumber);
        setProfileEmail(payload.user.email || "");
        setMessage("Please complete your profile to continue.");
        return;
      }

      setMessage("Login successful.");
      router.replace(nextPath);
    } catch (verifyError) {
      const firebaseError = verifyError as FirebaseError;
      const errorCode = firebaseError?.code ?? "unknown";
      setError(`OTP verification failed (${errorCode}).`);
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!profileName.trim() || !profilePhone.trim()) {
      setError("Name and mobile number are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest<{ success: true; data: AuthPayload }>(
        "/auth/complete-profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: profileName.trim(),
            phone: profilePhone.trim(),
            email: profileEmail.trim() || null,
          }),
        },
        serverToken
      );

      localStorage.setItem("hairiq_server_token", response.data.token);
      setNeedsProfile(false);
      setMessage("Profile saved. Login successful.");
      router.replace(nextPath);
    } catch (profileError) {
      const apiError = profileError as Error;
      setError(apiError.message || "Failed to complete profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Sign In"
        title="Login with mobile OTP"
        description="Create your account or login to continue to checkout, wishlist, and tracking."
      />

      <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <form className="space-y-3" onSubmit={sendOtp}>
          <label className="text-sm font-medium text-coal" htmlFor="phone-number">
            Mobile number
          </label>
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
            placeholder="+14155550123"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-champagne px-4 py-3 text-sm font-semibold text-coal disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <form className="space-y-3" onSubmit={verifyOtp}>
          <label className="text-sm font-medium text-coal" htmlFor="otp-code">
            Enter OTP
          </label>
          <input
            id="otp-code"
            type="text"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
            placeholder="6-digit code"
          />
          <button
            type="submit"
            disabled={loading || !confirmationResult}
            className="w-full rounded-full border border-black/20 bg-white px-4 py-3 text-sm font-semibold text-coal disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {needsProfile ? (
          <form className="space-y-3 rounded-xl border border-black/10 bg-white/70 p-4" onSubmit={submitProfile}>
            <p className="text-sm font-medium text-coal">Complete your profile</p>
            <input
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
              placeholder="Full name"
            />
            <input
              type="tel"
              value={profilePhone}
              onChange={(event) => setProfilePhone(event.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
              placeholder="Mobile number with country code"
            />
            <input
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
              placeholder="Email (optional)"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        ) : null}

        <div id="recaptcha-container" className="pt-1" />

        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
