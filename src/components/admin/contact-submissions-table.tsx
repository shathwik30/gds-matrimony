"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  Eye,
  MessageSquareReply,
  Archive,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AdminContactSubmission,
  updateContactStatus,
  deleteContactSubmission,
} from "@/lib/actions/admin";

interface ContactSubmissionsTableProps {
  submissions: AdminContactSubmission[];
  total: number;
  page: number;
  limit: number;
}

const statusColors: Record<string, string> = {
  unread: "bg-blue-50 text-blue-700 border-blue-200",
  read: "bg-yellow-50 text-yellow-700 border-yellow-200",
  replied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
};

export function ContactSubmissionsTable({
  submissions,
  total,
  page,
  limit,
}: ContactSubmissionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    submission: AdminContactSubmission | null;
  }>({ open: false, submission: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number | null;
  }>({ open: false, id: null });
  const [adminNotes, setAdminNotes] = useState("");

  const totalPages = Math.ceil(total / limit);
  const currentStatus = searchParams.get("status") || "all";

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (currentStatus !== "all") params.set("status", currentStatus);
      params.set("page", String(newPage));
      router.push(`/admin/contact-submissions?${params.toString()}`);
    });
  };

  const handleStatusChange = async (id: number, status: string, notes?: string) => {
    setLoadingId(id);
    try {
      const result = await updateContactStatus(id, status, notes);
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setLoadingId(id);
    try {
      const result = await deleteContactSubmission(id);
      if (result.success) {
        toast.success(result.message);
        setDeleteDialog({ open: false, id: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete submission");
    } finally {
      setLoadingId(null);
    }
  };

  const openViewDialog = (submission: AdminContactSubmission) => {
    setViewDialog({ open: true, submission });
    setAdminNotes(submission.adminNotes || "");
    if (submission.status === "unread") {
      handleStatusChange(submission.id, "read");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Mail className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium">No submissions found</p>
            <p className="text-sm">No contact submissions match the selected filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className={submission.status === "unread" ? "bg-blue-50/30 font-medium" : ""}
                    >
                      <TableCell>
                        <p className="text-sm text-slate-900">{submission.name}</p>
                        {submission.phone && (
                          <p className="text-xs text-slate-500">{submission.phone}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{submission.email}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-slate-600">{submission.subject}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[submission.status || "unread"]}
                        >
                          {submission.status || "unread"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {submission.createdAt
                          ? formatDistanceToNow(new Date(submission.createdAt), {
                              addSuffix: true,
                            })
                          : "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {submission.status !== "replied" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(submission.id, "replied")}
                              disabled={loadingId === submission.id || isPending}
                              title="Mark as Replied"
                            >
                              <MessageSquareReply className="h-4 w-4" />
                            </Button>
                          )}
                          {submission.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(submission.id, "archived")}
                              disabled={loadingId === submission.id || isPending}
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteDialog({ open: true, id: submission.id })}
                            disabled={loadingId === submission.id || isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || isPending}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || isPending}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={viewDialog.open}
        onOpenChange={(open) => {
          if (!open) setViewDialog({ open: false, submission: null });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewDialog.submission?.subject}</DialogTitle>
            <DialogDescription>
              From {viewDialog.submission?.name} ({viewDialog.submission?.email})
              {viewDialog.submission?.phone && ` | ${viewDialog.submission.phone}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm whitespace-pre-wrap text-slate-700">
                {viewDialog.submission?.message}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this submission..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setViewDialog({ open: false, submission: null })}
            >
              Close
            </Button>
            {viewDialog.submission && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewDialog.submission) {
                      handleStatusChange(
                        viewDialog.submission.id,
                        "replied",
                        adminNotes || undefined
                      );
                      setViewDialog({ open: false, submission: null });
                    }
                  }}
                  disabled={loadingId !== null}
                >
                  <MessageSquareReply className="mr-2 h-4 w-4" />
                  Mark Replied
                </Button>
                <Button
                  onClick={() => {
                    if (viewDialog.submission) {
                      handleStatusChange(
                        viewDialog.submission.id,
                        viewDialog.submission.status || "read",
                        adminNotes || undefined
                      );
                      setViewDialog({ open: false, submission: null });
                    }
                  }}
                  disabled={loadingId !== null}
                >
                  Save Notes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, id: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.id && handleDelete(deleteDialog.id)}
              disabled={loadingId !== null}
            >
              {loadingId !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
