// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json) and handled by the Express app.
// The server is compiled to server/dist by `npm run build` before Vercel bundles this function.
// Everything is loaded lazily so configuration problems come back as a readable JSON error instead of a crash.

let ready = null;

function fail(res, status, error) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error }));
}

async function boot() {
  const missing = ['JWT_SECRET', 'DATABASE_URL'].filter((k) => !process.env[k]);
  if (missing.length) throw Object.assign(new Error(`Missing environment variable(s) on Vercel: ${missing.join(', ')}`), { expose: true });
  const [{ createApp }, { initDb }] = await Promise.all([import('../server/dist/app.js'), import('../server/dist/db/client.js')]);
  await initDb();
  return createApp();
}

export default async function handler(req, res) {
  ready ??= boot().catch((err) => {
    ready = null;
    throw err;
  });
  let app;
  try {
    app = await ready;
  } catch (err) {
    console.error('[api] Startup failed:', err);
    return fail(res, 503, err.expose ? err.message : `API startup failed: ${err.message}`);
  }
  return app(req, res);
}
