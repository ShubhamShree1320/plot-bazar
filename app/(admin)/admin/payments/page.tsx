"use client";

import { useState, useEffect, useCallback } from "react";
import AdminTable from "@/components/admin/AdminTable";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface TokenPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  buyer: { name: string; email: string | null };
  plot: { title: string; city: string } | null;
}

interface ListingPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string | null };
  plot: { title: string } | null;
}

export default function AdminPaymentsPage() {
  const [type, setType] = useState<"token" | "listing">("token");
  const [payments, setPayments] = useState<(TokenPayment | ListingPayment)[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ type, page: String(page), status });
    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [type, page, status]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  function exportCSV() {
    const headers = type === "token"
      ? ["ID", "Buyer", "Plot", "Amount", "Status", "Date"]
      : ["ID", "User", "Plot", "Amount", "Status", "Date"];

    const rows = payments.map(p => {
      const tp = p as TokenPayment;
      const lp = p as ListingPayment;
      return [
        p.id,
        type === "token" ? tp.buyer?.name : lp.user?.name,
        type === "token" ? tp.plot?.title : lp.plot?.title,
        p.amount,
        p.status,
        format(new Date(p.createdAt), "dd/MM/yyyy"),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  }

  const STATUS_COLORS: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
  };

  const tokenColumns = [
    { key: "buyer", label: "Buyer",
      render: (row: TokenPayment) => (
        <div><p className="font-medium text-gray-900">{row.buyer?.name}</p><p className="text-xs text-gray-400">{row.buyer?.email}</p></div>
      )
    },
    { key: "plot", label: "Plot",
      render: (row: TokenPayment) => (
        <span className="text-gray-600 text-sm">{row.plot?.title || "-"}</span>
      )
    },
    { key: "amount", label: "Amount", sortable: true,
      render: (row: TokenPayment) => <span className="font-semibold text-gray-900">₹{row.amount.toLocaleString("en-IN")}</span>
    },
    { key: "status", label: "Status",
      render: (row: TokenPayment) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[row.status]}`}>{row.status}</span>
      )
    },
    { key: "createdAt", label: "Date", sortable: true,
      render: (row: TokenPayment) => (
        <span className="text-xs text-gray-500">{format(new Date(row.createdAt), "dd MMM yyyy, HH:mm")}</span>
      )
    },
  ];

  const listingColumns = [
    { key: "user", label: "User",
      render: (row: ListingPayment) => (
        <div><p className="font-medium text-gray-900">{row.user?.name}</p><p className="text-xs text-gray-400">{row.user?.email}</p></div>
      )
    },
    { key: "amount", label: "Amount", sortable: true,
      render: (row: ListingPayment) => <span className="font-semibold text-gray-900">₹{row.amount.toLocaleString("en-IN")}</span>
    },
    { key: "status", label: "Status",
      render: (row: ListingPayment) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[row.status]}`}>{row.status}</span>
      )
    },
    { key: "createdAt", label: "Date", sortable: true,
      render: (row: ListingPayment) => (
        <span className="text-xs text-gray-500">{format(new Date(row.createdAt), "dd MMM yyyy, HH:mm")}</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Logs</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(["token", "listing"] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${type === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "token" ? "Token Payments" : "Listing Payments"}
            </button>
          ))}
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <AdminTable
        columns={(type === "token" ? tokenColumns : listingColumns) as Parameters<typeof AdminTable>[0]["columns"]}
        data={payments as Parameters<typeof AdminTable>[0]["data"]}
        loading={loading}
        emptyMessage="No payment records found"
      />

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
