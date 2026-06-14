"use client";

import { useState, useEffect, useCallback } from "react";
import AdminTable from "@/components/admin/AdminTable";
import { Shield, ShieldOff, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
  freeListingsUsed: number;
  createdAt: string;
  _count: { plots: number; tokenPayments: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search, status });
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleBlock(userId: string, shouldBlock: boolean) {
    setActionLoading(userId);
    const endpoint = shouldBlock ? "block" : "unblock";
    try {
      const reason = shouldBlock
        ? window.prompt("Reason for blocking (optional):") || undefined
        : undefined;

      await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  const columns = [
    { key: "name", label: "Name", sortable: true,
      render: (row: AdminUser) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email || row.phone}</p>
        </div>
      )
    },
    { key: "role", label: "Role",
      render: (row: AdminUser) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full
          ${row.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
          {row.role}
        </span>
      )
    },
    { key: "isBlocked", label: "Status",
      render: (row: AdminUser) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full
          ${row.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {row.isBlocked ? "Blocked" : "Active"}
        </span>
      )
    },
    { key: "_count", label: "Listings",
      render: (row: AdminUser) => <span className="text-gray-600">{row._count.plots}</span>
    },
    { key: "createdAt", label: "Joined", sortable: true,
      render: (row: AdminUser) => (
        <span className="text-gray-500 text-xs">{format(new Date(row.createdAt), "dd MMM yyyy")}</span>
      )
    },
    { key: "actions", label: "Actions",
      render: (row: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBlock(row.id, !row.isBlocked)}
            disabled={actionLoading === row.id}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50
              ${row.isBlocked
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-red-50 text-red-700 hover:bg-red-100"}`}
          >
            {row.isBlocked ? <><ShieldOff className="w-3 h-3" /> Unblock</> : <><Shield className="w-3 h-3" /> Block</>}
          </button>
          <select
            value={row.role}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
            disabled={actionLoading === row.id}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <AdminTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

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
