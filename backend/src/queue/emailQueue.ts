import { Queue } from 'bullmq';
import { redis } from './connection';
export interface EmailQueueData { emailJobId: string }
export const emailQueue = new Queue<EmailQueueData>('email-scheduler', { connection: redis });
