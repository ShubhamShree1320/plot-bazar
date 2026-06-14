"use client";

import { Suspense, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OTPInput from "@/components/auth/OTPInput";
import { useAuthStore } from "@/store/authStore";

function VerifyForm() {
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  async function handleOTPComplete(otp: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data.user);
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    const isEmail = identifier.includes("@");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (data.success && data.data?.devOtp) setDevOtp(data.data.devOtp);
      if (!data.success) setError(data.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Enter OTP</h2>
      <p className="text-gray-500 text-sm mb-2">
        We sent a 6-digit OTP to
      </p>
      <p className="font-semibold text-blue-600 text-sm mb-8">{identifier}</p>

      {devOtp && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-xs text-amber-600 font-medium mb-1">Dev Mode OTP</p>
          <p className="text-2xl font-bold tracking-widest text-amber-700">{devOtp}</p>
        </div>
      )}

      <div className="mb-6">
        <OTPInput onComplete={handleOTPComplete} disabled={loading} />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center mb-4">{error}</p>
      )}

      {loading && (
        <p className="text-sm text-blue-600 text-center mb-4">Verifying...</p>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Didn't receive?{" "}
          <button onClick={handleResend} disabled={resending}
            className="text-blue-600 font-medium hover:underline disabled:opacity-50">
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
