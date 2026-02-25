"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminUser, toggleUserStatus, verifyUserProfile } from "@/lib/actions/admin";

interface UserActionsCardProps {
  user: AdminUser;
}

export function UserActionsCard({ user }: UserActionsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const result = await toggleUserStatus(user.id, !user.isActive);
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
      setIsLoading(false);
    }
  };

  const handleVerificationChange = async (value: string) => {
    setIsLoading(true);
    try {
      const result = await verifyUserProfile(
        user.id,
        value as "new_member" | "verified_user" | "highly_trusted"
      );
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update verification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Actions</h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Account Status</label>
        <Button
          variant={user.isActive ? "destructive" : "default"}
          className={user.isActive ? "" : "bg-emerald-600 hover:bg-emerald-700"}
          onClick={handleToggleStatus}
          disabled={isLoading || isPending}
        >
          {isLoading || isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : user.isActive ? (
            <UserX className="mr-2 h-4 w-4" />
          ) : (
            <UserCheck className="mr-2 h-4 w-4" />
          )}
          {user.isActive ? "Suspend User" : "Activate User"}
        </Button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification Level
          </div>
        </label>
        <Select
          defaultValue={user.profile?.trustLevel || "new_member"}
          onValueChange={handleVerificationChange}
          disabled={isLoading || isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_member">New Member</SelectItem>
            <SelectItem value="verified_user">Verified User</SelectItem>
            <SelectItem value="highly_trusted">Highly Trusted</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-slate-500">
          Change the user&apos;s verification trust level
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Quick Links</p>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`/profile/${user.id}`} target="_blank" rel="noopener noreferrer">
              View Public Profile
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
