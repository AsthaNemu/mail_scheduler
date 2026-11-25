import { prisma } from '../src/db/client';
import { scheduleEmails } from '../src/modules/emails/service';

async function run(): Promise<void> {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) throw new Error('Sign in with Google before running the load test.');
  const recipients = Array.from({ length: 1000 }, (_, index) => `load-${index}@example.test`);
  const result = await scheduleEmails(user.id, { subject: 'Scheduler load test', body: 'Ethereal test message', recipients, startTime: new Date(Date.now() + 60_000).toISOString(), delayBetweenMs: 0, hourlyLimit: 200 });
  process.stdout.write(`Scheduled ${result.count} emails in batch ${result.batchId}\n`);
}
void run().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
