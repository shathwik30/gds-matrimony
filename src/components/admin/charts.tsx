"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number; subscriptions: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
      <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">
        Revenue Overview
      </h3>
      <div className="h-[220px] sm:h-[260px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C53030" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C53030" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
            <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#C53030"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface UserGrowthChartProps {
  data: { month: string; newUsers: number; totalUsers: number }[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
      <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">
        User Growth
      </h3>
      <div className="h-[220px] sm:h-[260px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
            <YAxis stroke="#64748B" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="newUsers" name="New Users" fill="#C53030" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalUsers" name="Total Users" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface GenderDistributionChartProps {
  male: number;
  female: number;
}

const COLORS = ["#3B82F6", "#EC4899"];

export function GenderDistributionChart({ male, female }: GenderDistributionChartProps) {
  const data = [
    { name: "Male", value: male },
    { name: "Female", value: female },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
      <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">
        Gender Distribution
      </h3>
      <div className="h-[200px] sm:h-[230px] md:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600">Male ({male})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-pink-500" />
          <span className="text-sm text-slate-600">Female ({female})</span>
        </div>
      </div>
    </div>
  );
}

interface SubscriptionDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export function SubscriptionDistributionChart({ data }: SubscriptionDistributionChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
      <h3 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">
        Subscription Plans
      </h3>
      <div className="h-[200px] sm:h-[230px] md:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-slate-600">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
