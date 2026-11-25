"use client";

import React, { useMemo } from "react";
import { EmailJob } from "@/types/api";
import { useEmails } from "@/hooks/useEmails";
import { EmailsTable, Column } from "./EmailsTable";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { CalendarClock, Mail } from "lucide-react";

export interface ScheduledEmailsProps {
  onComposeClick: () => void;
  refreshTrigger?: number; // External counter to trigger refresh when email scheduled
}

export const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({
  onComposeClick,
  refreshTrigger,
}) => {
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
    type: "scheduled",
    initialPage: 1,
    limit: 10,
    autoRefreshIntervalMs: 10000, // 10s auto-refresh
  });

  // Re-fetch when an email is scheduled from modal
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

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
        header: "Scheduled Time",
        key: "scheduledAt",
        className: "w-1/4",
        render: (job) => (
          <div className="flex flex-col">
            <span className="text-xs text-slate-700 font-medium">
              {formatDateTime(job.scheduledAt)}
            </span>
            <span className="text-[11px] text-slate-400">
              {formatRelativeTime(job.scheduledAt)}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        key: "status",
        className: "w-28 text-right pr-6",
        render: (job) => (
          <div className="flex justify-end">
            <Badge status={job.status} />
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
          <CalendarClock className="w-4 h-4 text-brand-600" />
          <span>Queue updates every 10 seconds automatically.</span>
        </div>
      </div>

      <EmailsTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRetry={refresh}
        onComposeClick={onComposeClick}
        emptyTitle="No scheduled emails in queue"
        emptyDescription="You don't have any pending or processing email jobs scheduled right now."
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
};
