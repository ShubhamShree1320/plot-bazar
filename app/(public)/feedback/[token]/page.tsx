"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle, XCircle, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ response?: string }>;
}

export default function FeedbackPage({ params, searchParams }: PageProps) {
  const { token } = use(params);
  const { response: quickResponse } = use(searchParams);

  const [state, setState] = useState<"loading" | "form" | "success" | "already-submitted" | "error">("loading");
  const [feedbackData, setFeedbackData] = useState<{ buyerName: string; plotTitle: string } | null>(null);
  const [isGenuine, setIsGenuine] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const url = `/api/feedback/${token}${quickResponse ? `?response=${quickResponse}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success) { setState("error"); return; }

        if (data.data.alreadySubmitted || data.data.submitted) {
          setState("already-submitted");
        } else {
          setFeedbackData({ buyerName: data.data.buyerName, plotTitle: data.data.plotTitle });
          setState("form");
        }
      } catch {
        setState("error");
      }
    }
    load();
  }, [token, quickResponse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGenuine === null) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGenuine, comment }),
      });
      const data = await res.json();
      if (data.success) { setState("success"); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold">PlotBazaar Feedback</h1>
          <p className="text-blue-100 text-sm mt-1">Help us maintain a genuine community</p>
        </div>

        <div className="p-6">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading feedback form...</p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Invalid or Expired Link</p>
              <p className="text-sm text-gray-500 mt-1">This feedback link is no longer valid.</p>
            </div>
          )}

          {state === "already-submitted" && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Feedback Already Submitted</p>
              <p className="text-sm text-gray-500 mt-1">Thank you for your earlier response.</p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Thank You!</p>
              <p className="text-sm text-gray-500 mt-1">Your feedback helps keep our platform genuine.</p>
            </div>
          )}

          {state === "form" && feedbackData && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  Did buyer <strong className="text-blue-700">{feedbackData.buyerName}</strong> contact you genuinely
                  regarding your plot <strong>"{feedbackData.plotTitle}"</strong>?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenuine(true)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${isGenuine === true ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                >
                  <ThumbsUp className={`w-6 h-6 ${isGenuine === true ? "text-green-600" : "text-gray-400"}`} />
                  <span className="text-sm font-semibold text-gray-700">Yes, Genuine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGenuine(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${isGenuine === false ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
                >
                  <ThumbsDown className={`w-6 h-6 ${isGenuine === false ? "text-red-600" : "text-gray-400"}`} />
                  <span className="text-sm font-semibold text-gray-700">Not Genuine</span>
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Additional Comments <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Share more details about your experience..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <button
                type="submit"
                disabled={isGenuine === null || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
