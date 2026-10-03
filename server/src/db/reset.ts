/** Drops every table and re-seeds the catalog and demo account: `npm run db:reset -w server`. */
import { closeDb, initDb } from './client.js';
import { DROP_ALL } from './schema.js';

const db = await initDb();
await db.exec(DROP_ALL);
await closeDb();

// initDb() recreates the schema and seeds from scratch.
await initDb();
await closeDb();
console.log('[db] Reset complete');
