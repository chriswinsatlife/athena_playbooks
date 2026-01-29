#!/usr/bin/env bun

/**
 * Analyze Illustration Reference
 *
 * Takes a reference illustration image and outputs a brand-agnostic
 * illustration style template markdown file.
 *
 * Usage:
 *   bun tools/analyze_illustration_reference.ts <image_path> [output_name]
 *
 * Example:
 *   bun tools/analyze_illustration_reference.ts docs/lenny_diagrams_and_visuals/foo.png watercolor_footer_style
 */

import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const PROJECT_ROOT = import.meta.dir.replace("/tools", "");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "prompts");
const METAPROMPT_PATH = path.join(PROMPTS_DIR, "analyze_illustration_reference.md");
const OUTPUT_DIR = path.join(PROMPTS_DIR, "illustration_styles");

const ANALYSIS_MODEL = "gemini-3-flash-preview";
const ANALYSIS_MODEL_FALLBACK = "gemini-3-flash";

function usage(): string {
  return `
USAGE:
  analyze_illustration_reference <image_path> [output_name]

ARGUMENTS:
  image_path    Path to reference image (png, jpg, etc.)
  output_name   Optional output filename (without .md)

OPTIONS:
  -h, --help    Show this help
  --debug       Print raw model response

ENVIRONMENT:
  GOOGLE_GENERATIVE_AI_API_KEY  Required
`;
}

function stripFrontmatter(text: string): string {
  if (text.startsWith("---")) {
    const endIdx = text.indexOf("\n---", 4);
    if (endIdx !== -1) {
      return text.slice(endIdx + 5).trim();
    }
  }
  return text.trim();
}

async function readFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${filePath}`);
  }
  return file.text();
}

async function loadMetaprompt(): Promise<string> {
  const raw = await readFile(METAPROMPT_PATH);
  return stripFrontmatter(raw);
}

async function loadImage(imagePath: string): Promise<{ data: string; mimeType: string; absPath: string }> {
  const absPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(PROJECT_ROOT, imagePath);

  const file = Bun.file(absPath);
  if (!(await file.exists())) {
    throw new Error(`Image not found: ${absPath}`);
  }

  const ext = path.extname(absPath).toLowerCase();
  let mimeType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".webp") mimeType = "image/webp";
  else if (ext === ".gif") mimeType = "image/gif";

  const buffer = await file.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  return { data, mimeType, absPath };
}

function looksLikeUnsupportedModelError(err: unknown): boolean {
  const msg = String((err as { message?: unknown })?.message ?? err).toLowerCase();
  return msg.includes("not found") || msg.includes("unsupported") || msg.includes("invalid") || msg.includes("404");
}

function cleanMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```markdown")) cleaned = cleaned.slice(11);
  else if (cleaned.startsWith("```md")) cleaned = cleaned.slice(5);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

async function analyzeWithFallback(
  ai: GoogleGenAI,
  metaprompt: string,
  image: { data: string; mimeType: string },
  debug: boolean,
): Promise<string> {
  const models = [ANALYSIS_MODEL, ANALYSIS_MODEL_FALLBACK];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: metaprompt },
              { inlineData: { data: image.data, mimeType: image.mimeType } },
            ],
          },
        ],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text response from model");
      if (debug) {
        console.log("[debug] Raw response:\n" + text);
      }
      return cleanMarkdownFences(text);
    } catch (err) {
      if (looksLikeUnsupportedModelError(err) && model !== models[models.length - 1]) {
        console.warn(`[analyze] Model ${model} unavailable, trying fallback...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All models failed");
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    console.log(usage());
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const debug = argv.includes("--debug");
  const args = argv.filter((a) => a !== "--debug");
  const imagePath = args[0];
  const outputName = args[1];

  if (!imagePath) {
    console.error("Image path is required");
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const metaprompt = await loadMetaprompt();
  const image = await loadImage(imagePath);

  const safeName =
    (outputName ?? path.basename(image.absPath, path.extname(image.absPath)))
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .toLowerCase();

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`[analyze] Analyzing illustration reference with ${ANALYSIS_MODEL}...`);
  const template = await analyzeWithFallback(ai, metaprompt, image, debug);
  const outputPath = path.join(OUTPUT_DIR, `${safeName}.md`);
  await Bun.write(outputPath, template);
  console.log(`[analyze] Saved: ${outputPath}`);
}

main().catch((err) => {
  console.error("[analyze] Error:", (err as Error)?.message ?? String(err));
  process.exit(1);
});
