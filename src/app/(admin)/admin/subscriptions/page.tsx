import { Suspense } from "react";
import { getSubscriptionStats, getRecentSubscriptionsAdmin } from "@/lib/actions/admin";
import { SubscriptionsTable } from "@/components/admin/subscriptions-table";
import { Loader2, CreditCard, IndianRupee, TrendingUp, Users } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";

export const dynamic = "force-dynamic";

async function SubscriptionsContent() {
  const [stats, subs] = await Promise.all([
    getSubscriptionStats(),
    getRecentSubscriptionsAdmin(),
  ]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Paid Subscriptions"
          value={stats.totalPaid}
          icon={CreditCard}
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activePaid}
          icon={Users}
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
        />
        <StatsCard
          title="Avg Revenue/Sub"
          value={`₹${stats.totalPaid > 0 ? Math.round(stats.totalRevenue / stats.totalPaid).toLocaleString() : 0}`}
          icon={TrendingUp}
        />
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Plan Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.planCounts.map((plan) => (
            <div
              key={plan.plan}
              className={`p-4 rounded-lg ${
                plan.plan === "platinum"
                  ? "bg-purple-50 border border-purple-200"
                  : plan.plan === "gold"
                  ? "bg-amber-50 border border-amber-200"
                  : plan.plan === "silver"
                  ? "bg-slate-100 border border-slate-300"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{plan.count}</p>
              <p className="text-sm text-slate-500 capitalize">{plan.plan} Plans</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <SubscriptionsTable subscriptions={subs} />
    </>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500">Manage and view all subscription information</p>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}
