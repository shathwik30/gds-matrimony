import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  IndianRupee,
  Heart,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { getAdminDashboard, getRevenueAnalytics, getUserGrowthAnalytics } from "@/lib/actions/admin";
import { StatsCard } from "@/components/admin/stats-card";
import { RevenueChart, UserGrowthChart, GenderDistributionChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [dashboardResult, revenueResult, userGrowthResult] = await Promise.all([
    getAdminDashboard(),
    getRevenueAnalytics(),
    getUserGrowthAnalytics(),
  ]);

  const dashboard = dashboardResult.data;
  const revenueData = revenueResult.data || [];
  const userGrowthData = userGrowthResult.data || [];

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={dashboard.totalUsers.toLocaleString()}
          description={`${dashboard.activeUsers} active`}
          icon={Users}
        />
        <StatsCard
          title="New Users Today"
          value={dashboard.newUsersToday}
          description={`${dashboard.newUsersThisWeek} this week`}
          icon={UserPlus}
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${dashboard.totalRevenue.toLocaleString()}`}
          description={`₹${dashboard.revenueThisMonth.toLocaleString()} this month`}
          icon={IndianRupee}
        />
        <StatsCard
          title="Active Subscriptions"
          value={dashboard.activeSubscriptions}
          description={`${dashboard.totalSubscriptions} total paid`}
          icon={CreditCard}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <UserGrowthChart data={userGrowthData} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Verified Profiles"
          value={dashboard.verifiedProfiles}
          icon={UserCheck}
        />
        <StatsCard
          title="Total Interests"
          value={dashboard.totalInterests}
          description={`${dashboard.acceptedInterests} accepted`}
          icon={Heart}
        />
        <StatsCard
          title="Pending Reports"
          value={dashboard.pendingReports}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Pending Verifications"
          value={dashboard.pendingVerifications}
          icon={Shield}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <GenderDistributionChart
          male={dashboard.maleUsers}
          female={dashboard.femaleUsers}
        />

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{dashboard.newUsersThisMonth}</p>
              <p className="text-sm text-slate-500">New users this month</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">
                {dashboard.totalUsers > 0
                  ? Math.round((dashboard.verifiedProfiles / dashboard.totalUsers) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500">Profile verification rate</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">
                {dashboard.totalInterests > 0
                  ? Math.round((dashboard.acceptedInterests / dashboard.totalInterests) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500">Interest acceptance rate</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboard.maleUsers}</p>
              <p className="text-sm text-slate-500">Male profiles</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-2xl font-bold text-pink-600">{dashboard.femaleUsers}</p>
              <p className="text-sm text-slate-500">Female profiles</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">
                ₹{dashboard.totalSubscriptions > 0
                  ? Math.round(dashboard.totalRevenue / dashboard.totalSubscriptions).toLocaleString()
                  : 0}
              </p>
              <p className="text-sm text-slate-500">Avg. revenue per subscription</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
