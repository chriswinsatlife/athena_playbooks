#!/usr/bin/env bun

/**
 * Analyze Reference Diagram
 * 
 * Takes a reference image and outputs a brand-agnostic template file
 * that describes the layout, hierarchy, and visual patterns.
 * 
 * Usage:
 *   bun tools/analyze_reference.ts <image_path> [output_name]
 * 
 * Examples:
 *   bun tools/analyze_reference.ts docs/lenny_diagrams_and_visuals/some_image.png
 *   bun tools/analyze_reference.ts docs/lenny_diagrams_and_visuals/some_image.png my_template
 */

import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const PROJECT_ROOT = import.meta.dir.replace("/tools", "");
const METAPROMPT_PATH = path.join(PROJECT_ROOT, "prompts", "analyze_diagram_reference.md");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "prompts", "diagram_templates");

// Models
const ANALYSIS_MODEL = "gemini-3-flash-preview";
const ANALYSIS_MODEL_FALLBACK = "gemini-3-flash";

function usage(): string {
  return `
USAGE:
  analyze_reference <image_path> [output_name]

ARGUMENTS:
  image_path    Path to reference image (png, jpg, etc.)
  output_name   Optional template name (defaults to image filename)

OPTIONS:
  -h, --help    Show this help
  --debug       Print the full prompt and response

ENVIRONMENT:
  GOOGLE_GENERATIVE_AI_API_KEY  Required

EXAMPLES:
  analyze_reference docs/lenny_diagrams_and_visuals/circular_diagram.png
  analyze_reference docs/lenny_diagrams_and_visuals/flow.png horizontal_process_flow
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

async function loadMetaprompt(): Promise<string> {
  const file = Bun.file(METAPROMPT_PATH);
  if (!(await file.exists())) {
    throw new Error(`Metaprompt not found: ${METAPROMPT_PATH}`);
  }
  const raw = await file.text();
  return stripFrontmatter(raw);
}

async function loadImage(imagePath: string): Promise<{ data: string; mimeType: string }> {
  const absPath = path.isAbsolute(imagePath) 
    ? imagePath 
    : path.resolve(PROJECT_ROOT, imagePath);
  
  const file = Bun.file(absPath);
  if (!(await file.exists())) {
    throw new Error(`Image not found: ${absPath}`);
  }

  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".webp") mimeType = "image/webp";
  else if (ext === ".gif") mimeType = "image/gif";

  const buffer = await file.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");

  return { data, mimeType };
}

function extractFilename(imagePath: string): string {
  const base = path.basename(imagePath, path.extname(imagePath));
  // Clean up UUID-style names
  const cleaned = base
    .replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_?/i, "")
    .replace(/_\d+x\d+$/, "") // remove dimension suffix
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  
  return cleaned || "template";
}

function looksLikeUnsupportedModelError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = String((err as { message?: string }).message || err).toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("unsupported") ||
    msg.includes("invalid") ||
    msg.includes("404")
  );
}

async function analyzeImageWithFallback(
  ai: GoogleGenAI,
  metaprompt: string,
  imageData: { data: string; mimeType: string },
  debug: boolean
): Promise<string> {
  const models = [ANALYSIS_MODEL, ANALYSIS_MODEL_FALLBACK];
  
  for (const model of models) {
    try {
      console.log(`[analyze] Trying model: ${model}`);
      
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: metaprompt },
              { 
                inlineData: {
                  data: imageData.data,
                  mimeType: imageData.mimeType,
                }
              },
            ],
          },
        ],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No text response from model");
      }

      if (debug) {
        console.log("\n[debug] Raw response:");
        console.log("-".repeat(60));
        console.log(text);
        console.log("-".repeat(60));
      }

      // Clean up markdown code fences if present
      let cleaned = text.trim();
      if (cleaned.startsWith("```markdown")) {
        cleaned = cleaned.slice(11);
      } else if (cleaned.startsWith("```md")) {
        cleaned = cleaned.slice(5);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }

      return cleaned.trim();
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
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(usage());
    process.exit(args.length === 0 ? 1 : 0);
  }

  const debug = args.includes("--debug");
  const filteredArgs = args.filter(a => a !== "--debug");

  const imagePath = filteredArgs[0];
  if (!imagePath) {
    console.error("Image path is required");
    process.exit(1);
  }

  const outputName = filteredArgs[1] || extractFilename(imagePath);

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`[analyze] Loading metaprompt...`);
  const metaprompt = await loadMetaprompt();

  console.log(`[analyze] Loading image: ${imagePath}`);
  const imageData = await loadImage(imagePath);

  console.log(`[analyze] Analyzing with Gemini 3 Flash...`);
  const templateContent = await analyzeImageWithFallback(ai, metaprompt, imageData, debug);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(OUTPUT_DIR, `${outputName}.md`);
  await Bun.write(outputPath, templateContent);

  console.log(`[analyze] Saved template: ${outputPath}`);
  console.log(`[analyze] Done.`);
}

main().catch((err) => {
  console.error("[analyze] Error:", err.message || err);
  process.exit(1);
});
