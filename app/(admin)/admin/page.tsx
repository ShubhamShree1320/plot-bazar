import { prisma } from "@/lib/prisma";
import { Users, MapPin, DollarSign, Clock, Ban } from "lucide-react";
import AdminStatsChart from "./AdminStatsChart";

export const revalidate = 60;

async function getStats() {
  const [totalUsers, totalPlots, pendingPlots, blockedUsers, tokenRevenue, listingRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.plot.count({ where: { status: { not: "DELETED" } } }),
    prisma.plot.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.tokenPayment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.listingPayment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
  ]);

  const totalRevenue = (tokenRevenue._sum.amount || 0) + (listingRevenue._sum.amount || 0);
  return { totalUsers, totalPlots, pendingPlots, blockedUsers, totalRevenue };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
    { label: "Total Plots", value: stats.totalPlots, icon: MapPin, color: "green" },
    { label: "Pending Approval", value: stats.pendingPlots, icon: Clock, color: "yellow" },
    { label: "Blocked Users", value: stats.blockedUsers, icon: Ban, color: "red" },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "purple",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <AdminStatsChart />
    </div>
  );
}
