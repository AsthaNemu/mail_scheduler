# Email Scheduler

Production-oriented TypeScript email scheduling service with Next.js dashboard. PostgreSQL is the source of truth, BullMQ stores persistent delayed work in Redis, Nodemailer delivers through Ethereal test SMTP, and Elasticsearch serves full-text search. The API process starts a worker; `npm run worker` can also run workers separately.

```text
Browser -- Google OAuth/JWT cookie --> Express API -- PostgreSQL
                                           |          | transaction
                                           |          +--> Redis / BullMQ delayed jobs
                                           |                       |
                                           +--> Elasticsearch       v
                                                        Worker --> Ethereal SMTP
                                                          |
                                                          +--> Slack rate-limit notice
```

---

## Frontend Dashboard (Next.js App Router + TypeScript + Tailwind CSS)

A polished, high-fidelity SaaS dashboard built to schedule, pace, and monitor outbound email campaigns with real-time feedback and Slack notifications.

### Frontend Features
- **Real Google OAuth & Auth Guard**: Session-based cookie auth with `/auth/me`, automatic redirect to `/login` for unauthenticated sessions, and full-page loading indicators.
- **Top Header**: User avatar, display name, email, quick sign-out, and interactive Slack connection toggle.
- **Slack Status & Connect Button**: Integrates with `/api/slack/status`, initiates OAuth flow via `/api/slack/connect`, handles `?slack=connected` toast feedback, and supports disconnection.
- **Dashboard Shell & URL-Synced Tabs**: Smooth switching between "Scheduled Emails" and "Sent Emails" with persistent `?tab=scheduled` and `?tab=sent` URL query parameters.
- **Compose New Email Modal**:
  - Accessible modal dialog (keyboard trap, Escape key to close, light-dismiss backdrop, focus management).
  - Subject, rich message body, start time (`datetime-local`), delay between emails (in seconds, converted to milliseconds for backend), and hourly rate limit.
  - **Drag-and-Drop Lead File Uploader**: Client-side CSV/TXT parser with RFC 5322 regex extraction across all columns, deduplication, detection counters ("N email addresses detected"), and count of skipped duplicates/invalid entries.
  - Inline error validation and responsive submit spinner.
- **Scheduled Emails Tab**:
  - Auto-refreshes every 10 seconds (automatically paused when browser tab is inactive/hidden).
  - Status badges with distinct colors: `scheduled` (blue), `processing` (purple pulse), and `rate_delayed` ("Delayed (rate limit)").
  - Loading skeleton rows, empty state with "Compose New Email" CTA, error handling with retry button, and pagination.
- **Sent Emails Tab**:
  - DRY implementation reusing the identical `EmailsTable` component via column configuration.
  - Displays sent timestamps, delivery status (`sent` = emerald green, `failed` = rose red), and interactive error message tooltips for failure diagnosis.
- **Strict Quality**: 100% strict TypeScript (zero `any` types), modular component architecture, and responsive layout across mobile and desktop viewports.

### Frontend Project Structure
```text
src/
  app/
    globals.css               # Tailwind CSS base and theme styles
    layout.tsx                # Root layout with ToastProvider and metadata
    page.tsx                  # Root redirector to /dashboard
    login/
      page.tsx                # Google OAuth sign-in page with feature highlights
    dashboard/
      layout.tsx              # Auth guard (calls /auth/me, full-page spinner)
      page.tsx                # Main dashboard shell (tabs, compose button, modal)
  components/
    ui/
      Avatar.tsx              # User profile avatar with initials fallback
      Badge.tsx               # Status badges with semantic tokens
      Button.tsx              # Button with variants, sizes, and loading state
      EmptyState.tsx          # Reusable illustration & CTA empty state
      Input.tsx               # Form input with labels, icons, and error states
      Modal.tsx               # Accessible dialog with focus trap & Esc dismiss
      Skeleton.tsx            # Animated pulse loading placeholder
      Spinner.tsx             # Accessible SVG spinner
      Table.tsx               # Composable Table, Header, Body, Row, Cell
      Tabs.tsx                # Accessible tab list & triggers
      Textarea.tsx            # Form textarea with validation states
      Toast.tsx               # Fixed stacked toast notifications provider
    layout/
      Header.tsx              # Header with logo, user info, Slack & logout
    emails/
      ComposeModal.tsx        # Modal form for scheduling email batches
      EmailsTable.tsx         # DRY reusable table with pagination & skeletons
      FileUploader.tsx        # Drag-and-drop CSV/TXT lead file email extractor
      ScheduledEmails.tsx     # Scheduled queue with 10s auto-refresh
      SentEmails.tsx          # Sent & failed history with failure tooltips
      SlackConnectButton.tsx  # Slack OAuth connect/disconnect and URL listener
  hooks/
    useAuth.ts                # Session authentication and logout handler
    useEmails.ts              # Paginated email fetching with visibility refresh
    useSlackStatus.ts         # Slack connection state and OAuth actions
    useToast.ts               # Toast trigger hook (success, error, info)
  lib/
    apiClient.ts              # Fetch wrapper with credentials and typed errors
    cn.ts                     # Class merge utility (clsx + tailwind-merge)
    csvParser.ts              # Client-side email extraction and deduplication
    formatters.ts             # Date, duration, and status string formatters
  types/
    api.ts                    # Strict TypeScript API contract interfaces
```

### Frontend Quickstart

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   The frontend runs at `http://localhost:3000`; the backend API runs at `http://localhost:4000`. Set `NEXT_PUBLIC_API_URL=http://localhost:4000`.

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production build & type check**:
   ```bash
   npm run build
   ```

---

## Backend Setup

1. Install Node.js 20+ and Docker Compose.
2. Copy `backend/.env.example` to `backend/.env`, then set Google and Slack OAuth credentials and a random `JWT_SECRET` of at least 32 characters. Register the Google callback URL and Slack redirect URL exactly as configured.
3. Start infrastructure from the repository root with `docker compose up -d`.
4. In `backend/`, run `npm install`, `npm run db:migrate`, `npm run db:seed`, and `npm run build`.
5. Start the API and its embedded worker with `npm start`. To operate a separate worker process, use `npm run worker` in another process. The dashboard is at `/admin/queues` and requires the signed-in session cookie.

The seed creates three Ethereal accounts and records SMTP credentials in PostgreSQL. Messages are captured by Ethereal; after delivery, the worker logs the preview URL and saves it in `EmailJob.previewUrl`. OAuth client credentials and SMTP account credentials must be provided by the operator; the example file contains placeholders.

## Configuration

All runtime settings are parsed by Zod during boot. The required settings are `PORT`, `DATABASE_URL`, `REDIS_URL`, `ELASTICSEARCH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`, `JWT_SECRET`, `FRONTEND_URL`, `WORKER_CONCURRENCY` (default 5), `MIN_DELAY_BETWEEN_EMAILS_MS` (default 2000), and `MAX_EMAILS_PER_HOUR_PER_SENDER` (default 200). The complete local values are in `backend/.env.example`.

## Scheduling and delivery

The API validates the request, normalizes and deduplicates recipient addresses, then inserts all rows in one PostgreSQL transaction. It assigns senders round-robin and computes each scheduled time from the supplied start time and interval. The returned UUID is also the BullMQ `jobId`, so repeated adds for the same email do not create another queue job. The queue stores delayed jobs in Redis; no cron or polling scheduler is used. The queue add is chunked at 500 jobs.

The worker claims each row with a conditional database update. A sent row is skipped on replay, and only one worker can change a scheduled row to processing. BullMQ persists pending/delayed work across process restarts. Startup reconciliation recreates missing queue entries from the database and resets processing rows whose `updatedAt` is older than five minutes. The worker uses concurrency 5 by default and a distributed BullMQ limiter set to one send every two seconds. That minimum avoids aggressive bursts against SMTP providers while still allowing concurrent preparation and scaling.

Hourly caps use an atomic Redis Lua counter under `rl:{senderId}:{YYYYMMDDHH}` in UTC. The script increments, expires the first counter after two hours, and rolls back the increment if the cap is exceeded. The effective cap is the lower of the configured sender cap and the optional batch cap. A capped job is returned to the delayed queue at the next UTC hour plus 50 ms per position in its original batch. This preserves batch order approximately; work from other batches and senders can interleave, and a process crash between the database update and BullMQ move is repaired by reconciliation. A Redis outage stops processing rather than bypassing the cap. When Slack is connected, the service sends at most one notice for each sender/hour; Slack errors are logged and do not interrupt email work.

With 1,000 jobs at one timestamp, the API inserts them transactionally and enqueues in batches of 500. Three senders receive round-robin assignments, and each sender's counter limits hourly volume. Remaining work is delayed into later UTC windows instead of being dropped. The exact completion time depends on configured limits, provider response time, worker availability, and any other queued batches.

## Slack setup

Create a Slack app, enable OAuth v2, add the configured redirect URI, and grant `chat:write` and `incoming-webhook`. Sign in first, then visit `GET /api/slack/connect`; authorize the workspace and channel. The callback stores the token and webhook/channel in PostgreSQL. `GET /api/slack/status` reports connection status; `DELETE /api/slack/disconnect` removes it. The notifier reads the connection from PostgreSQL when a rate limit is hit, so a later connection needs no restart.

## API Endpoints

Authentication endpoints:
- `GET /auth/google` redirects to Google; `GET /auth/google/callback` sets an HTTP-only JWT cookie and redirects to `/dashboard` on the configured frontend.
- `GET /auth/me` returns the current user; `POST /auth/logout` clears the cookie.
- Every `/api` endpoint requires that cookie. CORS allows the configured frontend origin with credentials.

Email endpoints:
- `POST /api/emails/schedule` body: `{ "subject": "...", "body": "...", "recipients": ["a@example.com"], "startTime": "2026-12-01T10:00:00Z", "delayBetweenMs": 2000, "hourlyLimit": 200 }`. `hourlyLimit` is optional. Response: `{ "batchId": "...", "count": 1 }`.
- `GET /api/emails/scheduled?page=1&limit=20` lists scheduled, processing, and rate-delayed records.
- `GET /api/emails/sent?page=1&limit=20` lists sent and failed records.
- `GET /api/emails/search?q=words&status=sent&page=1&limit=20` performs full-text search scoped to the signed-in user.

List response shape:
```json
{ "data": [], "page": 1, "limit": 20, "total": 0 }
```

Item shape:
```json
{
  "id": "uuid",
  "toEmail": "a@example.com",
  "subject": "...",
  "status": "sent",
  "scheduledAt": "2026-12-01T10:00:00.000Z",
  "sentAt": "2026-12-01T10:00:01.000Z",
  "error": null
}
```

