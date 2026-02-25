"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Check, X, User, Eye, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AdminReport, processReport } from "@/lib/actions/admin";

interface ReportsTableProps {
  reports: AdminReport[];
}

const reasonLabels: Record<string, string> = {
  fake_profile: "Fake Profile",
  harassment: "Harassment",
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  scam: "Scam/Fraud",
  other: "Other",
};

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    reportId: number | null;
    action: "resolved" | "dismissed";
    reportedUserId: number | null;
  }>({ open: false, reportId: null, action: "resolved", reportedUserId: null });
  const [suspendUser, setSuspendUser] = useState(false);

  const handleAction = async (
    reportId: number,
    action: "resolved" | "dismissed",
    reportedUserId: number
  ) => {
    if (action === "resolved") {
      setActionDialog({ open: true, reportId, action, reportedUserId });
    } else {
      await processReportAction(reportId, action, false);
    }
  };

  const processReportAction = async (
    reportId: number,
    action: "resolved" | "dismissed",
    suspend: boolean
  ) => {
    setLoadingId(reportId);
    try {
      const result = await processReport(reportId, action, suspend);
      if (result.success) {
        toast.success(result.message);
        setActionDialog({ open: false, reportId: null, action: "resolved", reportedUserId: null });
        setSuspendUser(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to process report");
    } finally {
      setLoadingId(null);
    }
  };

  const confirmAction = () => {
    if (actionDialog.reportId) {
      processReportAction(actionDialog.reportId, actionDialog.action, suspendUser);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <AlertTriangle className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-sm">No reports match the selected filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {report.reporter.firstName || ""} {report.reporter.lastName || ""}
                          </p>
                          <p className="text-xs text-slate-500">{report.reporter.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                          <User className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {report.reported.firstName || ""} {report.reported.lastName || ""}
                          </p>
                          <p className="text-xs text-slate-500">{report.reported.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-orange-200 text-orange-600">
                        {reasonLabels[report.reason] || report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm text-slate-600">
                        {report.description || "No description provided"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {report.createdAt
                        ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          report.status === "pending"
                            ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                            : report.status === "resolved"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {report.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/users/${report.reportedUserId}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() =>
                              handleAction(report.id, "resolved", report.reportedUserId)
                            }
                            disabled={loadingId === report.id || isPending}
                          >
                            {loadingId === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-4 w-4" />
                                Resolve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction(report.id, "dismissed", report.reportedUserId)
                            }
                            disabled={loadingId === report.id || isPending}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/users/${report.reportedUserId}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View User
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({
              open: false,
              reportId: null,
              action: "resolved",
              reportedUserId: null,
            });
            setSuspendUser(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              You are about to mark this report as resolved. Would you also like to suspend the
              reported user?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="suspend"
              checked={suspendUser}
              onCheckedChange={(checked) => setSuspendUser(checked as boolean)}
            />
            <label
              htmlFor="suspend"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-500" />
                Suspend the reported user
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({
                  open: false,
                  reportId: null,
                  action: "resolved",
                  reportedUserId: null,
                })
              }
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmAction}
              disabled={loadingId !== null}
            >
              {loadingId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
