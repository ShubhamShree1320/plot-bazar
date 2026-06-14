"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/ui/PaymentModal";
import ImageUploader from "@/components/plots/ImageUploader";
import { MapPin, Upload, CheckCircle } from "lucide-react";

interface UploadedImage {
  file: File;
  preview: string;
  name: string;
  coordinates: { x: number; y: number; label: string }[];
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
];

export default function NewPlotPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "images" | "payment" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdPlotId, setCreatedPlotId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string; amount: number; paymentId: string; plotData: Record<string, unknown>;
  } | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", price: "", area: "", areaUnit: "sqft",
    state: "", city: "", locality: "", pincode: "", latitude: "", longitude: "",
  });

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      area: parseFloat(form.area),
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };

    try {
      const res = await fetch("/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setCreatedPlotId(data.data.plot.id);
        setStep("images");
      } else if (res.status === 402 && data.data?.requiresPayment) {
        setPaymentData({
          razorpayOrderId: data.data.razorpayOrderId,
          amount: data.data.amount,
          paymentId: data.data.paymentId,
          plotData: payload,
        });
        setShowPayment(true);
      } else {
        setError(data.error || "Failed to create plot");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(paymentResult: {
    razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string;
  }) {
    if (!paymentData) return;
    setLoading(true);

    try {
      const res = await fetch("/api/plots/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentResult,
          paymentId: paymentData.paymentId,
          plotData: paymentData.plotData,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCreatedPlotId(data.data.plot.id);
        setStep("images");
      } else {
        setError(data.error || "Payment confirmation failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImagesUpload() {
    if (!createdPlotId || images.length === 0) {
      setStep("done");
      return;
    }

    setLoading(true);
    setError("");

    try {
      for (const img of images) {
        const formData = new FormData();
        formData.append("imageFile", img.file);
        formData.append("imageName", img.name);
        if (img.coordinates.length > 0) {
          formData.append("coordinates", JSON.stringify(img.coordinates));
        }

        await fetch(`/api/plots/${createdPlotId}/images`, {
          method: "POST",
          body: formData,
        });
      }
      setStep("done");
    } catch {
      setError("Some images failed to upload");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plot Submitted!</h2>
        <p className="text-gray-500 mb-8">Your listing is pending admin approval. We'll notify you once it goes live.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
            Go to Dashboard
          </button>
          {createdPlotId && (
            <button onClick={() => router.push(`/plots/${createdPlotId}`)}
              className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
              View Plot
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">List New Plot</h1>
          <div className="flex items-center gap-2 mt-1">
            {["Plot Details", "Upload Images"].map((s, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full
                ${(i === 0 && step === "form") || (i === 1 && step === "images")
                  ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {step === "form" && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Plot Title *</label>
            <input type="text" value={form.title} onChange={e => handleChange("title", e.target.value)}
              placeholder="e.g. 2400 sqft Residential Plot in Whitefield"
              required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => handleChange("description", e.target.value)}
              rows={4} placeholder="Describe the plot, surroundings, nearby amenities..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => handleChange("price", e.target.value)}
                placeholder="e.g. 2500000" required min="1"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Area *</label>
              <div className="flex gap-2">
                <input type="number" value={form.area} onChange={e => handleChange("area", e.target.value)}
                  placeholder="e.g. 2400" required min="1"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <select value={form.areaUnit} onChange={e => handleChange("areaUnit", e.target.value)}
                  className="border border-gray-200 rounded-xl px-2 py-3 text-sm focus:outline-none">
                  <option value="sqft">sqft</option>
                  <option value="sqyd">sqyd</option>
                  <option value="acre">acre</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">State *</label>
              <select value={form.state} onChange={e => handleChange("state", e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City *</label>
              <input type="text" value={form.city} onChange={e => handleChange("city", e.target.value)}
                placeholder="e.g. Bengaluru" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Locality</label>
              <input type="text" value={form.locality} onChange={e => handleChange("locality", e.target.value)}
                placeholder="e.g. Whitefield"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Pincode</label>
              <input type="text" value={form.pincode} onChange={e => handleChange("pincode", e.target.value)}
                placeholder="e.g. 560066"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={e => handleChange("latitude", e.target.value)}
                placeholder="e.g. 12.9716"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={e => handleChange("longitude", e.target.value)}
                placeholder="e.g. 77.5946"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
            {loading ? "Processing..." : "Next: Upload Images →"}
          </button>
        </form>
      )}

      {step === "images" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Upload Plot Images</h3>
            <p className="text-xs text-gray-500">Add up to 20 images. Click the pin icon to tag coordinates.</p>
          </div>
          <ImageUploader onUpload={setImages} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleImagesUpload} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
              <Upload className="w-4 h-4" />
              {loading ? "Uploading..." : images.length === 0 ? "Skip & Submit" : `Upload ${images.length} Image${images.length !== 1 ? "s" : ""} & Submit`}
            </button>
          </div>
        </div>
      )}

      {paymentData && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={paymentData.amount}
          title="Listing Fee - Post New Plot"
          razorpayOrderId={paymentData.razorpayOrderId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
