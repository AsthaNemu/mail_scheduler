import { redis } from './connection';
import { startOfNextUtcHour, utcHourKey } from '../utils/time';

const incrementScript = `local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 7200); end; if count > tonumber(ARGV[1]) then redis.call('DECR', KEYS[1]); return -1; end; return count`;
export interface RateCheck { exceeded: boolean; count: number; nextWindowStart: Date; windowKey: string }
export async function checkSenderRate(senderId: string, limit: number, now: Date): Promise<RateCheck> {
  const windowKey = utcHourKey(now);
  const result = await redis.eval(incrementScript, 1, `rl:${senderId}:${windowKey}`, String(limit));
  const count = Number(result);
  return { exceeded: count < 0, count: count < 0 ? limit : count, nextWindowStart: startOfNextUtcHour(now), windowKey };
}
export async function claimSlackNotification(senderId: string, windowKey: string): Promise<boolean> {
  const result = await redis.set(`slack-notified:${senderId}:${windowKey}`, '1', 'EX', 7200, 'NX');
  return result === 'OK';
}
