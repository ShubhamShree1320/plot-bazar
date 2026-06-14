"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

interface Settings {
  freeListingLimit: number;
  listingFeeAmount: number;
  otpExpiryMinutes: number;
  feedbackDelayHours: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    freeListingLimit: 3, listingFeeAmount: 200, otpExpiryMinutes: 10, feedbackDelayHours: 48,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data.settings); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "freeListingLimit", label: "Free Listing Limit", description: "How many free listings each user can post", unit: "listings" },
    { key: "listingFeeAmount", label: "Listing Fee Amount", description: "Amount charged for listings beyond the free limit", unit: "₹" },
    { key: "otpExpiryMinutes", label: "OTP Expiry Time", description: "How long OTPs remain valid", unit: "minutes" },
    { key: "feedbackDelayHours", label: "Feedback Reminder Delay", description: "Hours after token payment to send seller feedback request", unit: "hours" },
  ] as const;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500">Configure global platform behavior</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-semibold text-gray-900 block mb-1">{field.label}</label>
            <p className="text-xs text-gray-500 mb-2">{field.description}</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings[field.key]}
                onChange={e => setSettings(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                min="1"
                className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-sm text-gray-500">{field.unit}</span>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <p className="text-sm text-green-600 font-medium">✓ Settings saved</p>}
        </div>
      </form>
    </div>
  );
}
