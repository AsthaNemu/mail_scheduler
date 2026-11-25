import '../src/config/env';
import { prisma } from '../src/db/client';
import { logger } from '../src/utils/logger';
import { createEtherealSenders } from '../src/modules/senders/service';

async function seed(): Promise<void> {
  await createEtherealSenders(3);
  logger.info('Created three Ethereal test senders');
}
void seed().catch((error: unknown) => { logger.error({ error }, 'Sender seed failed'); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
