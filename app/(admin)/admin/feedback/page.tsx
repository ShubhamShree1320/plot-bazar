"use client";

import { useState, useEffect, useCallback } from "react";
import AdminTable from "@/components/admin/AdminTable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface FeedbackRecord {
  id: string;
  isGenuine: boolean | null;
  status: string;
  comment: string | null;
  createdAt: string;
  submittedAt: string | null;
  buyer: { name: string; email: string | null };
  seller: { name: string; email: string | null };
  plot: { title: string; city: string };
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), filter: filter === "all" ? "" : filter });
    try {
      const res = await fetch(`/api/admin/feedback?${params}`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const columns = [
    { key: "buyer", label: "Buyer",
      render: (row: FeedbackRecord) => (
        <div><p className="font-medium text-gray-900">{row.buyer?.name}</p><p className="text-xs text-gray-400">{row.buyer?.email}</p></div>
      )
    },
    { key: "seller", label: "Seller",
      render: (row: FeedbackRecord) => (
        <div><p className="font-medium text-gray-900">{row.seller?.name}</p><p className="text-xs text-gray-400">{row.seller?.email}</p></div>
      )
    },
    { key: "plot", label: "Plot",
      render: (row: FeedbackRecord) => (
        <span className="text-sm text-gray-700">{row.plot?.title}</span>
      )
    },
    { key: "isGenuine", label: "Result",
      render: (row: FeedbackRecord) => {
        if (row.status === "PENDING") return <span className="text-xs text-yellow-600 font-medium">Pending</span>;
        if (row.isGenuine === true) return <span className="text-xs text-green-600 font-semibold">✓ Genuine</span>;
        if (row.isGenuine === false) return <span className="text-xs text-red-600 font-semibold">✗ Not Genuine</span>;
        return <span className="text-xs text-gray-400">-</span>;
      }
    },
    { key: "comment", label: "Comment",
      render: (row: FeedbackRecord) => (
        <span className="text-xs text-gray-500 max-w-xs truncate block">{row.comment || "-"}</span>
      )
    },
    { key: "createdAt", label: "Date", sortable: true,
      render: (row: FeedbackRecord) => (
        <span className="text-xs text-gray-500">{format(new Date(row.createdAt), "dd MMM yyyy")}</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback Logs</h1>
        <p className="text-sm text-gray-500">{total} total feedback records</p>
      </div>

      <div className="flex gap-2">
        {[
          { val: "all", label: "All" },
          { val: "genuine", label: "✓ Genuine" },
          { val: "not-genuine", label: "✗ Not Genuine" },
          { val: "pending", label: "Pending" },
        ].map(f => (
          <button key={f.val} onClick={() => { setFilter(f.val); setPage(1); }}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors
              ${filter === f.val ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <AdminTable columns={columns} data={feedbacks} loading={loading} emptyMessage="No feedback records found" />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
