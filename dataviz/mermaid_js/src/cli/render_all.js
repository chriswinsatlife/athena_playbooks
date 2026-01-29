#!/usr/bin/env node
import { readdir, stat, mkdir } from 'fs/promises';
import { spawn } from 'child_process';
import { join, relative, dirname, extname, basename } from 'path';

function parseArgs(argv) {
  const args = { inDir: 'mermaid_js', outDir: 'mermaid_js/generated' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--inDir') args.inDir = argv[++i];
    else if (a === '--outDir') args.outDir = argv[++i];
    else if (a === '--format') args.format = argv[++i]; // unused, we always write svg+png
    else if (a === '--debug') args.debug = true;
  }
  return args;
}

async function listFiles(root, acc = []) {
  const entries = await readdir(root);
  for (const name of entries) {
    const p = join(root, name);
    const s = await stat(p);
    if (s.isDirectory()) await listFiles(p, acc);
    else if (/\.(md|mmd)$/i.test(name)) acc.push(p);
  }
  return acc;
}

function runFlowrender(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['mermaid_js/src/cli/render_any.js', '--in', input, '--out', output], { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error('render_any failed: ' + code)));
  });
}

async function main() {
  const { inDir, outDir, debug } = parseArgs(process.argv);
  const inputs = await listFiles(inDir);
  if (inputs.length === 0) {
    console.log('No .md/.mmd files found in', inDir);
    return;
  }
  for (const input of inputs) {
    const rel = relative(inDir, input);
    const base = basename(rel, extname(rel));
    const outSubDir = join(outDir, dirname(rel));
    await mkdir(outSubDir, { recursive: true });
    const svgOut = join(outSubDir, base + '.svg');
    if (debug) console.log('Rendering', input, '->', svgOut);
    await runFlowrender(input, svgOut);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
