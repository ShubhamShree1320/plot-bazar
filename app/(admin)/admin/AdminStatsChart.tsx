"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface MonthData {
  month: string;
  plots: number;
  revenue: number;
}

export default function AdminStatsChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const monthMap: Record<string, MonthData> = {};

          d.data.recentPlots.forEach((item: { createdAt: string; _count: number }) => {
            const m = format(new Date(item.createdAt), "MMM yy");
            if (!monthMap[m]) monthMap[m] = { month: m, plots: 0, revenue: 0 };
            monthMap[m].plots += item._count;
          });

          d.data.recentRevenue.forEach((item: { createdAt: string; _sum: { amount: number } }) => {
            const m = format(new Date(item.createdAt), "MMM yy");
            if (!monthMap[m]) monthMap[m] = { month: m, plots: 0, revenue: 0 };
            monthMap[m].revenue += item._sum.amount || 0;
          });

          setData(Object.values(monthMap).slice(-6));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Listings per Month</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="plots" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue per Month (₹)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: unknown) => `₹${Number(v).toLocaleString("en-IN")}`} />
            <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
