import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { prisma } from '../../db/client';
import { HttpError } from '../../utils/errors';

passport.use(new GoogleStrategy({ clientID: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, callbackURL: env.GOOGLE_CALLBACK_URL }, (_access, _refresh, profile, done) => {
  void (async () => {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new HttpError(400, 'Google account did not provide an email');
    const user = await prisma.user.upsert({ where: { googleId: profile.id }, update: { email, name: profile.displayName, avatarUrl: profile.photos?.[0]?.value }, create: { googleId: profile.id, email, name: profile.displayName, avatarUrl: profile.photos?.[0]?.value } });
    done(null, user);
  })().catch((error: unknown) => done(error));
}));

export interface AuthUser { id: string; name: string; email: string; avatarUrl: string | null }
export interface AuthRequest extends Request { authUser?: AuthUser }
export function issueCookie(res: Response, user: AuthUser): void {
  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '7d', issuer: 'email-scheduler' });
  res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.session as string | undefined;
    if (!token) throw new HttpError(401, 'Authentication required');
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'email-scheduler' });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') throw new HttpError(401, 'Invalid session');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, name: true, email: true, avatarUrl: true } });
    if (!user) throw new HttpError(401, 'Session user no longer exists');
    req.authUser = user;
    next();
  } catch (error) { next(error); }
}
