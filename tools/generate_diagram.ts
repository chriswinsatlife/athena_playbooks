#!/usr/bin/env bun

/**
 * Athena Playbook Diagram Generator
 * 
 * Generates consistent, on-brand diagrams for Athena playbooks using
 * Google Gemini 3 Pro image generation.
 * 
 * Usage:
 *   bun tools/generate_diagram.ts <template> "<content>" [options]
 * 
 * Templates:
 *   circular_hub       - Radial diagram with center hub and surrounding elements
 *   horizontal_flow    - Left-to-right process flow
 *   comparison_columns - Side-by-side comparison (2-4 columns)
 *   detailed_checklist - Long-form text-heavy guide/checklist
 *   card_grid          - Grid of cards showing related concepts
 *   vertical_hierarchy - Pyramid or stacked levels
 * 
 * Examples:
 *   bun tools/generate_diagram.ts circular_hub "Center: Delegation Hub | Elements: Email, Calendar, Travel, Research, Expenses, Scheduling"
 *   bun tools/generate_diagram.ts horizontal_flow "Step 1: Identify Task | Step 2: Document Process | Step 3: Delegate to EA | Step 4: Review & Refine"
 */

import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const PROJECT_ROOT = import.meta.dir.replace("/tools", "");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "prompts");
const TEMPLATES_DIR = path.join(PROMPTS_DIR, "diagram_templates");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "outputs", "diagrams");
const BRAND_STYLE_PATH = path.join(PROMPTS_DIR, "athena_brand_style.md");

const GENERATION_MODEL = "gemini-3-pro-image-preview";

const VALID_TEMPLATES = [
  "circular_hub",
  "horizontal_flow",
  "comparison_columns",
  "detailed_checklist",
  "card_grid",
  "vertical_hierarchy",
] as const;

type TemplateType = (typeof VALID_TEMPLATES)[number];

interface GenerationOptions {
  template: TemplateType;
  content: string;
  notes?: string;
  numGenerations: number;
  imageSize: "1K" | "2K" | "4K";
  aspectRatio?: string;
  outputDir?: string;
  debug?: boolean;
}

const DEFAULT_ASPECT_RATIOS: Record<TemplateType, string> = {
  circular_hub: "1:1",
  horizontal_flow: "16:9",
  comparison_columns: "4:3",
  detailed_checklist: "3:4",
  card_grid: "1:1",
  vertical_hierarchy: "3:4",
};

function usage(): string {
  return `
USAGE:
  generate_diagram <template> "<content>" [options]

TEMPLATES:
  circular_hub       Radial diagram with center hub
  horizontal_flow    Left-to-right process flow
  comparison_columns Side-by-side comparison
  detailed_checklist Long-form text-heavy guide
  card_grid          Grid of related concepts
  vertical_hierarchy Pyramid or stacked levels

OPTIONS:
  -h, --help                Show this help
  -n, --num-generations <n> Number of images (default: 1)
  -o, --output <dir>        Output directory
  --notes "<text>"          Additional generation notes
  --image-size <size>       1K, 2K, or 4K (default: 2K)
  --aspect-ratio <ratio>    Override default aspect ratio
  --debug                   Show debug info

ENVIRONMENT:
  GOOGLE_GENERATIVE_AI_API_KEY  Required

EXAMPLES:
  generate_diagram circular_hub "Center: Delegation | Items: Email, Calendar, Travel, Research"
  generate_diagram horizontal_flow "Identify → Document → Delegate → Review" -n 3
  generate_diagram detailed_checklist "Title: EA Onboarding Checklist | Section 1: Communication Setup | ..."
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

function stripFrontmatter(text: string): string {
  if (text.startsWith("---")) {
    const endIdx = text.indexOf("\n---", 4);
    if (endIdx !== -1) {
      return text.slice(endIdx + 5).trim();
    }
  }
  return text.trim();
}

async function loadBrandStyle(): Promise<string> {
  const raw = await readFile(BRAND_STYLE_PATH);
  return stripFrontmatter(raw);
}

async function loadTemplate(template: TemplateType): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
  const raw = await readFile(templatePath);
  return stripFrontmatter(raw);
}

function buildPrompt(
  brandStyle: string,
  templatePrompt: string,
  content: string,
  notes?: string
): string {
  let prompt = templatePrompt.replace("$CONTENT", content);

  const sections = [
    "# Athena Brand Style Guide",
    "",
    brandStyle,
    "",
    "---",
    "",
    prompt,
  ];

  if (notes) {
    sections.push("", "## Additional Notes", "", notes);
  }

  return sections.join("\n");
}

async function generateImage(
  ai: GoogleGenAI,
  prompt: string,
  imageSize: "1K" | "2K" | "4K",
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

function parseArgs(argv: string[]): GenerationOptions {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(usage());
    process.exit(0);
  }

  const template = args[0] as TemplateType;
  if (!VALID_TEMPLATES.includes(template)) {
    console.error(`Invalid template: ${template}`);
    console.error(`Valid templates: ${VALID_TEMPLATES.join(", ")}`);
    process.exit(1);
  }

  const content = args[1];
  if (!content) {
    console.error("Content is required");
    process.exit(1);
  }

  const options: GenerationOptions = {
    template,
    content,
    numGenerations: 1,
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
        options.imageSize = args[++i] as "1K" | "2K" | "4K";
        break;
      case "--aspect-ratio":
        options.aspectRatio = args[++i];
        break;
      case "--debug":
        options.debug = true;
        break;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv);

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`[diagram] Loading brand style and ${options.template} template...`);

  const brandStyle = await loadBrandStyle();
  const templatePrompt = await loadTemplate(options.template);

  const fullPrompt = buildPrompt(
    brandStyle,
    templatePrompt,
    options.content,
    options.notes
  );

  const aspectRatio =
    options.aspectRatio || DEFAULT_ASPECT_RATIOS[options.template];

  if (options.debug) {
    console.log("\n[debug] Full prompt:");
    console.log("─".repeat(60));
    console.log(fullPrompt.slice(0, 2000) + (fullPrompt.length > 2000 ? "\n..." : ""));
    console.log("─".repeat(60));
    console.log(`[debug] Aspect ratio: ${aspectRatio}`);
    console.log(`[debug] Image size: ${options.imageSize}`);
    console.log(`[debug] Num generations: ${options.numGenerations}`);
  }

  const outputDir = options.outputDir || OUTPUT_DIR;
  ensureDir(outputDir);

  console.log(
    `[diagram] Generating ${options.numGenerations} image(s) at ${options.imageSize} resolution...`
  );

  const timestamp = formatTimestamp();
  const contentSlug = slugify(options.content);

  const promises: Promise<{ buffer: Buffer; index: number }>[] = [];

  for (let i = 0; i < options.numGenerations; i++) {
    const promise = generateImage(
      ai,
      fullPrompt,
      options.imageSize,
      aspectRatio
    ).then((buffer) => ({ buffer, index: i }));
    promises.push(promise);
  }

  const results = await Promise.all(promises);

  for (const { buffer, index } of results) {
    const suffix = options.numGenerations > 1 ? `_${index + 1}` : "";
    const filename = `${timestamp}_${options.template}_${contentSlug}${suffix}.png`;
    const outputPath = path.join(outputDir, filename);

    await Bun.write(outputPath, buffer);
    console.log(`[diagram] Saved: ${outputPath}`);
  }

  console.log(`[diagram] Done. Generated ${results.length} image(s).`);
}

main().catch((err) => {
  console.error("[diagram] Error:", err.message || err);
  process.exit(1);
});
