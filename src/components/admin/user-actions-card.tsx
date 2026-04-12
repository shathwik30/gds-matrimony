"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  UserCheck,
  UserX,
  Shield,
  Heart,
  HeartOff,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminUser,
  toggleUserStatus,
  verifyUserProfile,
  adminToggleMarriedStatus,
  setUserSecondaryPassword,
} from "@/lib/actions/admin";

interface UserActionsCardProps {
  user: AdminUser;
}

export function UserActionsCard({ user }: UserActionsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [secondaryPasswordInput, setSecondaryPasswordInput] = useState("");
  const [revealed, setRevealed] = useState(false);

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

  const handleToggleMarried = async () => {
    setIsLoading(true);
    try {
      const result = await adminToggleMarriedStatus(user.id, !user.profile?.isMarried);
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update married status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSecondaryPassword = async () => {
    const trimmed = secondaryPasswordInput.trim();
    if (!trimmed) {
      toast.error("Please enter a password");
      return;
    }
    setIsLoading(true);
    try {
      const result = await setUserSecondaryPassword(user.id, trimmed);
      if (result.success) {
        toast.success(result.message);
        setSecondaryPasswordInput("");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to set secondary password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSecondaryPassword = async () => {
    setIsLoading(true);
    try {
      const result = await setUserSecondaryPassword(user.id, null);
      if (result.success) {
        toast.success(result.message);
        setRevealed(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to clear secondary password");
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
        <label className="mb-2 block text-sm font-medium text-slate-700">Married Status</label>
        <Button
          variant={user.profile?.isMarried ? "outline" : "default"}
          className={user.profile?.isMarried ? "" : "bg-pink-600 hover:bg-pink-700"}
          onClick={handleToggleMarried}
          disabled={isLoading || isPending}
        >
          {isLoading || isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : user.profile?.isMarried ? (
            <HeartOff className="mr-2 h-4 w-4" />
          ) : (
            <Heart className="mr-2 h-4 w-4" />
          )}
          {user.profile?.isMarried ? "Unmark Married" : "Mark as Married"}
        </Button>
        {user.profile?.isMarried && (
          <p className="mt-1 text-xs text-pink-600">Profile is suspended (married)</p>
        )}
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

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Secondary Password
          </div>
        </label>
        {user.secondaryPassword ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="flex-1 font-mono">
              {revealed ? user.secondaryPassword : "••••••••"}
            </span>
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="text-slate-400 hover:text-slate-600"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <p className="mb-2 text-xs text-slate-400">No secondary password set</p>
        )}
        <div className="flex gap-2">
          <Input
            value={secondaryPasswordInput}
            onChange={(e) => setSecondaryPasswordInput(e.target.value)}
            placeholder="Set new password..."
            className="h-8 text-sm"
            disabled={isLoading || isPending}
          />
          <Button size="sm" onClick={handleSetSecondaryPassword} disabled={isLoading || isPending}>
            Set
          </Button>
          {user.secondaryPassword && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSecondaryPassword}
              disabled={isLoading || isPending}
            >
              Clear
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Share with the user if they forget their password.
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
