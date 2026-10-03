// Lists strings passed to t()/tn()/msg() that have no Vietnamese translation in src/i18n/vi.json.
//   node scripts/i18n-check.mjs            → report (exit 1 when something is missing)
//   node scripts/i18n-check.mjs --missing  → print missing keys as a JSON object to fill in
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(path.join(root, 'src'));

// A single- or double-quoted string literal (template literals are not used as keys).
const SQ = String.raw`'((?:\\.|[^'\\])*)'`;
const DQ = String.raw`"((?:\\.|[^"\\])*)"`;
const LIT = `(?:${SQ}|${DQ})`;
const single = new RegExp(String.raw`\b(?:t|msg)\(\s*` + LIT, 'g');
const plural = new RegExp(String.raw`\btn\(\s*` + LIT + String.raw`\s*,\s*` + LIT, 'g');
const unescape = (s) => s.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');

const keys = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(single)) keys.set(unescape(m[1] ?? m[2]), path.relative(root, f));
  for (const m of src.matchAll(plural)) keys.set(unescape(m[3] ?? m[4]), path.relative(root, f));
}
const vi = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/vi.json'), 'utf8'));
const missing = [...keys.keys()].filter((k) => !(k in vi));
const unused = Object.keys(vi).filter((k) => !keys.has(k));

if (process.argv.includes('--missing')) {
  console.log(JSON.stringify(Object.fromEntries(missing.map((k) => [k, ''])), null, 2));
} else {
  console.log(`${keys.size} strings, ${missing.length} missing, ${unused.length} unused`);
  for (const k of missing) console.log(`  missing: ${JSON.stringify(k)}  (${keys.get(k)})`);
  for (const k of unused) console.log(`  unused:  ${JSON.stringify(k)}`);
  if (missing.length) process.exit(1);
}
