"use client";

import React from "react";
import { EmailJob } from "@/types/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";

export interface Column<T> {
  header: string;
  key: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface EmailsTableProps {
  columns: Column<EmailJob>[];
  data: EmailJob[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onComposeClick?: () => void;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const EmailsTable: React.FC<EmailsTableProps> = ({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyTitle = "No emails found",
  emptyDescription = "No emails match this view. Create a new campaign to get started.",
  onComposeClick,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-rose-900">
            Failed to load emails
          </h4>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Initial loading state (skeleton rows)
  if (loading && data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="h-11 px-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="p-4">
                      <Skeleton
                        className={`h-4 ${
                          cIdx === 0
                            ? "w-36"
                            : cIdx === 1
                            ? "w-48"
                            : cIdx === 2
                            ? "w-28"
                            : "w-20"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          onComposeClick ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onComposeClick}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Compose New Email
            </Button>
          ) : undefined
        }
      />
    );
  }

  const startRange = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, total);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="relative">
        {loading && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-500/20 overflow-hidden">
            <div className="w-full h-full bg-brand-600 animate-pulse" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((job) => (
              <TableRow key={job.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(job)
                      : (job[col.key as keyof EmailJob] as React.ReactNode) ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-700">{startRange}</span> to{" "}
          <span className="font-semibold text-slate-700">{endRange}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> emails
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            className="py-1 px-2.5 text-xs h-7"
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="px-2 font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            className="py-1 px-2.5 text-xs h-7"
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
