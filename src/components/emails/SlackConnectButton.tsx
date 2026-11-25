"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSlackStatus } from "@/hooks/useSlackStatus";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export const SlackConnectButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { connected, teamName, loading, disconnecting, connect, disconnect } =
    useSlackStatus();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("slack") === "connected") {
      toast.success("Slack integration connected successfully!");
      // Clean query parameter from URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("slack");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, toast]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.info("Slack disconnected");
    } catch {
      toast.error("Failed to disconnect Slack. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-400 bg-slate-50">
        <Spinner size="xs" />
        <span>Checking Slack...</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium">Slack: {teamName || "Workspace"}</span>
        <button
          type="button"
          disabled={disconnecting}
          onClick={handleDisconnect}
          className="ml-1 text-slate-500 hover:text-rose-600 underline text-[11px] font-medium transition-colors disabled:opacity-50"
        >
          {disconnecting ? "Disconnecting..." : "(Disconnect)"}
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={connect}
      className={className}
      leftIcon={
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.5 10.5C6.88071 10.5 8 9.38071 8 8C8 6.61929 6.88071 5.5 5.5 5.5C4.11929 5.5 3 6.61929 3 8C3 9.38071 4.11929 10.5 5.5 10.5Z"
            fill="#E01E5A"
          />
          <path
            d="M9.5 8C9.5 6.61929 10.6193 5.5 12 5.5C13.3807 5.5 14.5 6.61929 14.5 8V14.5H9.5V8Z"
            fill="#E01E5A"
          />
          <path
            d="M13.5 5.5C13.5 4.11929 14.6193 3 16 3C17.3807 3 18.5 4.11929 18.5 5.5C18.5 6.88071 17.3807 8 16 8C14.6193 8 13.5 6.88071 13.5 5.5Z"
            fill="#36C5F0"
          />
          <path
            d="M16 9.5C17.3807 9.5 18.5 10.6193 18.5 12C18.5 13.3807 17.3807 14.5 16 14.5H9.5V9.5H16Z"
            fill="#36C5F0"
          />
          <path
            d="M18.5 13.5C17.1193 13.5 16 14.6193 16 16C16 17.3807 17.1193 18.5 18.5 18.5C19.8807 18.5 21 17.3807 21 16C21 14.6193 19.8807 13.5 18.5 13.5Z"
            fill="#2EB67D"
          />
          <path
            d="M14.5 16C14.5 17.3807 13.3807 18.5 12 18.5C10.6193 18.5 9.5 17.3807 9.5 16V9.5H14.5V16Z"
            fill="#2EB67D"
          />
          <path
            d="M10.5 18.5C10.5 19.8807 9.38071 21 8 21C6.61929 21 5.5 19.8807 5.5 18.5C5.5 17.1193 6.61929 16 8 16C9.38071 16 10.5 17.1193 10.5 18.5Z"
            fill="#ECB22E"
          />
          <path
            d="M8 14.5C6.61929 14.5 5.5 13.3807 5.5 12C5.5 10.6193 6.61929 9.5 8 9.5H14.5V14.5H8Z"
            fill="#ECB22E"
          />
        </svg>
      }
    >
      Connect Slack
    </Button>
  );
};
