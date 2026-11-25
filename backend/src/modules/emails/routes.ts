import { Router } from 'express';
import { EmailStatus } from '@prisma/client';
import { list, schedule, search } from './controller';
export const emailRouter = Router();
emailRouter.post('/schedule', schedule);
emailRouter.get('/scheduled', list([EmailStatus.scheduled, EmailStatus.processing, EmailStatus.rate_delayed]));
emailRouter.get('/sent', list([EmailStatus.sent, EmailStatus.failed]));
emailRouter.get('/search', search);
