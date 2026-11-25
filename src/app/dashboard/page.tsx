"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { ScheduledEmails } from "@/components/emails/ScheduledEmails";
import { SentEmails } from "@/components/emails/SentEmails";
import { ComposeModal } from "@/components/emails/ComposeModal";
import { Spinner } from "@/components/ui/Spinner";
import { Plus, Clock, CheckCircle2 } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "sent" ? "sent" : "scheduled";

  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`);
  };

  const handleComposeSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Email Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Queue outbound messages, control pacing, and monitor real-time delivery status.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsComposeOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-brand-500/20"
        >
          Compose New Email
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger
              value="scheduled"
              icon={<Clock className="w-4 h-4" />}
            >
              Scheduled Emails
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Sent Emails
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        {activeTab === "scheduled" ? (
          <ScheduledEmails
            onComposeClick={() => setIsComposeOpen(true)}
            refreshTrigger={refreshKey}
          />
        ) : (
          <SentEmails onComposeClick={() => setIsComposeOpen(true)} />
        )}
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
