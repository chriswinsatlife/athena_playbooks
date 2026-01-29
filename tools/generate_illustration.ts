#!/usr/bin/env bun

/**
 * Generate Decorative Illustration
 *
 * Generates new decorative artwork using a style template produced by
 * tools/analyze_illustration_reference.ts.
 *
 * Models:
 * - Generation: gemini-3-pro-image-preview
 * - QA: gemini-3-flash-preview (fallback gemini-3-flash)
 *
 * Usage:
 *   bun tools/generate_illustration.ts <style_name> "<subject>" "<scene>" [options]
 *   bun tools/generate_illustration.ts <style_name> -f <image_path> [options]
 *   bun tools/generate_illustration.ts --list
 *
 * Example:
 *   bun tools/generate_illustration.ts wattenberger_watercolor_footer_style \
 *     "a vintage bicycle" \
 *     "leaning in a wildflower patch at the bottom of a wide panoramic frame" \
 *     -n 4 --keep-failed --reference docs/wattenberger_watercolor_footer_image.png
 *
 *   bun tools/generate_illustration.ts wattenberger_watercolor_footer_style \
 *     -f docs/jonathan_swanson.jpg \
 *     --reference docs/wattenberger_watercolor_footer_image.png \
 *     -n 4 --keep-failed
 */

import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const PROJECT_ROOT = import.meta.dir.replace("/tools", "");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "prompts");
const STYLES_DIR = path.join(PROMPTS_DIR, "illustration_styles");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "outputs", "illustrations");

const SYSTEM_INSTRUCTIONS_PATH = path.join(PROMPTS_DIR, "illustration_system_instructions.md");
const QUALITY_CHECK_PATH = path.join(PROMPTS_DIR, "illustration_quality_check.md");

const GENERATION_MODEL = "gemini-3-pro-image-preview";
const QA_MODEL = "gemini-3-flash-preview";
const QA_MODEL_FALLBACK = "gemini-3-flash";
const MAX_QA_RETRIES = 3;

type ImageSize = "1K" | "2K" | "4K";

interface StyleMeta {
  name: string;
  description: string;
  aspectRatio: string;
  styleType: string;
}

interface Options {
  styleName: string;
  subject: string;
  scene: string;
  inputImagePath?: string;
  notes?: string;
  numGenerations: number;
  imageSize: ImageSize;
  outputDir?: string;
  keepFailed?: boolean;
  skipQualityCheck?: boolean;
  referenceImagePath?: string;
  debug?: boolean;
}

function usage(): string {
  return `
USAGE:
  generate_illustration --list
  generate_illustration <style_name> "<subject>" "<scene>" [options]
  generate_illustration <style_name> -f <image_path> [options]

OPTIONS:
  -h, --help              Show help
  -n, --num-generations   Number of candidates (default: 4)
  --image-size            1K, 2K, or 4K (default: 2K)
  -o, --output            Output directory (default: outputs/illustrations/)
  --notes                 Extra notes appended to prompt
  -f, --input-image        Input image path to restyle (preserve subject)
  --reference             Reference style image path (recommended for QA)
  --keep-failed           Keep failed candidates in failed/
  --skip-quality-check    Disable QA filtering
  --debug                 Print prompt preview and QA responses

ENV:
  GOOGLE_GENERATIVE_AI_API_KEY  Required
`;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function readFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) throw new Error(`File not found: ${filePath}`);
  return file.text();
}

function parseFrontmatter(text: string): { fm: Record<string, string>; body: string } {
  const fm: Record<string, string> = {};
  let body = text.trim();
  if (body.startsWith("---")) {
    const endIdx = body.indexOf("\n---", 4);
    if (endIdx !== -1) {
      const rawFm = body.slice(4, endIdx).trim();
      body = body.slice(endIdx + 5).trim();
      for (const line of rawFm.split("\n")) {
        const i = line.indexOf(":");
        if (i <= 0) continue;
        const key = line.slice(0, i).trim();
        let value = line.slice(i + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        fm[key] = value;
      }
    }
  }
  return { fm, body };
}

function listStyles(): StyleMeta[] {
  if (!existsSync(STYLES_DIR)) return [];
  const files = readdirSync(STYLES_DIR).filter((f) => f.endsWith(".md"));
  const metas: StyleMeta[] = [];
  for (const file of files) {
    const name = file.replace(/\.md$/, "");
    const text = require("fs").readFileSync(path.join(STYLES_DIR, file), "utf-8");
    const { fm } = parseFrontmatter(text);
    metas.push({
      name,
      description: fm.description || "(no description)",
      aspectRatio: fm.aspect_ratio || "1:1",
      styleType: fm.style_type || name,
    });
  }
  return metas;
}

async function loadStyle(styleName: string): Promise<{ meta: StyleMeta; body: string }> {
  const stylePath = path.join(STYLES_DIR, `${styleName}.md`);
  if (!existsSync(stylePath)) {
    const available = listStyles().map((s) => s.name);
    throw new Error(`Style "${styleName}" not found. Available: ${available.join(", ") || "(none)"}`);
  }
  const raw = await readFile(stylePath);
  const { fm, body } = parseFrontmatter(raw);
  return {
    meta: {
      name: styleName,
      description: fm.description || "",
      aspectRatio: fm.aspect_ratio || "1:1",
      styleType: fm.style_type || styleName,
    },
    body,
  };
}

async function loadSystemInstructions(): Promise<string> {
  if (!existsSync(SYSTEM_INSTRUCTIONS_PATH)) return "";
  const raw = await readFile(SYSTEM_INSTRUCTIONS_PATH);
  return parseFrontmatter(raw).body;
}

function normalizeAspectRatio(aspectRatio: string): string {
  const allowed = new Set(["1:1", "16:9", "9:16", "4:3", "3:4"]);
  const trimmed = (aspectRatio || "").trim();
  if (allowed.has(trimmed)) return trimmed;

  // Common near-misses
  if (trimmed === "3:2" || trimmed === "2:1") return "16:9";
  if (trimmed === "2:3") return "3:4";

  return "16:9";
}

async function loadQualityPrompt(): Promise<string> {
  const raw = await readFile(QUALITY_CHECK_PATH);
  return parseFrontmatter(raw).body;
}

function extractPromptSkeleton(styleBody: string): string {
  // Heuristic: take the fenced block under "## Prompt Skeleton".
  const m = styleBody.match(/##\s+Prompt Skeleton[\s\S]*?```text\s*([\s\S]*?)```/i);
  if (m?.[1]) return m[1].trim();
  // Fallback: use entire style body (but keep short by taking first ~40 lines).
  return styleBody.split("\n").slice(0, 40).join("\n").trim();
}

function buildPrompt(
  styleBody: string,
  system: string,
  subject: string,
  scene: string,
  notes: string | undefined,
  mode: "text" | "restyle",
): string {
  const skeleton = extractPromptSkeleton(styleBody);
  const filled = skeleton
    .replace(/\$SUBJECT/g, subject)
    .replace(/\$SCENE/g, scene)
    .replace(/\$NOTES/g, notes ?? "");

  // Keep prompt compact for Gemini.
  const parts: string[] = [filled.trim()];

  if (mode === "restyle") {
    parts.push(
      "",
      "Restyle instruction:",
      "- Preserve the input image framing and subject scale.",
      "- Do NOT introduce large blank margins or extra white space compared to the input.",
      "- Apply ONLY the medium/linework/wash/texture/color behavior of the target style.",
    );
  }

  if (system.trim()) {
    parts.push("", "System constraints:", system.trim());
  }
  return parts.join("\n");
}

function formatTimestamp(d = new Date()): string {
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .replace(/\s+/g, "_")
    .split("_")
    .slice(0, 6)
    .join("_")
    .slice(0, 50);
}

async function generateImage(ai: GoogleGenAI, prompt: string, imageSize: ImageSize, aspectRatio: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{ text: prompt }],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { imageSize, aspectRatio },
    },
  });
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content in response");
  for (const part of parts) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("No image data in response");
}

async function generateImageFromInput(
  ai: GoogleGenAI,
  prompt: string,
  inputAbsPath: string,
  imageSize: ImageSize,
  aspectRatio: string,
): Promise<Buffer> {
  const inputFile = Bun.file(inputAbsPath);
  if (!(await inputFile.exists())) {
    throw new Error(`Input image not found: ${inputAbsPath}`);
  }

  const ext = path.extname(inputAbsPath).toLowerCase();
  let mimeType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".webp") mimeType = "image/webp";

  const buf = Buffer.from(await inputFile.arrayBuffer());
  const base64 = buf.toString("base64");

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
          {
            text:
              prompt +
              "\n\nInstruction: Restyle the provided input image into the described illustration style. Preserve framing and subject scale. Do not add extra margins/white space. Do not add any text or logos.",
          },
        ],
      },
    ],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { imageSize, aspectRatio },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content in response");
  for (const part of parts) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("No image data in response");
}

function looksLikeUnsupportedModelError(err: unknown): boolean {
  const msg = String((err as { message?: unknown })?.message ?? err).toLowerCase();
  return msg.includes("not found") || msg.includes("unsupported") || msg.includes("invalid") || msg.includes("404");
}

async function fileToBase64(absPath: string): Promise<string> {
  const buf = Buffer.from(await Bun.file(absPath).arrayBuffer());
  return buf.toString("base64");
}

async function qaCheck(
  ai: GoogleGenAI,
  qualityPrompt: string,
  referenceAbs: string,
  candidateAbs: string,
  requested: { subject: string; scene: string },
  debug: boolean,
): Promise<boolean> {
  const models = [QA_MODEL, QA_MODEL_FALLBACK];
  const referenceBase64 = await fileToBase64(referenceAbs);
  const candidateBase64 = await fileToBase64(candidateAbs);

  const prompt = [
    qualityPrompt.trim(),
    "",
    "Requested subject/scene:",
    `Subject: ${requested.subject}`,
    `Scene: ${requested.scene}`,
  ].join("\n");

  for (let attempt = 0; attempt < MAX_QA_RETRIES; attempt++) {
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                { text: prompt },
                { text: "Reference style image" },
                { inlineData: { data: referenceBase64, mimeType: "image/png" } },
                { text: "Candidate image" },
                { inlineData: { data: candidateBase64, mimeType: "image/png" } },
              ],
            },
          ],
          config: { responseMimeType: "application/json" },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No QA response text");
        if (debug) console.log(`[qa] ${model}: ${text}`);
        const parsed = JSON.parse(text);
        return Boolean(parsed.isGood);
      } catch (err) {
        if (looksLikeUnsupportedModelError(err) && model !== models[models.length - 1]) {
          continue;
        }
        if (attempt < MAX_QA_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 750 * (attempt + 1)));
          break;
        }
        // If QA is flaky, do not block the pipeline.
        console.warn("[qa] QA failed repeatedly; soft-pass");
        return true;
      }
    }
  }
  return true;
}

function parseArgs(argv: string[]): Options | "list" | "help" {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) return "help";
  if (args.includes("--list") || args.includes("-l")) return "list";

  const styleName = args[0];
  if (!styleName || styleName.startsWith("-")) {
    console.error("style_name is required as the first argument");
    process.exit(1);
  }

  // Back-compat positional: <style> "<subject>" "<scene>"
  let subject = "";
  let scene = "";
  let startIdx = 1;
  if (args[1] && !args[1].startsWith("-") && args[2] && !args[2].startsWith("-")) {
    subject = args[1];
    scene = args[2];
    startIdx = 3;
  }

  const opt: Options = {
    styleName,
    subject,
    scene,
    numGenerations: 4,
    imageSize: "2K",
  };

  for (let i = startIdx; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "-n":
      case "--num-generations":
        opt.numGenerations = parseInt(args[++i], 10);
        break;
      case "--image-size":
        opt.imageSize = args[++i] as ImageSize;
        break;
      case "-o":
      case "--output":
        opt.outputDir = args[++i];
        break;
      case "--notes":
        opt.notes = args[++i];
        break;
      case "-f":
      case "--input-image":
        opt.inputImagePath = args[++i];
        break;
      case "--subject":
        opt.subject = args[++i];
        break;
      case "--scene":
        opt.scene = args[++i];
        break;
      case "--reference":
        opt.referenceImagePath = args[++i];
        break;
      case "--keep-failed":
        opt.keepFailed = true;
        break;
      case "--skip-quality-check":
        opt.skipQualityCheck = true;
        break;
      case "--debug":
        opt.debug = true;
        break;
    }
  }

  // Require subject/scene unless an input image is provided.
  if (!opt.inputImagePath) {
    if (!opt.subject || !opt.scene) {
      console.error("subject and scene are required (positional or via --subject/--scene)");
      process.exit(1);
    }
  } else {
    // For image restyling, subject/scene are optional but helpful.
    if (!opt.subject) opt.subject = "the provided input image";
    if (!opt.scene) opt.scene = "restyled into the target illustration style";
  }

  return opt;
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed === "help") {
    console.log(usage());
    return;
  }
  if (parsed === "list") {
    const styles = listStyles();
    if (styles.length === 0) {
      console.log("No styles found in prompts/illustration_styles/");
      return;
    }
    console.log("Available styles:\n");
    for (const s of styles) {
      console.log(`  ${s.name}`);
      console.log(`    ${s.description}`);
      console.log(`    Aspect ratio: ${s.aspectRatio}`);
      console.log("");
    }
    return;
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
    process.exit(1);
  }

  const options = parsed;
  const ai = new GoogleGenAI({ apiKey });

  const { meta, body: styleBody } = await loadStyle(options.styleName);
  const system = await loadSystemInstructions();
  const qualityPrompt = options.skipQualityCheck ? "" : await loadQualityPrompt();

  const prompt = buildPrompt(
    styleBody,
    system,
    options.subject,
    options.scene,
    options.notes,
    options.inputImagePath ? "restyle" : "text",
  );
  const aspectRatio = normalizeAspectRatio(meta.aspectRatio);

  if (options.debug) {
    console.log("[debug] style:", meta.name);
    console.log("[debug] aspect:", aspectRatio);
    console.log("[debug] prompt preview:\n" + "-".repeat(40));
    console.log(prompt);
    console.log("-".repeat(40));
  }

  const outDir = options.outputDir ? (path.isAbsolute(options.outputDir) ? options.outputDir : path.resolve(PROJECT_ROOT, options.outputDir)) : OUTPUT_DIR;
  const failedDir = path.join(outDir, "failed");
  ensureDir(outDir);
  if (options.keepFailed) ensureDir(failedDir);

  const ts = formatTimestamp();
  const slug = slugify(options.subject + "_" + options.scene);

  const genPromises: Promise<{ idx: number; buf: Buffer } | null>[] = [];
  const inputAbs = options.inputImagePath
    ? (path.isAbsolute(options.inputImagePath)
        ? options.inputImagePath
        : path.resolve(PROJECT_ROOT, options.inputImagePath))
    : null;

  for (let i = 0; i < options.numGenerations; i++) {
    genPromises.push(
      (inputAbs
        ? generateImageFromInput(ai, prompt, inputAbs, options.imageSize, aspectRatio)
        : generateImage(ai, prompt, options.imageSize, aspectRatio))
        .then((buf) => ({ idx: i, buf }))
        .catch((err) => {
          if (options.debug) {
            console.error(`[gen] Candidate ${i + 1} failed: ${(err as Error)?.message ?? String(err)}`);
          }
          return null;
        }),
    );
  }

  const results = (await Promise.all(genPromises)).filter(Boolean) as { idx: number; buf: Buffer }[];
  if (results.length === 0) throw new Error("No images generated");

  const saved: { abs: string; filename: string; passed: boolean }[] = [];
  for (const r of results) {
    const filename = `${ts}_${options.styleName}_${slug}_${r.idx + 1}.png`;
    const abs = path.join(outDir, filename);
    await Bun.write(abs, r.buf);
    saved.push({ abs, filename, passed: true });
    console.log(`[gen] Saved: ${filename}`);
  }

  if (!options.skipQualityCheck && options.referenceImagePath) {
    const referenceAbs = path.isAbsolute(options.referenceImagePath)
      ? options.referenceImagePath
      : path.resolve(PROJECT_ROOT, options.referenceImagePath);

    console.log(`[qa] Checking ${saved.length} candidate(s) against reference...`);
    for (const s of saved) {
      const ok = await qaCheck(
        ai,
        qualityPrompt,
        referenceAbs,
        s.abs,
        { subject: options.subject, scene: options.scene },
        Boolean(options.debug),
      );
      if (ok) {
        console.log(`[qa] PASSED: ${s.filename}`);
        s.passed = true;
      } else {
        console.log(`[qa] FAILED: ${s.filename}`);
        s.passed = false;
        if (options.keepFailed) {
          const failedAbs = path.join(failedDir, s.filename.replace(/\.png$/, "_FAILED.png"));
          await Bun.write(failedAbs, await Bun.file(s.abs).arrayBuffer());
        }
        const { $ } = await import("bun");
        await $`trash ${s.abs}`.quiet().nothrow();
      }
    }
    const passCount = saved.filter((x) => x.passed).length;
    const failCount = saved.filter((x) => !x.passed).length;
    console.log(`[gen] Done. Passed: ${passCount}, Failed: ${failCount}`);
  } else if (!options.skipQualityCheck) {
    console.log("[qa] Skipped (no --reference provided)");
  }
}

main().catch((err) => {
  console.error("[gen] Error:", (err as Error)?.message ?? String(err));
  process.exit(1);
});
