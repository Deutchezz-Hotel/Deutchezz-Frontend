#!/usr/bin/env node
/**
 * check-theme.mjs
 *
 * Guards the theme-token contract: app components must express colour with
 * semantic tokens (background, card, foreground, muted-foreground, primary,
 * destructive, success, warning, info, …) — never literals or Tailwind's
 * default palette. This keeps dark mode and contrast fixes working everywhere.
 *
 * Scans `src/**\/*.{ts,tsx}`. `src/index.css` and `tailwind.config.js` are the
 * token source of truth and are intentionally NOT scanned. Documented
 * exceptions live in `scripts/theme-allowlist.mjs`.
 *
 * Run with `npm run check:theme`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowlistLookup } from './theme-allowlist.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const DEFAULT_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const RULES = [
  { id: 'hex-color', regex: /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g },
  { id: 'rgb-color', regex: /\brgba?\(\s*[\d.]/g },
  // hsl(var(--token)) is the token form and is allowed; hsl(0 0% 0%) is not.
  { id: 'hsl-color', regex: /\bhsla?\(\s*[\d.]/g },
  {
    id: 'default-palette',
    regex: new RegExp(
      `\\b(?:bg|text|border|ring|from|to|via|divide|outline|decoration|fill|stroke|shadow|accent|caret|placeholder|ring-offset)-(?:${DEFAULT_PALETTE})(?:-\\d{2,3})?\\b`,
      'g',
    ),
  },
  {
    id: 'fixed-ink',
    regex: /\b(?:bg|text|border|ring|from|to|via|divide|fill|stroke)-(?:white|black)\b/g,
  },
  { id: 'legacy-var', regex: /var\(\s*--(?:ink|forest|milk|canvas)[\w-]*\s*\)/g },
  { id: 'arbitrary-color', regex: /-\[(?:#|rgb|hsl)[^\]]*\]/g },
];

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);
const SKIP_FILE = /\.(test|spec)\.(ts|tsx)$|(^|[\\/])__tests__([\\/]|$)/;

function collect(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) collect(full, acc);
    else if (!SKIP_FILE.test(full) && ['.ts', '.tsx'].includes(extname(entry))) acc.push(full);
  }
  return acc;
}

const allowlist = allowlistLookup();
const files = collect(SRC);
const violations = [];

for (const file of files) {
  const relPath = relative(ROOT, file).replace(/\\/g, '/');
  const allowed = allowlist.get(relPath) ?? new Set();
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (allowed.has(rule.id)) continue;
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        violations.push({
          file: relPath,
          line: i + 1,
          rule: rule.id,
          value: match[0],
          text: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`\ncheck:theme FAILED — ${violations.length} theme violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.value}`);
    console.error(`      ${v.text}`);
  }
  console.error(
    '\nReplace literal colours and default-palette classes with semantic theme tokens\n' +
      '(see src/index.css). Intentional exceptions belong in scripts/theme-allowlist.mjs.\n',
  );
  process.exit(1);
}

console.log(`check:theme passed — scanned ${files.length} file(s), all colours use theme tokens.`);
