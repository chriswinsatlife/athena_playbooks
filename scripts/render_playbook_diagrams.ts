import { Glob } from "bun";
import { mkdir } from "node:fs/promises";

type DiagramJob = {
  src: string;
  outSvg: string;
  outPng: string;
};

function toOutPaths(src: string): DiagramJob {
  // src: athena/playbooks/<slug>/assets/diagrams_src/<name>.md
  const outBase = src
    .replace(/\/assets\/diagrams_src\//, "/assets/diagrams/")
    .replace(/\.(md|mmd)$/i, "");
  return {
    src,
    outSvg: outBase + ".svg",
    outPng: outBase + ".png",
  };
}

async function run(cmd: string[], cwd?: string) {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    proc.stdout ? proc.stdout.text() : Promise.resolve(""),
    proc.stderr ? proc.stderr.text() : Promise.resolve(""),
    proc.exited,
  ]);

  if (proc.exitCode !== 0) {
    throw new Error(
      [
        `Command failed (${proc.exitCode}): ${cmd.join(" ")}`,
        stdout.trim() ? `stdout:\n${stdout.trim()}` : "",
        stderr.trim() ? `stderr:\n${stderr.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );
  }
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function main() {
  const patterns = [
    "athena/playbooks/**/assets/diagrams_src/**/*.md",
    "athena/playbooks/**/assets/diagrams_src/**/*.mmd",
  ];

  const jobs: DiagramJob[] = [];
  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    for await (const file of glob.scan(".")) {
      jobs.push(toOutPaths(file));
    }
  }

  const uniq = new Map<string, DiagramJob>();
  for (const j of jobs) uniq.set(j.src, j);

  const list = Array.from(uniq.values()).sort((a, b) => a.src.localeCompare(b.src));
  if (!list.length) {
    process.stdout.write("No diagrams found under athena/playbooks/**/assets/diagrams_src\n");
    return;
  }

  for (const j of list) {
    const outDir = j.outSvg.split("/").slice(0, -1).join("/");
    await ensureDir(outDir);

    await run([
      "bun",
      "dataviz/mermaid_js/src/cli/flowrender_athena.js",
      "--in",
      j.src,
      "--out",
      j.outSvg,
    ]);

    await run([
      "bun",
      "dataviz/mermaid_js/src/cli/flowrender_athena.js",
      "--in",
      j.src,
      "--out",
      j.outPng,
    ]);

    process.stdout.write(`Rendered ${j.src} -> ${j.outSvg} + ${j.outPng}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
