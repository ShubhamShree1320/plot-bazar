"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ShieldCheck } from "lucide-react";

type Role = "USER" | "ADMIN";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("USER");
  const [form, setForm] = useState({ name: "", identifier: "", adminKey: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevOtp("");

    const isEmail = form.identifier.includes("@");
    const payload = {
      name: form.name,
      role,
      ...(isEmail ? { email: form.identifier } : { phone: form.identifier }),
      ...(role === "ADMIN" && { adminKey: form.adminKey }),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.devOtp) {
          setDevOtp(data.data.devOtp);
        } else {
          router.push(`/verify?identifier=${encodeURIComponent(form.identifier)}`);
        }
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (devOtp) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Dev Mode — OTP Ready</h2>
        <p className="text-gray-500 text-sm mb-6">Email/SMS not configured. Use this OTP to verify:</p>
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-6">
          <p className="text-4xl font-bold tracking-[0.5em] text-amber-700">{devOtp}</p>
        </div>
        <button
          onClick={() => router.push(`/verify?identifier=${encodeURIComponent(form.identifier)}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Enter OTP →
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
      <p className="text-gray-500 text-sm mb-6">Join PlotBazaar as a buyer, seller, or admin</p>

      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole("USER")}
          className={`flex items-center gap-2 justify-center p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            role === "USER"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Buyer / Seller
        </button>
        <button
          type="button"
          onClick={() => setRole("ADMIN")}
          className={`flex items-center gap-2 justify-center p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            role === "ADMIN"
              ? "border-purple-600 bg-purple-50 text-purple-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Admin
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your full name"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email or Phone</label>
          <input
            type="text"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            placeholder="email@example.com or +91xxxxxxxxxx"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {role === "ADMIN" && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Admin Secret Key</label>
            <input
              type="password"
              value={form.adminKey}
              onChange={(e) => setForm({ ...form, adminKey: e.target.value })}
              placeholder="Enter admin registration key"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <p className="text-xs text-gray-400 mt-1">Default dev key: <code className="bg-gray-100 px-1 rounded">admin@plotbazaar</code></p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors text-white ${
            role === "ADMIN"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Sending OTP..." : "Continue with OTP"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
