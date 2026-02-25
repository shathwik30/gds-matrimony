import { Suspense } from "react";
import { getSubscriptionStats, getRecentSubscriptionsAdmin } from "@/lib/actions/admin";
import { SubscriptionsTable } from "@/components/admin/subscriptions-table";
import { Loader2, CreditCard, IndianRupee, TrendingUp, Users } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";

export const dynamic = "force-dynamic";

async function SubscriptionsContent() {
  const [stats, subs] = await Promise.all([getSubscriptionStats(), getRecentSubscriptionsAdmin()]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Paid Subscriptions" value={stats.totalPaid} icon={CreditCard} />
        <StatsCard title="Active Subscriptions" value={stats.activePaid} icon={Users} />
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Plan Distribution</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.planCounts.map((plan) => (
            <div
              key={plan.plan}
              className={`rounded-lg p-4 ${
                plan.plan === "platinum"
                  ? "border border-purple-200 bg-purple-50"
                  : plan.plan === "gold"
                    ? "border border-amber-200 bg-amber-50"
                    : plan.plan === "silver"
                      ? "border border-slate-300 bg-slate-100"
                      : "border border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{plan.count}</p>
              <p className="text-sm text-slate-500 capitalize">{plan.plan} Plans</p>
            </div>
          ))}
        </div>
      </div>

      <SubscriptionsTable subscriptions={subs} />
    </>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500">Manage and view all subscription information</p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-brand h-8 w-8 animate-spin" />
          </div>
        }
      >
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}
