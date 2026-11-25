"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { User } from "@/types/api";

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useAuth({ redirectTo, redirectIfFound = false }: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiClient.get<User>("/auth/me");
      setUser(userData);

      if (redirectIfFound && redirectTo) {
        router.replace(redirectTo);
      }
    } catch (err) {
      setUser(null);
      if (err instanceof ApiClientError && err.status === 401) {
        if (!redirectIfFound && redirectTo) {
          router.replace(redirectTo);
        }
      } else {
        const message = err instanceof Error ? err.message : "Failed to authenticate";
        setError(message);
        if (!redirectIfFound && redirectTo) {
          router.replace(redirectTo);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [redirectTo, redirectIfFound, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }, []);

  return {
    user,
    loading,
    error,
    logout,
    refreshUser: fetchUser,
    isAuthenticated: !!user,
  };
}
