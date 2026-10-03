import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { tr } from '../i18n.js';

/** `message` is English and may contain {placeholders}; it is translated for the request's language when sent. */
export class HttpError extends Error {
  constructor(public status: number, message: string, public vars?: Record<string, string | number>) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => next(new HttpError(404, 'Not found'));

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const lang = req.lang ?? 'en';
  if (err instanceof ZodError) {
    const first = err.issues[0];
    res.status(400).json({
      error: first ? `${first.path.join('.') || 'input'}: ${tr(lang, first.message)}` : tr(lang, 'Invalid input'),
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: tr(lang, i.message) })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: tr(lang, err.message, err.vars) });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: tr(lang, 'Malformed JSON body') });
    return;
  }
  console.error('[api] Unhandled error', err);
  res.status(500).json({ error: tr(lang, 'Something went wrong on our side') });
};
