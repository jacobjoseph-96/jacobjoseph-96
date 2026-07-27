#!/usr/bin/env node
/**
 * Rewrite the `?v=` cache-buster on every generated image in README.md.
 *
 * GitHub proxies README images through camo, which caches aggressively. Without
 * a changing query string the profile can serve yesterday's frame for hours.
 *
 *   node scripts/stamp-readme.mjs 42
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'README.md');
const stamp = process.argv[2] || String(Date.now());

const before = fs.readFileSync(FILE, 'utf8');
const after = before.replace(/(\.svg)\?v=[^"'\s)]*/g, `$1?v=${stamp}`);

if (after === before) {
  console.log('· README unchanged (no ?v= markers matched)');
} else {
  fs.writeFileSync(FILE, after);
  console.log(`✓ stamped README images with ?v=${stamp}`);
}
