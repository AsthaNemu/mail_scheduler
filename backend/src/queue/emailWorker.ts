import nodemailer, { type SentMessageInfo } from 'nodemailer';
import { DelayedError, Worker, type Job } from 'bullmq';
import { EmailStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { emailQueue, type EmailQueueData } from './emailQueue';
import { redis } from './connection';
import { checkSenderRate } from './rateLimiter';
import { indexEmail } from '../modules/search/client';
import { notifyRateLimit } from '../modules/slack/notifier';
import { logger } from '../utils/logger';

async function processEmail(job: Job<EmailQueueData>, token?: string): Promise<void> {
  const email = await prisma.emailJob.findUnique({ where: { id: job.data.emailJobId }, include: { sender: true, user: { select: { id: true } } } });
  if (!email || email.status === EmailStatus.sent) return;
  const claim = await prisma.emailJob.updateMany({ where: { id: email.id, status: { in: [EmailStatus.scheduled, EmailStatus.rate_delayed] } }, data: { status: EmailStatus.processing, error: null } });
  if (claim.count === 0) return;
  try { await indexEmail({ ...email, status: 'processing', sentAt: null, error: null }); }
  catch (error) { logger.error({ emailJobId: email.id, error }, 'Unable to index processing email'); }

  const limit = Math.min(env.MAX_EMAILS_PER_HOUR_PER_SENDER, email.hourlyLimit ?? env.MAX_EMAILS_PER_HOUR_PER_SENDER);
  const now = new Date();
  const rate = await checkSenderRate(email.senderId, limit, now);
  if (rate.exceeded) {
    const nextTime = new Date(rate.nextWindowStart.getTime() + email.batchOrder * 50);
    const delayed = await prisma.emailJob.updateMany({ where: { id: email.id, status: EmailStatus.processing }, data: { status: EmailStatus.rate_delayed, scheduledAt: nextTime } });
    if (delayed.count > 0 && token) {
      const batchCount = await prisma.emailJob.count({ where: { senderId: email.senderId, batchId: email.batchId, scheduledAt: { lt: rate.nextWindowStart }, status: { in: [EmailStatus.scheduled, EmailStatus.processing, EmailStatus.rate_delayed] } } });
      try { await indexEmail({ ...email, status: 'rate_delayed', scheduledAt: nextTime, sentAt: null, error: null }); }
      catch (error) { logger.error({ emailJobId: email.id, error }, 'Unable to index rate-delayed email'); }
      await notifyRateLimit(email.user.id, email.sender.email, limit, rate.windowKey, batchCount, nextTime);
      await job.moveToDelayed(nextTime.getTime(), token);
      throw new DelayedError();
    }
    throw new Error('Could not move rate-limited job to delayed state');
  }

  let info: SentMessageInfo;
  try {
    const transporter = nodemailer.createTransport({ host: email.sender.smtpHost, port: email.sender.smtpPort, secure: email.sender.smtpPort === 465, auth: { user: email.sender.smtpUser, pass: email.sender.smtpPass } });
    info = await transporter.sendMail({ from: email.sender.email, to: email.toEmail, subject: email.subject, text: email.body });
  } catch (error) {
    const attemptsAfterFailure = job.attemptsMade + 1;
    const message = error instanceof Error ? error.message : 'Unknown email delivery error';
    if (attemptsAfterFailure >= (job.opts.attempts ?? 1)) {
      await prisma.emailJob.update({ where: { id: email.id }, data: { status: EmailStatus.failed, attempts: attemptsAfterFailure, error: message } });
      try { await indexEmail({ ...email, status: 'failed', sentAt: null, error: message }); }
      catch (indexError) { logger.error({ emailJobId: email.id, error: indexError }, 'Unable to index failed email'); }
    } else {
      await prisma.emailJob.update({ where: { id: email.id }, data: { status: EmailStatus.scheduled, attempts: attemptsAfterFailure, error: message } });
      try { await indexEmail({ ...email, status: 'scheduled', sentAt: null, error: message }); }
      catch (indexError) { logger.error({ emailJobId: email.id, error: indexError }, 'Unable to index retrying email'); }
    }
    throw error;
  }
  const sentAt = new Date();
  const previewUrl = nodemailer.getTestMessageUrl(info)?.toString() ?? null;
  await prisma.emailJob.update({ where: { id: email.id }, data: { status: EmailStatus.sent, sentAt, previewUrl, error: null } });
  try { await indexEmail({ ...email, status: 'sent', sentAt, error: null }); }
  catch (error) { logger.error({ emailJobId: email.id, error }, 'Unable to index sent email'); }
  logger.info({ emailJobId: email.id, previewUrl }, 'Email sent');
}

export function createEmailWorker(): Worker<EmailQueueData> {
  const worker = new Worker<EmailQueueData>('email-scheduler', processEmail, { connection: redis, concurrency: env.WORKER_CONCURRENCY, limiter: { max: 1, duration: env.MIN_DELAY_BETWEEN_EMAILS_MS } });
  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Queue job completed'));
  worker.on('failed', (job, error) => logger.error({ jobId: job?.id, error }, 'Queue job failed'));
  worker.on('error', (error) => logger.error({ error }, 'Email worker error'));
  return worker;
}
export { emailQueue };
