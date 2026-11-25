import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queue/emailQueue';
import { requireAuth, issueCookie, type AuthRequest, type AuthUser } from './modules/auth/auth';
import { emailRouter } from './modules/emails/routes';
import { slackRouter } from './modules/slack/routes';
import { env } from './config/env';
import { HttpError } from './utils/errors';
import { logger } from './utils/logger';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=google` }), (req, res) => {
  issueCookie(res, req.user as AuthUser);
  res.redirect(`${env.FRONTEND_URL}/dashboard`);
});
app.get('/auth/me', requireAuth, (req: AuthRequest, res) => res.json(req.authUser));
app.post('/auth/logout', (_req, res) => { res.clearCookie('session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }); res.status(204).end(); });

app.use('/api', requireAuth);
app.use('/api/emails', emailRouter);
app.use('/api/slack', slackRouter);

const boardAdapter = new ExpressAdapter();
boardAdapter.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(emailQueue)], serverAdapter: boardAdapter });
app.use('/admin/queues', requireAuth, boardAdapter.getRouter());

app.use((_req, _res, next) => next(new HttpError(404, 'Not found')));
const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, ...(error.details === undefined ? {} : { details: error.details }) });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Invalid JSON request body' });
    return;
  }
  if (error instanceof Error && error.name === 'ZodError') {
    const issues = (error as Error & { issues?: unknown }).issues;
    res.status(400).json({ error: 'Validation failed', details: issues });
    return;
  }
  logger.error({ error }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);
export default app;
