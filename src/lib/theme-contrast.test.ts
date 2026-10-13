import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Theme contrast guard.
 *
 * Parses the HSL channel tokens from `src/index.css` (light `:root` and `.dark`)
 * and asserts WCAG contrast for the text pairs the design system relies on.
 * Text pairs must clear 4.5:1; non-text UI (input outlines, focus ring) must
 * clear 3:1.
 */

type Hsl = { h: number; s: number; l: number };

function parseTokens(css: string, selector: string): Record<string, Hsl> {
  const block = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\}`).exec(css);
  if (!block) throw new Error(`Selector ${selector} not found in index.css`);
  const tokens: Record<string, Hsl> = {};
  const re = /--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1])) !== null) {
    tokens[m[1]] = { h: Number(m[2]), s: Number(m[3]), l: Number(m[4]) };
  }
  return tokens;
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hsl: Hsl): number {
  const [r, g, b] = hslToRgb(hsl);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Hsl, b: Hsl): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const light = parseTokens(css, ':root');
const dark = parseTokens(css, '.dark');

const TEXT_PAIRS: Array<[string, string]> = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['primary', 'background'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['destructive-text', 'card'],
  ['destructive-text', 'background'],
  ['destructive-foreground', 'destructive'],
  ['destructive-soft-foreground', 'destructive-soft'],
  ['success', 'background'],
  ['success', 'card'],
  ['warning', 'background'],
  ['warning', 'card'],
  ['info', 'background'],
  ['info', 'card'],
];

const NON_TEXT_PAIRS: Array<[string, string]> = [
  ['input', 'card'],
  ['input', 'background'],
  ['ring', 'background'],
  ['ring', 'card'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('theme contrast (%s)', (_name, tokens) => {
  it.each(TEXT_PAIRS)('%s on %s clears 4.5:1', (fg, bg) => {
    const ratio = contrast(tokens[fg], tokens[bg]);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)('%s on %s clears 3:1', (fg, bg) => {
    const ratio = contrast(tokens[fg], tokens[bg]);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});
