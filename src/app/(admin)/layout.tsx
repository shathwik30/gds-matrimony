import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/actions/helpers";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminResult = await requireAdmin();

  if (adminResult.error) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
