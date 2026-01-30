/**
 * Playbook Brief Parser
 *
 * Parses YAML brief files for the playbook generation pipeline.
 * Briefs must provide EXTENSIVE steering for LLM content generation.
 *
 * The playbook audience is ALWAYS Athena clients. Section-level distinctions
 * (client tasks vs EA tasks) are OUTPUT concerns handled in content generation.
 */

import { z } from 'zod';
import * as YAML from 'yaml';

// 16-area taxonomy
const personalAreas = [
  'physical-health',
  'mental-health',
  'relationships',
  'personal-finance',
  'learning-pkm',
  'passion-projects',
  'bucket-list',
  'experiences-travel',
] as const;

const businessAreas = [
  'admin',
  'finance',
  'people',
  'marketing',
  'sales',
  'product',
  'engineering',
  'operations',
] as const;

const allAreas = [
  'physical-health',
  'mental-health',
  'relationships',
  'personal-finance',
  'learning-pkm',
  'passion-projects',
  'bucket-list',
  'experiences-travel',
  'admin',
  'finance',
  'people',
  'marketing',
  'sales',
  'product',
  'engineering',
  'operations',
] as const;

export const AREA_TAXONOMY = {
  personal: personalAreas,
  business: businessAreas,
  all: allAreas,
} as const;

export type PersonalArea = (typeof personalAreas)[number];
export type BusinessArea = (typeof businessAreas)[number];
export type Area = (typeof allAreas)[number];

// Person schema for person-centric briefs (routines, stacks, interviews)
const personSchema = z.object({
  name: z.string().describe('Full name'),
  title: z.string().optional().describe('Job title or role'),
  company: z.string().optional().describe('Company or organization'),
  credentials: z.array(z.string()).optional().describe('Why this person is authoritative'),
  known_for: z.string().optional().describe('What they are famous for, 1-2 sentences'),
});

// Research guidance schema - the actual steering for research agents
const researchGuidanceSchema = z.object({
  // Person/expert focus
  expert_focus: z.object({
    name: z.string().describe('Expert name to focus on'),
    why: z.string().optional().describe('Why this person is the authority'),
    verified_sources: z.array(z.string()).optional().describe('Known good URLs for this person'),
  }).optional().describe('Specific person/expert to center research around'),

  // Source control
  whitelist: z.array(z.string()).optional().describe('Prioritize these URLs, domains, authors, publications'),
  blacklist: z.array(z.string()).optional().describe('Never cite: specific sites, affiliate-heavy content, outdated sources'),
  primary_sources: z.array(z.string()).optional().describe('Specific URLs to scrape and analyze directly'),

  // Framing and angles
  angles: z.array(z.string()).optional().describe('Specific angles or lenses to apply: "delegation-first", "automation-heavy", "relationship-focused"'),
  frameworks: z.array(z.string()).optional().describe('Named frameworks to reference or apply'),
  mental_models: z.array(z.string()).optional().describe('Mental models to use in framing'),

  // Scope control
  must_cover: z.array(z.string()).optional().describe('Topics/aspects that MUST be included'),
  do_not_cover: z.array(z.string()).optional().describe('Topics to explicitly exclude from scope'),
  depth_guidance: z.string().optional().describe('How deep to go: "surface overview", "practitioner depth", "expert implementation detail"'),

  // Quality signals
  quality_signals: z.array(z.string()).optional().describe('What makes a source trustworthy for this topic'),
  red_flags: z.array(z.string()).optional().describe('Signals that a source is low quality or wrong'),

  // Search guidance
  search_queries: z.array(z.string()).optional().describe('Suggested search queries to run'),
  keywords: z.array(z.string()).optional().describe('Terms that indicate relevance'),
  negative_keywords: z.array(z.string()).optional().describe('Terms that indicate irrelevance'),
});

// Target reader persona schema
const personaSchema = z.object({
  archetype: z.string().describe('Specific type: "Series A founder", "VC partner", "agency owner scaling to 50 people"'),
  pain_points: z.array(z.string()).optional().describe('What problems they have that this playbook solves'),
  goals: z.array(z.string()).optional().describe('What they want to achieve'),
  context: z.string().optional().describe('Their situation, constraints, environment'),
  prior_knowledge: z.string().optional().describe('What they already know, what needs explanation'),
});

// Zod schema for brief validation
export const briefSchema = z.object({
  // Required core fields
  slug: z
    .string()
    .min(1, 'slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'slug must be lowercase kebab-case (e.g., "gift-automation")'
    ),

  area: z.enum(allAreas, {
    errorMap: () => ({ message: `area must be one of: ${allAreas.join(', ')}` }),
  }),

  // Topic must be extensive - minimum 300 chars, should be multiple paragraphs
  topic: z
    .string()
    .min(300, 'topic must be at least 300 characters - provide multiple paragraphs of detail on scope, goals, specific workflows, edge cases, and what success looks like')
    .describe('Extensive description of what this playbook covers'),

  // Person-centric briefs (for routines, stacks, interviews)
  person: personSchema.optional().describe('Required for person-centric content'),

  // Research steering - the core of guiding AI research
  research_guidance: researchGuidanceSchema.optional().describe('Steering for research: sources, angles, scope, quality signals'),

  // Target reader archetype
  persona: personaSchema.optional().describe('Specific target reader archetype'),

  // Source material (existing content to transform/expand)
  source_material: z.string().optional().describe('Existing content: Coda doc, notes, transcript, pasted text'),

  // Tone/voice guidance beyond brand defaults
  tone: z.string().optional().describe('Voice guidance beyond Athena brand defaults'),

  // Section hints (optional guidance on structure)
  section_hints: z.array(z.string()).optional().describe('Suggested sections or topics to cover'),

  // Examples of what good looks like
  examples: z.array(z.string()).optional().describe('URLs or descriptions of similar good content to emulate'),

  // Specific delegation patterns to highlight
  delegation_focus: z.string().optional().describe('What aspect of delegation to emphasize: setup, ongoing, edge cases, proactive vs reactive'),
});

export type Brief = z.infer<typeof briefSchema>;
export type Person = z.infer<typeof personSchema>;
export type ResearchGuidance = z.infer<typeof researchGuidanceSchema>;
export type Persona = z.infer<typeof personaSchema>;

/** Error thrown when brief parsing or validation fails */
export class BriefParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'BriefParseError';
  }
}

/**
 * Parse and validate a brief YAML file.
 *
 * @param filePath - Absolute path to the YAML brief file
 * @returns Validated Brief object
 * @throws BriefParseError if file cannot be read, parsed, or validated
 */
export async function parseBrief(filePath: string): Promise<Brief> {
  let content: string;
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      throw new BriefParseError(`Brief file not found: ${filePath}`, filePath);
    }
    content = await file.text();
  } catch (error) {
    if (error instanceof BriefParseError) throw error;
    throw new BriefParseError(
      `Failed to read brief file: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      error
    );
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(content);
  } catch (error) {
    const yamlError = error as { message?: string; linePos?: { start?: { line: number } } };
    const line = yamlError.linePos?.start?.line;
    const lineInfo = line ? ` at line ${line}` : '';
    throw new BriefParseError(
      `Invalid YAML syntax${lineInfo}: ${yamlError.message || 'unknown error'}`,
      filePath,
      error
    );
  }

  const result = briefSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `  - ${path}${issue.message}`;
      })
      .join('\n');
    throw new BriefParseError(`Brief validation failed:\n${issues}`, filePath, result.error);
  }

  return result.data;
}

/**
 * Get the category (personal/business) for an area.
 */
export function getAreaCategory(area: Area): 'personal' | 'business' {
  return (personalAreas as readonly string[]).includes(area) ? 'personal' : 'business';
}

/**
 * Validate a slug format without parsing a full brief.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
