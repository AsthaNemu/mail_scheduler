import app from './app';
import { env } from './config/env';
import { prisma } from './db/client';
import { emailQueue } from './queue/emailQueue';
import { createEmailWorker } from './queue/emailWorker';
import { ensureEmailIndex } from './modules/search/client';
import { logger } from './utils/logger';

async function reconcile(): Promise<void> {
  await prisma.emailJob.updateMany({ where: { status: 'processing', updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } }, data: { status: 'scheduled' } });
  const pending = await prisma.emailJob.findMany({ where: { status: { in: ['scheduled', 'rate_delayed'] } }, select: { id: true, scheduledAt: true } });
  for (let offset = 0; offset < pending.length; offset += 500) {
    const group = pending.slice(offset, offset + 500);
    const missing = [];
    for (const email of group) if (!await emailQueue.getJob(email.id)) missing.push(email);
    if (missing.length) await emailQueue.addBulk(missing.map((email) => ({ name: 'send-email', data: { emailJobId: email.id }, opts: { jobId: email.id, delay: Math.max(0, email.scheduledAt.getTime() - Date.now()), attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: false, removeOnFail: false } })));
  }
}

async function start(): Promise<void> {
  await ensureEmailIndex();
  await reconcile();
  const worker = createEmailWorker();
  const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'Email scheduler listening'));
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Graceful shutdown started');
    await worker.close();
    await emailQueue.close();
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
}
void start().catch((error: unknown) => { logger.fatal({ error }, 'Unable to start email scheduler'); process.exitCode = 1; });
