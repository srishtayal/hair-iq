"use client";

import SectionHeader from "@/components/common/section-header";
import { apiRequest } from "@/lib/api";
import { auth } from "@/lib/firebase-client";
import { FirebaseError } from "firebase/app";
import { PhoneAuthProvider, RecaptchaVerifier, signInWithCredential, signInWithPhoneNumber } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type AuthPayload = {
  token: string;
  user: { id: string; name: string; phone: string; email: string | null; role: string };
  needsProfile: boolean;
  isNewUser: boolean;
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const AUTH_VERIFICATION_ID_KEY = "hairiq_auth_verification_id";
const AUTH_PHONE_KEY = "hairiq_auth_phone";
const SERVER_USER_KEY = "hairiq_server_user";

declare global {
  interface Window {
    OTPCredential?: unknown;
  }
}

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [phoneFromQuery, setPhoneFromQuery] = useState<string>("");
  const [nextPath, setNextPath] = useState<string>("/profile");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [needsNamePrompt, setNeedsNamePrompt] = useState(false);
  const [name, setName] = useState("");
  const [profileToken, setProfileToken] = useState("");
  const [savingName, setSavingName] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const phone = params.get("phone");
      const next = params.get("next");
      setPhoneFromQuery(phone || "");
      setNextPath(next && next.startsWith("/") ? next : "/profile");
    } catch {
      setPhoneFromQuery("");
      setNextPath("/profile");
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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((previous) => Math.max(0, previous - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      try {
        recaptchaVerifierRef.current?.clear();
      } catch {
        // ignore cleanup races
      }
      recaptchaVerifierRef.current = null;
    };
  }, []);

  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);

  const applyOtpCode = (rawCode: string) => {
    const code = rawCode.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!code) return;

    setOtpDigits((prev) => {
      const next = [...prev];
      code.split("").forEach((char, idx) => {
        next[idx] = char;
      });
      return next;
    });

    const focusIndex = Math.min(code.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

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
    const pasted = event.clipboardData.getData("text");
    applyOtpCode(pasted);
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

      if (response.data.isNewUser || !response.data.user?.name?.trim()) {
        setNeedsNamePrompt(true);
        setName(response.data.user?.name || "");
        setProfileToken(response.data.token);
        setMessage("Welcome! Please tell us your name to finish setup.");
        return;
      }

      router.replace(nextPath);
    } catch (verifyError) {
      const firebaseError = verifyError as FirebaseError;
      const code = firebaseError?.code ?? "unknown";
      setError(`OTP verification failed (${code}).`);
    } finally {
      setLoading(false);
    }
  };

  const clearRecaptchaVerifier = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // ignore
    }
    recaptchaVerifierRef.current = null;
  };

  const handleResendOtp = async () => {
    if (needsNamePrompt) {
      return;
    }

    if (resendCooldown > 0 || loading || resending) {
      return;
    }

    setError("");
    setMessage("");

    if (!auth) {
      setError("Authentication is unavailable. Check Firebase public environment variables.");
      return;
    }

    const targetPhone = sessionStorage.getItem(AUTH_PHONE_KEY) || phoneFromQuery;
    if (!targetPhone) {
      setError("Session expired. Please request OTP again.");
      return;
    }

    try {
      setResending(true);
      clearRecaptchaVerifier();

      const verifier = new RecaptchaVerifier(auth, "verify-recaptcha-container", { size: "invisible" });
      recaptchaVerifierRef.current = verifier;
      await verifier.render();

      const result = await signInWithPhoneNumber(auth, targetPhone, verifier);
      sessionStorage.setItem(AUTH_VERIFICATION_ID_KEY, result.verificationId);
      sessionStorage.setItem(AUTH_PHONE_KEY, targetPhone);
      setVerificationId(result.verificationId);
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("A new OTP has been sent.");
      inputRefs.current[0]?.focus();
    } catch (resendError) {
      const firebaseError = resendError as FirebaseError;
      const code = firebaseError?.code ?? "unknown";
      setError(`Failed to resend OTP (${code}).`);
    } finally {
      clearRecaptchaVerifier();
      setResending(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!verificationId) return;
    if (needsNamePrompt) return;
    if (!("OTPCredential" in window) || !("credentials" in navigator)) return;

    const controller = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: controller.signal,
      } as CredentialRequestOptions)
      .then((otpCredential) => {
        const code = String((otpCredential as { code?: string } | null)?.code || "");
        if (!code) return;
        applyOtpCode(code);
      })
      .catch(() => {
        // Browser may not support WebOTP or user denied permission.
      });

    return () => controller.abort();
  }, [needsNamePrompt, verificationId]);

  const handleSaveName = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setSavingName(true);
      const response = await apiRequest<{ success: true; data: AuthPayload }>(
        "/auth/complete-profile",
        {
          method: "PUT",
          body: JSON.stringify({ name: normalizedName }),
        },
        profileToken
      );

      localStorage.setItem("hairiq_server_token", response.data.token);
      localStorage.setItem(SERVER_USER_KEY, JSON.stringify(response.data.user));
      router.replace(nextPath);
    } catch (saveError) {
      const messageText = saveError instanceof Error ? saveError.message : "Unable to save your name.";
      setError(messageText);
    } finally {
      setSavingName(false);
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
                disabled={needsNamePrompt}
                className="h-12 w-12 rounded-xl border border-black/15 bg-white text-center text-lg font-semibold text-coal outline-none focus:border-coal"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !verificationId || needsNamePrompt}
            className="w-full rounded-full border border-black/20 bg-white px-4 py-3 text-sm font-semibold text-coal disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP & Log In"}
          </button>
        </form>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleResendOtp()}
            disabled={resending || loading || resendCooldown > 0 || needsNamePrompt}
            className="text-sm text-coal underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
          <p className="text-xs text-gray-600">{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "You can resend now."}</p>
        </div>

        <button onClick={() => router.replace("/auth")} className="text-sm text-coal underline underline-offset-4">
          Change mobile number
        </button>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <div id="verify-recaptcha-container" className="hidden" />
      </div>

      {needsNamePrompt ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
          <h3 className="text-base font-semibold text-coal">Tell us your name</h3>
          <p className="mt-1 text-sm text-gray-600">This helps us personalize your account and orders.</p>
          <form className="mt-4 space-y-3" onSubmit={handleSaveName}>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter full name"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-coal outline-none focus:border-coal"
            />
            <button
              type="submit"
              disabled={savingName}
              className="w-full rounded-full bg-coal px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {savingName ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
