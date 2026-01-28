import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Copies canonical playbooks + assets from `athena/playbooks/**` into locations
// that Astro serves by default.
//
// - Playbook MDX -> `src/pages/playbooks/<slug>.mdx`
// - Assets -> `public/playbooks/<slug>/assets/**`
//
// This script does not delete stale outputs (avoid destructive ops). It only
// overwrites/creates.

const ROOT = process.cwd();
const PLAYBOOKS_DIR = join(ROOT, 'athena', 'playbooks');
const OUT_PAGES_DIR = join(ROOT, 'src', 'pages', 'playbooks');
const OUT_PUBLIC_DIR = join(ROOT, 'public', 'playbooks');

async function copyFile(src, dest) {
  const buf = await readFile(src);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function copyDir(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const src = join(srcDir, e.name);
    const dest = join(destDir, e.name);
    if (e.isDirectory()) {
      await copyDir(src, dest);
    } else if (e.isFile()) {
      await copyFile(src, dest);
    }
  }
}

async function existsFile(p) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_PAGES_DIR, { recursive: true });
  await mkdir(OUT_PUBLIC_DIR, { recursive: true });

  const slugs = [];
  const entries = await readdir(PLAYBOOKS_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const slug = e.name;
    const srcPlaybook = join(PLAYBOOKS_DIR, slug, 'playbook.mdx');
    if (!(await existsFile(srcPlaybook))) continue;

    slugs.push(slug);

    const destPlaybook = join(OUT_PAGES_DIR, `${slug}.mdx`);
    await copyFile(srcPlaybook, destPlaybook);

    const srcAssetsDir = join(PLAYBOOKS_DIR, slug, 'assets');
    try {
      const s = await stat(srcAssetsDir);
      if (s.isDirectory()) {
        const destAssetsDir = join(OUT_PUBLIC_DIR, slug, 'assets');
        await copyDir(srcAssetsDir, destAssetsDir);
      }
    } catch {
      // no assets folder; ok
    }
  }

  await mkdir(join(ROOT, '.astro'), { recursive: true });
  await writeFile(join(ROOT, '.astro', 'playbooks.generated.json'), JSON.stringify({ slugs }, null, 2) + '\n');

  process.stdout.write(`Synced ${slugs.length} playbooks -> src/pages/playbooks and public/playbooks\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
