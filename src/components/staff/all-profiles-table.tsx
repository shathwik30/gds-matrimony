"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { staffGetAllPlatformProfiles, type PlatformProfile } from "@/lib/actions/staff";
import { getFullName, heightToFeetInches } from "@/lib/utils";

interface AllProfilesTableProps {
  initialUsers: PlatformProfile[];
  initialTotal: number;
}

function capitalize(val: string | null | undefined): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function calculateAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

export function AllProfilesTable({ initialUsers, initialTotal }: AllProfilesTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = (newPage: number, newSearch: string) => {
    startTransition(async () => {
      const result = await staffGetAllPlatformProfiles(newPage, limit, newSearch);
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
            placeholder="Search by name or email..."
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
            {search
              ? "No profiles found matching your search."
              : "No profiles on the platform yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Basic Details</th>
                  <th className="px-4 py-3 font-medium">Religion & Location</th>
                  <th className="px-4 py-3 font-medium">Education</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {user.profileImage && <AvatarImage src={user.profileImage} />}
                          <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-600">
                            {(user.firstName?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">
                            {getFullName(user.firstName, user.lastName)}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{user.gender || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Basic Details */}
                    <td className="px-4 py-3 text-slate-600">
                      <div className="space-y-0.5">
                        <p>Age: {calculateAge(user.dateOfBirth)}</p>
                        <p>Height: {user.height ? heightToFeetInches(user.height) : "—"}</p>
                        <p>Status: {capitalize(user.maritalStatus)}</p>
                      </div>
                    </td>

                    {/* Religion & Location */}
                    <td className="px-4 py-3 text-slate-600">
                      <div className="space-y-0.5">
                        <p>
                          {capitalize(user.religion)}
                          {user.caste ? ` — ${capitalize(user.caste)}` : ""}
                        </p>
                        <p>
                          {[user.residingCity, user.residingState].filter(Boolean).join(", ") ||
                            "—"}
                        </p>
                        <p>{capitalize(user.countryLivingIn)}</p>
                      </div>
                    </td>

                    {/* Education */}
                    <td className="px-4 py-3 text-slate-600">
                      <div className="space-y-0.5">
                        <p>{capitalize(user.highestEducation)}</p>
                        {user.educationDetail && (
                          <p className="text-xs text-slate-500">{user.educationDetail}</p>
                        )}
                        {user.occupation && <p>Occupation: {capitalize(user.occupation)}</p>}
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
