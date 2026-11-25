export type EmailJobStatus =
  | 'scheduled'
  | 'processing'
  | 'rate_delayed'
  | 'sent'
  | 'failed';

export interface EmailJob {
  id: string;
  toEmail: string;
  subject: string;
  status: EmailJobStatus;
  scheduledAt: string;
  sentAt: string | null;
  error: string | null;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string; // ISO 8601 string
  delayBetweenMs: number;
  hourlyLimit?: number;
}

export interface ScheduleEmailResponse {
  batchId: string;
  count: number;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
