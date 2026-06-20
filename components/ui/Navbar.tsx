"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, MapPin, User, LogOut, LayoutDashboard, Shield } from "lucide-react";

interface NavUser {
  id: string;
  name: string;
  role: string;
  isBlocked: boolean;
}

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data.user); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Plot<span className="text-blue-600">Bazaar</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Browse Plots
            </Link>
            <Link href="/map" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              Explore Map
            </Link>
            {user && (
              <Link href="/plots/new" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
                List Plot
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name[0].toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name.split(" ")[0]}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 w-56 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  Register
                </Link>
              </>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-500 hover:text-gray-700">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/search" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg">
              Browse Plots
            </Link>
            <Link href="/map" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg">
              Explore Map
            </Link>
            {user && (
              <Link href="/plots/new" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg">
                List Plot
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
