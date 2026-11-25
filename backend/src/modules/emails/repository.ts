import { EmailStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/client';

export const emailSelect = { id: true, toEmail: true, subject: true, status: true, scheduledAt: true, sentAt: true, error: true } satisfies Prisma.EmailJobSelect;
export class EmailRepository {
  list(userId: string, statuses: EmailStatus[], page: number, limit: number) {
    return prisma.$transaction(async (tx) => {
      const where = { userId, status: { in: statuses } };
      const [data, total] = await Promise.all([tx.emailJob.findMany({ where, select: emailSelect, orderBy: { scheduledAt: 'asc' }, skip: (page - 1) * limit, take: limit }), tx.emailJob.count({ where })]);
      return { data, total };
    });
  }
}
