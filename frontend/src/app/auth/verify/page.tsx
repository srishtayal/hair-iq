"use client";

import SectionHeader from "@/components/common/section-header";
import { apiRequest } from "@/lib/api";
import { auth } from "@/lib/firebase-client";
import { FirebaseError } from "firebase/app";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type AuthPayload = {
  token: string;
  user: { id: string; name: string; phone: string; email: string | null; role: string };
  needsProfile: boolean;
  isNewUser: boolean;
};

const OTP_LENGTH = 6;
const AUTH_VERIFICATION_ID_KEY = "hairiq_auth_verification_id";
const AUTH_PHONE_KEY = "hairiq_auth_phone";
const SERVER_USER_KEY = "hairiq_server_user";

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneFromQuery, setPhoneFromQuery] = useState<string>("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const phone = params.get("phone");
      setPhoneFromQuery(phone || "");
    } catch {
      setPhoneFromQuery("");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = sessionStorage.getItem(AUTH_VERIFICATION_ID_KEY);
    setVerificationId(id);

    if (!id) {
      setError("Session expired. Please request OTP again.");
    }
  }, []);

  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);

  const updateDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean && value.length) return;

    if (clean.length > 1) {
      setOtpDigits((prev) => {
        const next = [...prev];
        const chars = clean.slice(0, OTP_LENGTH - index).split("");
        chars.forEach((char, offset) => {
          next[index + offset] = char;
        });
        return next;
      });

      const lastIndex = Math.min(index + clean.length, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = clean.slice(-1);
      return next;
    });

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    setOtpDigits((prev) => {
      const next = [...prev];
      pasted.split("").forEach((char, idx) => {
        next[idx] = char;
      });
      return next;
    });

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!verificationId) {
      setError("Session expired. Please request OTP again.");
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    if (!auth) {
      setError("Authentication is unavailable. Check Firebase public environment variables.");
      return;
    }

    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, otpValue);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();

      const response = await apiRequest<{ success: true; data: AuthPayload }>("/auth/verify-firebase", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      localStorage.setItem("hairiq_server_token", response.data.token);
      localStorage.setItem(SERVER_USER_KEY, JSON.stringify(response.data.user));
      sessionStorage.removeItem(AUTH_VERIFICATION_ID_KEY);
      sessionStorage.removeItem(AUTH_PHONE_KEY);

      router.replace("/profile");
    } catch (verifyError) {
      const firebaseError = verifyError as FirebaseError;
      const code = firebaseError?.code ?? "unknown";
      setError(`OTP verification failed (${code}).`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Verify OTP"
        title="Enter the 6-digit code"
        description={phoneFromQuery ? `Code sent to ${phoneFromQuery}` : "Enter the OTP sent to your mobile number."}
      />

      <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <form className="space-y-4" onSubmit={verifyOtp}>
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={`otp-${index}`}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                className="h-12 w-12 rounded-xl border border-black/15 bg-white text-center text-lg font-semibold text-coal outline-none focus:border-coal"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !verificationId}
            className="w-full rounded-full border border-black/20 bg-white px-4 py-3 text-sm font-semibold text-coal disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP & Log In"}
          </button>
        </form>

        <button onClick={() => router.replace("/auth")} className="text-sm text-coal underline underline-offset-4">
          Change mobile number
        </button>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
