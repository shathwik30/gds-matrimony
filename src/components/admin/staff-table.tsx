"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { adminToggleStaffStatus, adminDeleteStaff, type AdminStaff } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

interface StaffTableProps {
  staff: AdminStaff[];
}

export function StaffTable({ staff: initialStaff }: StaffTableProps) {
  const [staff, setStaff] = useState(initialStaff);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const handleToggleStatus = (userId: number) => {
    setLoadingId(userId);
    startTransition(async () => {
      const result = await adminToggleStaffStatus(userId);
      if (result.success) {
        toast.success(result.message);
        setStaff((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, isActive: !s.isActive } : s))
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
      setLoadingId(null);
    });
  };

  const handleDelete = (userId: number) => {
    if (!confirm("Are you sure you want to delete this staff account?")) return;

    setLoadingId(userId);
    startTransition(async () => {
      const result = await adminDeleteStaff(userId);
      if (result.success) {
        toast.success(result.message);
        setStaff((prev) => prev.filter((s) => s.id !== userId));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete staff");
      }
      setLoadingId(null);
    });
  };

  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">No staff accounts yet. Create one above.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Profiles Created</th>
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-3 font-medium text-slate-900">{s.name || "—"}</td>
                <td className="px-6 py-3 text-slate-600">{s.email}</td>
                <td className="px-6 py-3">
                  <Badge
                    variant={s.isActive ? "default" : "destructive"}
                    className={s.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-slate-600">{s.createdProfilesCount}</td>
                <td className="px-6 py-3 text-slate-600">
                  {s.createdAt ? formatDate(s.createdAt) : "—"}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(s.id)}
                      disabled={isPending && loadingId === s.id}
                    >
                      {isPending && loadingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : s.isActive ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(s.id)}
                      disabled={isPending && loadingId === s.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
