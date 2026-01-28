import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Minimal vendoring script.
// Purpose: pin a small, stable subset of Heroicons SVGs into the repo so
// playbooks/diagrams can reference icons without bundling React components.
//
// Source repo: https://github.com/tailwindlabs/heroicons
// License: MIT

const ICONS_24_OUTLINE = [
  'calendar-days',
  'chat-bubble-left-right',
  'check-circle',
  'clock',
  'credit-card',
  'document-text',
  'envelope',
  'exclamation-triangle',
  'gift',
  'lock-closed',
  'magnifying-glass',
  'phone',
  'shield-check',
  'shopping-bag',
  'sparkles',
  'truck',
  'user-group',
  'x-circle'
];

const BASE = 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline';
const OUT_DIR = 'athena/brand/icons/vendor/heroicons/24/outline';

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}: ${url}`);
  return await res.text();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const results = [];

  for (const name of ICONS_24_OUTLINE) {
    const url = `${BASE}/${name}.svg`;
    const svg = await fetchText(url);
    const outPath = join(OUT_DIR, `${name}.svg`);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, svg, 'utf8');
    results.push(outPath);
  }

  process.stdout.write(`Wrote ${results.length} icons to ${OUT_DIR}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
