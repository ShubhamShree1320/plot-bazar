import Navbar from "@/components/ui/Navbar";
import { getCurrentUser } from "@/lib/auth-helpers";
import BlockBanner from "@/components/ui/BlockBanner";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      {user?.isBlocked && <BlockBanner />}
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2025 PlotBazaar. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
