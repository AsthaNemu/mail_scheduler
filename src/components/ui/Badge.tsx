import React from "react";
import { cn } from "@/lib/cn";
import { EmailJobStatus } from "@/types/api";
import { getStatusLabel } from "@/lib/formatters";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: EmailJobStatus;
  variant?: "scheduled" | "processing" | "rate_delayed" | "sent" | "failed" | "neutral";
  children?: React.ReactNode;
  showDot?: boolean;
}

const statusConfig = {
  scheduled: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  processing: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500 animate-pulse",
  },
  rate_delayed: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  sent: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  neutral: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  showDot = true,
  className,
  ...props
}) => {
  const currentVariant = variant || (status ? (status as keyof typeof statusConfig) : "neutral");
  const config = statusConfig[currentVariant] || statusConfig.neutral;
  const displayText = children || (status ? getStatusLabel(status) : "");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none",
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  );
};
