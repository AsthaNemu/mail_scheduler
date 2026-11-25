import { Client } from '@elastic/elasticsearch';
import { env } from '../../config/env';
export const elastic = new Client({ node: env.ELASTICSEARCH_URL });
export const EMAIL_INDEX = 'emails';
export async function ensureEmailIndex(): Promise<void> {
  const exists = await elastic.indices.exists({ index: EMAIL_INDEX });
  if (exists) return;
  await elastic.indices.create({ index: EMAIL_INDEX, mappings: { properties: {
    toEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } }, subject: { type: 'text' }, body: { type: 'text' },
    status: { type: 'keyword' }, userId: { type: 'keyword' }, scheduledAt: { type: 'date' }, sentAt: { type: 'date' }, error: { type: 'text' },
  } } });
}
export interface IndexedEmail { id: string; userId: string; toEmail: string; subject: string; body: string; status: string; scheduledAt: Date; sentAt: Date | null; error: string | null }
export async function indexEmail(email: IndexedEmail): Promise<void> {
  await elastic.index({ index: EMAIL_INDEX, id: email.id, document: { ...email, scheduledAt: email.scheduledAt.toISOString(), sentAt: email.sentAt?.toISOString() ?? null }, refresh: false });
}
