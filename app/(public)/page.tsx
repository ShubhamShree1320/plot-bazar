import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/ui/SearchBar";
import PlotCard from "@/components/plots/PlotCard";
import { MapPin, TrendingUp, Shield, Home } from "lucide-react";

export const revalidate = 60;

async function getFeaturedPlots() {
  return prisma.plot.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
}

async function getStats() {
  const [totalPlots, totalCities] = await Promise.all([
    prisma.plot.count({ where: { status: "ACTIVE" } }),
    prisma.plot.findMany({ select: { city: true }, distinct: ["city"], where: { status: "ACTIVE" } }),
  ]);
  return { totalPlots, totalCities: totalCities.length };
}

export default async function HomePage() {
  const [plots, stats] = await Promise.all([getFeaturedPlots(), getStats()]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-blue-300 text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              <span>India's Premier Plot Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <span className="block text-blue-300">Plot of Land</span>
            </h1>
            <p className="text-lg text-blue-100 mb-10 leading-relaxed">
              Discover verified residential and commercial plots. Connect directly with sellers. Invest smart.
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchBar large />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalPlots.toLocaleString()}+</p>
              <p className="text-xs text-gray-500 mt-1">Active Listings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalCities}+</p>
              <p className="text-xs text-gray-500 mt-1">Cities Covered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">100%</p>
              <p className="text-xs text-gray-500 mt-1">Verified Sellers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plots */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Latest Listings</h2>
            <p className="text-gray-500 text-sm mt-1">Recently added plots across India</p>
          </div>
          <Link href="/search" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            View all <span>→</span>
          </Link>
        </div>

        {plots.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No listings yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plots.map((plot) => (
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
      </section>

      {/* Why Us */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Why PlotBazaar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified Listings", desc: "All plots reviewed by our admin team before going live." },
              { icon: MapPin, title: "Map View", desc: "Browse listings on an interactive map with precise coordinates." },
              { icon: TrendingUp, title: "Direct Contact", desc: "Pay a small token to reveal seller contact. No middlemen." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
