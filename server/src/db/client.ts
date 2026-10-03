import fs from 'node:fs';
import { config } from '../config.js';
import { SCHEMA } from './schema.js';
import { seedIfEmpty } from './seed.js';
import { syncTranslations } from './translations.js';

export interface Queryable {
  query<T = Record<string, any>>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Database extends Queryable {
  kind: 'postgres' | 'pglite';
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

let instance: Database | null = null;

async function connectPostgres(url: string): Promise<Database> {
  const pg = (await import('pg')).default;
  // Return BIGINT (e.g. COUNT) as numbers, matching PGlite.
  pg.types.setTypeParser(20, (v: string) => Number.parseInt(v, 10));
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return {
    kind: 'postgres',
    async query(sql, params) {
      return (await pool.query(sql, params as any[])).rows;
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({ query: async (s, p) => (await client.query(s, p as any[])).rows });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function connectPglite(dir: string): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  if (!dir.startsWith('memory://')) fs.mkdirSync(dir, { recursive: true });
  const db = await PGlite.create(dir);
  return {
    kind: 'pglite',
    async query(sql, params) {
      return (await db.query<any>(sql, params as any[])).rows;
    },
    async exec(sql) {
      await db.exec(sql);
    },
    tx(fn) {
      return db.transaction((t) => fn({ query: async (s, p) => (await t.query<any>(s, p as any[])).rows }));
    },
    close: () => db.close(),
  };
}

export async function initDb(): Promise<Database> {
  if (instance) return instance;
  const db = config.databaseUrl ? await connectPostgres(config.databaseUrl) : await connectPglite(config.pgliteDir);
  await db.exec(SCHEMA);
  await seedIfEmpty(db);
  await syncTranslations(db);
  instance = db;
  return db;
}

export function getDb(): Database {
  if (!instance) throw new Error('Database not initialised – call initDb() first');
  return instance;
}

export async function closeDb() {
  if (!instance) return;
  await instance.close();
  instance = null;
}
