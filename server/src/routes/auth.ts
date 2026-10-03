import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { tr } from '../i18n.js';
import { getDb } from '../db/client.js';
import { rateLimit, requireAuth, signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { getUser, publicUser } from '../services/learner.js';

export const authRouter = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

/** Compared against when an email is unknown, so response timing does not reveal which emails are registered. */
const DUMMY_HASH = bcrypt.hashSync('pathforge-timing-guard', 10);

authRouter.post('/register', rateLimit(10, 60_000), async (req, res) => {
  const body = z.object({ fullName: z.string().trim().min(2, 'Enter your name').max(100), email, password }).parse(req.body);
  const db = getDb();
  const [exists] = await db.query('SELECT 1 FROM users WHERE email = $1', [body.email]);
  if (exists) throw new HttpError(409, 'An account with this email already exists');
  const hash = await bcrypt.hash(body.password, 10);
  const [row] = await db.query<{ id: number }>(
    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id',
    [body.email, hash, body.fullName],
  );
  const user = await getUser(db, row.id);
  res.status(201).json({ token: signToken(row.id), user: publicUser(user) });
});

authRouter.post('/login', rateLimit(10, 60_000), async (req, res) => {
  const body = z.object({ email, password: z.string().min(1, 'Enter your password') }).parse(req.body);
  const db = getDb();
  const [row] = await db.query<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = $1', [body.email]);
  const ok = await bcrypt.compare(body.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) throw new HttpError(401, 'Incorrect email or password');
  res.json({ token: signToken(row.id), user: publicUser(await getUser(db, row.id)) });
});

authRouter.post('/forgot-password', rateLimit(5, 60_000), async (req, res) => {
  const body = z.object({ email }).parse(req.body);
  const db = getDb();
  const [row] = await db.query<{ id: number }>('SELECT id FROM users WHERE email = $1', [body.email]);
  const response: { ok: true; message: string; devResetToken?: string } = {
    ok: true,
    message: tr(req.lang ?? 'en', 'If an account exists for that email, a reset link is on its way.'),
  };
  if (row) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      `UPDATE users SET reset_token_hash = $2, reset_expires_at = now() + interval '30 minutes' WHERE id = $1`,
      [row.id, sha256(token)],
    );
    // No mail service is configured: in development the link is returned so the flow can be completed.
    if (config.exposeResetToken) response.devResetToken = token;
    console.log(`[auth] Password reset requested for ${body.email}${config.exposeResetToken ? ` → /reset-password?token=${token}` : ''}`);
  }
  res.json(response);
});

authRouter.post('/reset-password', rateLimit(10, 60_000), async (req, res) => {
  const body = z.object({ token: z.string().min(10), password }).parse(req.body);
  const db = getDb();
  const [row] = await db.query<{ id: number }>(
    'SELECT id FROM users WHERE reset_token_hash = $1 AND reset_expires_at > now()',
    [sha256(body.token)],
  );
  if (!row) throw new HttpError(400, 'This reset link is invalid or has expired. Request a new one.');
  await db.query(
    'UPDATE users SET password_hash = $2, reset_token_hash = NULL, reset_expires_at = NULL, updated_at = now() WHERE id = $1',
    [row.id, await bcrypt.hash(body.password, 10)],
  );
  res.json({ token: signToken(row.id), user: publicUser(await getUser(db, row.id)) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(await getUser(getDb(), req.userId!)) });
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const body = z.object({ currentPassword: z.string().min(1), newPassword: password }).parse(req.body);
  const db = getDb();
  const [row] = await db.query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
  if (!row || !(await bcrypt.compare(body.currentPassword, row.password_hash))) {
    throw new HttpError(400, 'Your current password is incorrect');
  }
  await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [req.userId, await bcrypt.hash(body.newPassword, 10)]);
  res.json({ ok: true });
});
