import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import Navbar from "@/components/ui/Navbar";
import BlockBanner from "@/components/ui/BlockBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      {user.isBlocked && <BlockBanner />}
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1">{children}</main>
    </>
  );
}
