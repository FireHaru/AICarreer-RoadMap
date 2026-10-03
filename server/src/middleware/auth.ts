import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { detectLang, type Lang } from '../i18n.js';
import { HttpError } from './errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      lang?: Lang;
    }
  }
}

/** Language of the response text, from the client's Accept-Language header. */
export const languageMiddleware: RequestHandler = (req, _res, next) => {
  req.lang = detectLang(req.headers['accept-language']);
  next();
};

export function signToken(userId: number) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readUserId(header: string | undefined): number | null {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    const id = typeof payload === 'object' ? Number(payload.sub) : NaN;
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const id = readUserId(req.headers.authorization);
  if (!id) return next(new HttpError(401, 'Please sign in to continue'));
  req.userId = id;
  next();
};

/** Attaches the user when a valid token is present, but lets anonymous requests through. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const id = readUserId(req.headers.authorization);
  if (id) req.userId = id;
  next();
};

/** Small fixed-window limiter for sensitive endpoints (login, password reset). */
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req, _res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return next(new HttpError(429, 'Too many attempts – please wait a minute and try again'));
    next();
  };
}
