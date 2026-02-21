"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { AdminUser, toggleUserStatus, verifyUserProfile } from "@/lib/actions/admin";
import { getInitials } from "@/lib/utils";

interface UsersTableProps {
  users: AdminUser[];
  total: number;
  currentPage: number;
}

export function UsersTable({ users, total, currentPage }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  const totalPages = Math.ceil(total / 20);

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    setLoadingUserId(userId);
    try {
      const result = await toggleUserStatus(userId, isActive);
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleVerifyUser = async (userId: number, trustLevel: "new_member" | "verified_user" | "highly_trusted") => {
    setLoadingUserId(userId);
    try {
      const result = await verifyUserProfile(userId, trustLevel);
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to verify user");
    } finally {
      setLoadingUserId(null);
    }
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile?.profileImage || undefined} />
                        <AvatarFallback className="bg-brand/10 text-brand">
                          {getInitials(user.profile?.firstName, user.profile?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.profile?.firstName || ""} {user.profile?.lastName || ""}
                          {!user.profile?.firstName && !user.profile?.lastName && (
                            <span className="text-slate-400 italic">No name</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "destructive"}
                      className={user.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.profile?.trustLevel === "verified_user"
                          ? "border-blue-500 text-blue-600"
                          : user.profile?.trustLevel === "highly_trusted"
                          ? "border-purple-500 text-purple-600"
                          : "border-slate-300 text-slate-500"
                      }
                    >
                      {user.profile?.trustLevel || "new_member"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.subscription?.plan === "platinum"
                          ? "border-purple-500 text-purple-600"
                          : user.subscription?.plan === "gold"
                          ? "border-amber-500 text-amber-600"
                          : user.subscription?.plan === "silver"
                          ? "border-slate-400 text-slate-600"
                          : "border-slate-300 text-slate-500"
                      }
                    >
                      {user.subscription?.plan ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1) : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {user.createdAt
                      ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {user.lastActive
                      ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loadingUserId === user.id}>
                          {loadingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleToggleStatus(user.id, false)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-emerald-600"
                            onClick={() => handleToggleStatus(user.id, true)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "verified_user")}>
                          <Shield className="mr-2 h-4 w-4 text-blue-500" />
                          Mark Verified
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "highly_trusted")}>
                          <Shield className="mr-2 h-4 w-4 text-purple-500" />
                          Mark Highly Trusted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "new_member")}>
                          <Shield className="mr-2 h-4 w-4 text-slate-400" />
                          Reset to New Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
