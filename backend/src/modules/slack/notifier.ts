import { prisma } from '../../db/client';
import { logger } from '../../utils/logger';
import { claimSlackNotification } from '../../queue/rateLimiter';

export async function notifyRateLimit(userId: string, senderEmail: string, limit: number, windowKey: string, rescheduledCount: number, nextTime: Date): Promise<void> {
  try {
    if (!await claimSlackNotification(senderEmail, windowKey)) return;
    const connection = await prisma.slackConnection.findUnique({ where: { userId } });
    if (!connection) return;
    const time = nextTime.toISOString().slice(11, 16);
    const text = `Rate limit reached for sender ${senderEmail} (${limit}/hour). ${rescheduledCount} emails rescheduled to ${time} UTC.`;
    if (connection.webhookUrl) {
      const response = await fetch(connection.webhookUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!response.ok) throw new Error(`Slack webhook returned ${response.status}`);
    } else if (connection.channelId) {
      const response = await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', headers: { authorization: `Bearer ${connection.accessToken}`, 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ channel: connection.channelId, text }) });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Slack message failed');
    }
  } catch (error) { logger.warn({ error }, 'Unable to send Slack rate limit notification'); }
}
