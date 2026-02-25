"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: number;
  userId: number;
  plan: string | null;
  isActive: boolean | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date | null;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
}

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Recent Subscriptions</h3>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <p className="text-lg font-medium">No subscriptions found</p>
          <p className="text-sm">No paid subscriptions have been created yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-brand/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <User className="text-brand h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {sub.user.firstName || ""} {sub.user.lastName || ""}
                          {!sub.user.firstName && !sub.user.lastName && (
                            <span className="text-slate-400 italic">No name</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{sub.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        sub.plan === "platinum"
                          ? "border-purple-500 bg-purple-50 text-purple-600"
                          : sub.plan === "gold"
                            ? "border-amber-500 bg-amber-50 text-amber-600"
                            : sub.plan === "silver"
                              ? "border-slate-400 bg-slate-50 text-slate-600"
                              : "border-slate-300 text-slate-500"
                      }
                    >
                      {sub.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={sub.isActive ? "default" : "secondary"}
                      className={sub.isActive ? "bg-emerald-100 text-emerald-700" : ""}
                    >
                      {sub.isActive ? "Active" : "Expired"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {sub.startDate ? format(new Date(sub.startDate), "PP") : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {sub.endDate ? format(new Date(sub.endDate), "PP") : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {sub.createdAt
                      ? formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/users/${sub.userId}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View User
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
