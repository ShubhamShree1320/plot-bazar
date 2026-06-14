import Link from "next/link";
import { MapPin } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-white">Plot<span className="text-blue-300">Bazaar</span></span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
