"use client";

import { AlertTriangle } from "lucide-react";

export default function BlockBanner() {
  return (
    <div className="bg-red-600 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          Your account has been suspended due to multiple reports. You cannot post listings, make payments, or view seller contacts.
          Contact <a href="mailto:support@plotbazaar.in" className="underline font-bold">support@plotbazaar.in</a> for assistance.
        </p>
      </div>
    </div>
  );
}
