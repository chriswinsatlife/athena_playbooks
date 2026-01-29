#!/usr/bin/env node
import { readFile, writeFile, mkdtemp, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve, extname, dirname, basename } from 'path';
import { spawn } from 'child_process';
import YAML from 'js-yaml';

function parseArgs(argv){
  const args = { format: undefined };
  for (let i=2;i<argv.length;i++){
    const a=argv[i];
    if (a==='--in'||a==='-i') args.in=argv[++i];
    else if (a==='--out'||a==='-o') args.out=argv[++i];
    else if (a==='--format'||a==='-f') args.format=argv[++i];
    else if (a==='--debug') args.debug=true;
  }
  return args;
}

function usage(){
  return 'Usage: bun render_any.js --in <file.md|.mmd> --out <file.svg>';
}

function extractMermaid(md){
  let fm={}, body=md;
  if (md.startsWith('---')){
    const idx = md.indexOf('\n---', 3);
    if (idx !== -1){
      const yaml = md.slice(3, idx).replace(/^\n/, '');
      fm = yaml ? (YAML.load(yaml) || {}) : {};
      body = md.slice(idx + 4);
    }
  }
  const re = new RegExp("\x60\x60\x60\\s*mermaid\\s*\\n([\\s\\S]*?)\\n\x60\x60\x60","i");
  const m = body.match(re);
  const code = m ? m[1].trim() : body.trim();
  return { fm, code };
}

function run(cmd, args, opts={}){
  return new Promise((resolve, reject)=>{
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code)=> code===0 ? resolve() : reject(new Error(cmd+' failed: '+code)));
  });
}

async function renderWithMmdcFromCode(code, fm, outputPath){
  const tmp = await mkdtemp(join(tmpdir(), 'mmd-'));
  const mmd = join(tmp, 'diagram.mmd');
  await writeFile(mmd, code, 'utf8');
  // Build optional config
  let configFile;
  if (fm && (fm.config || fm.theme || fm.themeVariables)){
    const config = Object.assign({}, fm.config || {});
    if (fm.theme) config.theme = fm.theme;
    if (fm.themeVariables) config.themeVariables = fm.themeVariables;
    configFile = join(tmp, 'config.json');
    await writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');
  }
  const ext = extname(outputPath).slice(1).toLowerCase();
  const outFile = resolve(outputPath);
  const outDir = dirname(outFile);
  await mkdir(outDir, { recursive: true });
  const mmdcBin = 'node_modules/.bin/mmdc';
  const args = ['-i', mmd, '-o', outFile];
  if (configFile) args.push('--configFile', configFile);
  if (ext !== 'svg') throw new Error('Only .svg output is supported (got: ' + ext + ')');
  await run(mmdcBin, args, { cwd: process.cwd() });
}

async function main(){
  const args = parseArgs(process.argv);
  if (!args.in || !args.out){ console.error(usage()); process.exit(2); }
  const inPath = resolve(process.cwd(), args.in);
  const outPath = resolve(process.cwd(), args.out);
  if (extname(outPath).toLowerCase() !== '.svg') {
    console.error('Only .svg output is supported:', outPath);
    process.exit(2);
  }
  const md = await readFile(inPath, 'utf8');
  const { fm, code } = extractMermaid(md);
  await renderWithMmdcFromCode(code, fm, outPath);
}

main().catch((err)=>{ console.error(err); process.exit(70); });
