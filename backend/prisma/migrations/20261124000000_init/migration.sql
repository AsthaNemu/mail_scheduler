CREATE TYPE "EmailStatus" AS ENUM ('scheduled', 'processing', 'sent', 'failed', 'rate_delayed');

CREATE TABLE "User" (
  "id" UUID NOT NULL, "googleId" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL,
  "avatarUrl" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Sender" (
  "id" UUID NOT NULL, "email" TEXT NOT NULL, "smtpHost" TEXT NOT NULL, "smtpPort" INTEGER NOT NULL,
  "smtpUser" TEXT NOT NULL, "smtpPass" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SlackConnection" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "teamId" TEXT NOT NULL, "teamName" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL, "channelId" TEXT, "webhookUrl" TEXT, "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SlackConnection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailJob" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "senderId" UUID NOT NULL, "toEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL, "body" TEXT NOT NULL, "scheduledAt" TIMESTAMP(3) NOT NULL, "sentAt" TIMESTAMP(3),
  "status" "EmailStatus" NOT NULL DEFAULT 'scheduled', "attempts" INTEGER NOT NULL DEFAULT 0, "error" TEXT,
  "batchId" UUID NOT NULL, "hourlyLimit" INTEGER, "batchOrder" INTEGER NOT NULL DEFAULT 0, "previewUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Sender_email_key" ON "Sender"("email");
CREATE UNIQUE INDEX "SlackConnection_userId_key" ON "SlackConnection"("userId");
CREATE UNIQUE INDEX "EmailJob_batchId_toEmail_key" ON "EmailJob"("batchId", "toEmail");
CREATE INDEX "EmailJob_userId_status_scheduledAt_idx" ON "EmailJob"("userId", "status", "scheduledAt");
CREATE INDEX "EmailJob_status_scheduledAt_idx" ON "EmailJob"("status", "scheduledAt");
CREATE INDEX "EmailJob_status_createdAt_idx" ON "EmailJob"("status", "createdAt");
ALTER TABLE "SlackConnection" ADD CONSTRAINT "SlackConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
