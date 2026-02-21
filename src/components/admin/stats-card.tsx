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
    <div
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border border-slate-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-brand" />
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
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      {Icon && (
        <div className="h-8 w-8 rounded-md bg-brand/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand" />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
