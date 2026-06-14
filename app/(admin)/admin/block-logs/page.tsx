"use client";

import { useState, useEffect } from "react";
import AdminTable from "@/components/admin/AdminTable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface BlockLog {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  user: { name: string; email: string | null };
  admin: { name: string };
}

export default function AdminBlockLogsPage() {
  const [logs, setLogs] = useState<BlockLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/block-logs?page=${page}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLogs(d.data.logs);
          setTotal(d.data.total);
          setTotalPages(d.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const columns = [
    { key: "user", label: "User",
      render: (row: BlockLog) => (
        <div><p className="font-medium text-gray-900">{row.user?.name}</p><p className="text-xs text-gray-400">{row.user?.email}</p></div>
      )
    },
    { key: "action", label: "Action",
      render: (row: BlockLog) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full
          ${row.action === "BLOCKED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {row.action}
        </span>
      )
    },
    { key: "admin", label: "By Admin",
      render: (row: BlockLog) => <span className="text-sm text-gray-700">{row.admin?.name}</span>
    },
    { key: "reason", label: "Reason",
      render: (row: BlockLog) => <span className="text-xs text-gray-500">{row.reason || "-"}</span>
    },
    { key: "createdAt", label: "Date", sortable: true,
      render: (row: BlockLog) => (
        <span className="text-xs text-gray-500">{format(new Date(row.createdAt), "dd MMM yyyy, HH:mm")}</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Block Logs</h1>
        <p className="text-sm text-gray-500">{total} total records</p>
      </div>

      <AdminTable columns={columns} data={logs} loading={loading} emptyMessage="No block logs found" />

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
