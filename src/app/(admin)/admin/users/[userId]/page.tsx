import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAdminUserDetails } from "@/lib/actions/admin";
import { getInitials } from "@/lib/utils";
import { UserActionsCard } from "@/components/admin/user-actions-card";

export const dynamic = "force-dynamic";

interface UserDetailPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    notFound();
  }
  const result = await getAdminUserDetails(parsedUserId);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
          <p className="text-slate-500">View and manage user information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profile?.profileImage || undefined} />
              <AvatarFallback className="bg-brand/10 text-brand text-2xl">
                {getInitials(user.profile?.firstName, user.profile?.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {user.profile?.firstName || ""} {user.profile?.lastName || ""}
                  {!user.profile?.firstName && !user.profile?.lastName && (
                    <span className="text-slate-400 italic">No name</span>
                  )}
                </h2>
                <p className="text-slate-500">{user.profile?.gender || "Gender not specified"}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                  className={user.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                >
                  {user.isActive ? "Active" : "Suspended"}
                </Badge>
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
                {user.emailVerified && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    Email Verified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {user.email}
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phoneNumber}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Joined {user.createdAt ? format(new Date(user.createdAt), "PPP") : "Unknown"}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Last active{" "}
                  {user.lastActive
                    ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                    : "Never"}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Profile Completion</span>
              <span className="text-sm text-slate-500">{user.profile?.profileCompletion || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand h-2 rounded-full transition-all"
                style={{ width: `${user.profile?.profileCompletion || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <UserActionsCard user={user} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{user.profileViews}</p>
              <p className="text-sm text-slate-500">Profile Views</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{user.interestsSent}</p>
              <p className="text-sm text-slate-500">Interests Sent</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{user.interestsReceived}</p>
              <p className="text-sm text-slate-500">Interests Received</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{user.messagesCount}</p>
              <p className="text-sm text-slate-500">Messages Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900">Subscription</h3>
        </div>

        {user.subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500">Plan</p>
              <p className="font-medium text-slate-900 capitalize">{user.subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <Badge variant={user.subscription.isActive ? "default" : "secondary"}>
                {user.subscription.isActive ? "Active" : "Expired"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">End Date</p>
              <p className="font-medium text-slate-900">
                {user.subscription.endDate
                  ? format(new Date(user.subscription.endDate), "PPP")
                  : "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">No active subscription - Free plan</p>
        )}
      </div>
    </div>
  );
}
