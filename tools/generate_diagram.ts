#!/usr/bin/env bun

/**
 * Athena Playbook Diagram Generator
 * 
 * Generates consistent, on-brand diagrams for Athena playbooks using
 * Google Gemini 3 Pro image generation with quality checking.
 * 
 * Usage:
 *   bun tools/generate_diagram.ts <template> "<content>" [options]
 *   bun tools/generate_diagram.ts --list   # List available templates
 * 
 * Examples:
 *   bun tools/generate_diagram.ts staggered_step_grid "Title: 5 Delegation Tips | Step 1: Identify tasks..."
 *   bun tools/generate_diagram.ts test_lenny_1 "Title: Playbook Process | Step 1: Define | Step 2: Document" -n 4
 */

import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const PROJECT_ROOT = import.meta.dir.replace("/tools", "");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "prompts");
const TEMPLATES_DIR = path.join(PROMPTS_DIR, "diagram_templates");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "outputs", "diagrams");
const BRAND_STYLE_PATH = path.join(PROMPTS_DIR, "athena_brand_style.md");
const QUALITY_CHECK_PATH = path.join(PROMPTS_DIR, "diagram_quality_check.md");
const SYSTEM_INSTRUCTIONS_PATH = path.join(PROMPTS_DIR, "system_instructions.md");

// Models
const GENERATION_MODEL = "gemini-3-pro-image-preview";
const QUALITY_CHECK_MODEL = "gemini-3-flash-preview";
const QUALITY_CHECK_MODEL_FALLBACK = "gemini-3-flash";

const MAX_QUALITY_RETRIES = 3;

type ImageSize = "1K" | "2K" | "4K";

interface TemplateMeta {
  name: string;
  description: string;
  aspectRatio: string;
  layoutType: string;
}

interface GenerationOptions {
  template: string;
  content: string;
  notes?: string;
  numGenerations: number;
  imageSize: ImageSize;
  aspectRatio?: string;
  outputDir?: string;
  debug?: boolean;
  keepFailed?: boolean;
  skipQualityCheck?: boolean;
}

interface GeneratedImage {
  path: string;
  filename: string;
  passed: boolean;
}

function usage(): string {
  return `
USAGE:
  generate_diagram <template> "<content>" [options]
  generate_diagram --list

COMMANDS:
  --list              List all available templates

OPTIONS:
  -h, --help                Show this help
  -n, --num-generations <n> Number of images to generate (default: 4)
  -o, --output <dir>        Output directory
  --notes "<text>"          Additional generation notes
  --image-size <size>       1K, 2K, or 4K (default: 2K)
  --aspect-ratio <ratio>    Override template's default aspect ratio
  --keep-failed             Keep images that fail quality check
  --skip-quality-check      Skip quality checking (keep all)
  --debug                   Show debug info

ENVIRONMENT:
  GOOGLE_GENERATIVE_AI_API_KEY  Required

EXAMPLES:
  generate_diagram --list
  generate_diagram staggered_step_grid "Title: 5 Tips | Step 1: Do X | Step 2: Do Y"
  generate_diagram test_lenny_1 "Title: Process | Step 1: A | Step 2: B" -n 8 --keep-failed
`;
}

function formatTimestamp(d = new Date()): string {
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function slugify(text: string, maxWords = 4): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .replace(/\s+/g, "_")
    .split("_")
    .slice(0, maxWords)
    .join("_")
    .slice(0, 40);
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function readFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${filePath}`);
  }
  return file.text();
}

function parseFrontmatter(text: string): { frontmatter: Record<string, string>; body: string } {
  const frontmatter: Record<string, string> = {};
  let body = text;

  if (text.startsWith("---")) {
    const endIdx = text.indexOf("\n---", 4);
    if (endIdx !== -1) {
      const fmBlock = text.slice(4, endIdx).trim();
      body = text.slice(endIdx + 5).trim();

      for (const line of fmBlock.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let value = line.slice(colonIdx + 1).trim();
          // Remove quotes
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          frontmatter[key] = value;
        }
      }
    }
  }

  return { frontmatter, body };
}

function listTemplates(): TemplateMeta[] {
  if (!existsSync(TEMPLATES_DIR)) {
    return [];
  }

  const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".md"));
  const templates: TemplateMeta[] = [];

  for (const file of files) {
    const name = file.replace(".md", "");
    const content = Bun.file(path.join(TEMPLATES_DIR, file)).text();
    
    // Sync read for listing
    const text = require("fs").readFileSync(path.join(TEMPLATES_DIR, file), "utf-8");
    const { frontmatter } = parseFrontmatter(text);

    templates.push({
      name,
      description: frontmatter.description || "(no description)",
      aspectRatio: frontmatter.aspect_ratio || "1:1",
      layoutType: frontmatter.layout_type || name,
    });
  }

  return templates;
}

async function loadTemplate(templateName: string): Promise<{ meta: TemplateMeta; body: string }> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.md`);
  
  if (!existsSync(templatePath)) {
    const available = listTemplates().map((t) => t.name);
    throw new Error(
      `Template "${templateName}" not found.\nAvailable templates: ${available.join(", ") || "(none)"}`
    );
  }

  const raw = await readFile(templatePath);
  const { frontmatter, body } = parseFrontmatter(raw);

  return {
    meta: {
      name: templateName,
      description: frontmatter.description || "",
      aspectRatio: frontmatter.aspect_ratio || "1:1",
      layoutType: frontmatter.layout_type || templateName,
    },
    body,
  };
}

async function loadBrandStyle(): Promise<string> {
  const raw = await readFile(BRAND_STYLE_PATH);
  const { body } = parseFrontmatter(raw);
  return body;
}

async function loadQualityCheckPrompt(): Promise<string> {
  const raw = await readFile(QUALITY_CHECK_PATH);
  const { body } = parseFrontmatter(raw);
  return body;
}

async function loadSystemInstructions(): Promise<string> {
  if (!existsSync(SYSTEM_INSTRUCTIONS_PATH)) {
    return "";
  }
  const raw = await readFile(SYSTEM_INSTRUCTIONS_PATH);
  const { body } = parseFrontmatter(raw);
  return body;
}

function buildPrompt(
  brandStyle: string,
  templateBody: string,
  content: string,
  systemInstructions: string,
  notes?: string
): string {
  // Replace content placeholder if present, otherwise append
  let prompt = templateBody;
  if (templateBody.includes("$CONTENT")) {
    prompt = templateBody.replace("$CONTENT", content);
  } else {
    prompt = templateBody + "\n\n## Content\n\n" + content;
  }

  const sections = [
    "# Brand Style Guide",
    "",
    brandStyle,
    "",
    "---",
    "",
    "# Diagram Template",
    "",
    prompt,
  ];

  if (notes) {
    sections.push("", "## Additional Notes", "", notes);
  }

  if (systemInstructions) {
    sections.push("", "---", "", "# System Instructions", "", systemInstructions);
  }

  return sections.join("\n");
}

async function generateImage(
  ai: GoogleGenAI,
  prompt: string,
  imageSize: ImageSize,
  aspectRatio: string
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{ text: prompt }],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        imageSize,
        aspectRatio,
      },
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No content in response");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image data in response");
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

async function checkImageQuality(
  ai: GoogleGenAI,
  imagePath: string,
  qualityPrompt: string,
  originalPrompt: string,
  debug: boolean
): Promise<boolean> {
  const models = [QUALITY_CHECK_MODEL, QUALITY_CHECK_MODEL_FALLBACK];

  const imageBuffer = await Bun.file(imagePath).arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString("base64");

  const fullPrompt = [
    qualityPrompt,
    "",
    "## Original Generation Prompt (for reference)",
    "",
    originalPrompt.slice(0, 2000) + (originalPrompt.length > 2000 ? "..." : ""),
  ].join("\n");

  for (let attempt = 0; attempt < MAX_QUALITY_RETRIES; attempt++) {
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                { text: fullPrompt },
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType: "image/png",
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("No response text");
        }

        if (debug) {
          console.log(`[quality] Model ${model} response: ${text.slice(0, 200)}`);
        }

        const parsed = JSON.parse(text);
        return Boolean(parsed.isGood);
      } catch (err) {
        if (looksLikeUnsupportedModelError(err) && model !== models[models.length - 1]) {
          continue;
        }
        if (attempt < MAX_QUALITY_RETRIES - 1) {
          console.warn(`[quality] Attempt ${attempt + 1} failed, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          break;
        }
        console.warn(`[quality] Quality check failed after ${MAX_QUALITY_RETRIES} attempts, soft-passing`);
        return true;
      }
    }
  }

  return true;
}

function parseArgs(argv: string[]): GenerationOptions | "list" | "help" {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    return "help";
  }

  if (args.includes("--list") || args.includes("-l")) {
    return "list";
  }

  const template = args[0];
  if (!template || template.startsWith("-")) {
    console.error("Template name is required as first argument");
    process.exit(1);
  }

  const content = args[1];
  if (!content || content.startsWith("-")) {
    console.error("Content is required as second argument");
    process.exit(1);
  }

  const options: GenerationOptions = {
    template,
    content,
    numGenerations: 4,
    imageSize: "2K",
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-n":
      case "--num-generations":
        options.numGenerations = parseInt(args[++i], 10);
        break;
      case "-o":
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--notes":
        options.notes = args[++i];
        break;
      case "--image-size":
        options.imageSize = args[++i] as ImageSize;
        break;
      case "--aspect-ratio":
        options.aspectRatio = args[++i];
        break;
      case "--keep-failed":
        options.keepFailed = true;
        break;
      case "--skip-quality-check":
        options.skipQualityCheck = true;
        break;
      case "--debug":
        options.debug = true;
        break;
    }
  }

  return options;
}

async function main() {
  const parsed = parseArgs(process.argv);

  if (parsed === "help") {
    console.log(usage());
    process.exit(0);
  }

  if (parsed === "list") {
    const templates = listTemplates();
    if (templates.length === 0) {
      console.log("No templates found in prompts/diagram_templates/");
      console.log("Run analyze_reference.ts on reference images to create templates.");
    } else {
      console.log("Available templates:\n");
      for (const t of templates) {
        console.log(`  ${t.name}`);
        console.log(`    ${t.description}`);
        console.log(`    Aspect ratio: ${t.aspectRatio}`);
        console.log("");
      }
    }
    process.exit(0);
  }

  const options = parsed;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`[diagram] Loading template: ${options.template}`);

  const { meta, body: templateBody } = await loadTemplate(options.template);
  const brandStyle = await loadBrandStyle();
  const systemInstructions = await loadSystemInstructions();
  const qualityPrompt = options.skipQualityCheck ? "" : await loadQualityCheckPrompt();

  const fullPrompt = buildPrompt(brandStyle, templateBody, options.content, systemInstructions, options.notes);
  const aspectRatio = options.aspectRatio || meta.aspectRatio;

  if (options.debug) {
    console.log("\n[debug] Template:", meta.name);
    console.log("[debug] Layout type:", meta.layoutType);
    console.log("[debug] Aspect ratio:", aspectRatio);
    console.log("[debug] Image size:", options.imageSize);
    console.log("[debug] Num generations:", options.numGenerations);
    console.log("[debug] Quality check:", options.skipQualityCheck ? "DISABLED" : "ENABLED");
    console.log("\n[debug] Prompt preview:");
    console.log("-".repeat(60));
    console.log(fullPrompt.slice(0, 1500) + (fullPrompt.length > 1500 ? "\n..." : ""));
    console.log("-".repeat(60));
  }

  const outputDir = options.outputDir || OUTPUT_DIR;
  const failedDir = path.join(outputDir, "failed");
  ensureDir(outputDir);
  if (options.keepFailed) {
    ensureDir(failedDir);
  }

  console.log(`[diagram] Generating ${options.numGenerations} image(s) at ${options.imageSize}...`);

  const timestamp = formatTimestamp();
  const contentSlug = slugify(options.content);

  // Generate all images in parallel
  const generationPromises: Promise<{ buffer: Buffer; index: number } | null>[] = [];

  for (let i = 0; i < options.numGenerations; i++) {
    const promise = generateImage(ai, fullPrompt, options.imageSize, aspectRatio)
      .then((buffer) => ({ buffer, index: i }))
      .catch((err) => {
        console.error(`[diagram] Generation ${i + 1} failed: ${err.message}`);
        return null;
      });
    generationPromises.push(promise);
  }

  const results = (await Promise.all(generationPromises)).filter(Boolean) as {
    buffer: Buffer;
    index: number;
  }[];

  console.log(`[diagram] Generated ${results.length}/${options.numGenerations} images`);

  // Save all images
  const savedImages: GeneratedImage[] = [];

  for (const { buffer, index } of results) {
    const suffix = options.numGenerations > 1 ? `_${index + 1}` : "";
    const filename = `${timestamp}_${options.template}_${contentSlug}${suffix}.png`;
    const outputPath = path.join(outputDir, filename);

    await Bun.write(outputPath, buffer);
    savedImages.push({ path: outputPath, filename, passed: true });
    console.log(`[diagram] Saved: ${filename}`);
  }

  // Quality check phase
  if (!options.skipQualityCheck && savedImages.length > 0) {
    console.log(`[quality] Checking ${savedImages.length} image(s)...`);

    for (const image of savedImages) {
      const isGood = await checkImageQuality(
        ai,
        image.path,
        qualityPrompt,
        fullPrompt,
        options.debug || false
      );

      if (isGood) {
        console.log(`[quality] PASSED: ${image.filename}`);
        image.passed = true;
      } else {
        console.log(`[quality] FAILED: ${image.filename}`);
        image.passed = false;

        if (options.keepFailed) {
          const failedPath = path.join(failedDir, image.filename.replace(".png", "_FAILED.png"));
          await Bun.write(failedPath, await Bun.file(image.path).arrayBuffer());
          console.log(`[quality] Moved to failed/`);
        }

        const { $ } = await import("bun");
        await $`trash ${image.path}`.quiet().nothrow();
      }
    }

    const passed = savedImages.filter((i) => i.passed);
    const failed = savedImages.filter((i) => !i.passed);

    console.log(`[diagram] Done. Passed: ${passed.length}, Failed: ${failed.length}`);

    if (passed.length === 0) {
      console.warn("[diagram] WARNING: No images passed quality check!");
    }
  } else {
    console.log(`[diagram] Done. Generated ${savedImages.length} image(s).`);
  }
}

main().catch((err) => {
  console.error("[diagram] Error:", err.message || err);
  process.exit(1);
});
