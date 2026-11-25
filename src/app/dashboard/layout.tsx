"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth({
    redirectTo: "/login",
  });

  // Auth guard: show full-page spinner while checking /auth/me
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Authenticating session...
        </p>
      </div>
    );
  }

  // If unauthenticated, the hook already calls router.replace("/login")
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header user={user} onLogout={logout} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
