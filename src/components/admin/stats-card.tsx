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
        "rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1 sm:space-y-2">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
          <p className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">{value}</p>
          {description && (
            <p className="truncate text-xs text-slate-500 sm:text-sm">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium sm:text-sm",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="bg-brand/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 md:h-12 md:w-12">
          <Icon className="text-brand h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
