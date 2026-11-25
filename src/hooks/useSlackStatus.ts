"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { SlackStatus } from "@/types/api";

export function useSlackStatus() {
  const [status, setStatus] = useState<SlackStatus>({ connected: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<SlackStatus>("/api/slack/status");
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Slack status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connect = useCallback(() => {
    const baseUrl = apiClient.getBaseUrl();
    window.location.href = `${baseUrl}/api/slack/connect`;
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setDisconnecting(true);
      await apiClient.delete("/api/slack/disconnect");
      setStatus({ connected: false });
      return true;
    } catch (err) {
      throw err;
    } finally {
      setDisconnecting(false);
    }
  }, []);

  return {
    connected: status.connected,
    teamName: status.teamName,
    loading,
    disconnecting,
    error,
    refreshStatus: fetchStatus,
    connect,
    disconnect,
  };
}
