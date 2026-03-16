"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Loader2, ChevronLeft, ChevronRight, Share2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffGetMyCreatedUsers, type StaffCreatedUser } from "@/lib/actions/staff";
import { formatDate, getFullName } from "@/lib/utils";
import { toast } from "sonner";

interface StaffProfilesTableProps {
  initialUsers: StaffCreatedUser[];
  initialTotal: number;
}

export function StaffProfilesTable({ initialUsers, initialTotal }: StaffProfilesTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleShare = (userId: number) => {
    const url = `${window.location.origin}/shared-profile/${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(userId);
      toast.success("Profile link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = (newPage: number, newSearch: string) => {
    startTransition(async () => {
      const result = await staffGetMyCreatedUsers(newPage, limit, newSearch);
      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotal(result.data.total);
        setPage(newPage);
      }
    });
  };

  const handleSearch = () => {
    fetchUsers(1, search);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {search ? "No profiles found matching your search." : "No profiles created yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Completion</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {getFullName(user.firstName, user.lastName)}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{user.email}</td>
                    <td className="px-6 py-3 text-slate-600 capitalize">{user.gender || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant="outline"
                        className={
                          (user.profileCompletion || 0) >= 70
                            ? "border-emerald-500 text-emerald-600"
                            : "border-amber-500 text-amber-600"
                        }
                      >
                        {user.profileCompletion || 0}%
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {user.createdAt ? formatDate(user.createdAt) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/staff/profiles/${user.id}`}
                          className="text-brand hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(user.id)}
                          className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-900"
                        >
                          {copiedId === user.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                          Share
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(page - 1, search)}
                disabled={page <= 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(page + 1, search)}
                disabled={page >= totalPages || isPending}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
