/**
 * theme-allowlist.mjs
 *
 * Documented exceptions for `scripts/check-theme.mjs`. Each entry names a file
 * and the rule(s) it is allowed to break, plus a human-readable reason. Keep
 * this list as small as possible and every reason specific: an allow-list entry
 * is a claim that the offending value cannot be expressed with a theme token.
 *
 * Rule ids:
 *   hex-color      literal #rgb / #rrggbb / #rrggbbaa
 *   rgb-color      literal rgb(...) / rgba(...)
 *   hsl-color      literal hsl(...) / hsla(...)  (hsl(var(--token)) is fine)
 *   default-palette  Tailwind default palette utility (bg-red-500, text-slate-700, …)
 *   fixed-ink        bg-white / text-white / bg-black / text-black / border-* white|black
 *   legacy-var     var(--ink-*) / var(--forest-*) / var(--milk-*) references
 *   arbitrary-color  bg-[#fff] / text-[rgb(...)] style arbitrary color values
 */
export const ALLOWLIST = [
  {
    file: 'src/components/ui/chart.tsx',
    rules: ['hex-color'],
    reason:
      "Recharts injects literal #ccc / #fff stroke attributes into rendered SVG; this shadcn ChartContainer targets those exact attributes with CSS attribute selectors ([&_.recharts-grid_line[stroke='#ccc']]). The literals match Recharts' own defaults, not app colors, and cannot be replaced by a theme token.",
  },
];

/** Convenience lookup: file path (posix, relative to repo root) -> Set<rule>. */
export function allowlistLookup() {
  const map = new Map();
  for (const entry of ALLOWLIST) {
    map.set(entry.file, new Set(entry.rules));
  }
  return map;
}
