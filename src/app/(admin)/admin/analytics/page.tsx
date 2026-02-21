import { Suspense } from "react";
import { getRevenueAnalytics, getUserGrowthAnalytics, getAdminDashboard, getDetailedAnalytics } from "@/lib/actions/admin";
import { RevenueChart, UserGrowthChart, GenderDistributionChart, SubscriptionDistributionChart } from "@/components/admin/charts";
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
      {/* Revenue & User Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <UserGrowthChart data={userGrowthData} />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboard && (
          <GenderDistributionChart
            male={dashboard.maleUsers}
            female={dashboard.femaleUsers}
          />
        )}
        <SubscriptionDistributionChart data={detailedAnalytics.planCounts} />

        {/* Interest Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Total Interests</span>
              <span className="text-lg font-bold text-slate-900">
                {detailedAnalytics.interestStats.total}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-700">Pending</span>
              <span className="text-lg font-bold text-yellow-700">
                {detailedAnalytics.interestStats.pending}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm text-emerald-700">Accepted</span>
              <span className="text-lg font-bold text-emerald-700">
                {detailedAnalytics.interestStats.accepted}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">Rejected</span>
              <span className="text-lg font-bold text-red-700">
                {detailedAnalytics.interestStats.rejected}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Acceptance Rate</span>
                <span className="text-lg font-bold text-brand">
                  {detailedAnalytics.interestStats.total > 0
                    ? Math.round(
                        (detailedAnalytics.interestStats.accepted /
                          (detailedAnalytics.interestStats.accepted +
                            detailedAnalytics.interestStats.rejected)) *
                          100
                      ) || 0
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Completion Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {detailedAnalytics.completionRanges.map((range) => (
            <div
              key={range.range}
              className="p-4 bg-slate-50 rounded-lg text-center"
            >
              <p className="text-2xl font-bold text-slate-900">{range.count}</p>
              <p className="text-sm text-slate-500">{range.range}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
              {detailedAnalytics.completionRanges.map((range, index) => {
                const total = detailedAnalytics.completionRanges.reduce((acc, r) => acc + r.count, 0);
                const width = total > 0 ? (range.count / total) * 100 : 0;
                const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];
                return (
                  <div
                    key={range.range}
                    className="h-full inline-block"
                    style={{
                      width: `${width}%`,
                      backgroundColor: colors[index],
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              0-25%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              25-50%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              50-75%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              75-100%
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      {dashboard && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboard.totalUsers}</p>
              <p className="text-xs text-slate-500">Total Users</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{dashboard.activeUsers}</p>
              <p className="text-xs text-slate-500">Active Users</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{dashboard.verifiedProfiles}</p>
              <p className="text-xs text-slate-500">Verified Profiles</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{dashboard.activeSubscriptions}</p>
              <p className="text-xs text-slate-500">Paid Members</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-2xl font-bold text-pink-600">{dashboard.totalInterests}</p>
              <p className="text-xs text-slate-500">Total Interests</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500">Detailed platform analytics and insights</p>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
