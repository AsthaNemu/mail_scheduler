"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import { EmailJob, Paginated } from "@/types/api";

interface UseEmailsOptions {
  type: "scheduled" | "sent";
  initialPage?: number;
  limit?: number;
  autoRefreshIntervalMs?: number; // e.g. 10000 ms
}

export function useEmails({
  type,
  initialPage = 1,
  limit = 10,
  autoRefreshIntervalMs = 0,
}: UseEmailsOptions) {
  const [data, setData] = useState<EmailJob[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isVisibleRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  const fetchEmails = useCallback(
    async (isBackground = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      try {
        const endpoint = `/api/emails/${type}`;
        const result = await apiClient.get<Paginated<EmailJob>>(endpoint, {
          page,
          limit,
        });

        setData(result.data || []);
        setTotal(result.total || 0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to load ${type} emails`;
        setError(message);
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    [type, page, limit]
  );

  // Initial and page-change fetch
  useEffect(() => {
    fetchEmails(false);
  }, [fetchEmails]);

  // Auto-refresh interval (with tab visibility detection)
  useEffect(() => {
    if (!autoRefreshIntervalMs || autoRefreshIntervalMs <= 0) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      if (isVisibleRef.current) {
        // Tab became visible again; trigger an immediate refresh
        fetchEmails(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = setInterval(() => {
      if (isVisibleRef.current && document.visibilityState === "visible") {
        fetchEmails(true);
      }
    }, autoRefreshIntervalMs);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshIntervalMs, fetchEmails]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    page,
    limit,
    total,
    totalPages,
    loading,
    error,
    setPage,
    refresh: () => fetchEmails(false),
  };
}
