import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.loadEnvFile(path.join(serverRoot, '.env'));
} catch {
  // No .env file: rely on the process environment and defaults.
}

const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  isProd,
  port: Number(env.PORT ?? 4000),
  jwtSecret: env.JWT_SECRET || 'pathforge-dev-secret-do-not-use-in-production',
  jwtExpiresIn: '7d' as const,
  databaseUrl: env.DATABASE_URL || undefined,
  pgliteDir: env.PGLITE_DIR || path.join(serverRoot, 'data', 'pgdata'),
  clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
  exposeResetToken: env.EXPOSE_RESET_TOKEN ? env.EXPOSE_RESET_TOKEN === 'true' : !isProd,
  ai: {
    provider: (env.AI_PROVIDER || '').toLowerCase() as '' | 'gemini' | 'openai',
    geminiKey: env.GEMINI_API_KEY || '',
    geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiKey: env.OPENAI_API_KEY || '',
    openaiModel: env.OPENAI_MODEL || 'gpt-4o-mini',
  },
};
