import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import PlotImageWithPins from "@/components/plots/PlotImageWithPins";
import PlotDetailClient from "./PlotDetailClient";
import { MapPin, Ruler, Calendar, Building2 } from "lucide-react";
import MapViewClient from "@/components/map/MapViewClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlotDetailPage({ params }: PageProps) {
  const { id } = await params;

  const plot = await prisma.plot.findUnique({
    where: { id, status: { not: "DELETED" } },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      seller: { select: { id: true, name: true } },
      _count: { select: { tokenPayments: { where: { status: "COMPLETED" } } } },
    },
  });

  if (!plot) notFound();

  const user = await getCurrentUser();

  // Check if current user has paid token
  let hasTokenAccess = false;
  if (user) {
    if (user.id === plot.sellerId) {
      hasTokenAccess = true;
    } else {
      const payment = await prisma.tokenPayment.findUnique({
        where: { buyerId_plotId: { buyerId: user.id, plotId: id } },
      });
      hasTokenAccess = payment?.status === "COMPLETED";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            {plot.images.length > 0 ? (
              <>
                <PlotImageWithPins
                  imageUrl={plot.images[0].imageUrl}
                  coordinates={(plot.images[0].coordinates as { x: number; y: number; label: string }[]) || []}
                  alt={plot.title}
                />
                {plot.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {plot.images.slice(1).map((img, i) => (
                      <PlotImageWithPins
                        key={i}
                        imageUrl={img.imageUrl}
                        coordinates={(img.coordinates as { x: number; y: number; label: string }[]) || []}
                        alt={`${plot.title} ${i + 2}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                No images uploaded
              </div>
            )}
          </div>

          {/* Plot Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full mb-2 inline-block
                  ${plot.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {plot.status}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">{plot.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">₹{plot.price.toLocaleString("en-IN")}</p>
                <p className="text-sm text-gray-500">Total Price</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900">{plot.area.toLocaleString()} {plot.areaUnit}</p>
                <p className="text-xs text-gray-500">Area</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900">{plot.city}</p>
                <p className="text-xs text-gray-500">{plot.state}</p>
              </div>
              {plot.locality && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{plot.locality}</p>
                  <p className="text-xs text-gray-500">Locality</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(plot.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-gray-500">Listed On</p>
              </div>
            </div>

            {plot.description && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{plot.description}</p>
              </div>
            )}
          </div>

          {/* Map */}
          {plot.latitude && plot.longitude && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
              <div className="h-64 rounded-xl overflow-hidden">
                <MapViewClient
                  plots={[{
                    id: plot.id,
                    title: plot.title,
                    price: plot.price,
                    latitude: plot.latitude,
                    longitude: plot.longitude,
                    city: plot.city,
                    imageUrl: plot.images[0]?.imageUrl,
                  }]}
                  center={[plot.latitude, plot.longitude]}
                  zoom={15}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <PlotDetailClient
            plotId={plot.id}
            sellerId={plot.sellerId}
            sellerName={plot.seller.name}
            tokenAmount={plot.tokenAmount}
            hasTokenAccess={hasTokenAccess}
            isLoggedIn={!!user}
            isUserBlocked={user?.isBlocked || false}
            plotStatus={plot.status}
          />
        </div>
      </div>
    </div>
  );
}
