#!/usr/bin/env node
/**
 * check-no-mocks.mjs
 *
 * Fails the build if mock/demo data or a mock adapter leaks back into the
 * frontend, or if an unexpected browser-storage key is introduced. Scans the
 * `src` and `public` trees, `package.json`, and every root `.env*` file.
 * Test files/directories are skipped.
 *
 * Run with `npm run check:no-mocks`.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Literal substrings that must never appear (matched case-insensitively).
const FORBIDDEN = [
  'supabase',
  '@supabase',
  'VITE_USE_MOCKS',
  'mockAdapter',
  'mockData',
  'faker',
  'Grace Ibrahim',
  'David Musa',
  'Esther Samuel',
  'Peter James',
  'Tunde Bakare',
  'DHI-2026-',
  'Reward nights',
  'Math.random(',
];

// Browser-storage keys that are allowed to be referenced literally.
const ALLOWED_STORAGE_KEYS = new Set(['deutchezz.refresh', 'theme']);

const STORAGE_CALL = /(?:local|session)Storage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*(['"`])([^'"`]+)\1/g;

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss',
  '.html', '.htm', '.svg', '.md', '.txt', '.env',
]);

const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ssr', 'coverage', '.git', '.turbo']);
const SKIP_FILE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$|(^|[\\/])__tests__([\\/]|$)/;

function collectFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, acc);
    } else if (!SKIP_FILE.test(full)) {
      const ext = extname(entry).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext) || entry.startsWith('.env')) acc.push(full);
    }
  }
  return acc;
}

const targets = new Set();
for (const f of collectFiles(join(ROOT, 'src'))) targets.add(f);
for (const f of collectFiles(join(ROOT, 'public'))) targets.add(f);
if (existsSync(join(ROOT, 'package.json'))) targets.add(join(ROOT, 'package.json'));
for (const entry of readdirSync(ROOT)) {
  if (entry === '.env' || entry.startsWith('.env.')) {
    const full = join(ROOT, entry);
    if (statSync(full).isFile()) targets.add(full);
  }
}

const violations = [];

for (const file of targets) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const token of FORBIDDEN) {
      if (lower.includes(token.toLowerCase())) {
        violations.push({ file, line: i + 1, kind: `forbidden token "${token}"`, text: line.trim() });
      }
    }
    let match;
    STORAGE_CALL.lastIndex = 0;
    while ((match = STORAGE_CALL.exec(line)) !== null) {
      const key = match[2];
      if (!ALLOWED_STORAGE_KEYS.has(key)) {
        violations.push({ file, line: i + 1, kind: `unexpected storage key "${key}"`, text: line.trim() });
      }
    }
  });
}

const rel = (f) => f.slice(ROOT.length + 1);

if (violations.length > 0) {
  console.error(`\ncheck:no-mocks FAILED — ${violations.length} issue(s):\n`);
  for (const v of violations) {
    console.error(`  ${rel(v.file)}:${v.line}  [${v.kind}]`);
    console.error(`      ${v.text}`);
  }
  console.error('\nRemove the mock data / adapter, or use the real backend API.\n');
  process.exit(1);
}

console.log(`check:no-mocks passed — scanned ${targets.size} file(s), no mock data or unexpected storage keys.`);
