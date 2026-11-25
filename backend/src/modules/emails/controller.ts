import type { Request, Response, NextFunction } from 'express';
import { EmailStatus } from '@prisma/client';
import { AuthRequest } from '../auth/auth';
import { HttpError } from '../../utils/errors';
import { scheduleEmails } from './service';
import { EmailRepository } from './repository';
import { searchEmails } from '../search/service';
import { prisma } from '../../db/client';

const repository = new EmailRepository();
function pagination(req: Request): { page: number; limit: number } {
  const page = Number(req.query.page ?? 1); const limit = Number(req.query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, 'page must be positive and limit must be between 1 and 100');
  return { page, limit };
}
export async function schedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { res.status(201).json(await scheduleEmails(req.authUser!.id, req.body)); } catch (error) { next(error); }
}
export function list(statuses: EmailStatus[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try { const { page, limit } = pagination(req); const result = await repository.list(req.authUser!.id, statuses, page, limit); res.json({ data: result.data, page, limit, total: result.total }); }
    catch (error) { next(error); }
  };
}
export async function search(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = pagination(req); const q = typeof req.query.q === 'string' ? req.query.q : '';
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const validStatuses = Object.values(EmailStatus) as string[];
    if (status && !validStatuses.includes(status)) throw new HttpError(400, 'Invalid status filter');
    const result = await searchEmails(req.authUser!.id, q, status, page, limit);
    const [jobs, total] = await Promise.all([prisma.emailJob.findMany({ where: { id: { in: result.ids }, userId: req.authUser!.id }, select: { id: true, toEmail: true, subject: true, status: true, scheduledAt: true, sentAt: true, error: true } }), Promise.resolve(result.total)]);
    const byId = new Map(jobs.map((job) => [job.id, job]));
    res.json({ data: result.ids.map((id) => byId.get(id)).filter((job) => job !== undefined), page, limit, total });
  } catch (error) { next(error); }
}
