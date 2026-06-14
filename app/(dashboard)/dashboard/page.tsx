import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlotCard from "@/components/plots/PlotCard";
import { Plus, CreditCard, MapPin, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [myPlots, tokenPayments, settings] = await Promise.all([
    prisma.plot.findMany({
      where: { sellerId: user.id, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
    prisma.tokenPayment.findMany({
      where: { buyerId: user.id, status: "COMPLETED" },
      include: { plot: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.settings.findUnique({ where: { id: "global" } }),
  ]);

  const freeLeft = Math.max(0, (settings?.freeListingLimit || 3) - user.freeListingsUsed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user.name}</p>
        </div>
        <Link href="/plots/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> List New Plot
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myPlots.length}</p>
              <p className="text-xs text-gray-500">My Listings</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{freeLeft} free listing{freeLeft !== 1 ? "s" : ""} remaining</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tokenPayments.length}</p>
              <p className="text-xs text-gray-500">Contacts Unlocked</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {myPlots.filter(p => p.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-gray-500">Active Listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Plots */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Listings</h2>
        {myPlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No listings yet</p>
            <Link href="/plots/new" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">
              + Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myPlots.map((plot) => (
              <PlotCard
                key={plot.id}
                id={plot.id}
                title={plot.title}
                price={plot.price}
                area={plot.area}
                areaUnit={plot.areaUnit}
                city={plot.city}
                state={plot.state}
                status={plot.status}
                imageUrl={plot.images[0]?.imageUrl}
                tokenAmount={plot.tokenAmount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
