import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="bg-brand/10 flex h-12 w-12 items-center justify-center rounded-lg">
          <Icon className="text-brand h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface StatsMiniCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export function StatsMiniCard({ label, value, icon: Icon }: StatsMiniCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
      {Icon && (
        <div className="bg-brand/10 flex h-8 w-8 items-center justify-center rounded-md">
          <Icon className="text-brand h-4 w-4" />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
