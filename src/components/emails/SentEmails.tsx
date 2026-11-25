"use client";

import React, { useMemo } from "react";
import { EmailJob } from "@/types/api";
import { useEmails } from "@/hooks/useEmails";
import { EmailsTable, Column } from "./EmailsTable";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { CheckCircle, AlertTriangle, Mail } from "lucide-react";

export interface SentEmailsProps {
  onComposeClick: () => void;
}

export const SentEmails: React.FC<SentEmailsProps> = ({ onComposeClick }) => {
  const {
    data,
    loading,
    error,
    page,
    totalPages,
    total,
    limit,
    setPage,
    refresh,
  } = useEmails({
    type: "sent",
    initialPage: 1,
    limit: 10,
  });

  const columns: Column<EmailJob>[] = useMemo(
    () => [
      {
        header: "Recipient",
        key: "toEmail",
        className: "font-medium text-slate-900 w-1/4",
        render: (job) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span className="truncate max-w-[200px] sm:max-w-[240px] font-mono text-xs text-slate-700">
              {job.toEmail}
            </span>
          </div>
        ),
      },
      {
        header: "Subject",
        key: "subject",
        className: "w-2/5",
        render: (job) => (
          <span className="font-medium text-slate-800 line-clamp-1">
            {job.subject || "(No subject)"}
          </span>
        ),
      },
      {
        header: "Sent Time",
        key: "sentAt",
        className: "w-1/4",
        render: (job) => (
          <div className="flex flex-col">
            <span className="text-xs text-slate-700 font-medium">
              {formatDateTime(job.sentAt)}
            </span>
            {job.sentAt && (
              <span className="text-[11px] text-slate-400">
                {formatRelativeTime(job.sentAt)}
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Status",
        key: "status",
        className: "w-32 text-right pr-6",
        render: (job) => (
          <div className="flex items-center justify-end gap-1.5">
            <Badge status={job.status} />

            {/* Error Tooltip for Failed Status */}
            {job.status === "failed" && job.error && (
              <div className="relative group inline-flex items-center">
                <button
                  type="button"
                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-rose-400"
                  aria-label="View error reason"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                {/* Tooltip Popup */}
                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-56 p-2 text-xs text-white bg-slate-900 rounded-lg shadow-xl pointer-events-none transition-all">
                  <div className="font-semibold text-rose-400 mb-0.5">
                    Delivery failure:
                  </div>
                  <div className="text-[11px] leading-tight break-words text-slate-200">
                    {job.error}
                  </div>
                  <div className="absolute right-2 top-full -mt-1 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Historical log of delivered and failed dispatch attempts.</span>
        </div>
      </div>

      <EmailsTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRetry={refresh}
        onComposeClick={onComposeClick}
        emptyTitle="No sent emails yet"
        emptyDescription="When scheduled email dispatches complete or fail, they will appear in this history."
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
};
