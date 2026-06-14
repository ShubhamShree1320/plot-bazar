"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/ui/PaymentModal";
import { Phone, Mail, Lock, User, CreditCard, AlertTriangle } from "lucide-react";

interface PlotDetailClientProps {
  plotId: string;
  sellerId: string;
  sellerName: string;
  tokenAmount: number | null;
  hasTokenAccess: boolean;
  isLoggedIn: boolean;
  isUserBlocked: boolean;
  plotStatus: string;
}

export default function PlotDetailClient({
  plotId, sellerId, sellerName, tokenAmount, hasTokenAccess, isLoggedIn, isUserBlocked, plotStatus,
}: PlotDetailClientProps) {
  const [contact, setContact] = useState<{ name: string; email: string | null; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{ razorpayOrderId: string; amount: number; devMode: boolean } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function loadContact() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/plots/${plotId}/seller-contact`);
      const data = await res.json();
      if (data.success) {
        setContact(data.data.seller);
      } else {
        setError(data.error || "Failed to load contact");
      }
    } finally {
      setLoading(false);
    }
  }

  async function initiatePayment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/token-payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plotId }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentData({ razorpayOrderId: data.data.razorpayOrderId, amount: data.data.amount, devMode: !!data.data.devMode });
        setShowPayment(true);
      } else {
        setError(data.error || "Failed to create payment");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(paymentResult: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    setLoading(true);
    try {
      const res = await fetch("/api/token-payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentResult),
      });
      const data = await res.json();
      if (data.success) {
        await loadContact();
        router.refresh();
      } else {
        setError(data.error || "Payment verification failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (plotStatus !== "ACTIVE" && plotStatus !== "SOLD") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <p className="text-sm text-yellow-700">This plot is pending admin approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>

        {isUserBlocked ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">Your account is suspended. Contact support.</p>
          </div>
        ) : contact ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <User className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
              </div>
            </div>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-semibold text-blue-700">{contact.phone}</p>
                </div>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-semibold text-blue-700">{contact.email}</p>
                </div>
              </a>
            )}
          </div>
        ) : hasTokenAccess ? (
          <button onClick={loadContact} disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
            {loading ? "Loading..." : "Reveal Contact Details"}
          </button>
        ) : !isLoggedIn ? (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Login to view seller contact</p>
            </div>
            <a href="/login" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              Login to Continue
            </a>
          </div>
        ) : tokenAmount ? (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Seller: <strong>{sellerName}</strong></p>
              <p className="text-xs text-gray-500 mt-1">Pay token to reveal contact</p>
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button onClick={initiatePayment} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
              <CreditCard className="w-4 h-4" />
              {loading ? "Processing..." : `Pay ₹${tokenAmount.toLocaleString("en-IN")} Token`}
            </button>
            <p className="text-xs text-center text-gray-400">One-time payment to unlock seller's contact details</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-700">Token amount not set yet. Check back later.</p>
          </div>
        )}

        {error && !contact && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
      </div>

      {paymentData && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={paymentData.amount}
          title="Token Payment - Reveal Seller Contact"
          razorpayOrderId={paymentData.razorpayOrderId}
          devMode={paymentData.devMode}
          onSuccess={handlePaymentSuccess}
          onFailure={() => setError("Payment failed. Please try again.")}
        />
      )}
    </div>
  );
}
