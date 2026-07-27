#!/usr/bin/env node
/**
 * Render every SVG into dist/.
 *
 *   node scripts/render.mjs            real data, all themes
 *   node scripts/render.mjs --demo     synthetic full year (design preview)
 *   node scripts/render.mjs --theme=onepiece-dark
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/theme.mjs';
import { demoData } from '../src/derive.mjs';
import { renderBanner } from '../src/banner.mjs';
import { renderHero } from '../src/hero.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const demo = args.includes('--demo');
const only = args.find((a) => a.startsWith('--theme='))?.slice(8);

let data;
if (demo) {
  data = demoData('demo');
} else {
  const f = path.join(ROOT, 'data', 'contributions.json');
  if (!fs.existsSync(f)) {
    console.error('! data/contributions.json missing — run `npm run fetch` first (or use --demo)');
    process.exit(1);
  }
  data = JSON.parse(fs.readFileSync(f, 'utf8'));
}

fs.mkdirSync(DIST, { recursive: true });

// Banner file naming follows the skin, not the theme id: `arise-*` for Solo
// Leveling, `grandline-*` for One Piece.
const NAME = { solo: 'arise', onepiece: 'grandline' };
const written = [];
const write = (file, svg) => {
  fs.writeFileSync(path.join(DIST, file), svg);
  written.push([file, Buffer.byteLength(svg)]);
};

for (const [id, t] of Object.entries(THEMES)) {
  if (only && id !== only) continue;
  const stem = `${NAME[t.skin]}-${t.mode}`;
  write(`${stem}.svg`, renderBanner(data, t));
  write(`hero-${id}.svg`, renderHero(data, t));
}

// One static, animation-free banner for the README's reduced-motion opt-out.
// prefers-reduced-motion cannot be honoured from inside an <img>-loaded SVG,
// so an explicit link is the only correct answer.
if (!only) {
  write('arise-static.svg', renderBanner(data, THEMES['solo-dark'], { animate: false }));
  write('grandline-static.svg', renderBanner(data, THEMES['onepiece-dark'], { animate: false }));
}

const OVER = 250 * 1024;
let bad = 0;
for (const [f, b] of written) {
  const kb = (b / 1024).toFixed(1);
  const flag = b > OVER ? '  ← OVER BUDGET' : '';
  if (b > OVER) bad++;
  console.log(`  ${f.padEnd(26)} ${kb.padStart(7)} KB${flag}`);
}
console.log(`\n✓ ${written.length} files → dist/  (${demo ? 'DEMO data' : `${data.totalContributions} contributions, ${data.activeDays} active days`})`);
if (bad) { console.error(`! ${bad} file(s) over the 250 KB budget`); process.exit(1); }
