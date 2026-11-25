import nodemailer from 'nodemailer';
import { prisma } from '../../db/client';

export async function createEtherealSenders(count = 3): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const account = await nodemailer.createTestAccount();
    await prisma.sender.upsert({ where: { email: account.user }, update: { smtpHost: 'smtp.ethereal.email', smtpPort: 587, smtpUser: account.user, smtpPass: account.pass }, create: { email: account.user, smtpHost: 'smtp.ethereal.email', smtpPort: 587, smtpUser: account.user, smtpPass: account.pass } });
  }
}
