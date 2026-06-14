"use client";

import { useEffect, useRef } from "react";
import { X, Shield, FlaskConical } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  razorpayOrderId: string;
  devMode?: boolean;
  onSuccess: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => void;
  onFailure?: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

export default function PaymentModal({
  isOpen, onClose, amount, title, razorpayOrderId, devMode = false, onSuccess, onFailure,
}: PaymentModalProps) {
  const scriptLoaded = useRef(false);

  // Load Razorpay SDK only when real keys are configured
  useEffect(() => {
    if (devMode || scriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    scriptLoaded.current = true;
  }, [devMode]);

  useEffect(() => {
    if (!isOpen || devMode || !razorpayOrderId || !window.Razorpay) return;

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      currency: "INR",
      name: "PlotBazaar",
      description: title,
      order_id: razorpayOrderId,
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        onSuccess({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        onClose();
      },
      modal: { ondismiss: () => { onFailure?.(); onClose(); } },
      theme: { color: "#2563eb" },
    });

    rzp.open();
  }, [isOpen, razorpayOrderId, devMode]);

  function handleDevSkip() {
    onSuccess({
      razorpayOrderId,
      razorpayPaymentId: `dev_pay_${Date.now()}`,
      razorpaySignature: "dev_signature",
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Complete Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">₹{amount.toLocaleString("en-IN")}</p>
            <p className="text-sm text-gray-600 mt-1">{title}</p>
          </div>

          {devMode ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Development Mode</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Razorpay keys not configured. Click below to simulate a successful payment.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDevSkip}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Simulate Payment (Dev Mode)
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secured by Razorpay. 256-bit SSL encrypted.</span>
              </div>
              <p className="text-xs text-center text-gray-400">
                Razorpay checkout is opening...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
