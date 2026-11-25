"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Send, AlertCircle, ShieldCheck, Zap, Clock } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const { loading, isAuthenticated } = useAuth({
    redirectTo: "/dashboard",
    redirectIfFound: true,
  });

  const handleGoogleSignIn = () => {
    const baseUrl = apiClient.getBaseUrl();
    window.location.href = `${baseUrl}/auth/google`;
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-brand-600" />
          <p className="text-sm text-slate-500 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-50 to-brand-50/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-500/25 mb-4">
          <Send className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sign in to MailScheduler
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Automate and pace your outbound email campaigns with bulletproof queues
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {oauthError === "google" && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication failed</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Could not sign in with Google. Please try again or verify your account settings.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-4">
                Continue with authorized provider
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                className="w-full justify-center shadow-xs hover:shadow-sm border-slate-300 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                leftIcon={
                  <svg
                    className="w-5 h-5 mr-1"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                }
              >
                Sign in with Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                  Features
                </span>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-50 text-brand-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>Configurable delays & hourly rate-limiting</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-50 text-brand-600 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Real-time queue tracking and live dispatch updates</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-50 text-brand-600 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Slack alerting on rate limits and instant failure notices</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protected by enterprise session authentication. Cookie required.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
