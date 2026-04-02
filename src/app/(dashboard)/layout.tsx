import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MarriedGuard } from "@/components/dashboard/married-guard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <DashboardSidebar />

        {/* Main content */}
        <main className="bg-muted/30 min-w-0 flex-1 pb-20 lg:pb-0">
          <MarriedGuard>{children}</MarriedGuard>
        </main>
      </div>
    </div>
  );
}
