"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileUploader } from "./FileUploader";
import { useToast } from "@/hooks/useToast";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { ScheduleEmailPayload, ScheduleEmailResponse } from "@/types/api";
import { Send, Calendar, Clock, Gauge } from "lucide-react";

export interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to get local datetime string for <input type="datetime-local" />
const getDefaultStartTime = (): string => {
  const d = new Date(Date.now() + 60 * 1000); // 1 minute from now
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();

  // Form states
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>(getDefaultStartTime());
  const [delaySeconds, setDelaySeconds] = useState<string>("2");
  const [hourlyLimit, setHourlyLimit] = useState<string>("200");

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!subject.trim()) {
      errs.subject = "Subject is required";
    }

    if (!body.trim()) {
      errs.body = "Email body is required";
    }

    if (recipients.length === 0) {
      errs.recipients = "At least one recipient is required (upload a lead file)";
    }

    if (!startTime) {
      errs.startTime = "Start time is required";
    } else {
      const selectedDate = new Date(startTime);
      if (isNaN(selectedDate.getTime())) {
        errs.startTime = "Please provide a valid start date and time";
      }
    }

    const delayNum = Number(delaySeconds);
    if (isNaN(delayNum) || delayNum < 0) {
      errs.delaySeconds = "Delay must be greater than or equal to 0 seconds";
    }

    const limitNum = Number(hourlyLimit);
    if (isNaN(limitNum) || limitNum < 1) {
      errs.hourlyLimit = "Hourly limit must be at least 1";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setRecipients([]);
    setStartTime(getDefaultStartTime());
    setDelaySeconds("2");
    setHourlyLimit("200");
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const delayBetweenMs = Math.round(Number(delaySeconds) * 1000);
      const isoStartTime = new Date(startTime).toISOString();
      const parsedHourlyLimit = Number(hourlyLimit);

      const payload: ScheduleEmailPayload = {
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startTime: isoStartTime,
        delayBetweenMs,
        ...(parsedHourlyLimit > 0 ? { hourlyLimit: parsedHourlyLimit } : {}),
      };

      const result = await apiClient.post<ScheduleEmailResponse>(
        "/api/emails/schedule",
        payload
      );

      toast.success(
        `${result.count || recipients.length} email${
          (result.count || recipients.length) === 1 ? "" : "s"
        } scheduled successfully!`
      );

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      let backendError = "Failed to schedule emails. Please check inputs.";
      if (err instanceof ApiClientError) {
        backendError = err.message;
      } else if (err instanceof Error) {
        backendError = err.message;
      }
      toast.error(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compose New Campaign"
      description="Queue paced outbound emails with automated delivery intervals and sender limits."
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="compose-email-form"
            loading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Schedule Emails ({recipients.length})
          </Button>
        </>
      }
    >
      <form id="compose-email-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <Input
          label="Subject"
          required
          placeholder="e.g. Follow-up regarding partnership opportunity"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
          }}
          error={errors.subject}
          disabled={isSubmitting}
        />

        {/* Lead File Upload */}
        <FileUploader
          onRecipientsChange={(newRecipients) => {
            setRecipients(newRecipients);
            if (errors.recipients && newRecipients.length > 0) {
              setErrors((prev) => ({ ...prev, recipients: "" }));
            }
          }}
          error={errors.recipients}
        />

        {/* Body */}
        <Textarea
          label="Message Body"
          required
          rows={5}
          placeholder="Write your email content here..."
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (errors.body) setErrors((prev) => ({ ...prev, body: "" }));
          }}
          error={errors.body}
          disabled={isSubmitting}
        />

        {/* Dispatch Controls: Start Time, Delay, Hourly Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          {/* Start Time */}
          <Input
            label="Start Time"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              if (errors.startTime)
                setErrors((prev) => ({ ...prev, startTime: "" }));
            }}
            error={errors.startTime}
            disabled={isSubmitting}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          {/* Delay between emails */}
          <Input
            label="Delay (seconds)"
            type="number"
            min="0"
            step="0.5"
            required
            value={delaySeconds}
            onChange={(e) => {
              setDelaySeconds(e.target.value);
              if (errors.delaySeconds)
                setErrors((prev) => ({ ...prev, delaySeconds: "" }));
            }}
            error={errors.delaySeconds}
            helperText="Converted to ms on backend"
            disabled={isSubmitting}
            leftIcon={<Clock className="w-4 h-4" />}
          />

          {/* Hourly Limit */}
          <Input
            label="Hourly Limit"
            type="number"
            min="1"
            step="1"
            required
            value={hourlyLimit}
            onChange={(e) => {
              setHourlyLimit(e.target.value);
              if (errors.hourlyLimit)
                setErrors((prev) => ({ ...prev, hourlyLimit: "" }));
            }}
            error={errors.hourlyLimit}
            helperText="Max dispatches per hour"
            disabled={isSubmitting}
            leftIcon={<Gauge className="w-4 h-4" />}
          />
        </div>
      </form>
    </Modal>
  );
};
