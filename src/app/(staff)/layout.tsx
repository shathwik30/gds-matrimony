import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/actions/helpers";
import { StaffSidebar } from "@/components/staff/staff-sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staffResult = await requireStaff();

  if (staffResult.error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <StaffSidebar />
      <main className="lg:pl-64">
        <div className="p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
