import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { languageMiddleware } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { assistantRouter } from './routes/assistant.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { insightsRouter } from './routes/insights.js';
import { meRouter } from './routes/me.js';
import { roadmapRouter } from './routes/roadmap.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Behind Vercel's proxy the client IP is in X-Forwarded-For; without this every visitor would share one rate limit.
  app.set('trust proxy', process.env.VERCEL ? true : 'loopback');
  app.use(cors({ origin: config.clientOrigin }));
  app.use(languageMiddleware);
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/me', meRouter);
  app.use('/api/roadmap', roadmapRouter);
  app.use('/api/insights', insightsRouter);
  app.use('/api/assistant', assistantRouter);

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
