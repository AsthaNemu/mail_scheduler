import { prisma } from './db/client';
import { emailQueue } from './queue/emailQueue';
import { createEmailWorker } from './queue/emailWorker';
import { ensureEmailIndex } from './modules/search/client';
import { logger } from './utils/logger';

async function startWorker(): Promise<void> {
  await ensureEmailIndex();
  await prisma.emailJob.updateMany({ where: { status: 'processing', updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } }, data: { status: 'scheduled' } });
  const pending = await prisma.emailJob.findMany({ where: { status: { in: ['scheduled', 'rate_delayed'] } }, select: { id: true, scheduledAt: true } });
  for (const email of pending) if (!await emailQueue.getJob(email.id)) await emailQueue.add('send-email', { emailJobId: email.id }, { jobId: email.id, delay: Math.max(0, email.scheduledAt.getTime() - Date.now()), attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: false, removeOnFail: false });
  const worker = createEmailWorker();
  const shutdown = async (signal: string): Promise<void> => { logger.info({ signal }, 'Worker shutting down'); await worker.close(); await emailQueue.close(); await prisma.$disconnect(); process.exit(0); };
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); }); process.once('SIGINT', () => { void shutdown('SIGINT'); });
}
void startWorker().catch((error: unknown) => { logger.fatal({ error }, 'Unable to start worker'); process.exitCode = 1; });
