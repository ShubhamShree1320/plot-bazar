"use client";

import { useState, useEffect, useCallback } from "react";
import AdminTable from "@/components/admin/AdminTable";
import { CheckCircle, XCircle, Edit3, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface AdminPlot {
  id: string;
  title: string;
  status: string;
  city: string;
  state: string;
  tokenAmount: number | null;
  createdAt: string;
  seller: { name: string; email: string | null };
  _count: { tokenPayments: number };
}

export default function AdminPlotsPage() {
  const [plots, setPlots] = useState<AdminPlot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState("");

  const fetchPlots = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, status });
    try {
      const res = await fetch(`/api/admin/plots?${params}`);
      const data = await res.json();
      if (data.success) {
        setPlots(data.data.plots);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchPlots(); }, [fetchPlots]);

  async function handleApprove(plotId: string, action: "approve" | "reject") {
    setActionLoading(plotId);
    try {
      await fetch(`/api/admin/plots/${plotId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchPlots();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetToken(plotId: string) {
    const amount = parseFloat(tokenValue);
    if (!amount || amount <= 0) return;
    setActionLoading(plotId);
    try {
      await fetch(`/api/admin/plots/${plotId}/token`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAmount: amount }),
      });
      setEditingToken(null);
      setTokenValue("");
      fetchPlots();
    } finally {
      setActionLoading(null);
    }
  }

  const columns = [
    { key: "title", label: "Title", sortable: true,
      render: (row: AdminPlot) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate">{row.title}</p>
          <p className="text-xs text-gray-400">{row.city}, {row.state}</p>
        </div>
      )
    },
    { key: "seller", label: "Seller",
      render: (row: AdminPlot) => (
        <div>
          <p className="text-sm text-gray-700">{row.seller.name}</p>
          <p className="text-xs text-gray-400">{row.seller.email}</p>
        </div>
      )
    },
    { key: "status", label: "Status",
      render: (row: AdminPlot) => {
        const colors: Record<string, string> = {
          PENDING: "bg-yellow-100 text-yellow-700",
          ACTIVE: "bg-green-100 text-green-700",
          SOLD: "bg-blue-100 text-blue-700",
          DELETED: "bg-red-100 text-red-700",
        };
        return (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[row.status] || "bg-gray-100 text-gray-600"}`}>
            {row.status}
          </span>
        );
      }
    },
    { key: "tokenAmount", label: "Token",
      render: (row: AdminPlot) => (
        editingToken === row.id ? (
          <div className="flex items-center gap-1">
            <input type="number" value={tokenValue} onChange={e => setTokenValue(e.target.value)}
              className="w-20 text-xs border border-gray-200 rounded px-2 py-1" placeholder="₹" autoFocus />
            <button onClick={() => handleSetToken(row.id)} className="text-green-600 hover:text-green-700">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingToken(null)} className="text-red-400 hover:text-red-500">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-700">
              {row.tokenAmount ? `₹${row.tokenAmount.toLocaleString("en-IN")}` : "-"}
            </span>
            <button onClick={() => { setEditingToken(row.id); setTokenValue(String(row.tokenAmount || "")); }}
              className="text-gray-400 hover:text-blue-600">
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )
      )
    },
    { key: "createdAt", label: "Date", sortable: true,
      render: (row: AdminPlot) => (
        <span className="text-xs text-gray-500">{format(new Date(row.createdAt), "dd MMM yyyy")}</span>
      )
    },
    { key: "actions", label: "Actions",
      render: (row: AdminPlot) => (
        <div className="flex items-center gap-2">
          {row.status === "PENDING" && (
            <>
              <button onClick={() => handleApprove(row.id, "approve")}
                disabled={actionLoading === row.id}
                className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1.5 rounded-lg font-medium disabled:opacity-50">
                <CheckCircle className="w-3 h-3" /> Approve
              </button>
              <button onClick={() => handleApprove(row.id, "reject")}
                disabled={actionLoading === row.id}
                className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1.5 rounded-lg font-medium disabled:opacity-50">
                <XCircle className="w-3 h-3" /> Reject
              </button>
            </>
          )}
          {row.status === "ACTIVE" && (
            <button onClick={() => handleApprove(row.id, "reject")}
              disabled={actionLoading === row.id}
              className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1.5 rounded-lg font-medium disabled:opacity-50">
              <XCircle className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plot Management</h1>
        <p className="text-sm text-gray-500">{total} total plots</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search plots..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SOLD">Sold</option>
        </select>
      </div>

      <AdminTable columns={columns} data={plots} loading={loading} emptyMessage="No plots found" />

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
