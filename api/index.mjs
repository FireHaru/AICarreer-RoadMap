// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json) and handled by the Express app.
// The server is compiled to server/dist by `npm run build` before Vercel bundles this function.
import { createApp } from '../server/dist/app.js';
import { initDb } from '../server/dist/db/client.js';

const app = createApp();
let ready = null;

export default async function handler(req, res) {
  // Schema + seed check runs once per warm instance; a failed attempt is retried on the next request.
  ready ??= initDb().catch((err) => {
    ready = null;
    throw err;
  });
  try {
    await ready;
  } catch (err) {
    console.error('[api] Database initialisation failed', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database unavailable — check DATABASE_URL' }));
    return;
  }
  return app(req, res);
}
