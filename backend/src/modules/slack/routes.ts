import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../db/client';
import type { AuthRequest } from '../auth/auth';
import { HttpError } from '../../utils/errors';

export const slackRouter = Router();
slackRouter.get('/connect', (req, res, next) => {
  try {
    const userId = (req as AuthRequest).authUser!.id;
    const state = jwt.sign({ sub: userId, purpose: 'slack-oauth' }, env.JWT_SECRET, { expiresIn: '10m', issuer: 'email-scheduler' });
    const url = new URL('https://slack.com/oauth/v2/authorize');
    url.searchParams.set('client_id', env.SLACK_CLIENT_ID);
    url.searchParams.set('scope', 'chat:write,incoming-webhook');
    url.searchParams.set('redirect_uri', env.SLACK_REDIRECT_URI);
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (error) { next(error); }
});
slackRouter.get('/callback', async (req, res, next) => {
  try {
    if (typeof req.query.code !== 'string' || typeof req.query.state !== 'string') throw new HttpError(400, 'Missing Slack OAuth code or state');
    const decoded = jwt.verify(req.query.state, env.JWT_SECRET, { issuer: 'email-scheduler' });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || decoded.purpose !== 'slack-oauth') throw new HttpError(400, 'Invalid Slack OAuth state');
    const response = await fetch('https://slack.com/api/oauth.v2.access', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: req.query.code, client_id: env.SLACK_CLIENT_ID, client_secret: env.SLACK_CLIENT_SECRET, redirect_uri: env.SLACK_REDIRECT_URI }) });
    const data = await response.json() as { ok?: boolean; error?: string; access_token?: string; team?: { id?: string; name?: string }; incoming_webhook?: { url?: string; channel_id?: string } };
    if (!response.ok || !data.ok || !data.access_token || !data.team?.id) throw new HttpError(502, `Slack OAuth failed: ${data.error ?? response.statusText}`);
    await prisma.slackConnection.upsert({ where: { userId: decoded.sub }, update: { teamId: data.team.id, teamName: data.team.name ?? '', accessToken: data.access_token, channelId: data.incoming_webhook?.channel_id ?? null, webhookUrl: data.incoming_webhook?.url ?? null, connectedAt: new Date() }, create: { userId: decoded.sub, teamId: data.team.id, teamName: data.team.name ?? '', accessToken: data.access_token, channelId: data.incoming_webhook?.channel_id ?? null, webhookUrl: data.incoming_webhook?.url ?? null } });
    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
  } catch (error) { next(error); }
});
slackRouter.get('/status', async (req, res, next) => {
  try { const row = await prisma.slackConnection.findUnique({ where: { userId: (req as AuthRequest).authUser!.id }, select: { teamName: true } }); res.json(row ? { connected: true, teamName: row.teamName } : { connected: false }); }
  catch (error) { next(error); }
});
slackRouter.delete('/disconnect', async (req, res, next) => {
  try { await prisma.slackConnection.deleteMany({ where: { userId: (req as AuthRequest).authUser!.id } }); res.status(204).end(); }
  catch (error) { next(error); }
});
