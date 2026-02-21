"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Check,
  X,
  ExternalLink,
  Loader2,
  User,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PendingVerification, processVerification } from "@/lib/actions/admin";

interface VerificationsTableProps {
  verifications: PendingVerification[];
}

export function VerificationsTable({ verifications }: VerificationsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    verificationId: number | null;
  }>({ open: false, verificationId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (verificationId: number) => {
    setLoadingId(verificationId);
    try {
      const result = await processVerification(verificationId, "verified");
      if (result.success) {
        toast.success(result.message);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to process verification");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.verificationId) return;

    setLoadingId(rejectDialog.verificationId);
    try {
      const result = await processVerification(
        rejectDialog.verificationId,
        "rejected",
        rejectionReason
      );
      if (result.success) {
        toast.success(result.message);
        setRejectDialog({ open: false, verificationId: null });
        setRejectionReason("");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to process verification");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {verifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <FileText className="h-12 w-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">No pending verifications</p>
            <p className="text-sm">All verification requests have been processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {verification.user.firstName || ""} {verification.user.lastName || ""}
                            {!verification.user.firstName && !verification.user.lastName && (
                              <span className="text-slate-400 italic">No name</span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500">{verification.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {verification.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {verification.documentUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={verification.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Document
                          </a>
                        </Button>
                      ) : (
                        <span className="text-slate-400">No document</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {verification.createdAt
                        ? formatDistanceToNow(new Date(verification.createdAt), {
                            addSuffix: true,
                          })
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(verification.id)}
                          disabled={loadingId === verification.id || isPending}
                        >
                          {loadingId === verification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setRejectDialog({
                              open: true,
                              verificationId: verification.id,
                            })
                          }
                          disabled={loadingId === verification.id || isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, verificationId: null });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request. This will be
              communicated to the user.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, verificationId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || loadingId !== null}
            >
              {loadingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
