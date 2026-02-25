import { Suspense } from "react";
import {
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getAdminDashboard,
  getDetailedAnalytics,
} from "@/lib/actions/admin";
import {
  RevenueChart,
  UserGrowthChart,
  GenderDistributionChart,
  SubscriptionDistributionChart,
} from "@/components/admin/charts";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function AnalyticsContent() {
  const [revenueResult, userGrowthResult, dashboardResult, detailedAnalytics] = await Promise.all([
    getRevenueAnalytics(),
    getUserGrowthAnalytics(),
    getAdminDashboard(),
    getDetailedAnalytics(),
  ]);

  const revenueData = revenueResult.data || [];
  const userGrowthData = userGrowthResult.data || [];
  const dashboard = dashboardResult.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData} />
        <UserGrowthChart data={userGrowthData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {dashboard && (
          <GenderDistributionChart male={dashboard.maleUsers} female={dashboard.femaleUsers} />
        )}
        <SubscriptionDistributionChart data={detailedAnalytics.planCounts} />

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Interest Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm text-slate-600">Total Interests</span>
              <span className="text-lg font-bold text-slate-900">
                {detailedAnalytics.interestStats.total}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
              <span className="text-sm text-yellow-700">Pending</span>
              <span className="text-lg font-bold text-yellow-700">
                {detailedAnalytics.interestStats.pending}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <span className="text-sm text-emerald-700">Accepted</span>
              <span className="text-lg font-bold text-emerald-700">
                {detailedAnalytics.interestStats.accepted}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
              <span className="text-sm text-red-700">Rejected</span>
              <span className="text-lg font-bold text-red-700">
                {detailedAnalytics.interestStats.rejected}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Acceptance Rate</span>
                <span className="text-brand text-lg font-bold">
                  {detailedAnalytics.interestStats.total > 0
                    ? Math.round(
                        (detailedAnalytics.interestStats.accepted /
                          (detailedAnalytics.interestStats.accepted +
                            detailedAnalytics.interestStats.rejected)) *
                          100
                      ) || 0
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Profile Completion Distribution
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {detailedAnalytics.completionRanges.map((range) => (
            <div key={range.range} className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{range.count}</p>
              <p className="text-sm text-slate-500">{range.range}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
              {detailedAnalytics.completionRanges.map((range, index) => {
                const total = detailedAnalytics.completionRanges.reduce(
                  (acc, r) => acc + r.count,
                  0
                );
                const width = total > 0 ? (range.count / total) * 100 : 0;
                const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
                return (
                  <div
                    key={range.range}
                    className="inline-block h-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: colors[index],
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              0-25%
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              25-50%
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              50-75%
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              75-100%
            </span>
          </div>
        </div>
      </div>

      {dashboard && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Key Metrics Summary</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboard.totalUsers}</p>
              <p className="text-xs text-slate-500">Total Users</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{dashboard.activeUsers}</p>
              <p className="text-xs text-slate-500">Active Users</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{dashboard.verifiedProfiles}</p>
              <p className="text-xs text-slate-500">Verified Profiles</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{dashboard.activeSubscriptions}</p>
              <p className="text-xs text-slate-500">Paid Members</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-4 text-center">
              <p className="text-2xl font-bold text-pink-600">{dashboard.totalInterests}</p>
              <p className="text-xs text-slate-500">Total Interests</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                ₹{dashboard.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total Revenue</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500">Detailed platform analytics and insights</p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-brand h-8 w-8 animate-spin" />
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
