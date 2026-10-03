import { createApp } from './app.js';
import { config } from './config.js';
import { activeProvider } from './ai/llm.js';
import { initDb } from './db/client.js';
import { loadCatalog } from './engine/catalog.js';

const db = await initDb();
const cat = await loadCatalog(db);

createApp().listen(config.port, () => {
  console.log(`[api] PathForge API on http://localhost:${config.port}`);
  console.log(`[api] Database: ${db.kind === 'pglite' ? `embedded PostgreSQL (PGlite) at ${config.pgliteDir}` : 'PostgreSQL'}`);
  console.log(`[api] Catalog: ${cat.courseList.length} courses, ${cat.careers.size} careers, ${cat.research.size} research directions`);
  console.log(`[api] PathGPT: ${activeProvider() ?? 'local reasoning engine (no API key set)'}`);
});
