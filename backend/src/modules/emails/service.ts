import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../db/client';
import { emailQueue } from '../../queue/emailQueue';
import { indexEmail } from '../search/client';
import { HttpError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const scheduleSchema = z.object({ subject: z.string().min(1).max(998), body: z.string().min(1), recipients: z.array(z.string().email()).min(1).max(10000), startTime: z.string().datetime({ offset: true }), delayBetweenMs: z.number().int().min(0).max(86400000), hourlyLimit: z.number().int().positive().optional() });
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export async function scheduleEmails(userId: string, raw: unknown): Promise<{ batchId: string; count: number }> {
  const input = scheduleSchema.parse(raw);
  const recipients = [...new Set(input.recipients.map((email) => email.trim().toLowerCase()))];
  const startTime = new Date(input.startTime);
  if (startTime.getTime() < Date.now()) throw new HttpError(400, 'startTime must be now or in the future');
  const senders = await prisma.sender.findMany({ orderBy: { createdAt: 'asc' } });
  if (senders.length === 0) throw new HttpError(503, 'No email senders are configured');
  const batchId = randomUUID();
  const rows = recipients.map((toEmail, index) => ({ id: randomUUID(), userId, senderId: senders[index % senders.length]!.id, toEmail, subject: input.subject, body: input.body, batchId, batchOrder: index, hourlyLimit: input.hourlyLimit, scheduledAt: new Date(startTime.getTime() + index * input.delayBetweenMs) }));
  await prisma.$transaction(async (tx) => { await tx.emailJob.createMany({ data: rows }); });
  for (let offset = 0; offset < rows.length; offset += 500) {
    const chunk = rows.slice(offset, offset + 500);
    await emailQueue.addBulk(chunk.map((row) => ({ name: 'send-email', data: { emailJobId: row.id }, opts: { jobId: row.id, delay: Math.max(0, row.scheduledAt.getTime() - Date.now()), attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: false, removeOnFail: false } })));
  }
  for (const row of rows) {
    try { await indexEmail({ ...row, status: 'scheduled', sentAt: null, error: null }); }
    catch (error) { logger.error({ emailJobId: row.id, error }, 'Unable to index scheduled email'); }
  }
  return { batchId, count: rows.length };
}
