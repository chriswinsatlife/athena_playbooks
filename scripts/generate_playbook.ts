#!/usr/bin/env bun
/**
 * Playbook Generation Orchestrator
 *
 * Generates playbook JSON from brief YAML using AI.
 *
 * Usage:
 *   bun scripts/generate_playbook.ts briefs/gift-automation.yaml
 *   bun scripts/generate_playbook.ts briefs/gift-automation.yaml --dry-run
 */

import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { parseBrief, type Brief } from '../src/lib/brief_parser';
import { createPipelineRun, createPhaseLogger } from '../src/lib/pipeline_logger';
import {
  metaSchema,
  heroSchema,
  faqItemSchema,
  toolSchema,
  beforeAfterSchema,
  sectionContentSchema,
  calloutSchema,
} from '../src/lib/playbook_schemas';

// Simplified section schema for generation (no embeds - they're added manually or in post-processing)
const generationSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).describe('URL-safe section identifier'),
  title: z.string().describe('Section heading'),
  icon: z.string().optional().describe('Icon name from icon set'),
  content: sectionContentSchema.describe('Main section content'),
  callout: calloutSchema.optional().describe('Highlighted tip/warning/tool'),
});

// Generation-friendly schema (excludes complex embed types Gemini can't handle)
const generationSchema = z.object({
  meta: metaSchema,
  hero: heroSchema,
  tools: z.array(toolSchema).optional(),
  before_after: beforeAfterSchema.optional(),
  sections: z.array(generationSectionSchema).min(1),
  faq: z.array(faqItemSchema).min(3).max(8),
  related: z.array(z.string()).max(6).optional(),
});

type GeneratedPlaybook = z.infer<typeof generationSchema>;

interface GenerateOptions {
  dryRun?: boolean;
  model?: string;
}

/**
 * Build the system prompt for playbook generation
 */
function buildSystemPrompt(): string {
  return `You are an expert content strategist for Athena, a premium executive assistant service.

Your task is to generate structured playbook content in JSON format. Playbooks teach Athena clients (startup founders, executives, VCs) how to delegate specific tasks to their executive assistant.

CRITICAL RULES:
- Playbooks are ALWAYS for clients. Never write content for EAs to read.
- Content describes what the CLIENT does vs what they DELEGATE to the EA.
- Be specific and actionable. Clients should be able to implement immediately.
- Use the "reply with a number" paradigm where applicable (EA sends options, client picks).
- Emphasize time savings and relationship/business outcomes.

CONTENT FORMAT:
- Sections use structured content formats: checklist, steps, specs, or prose
- Checklists are for setup tasks with optional substeps
- Steps are for sequential workflows
- Specs are for key-value information (requirements, specifications)
- Prose is for explanatory content

TONE:
- Direct, confident, benefit-focused
- No fluff or generic advice
- Specific time estimates where possible
- Real examples over abstract concepts`;
}

/**
 * Build the user prompt from brief
 */
function buildUserPrompt(brief: Brief): string {
  const parts: string[] = [];

  parts.push(`# Generate Playbook: ${brief.slug}`);
  parts.push(`\n## Area: ${brief.area}`);
  parts.push(`\n## Topic\n${brief.topic}`);

  if (brief.persona) {
    parts.push(`\n## Target Reader`);
    parts.push(`Archetype: ${brief.persona.archetype}`);
    if (brief.persona.pain_points?.length) {
      parts.push(`Pain points:\n${brief.persona.pain_points.map(p => `- ${p}`).join('\n')}`);
    }
    if (brief.persona.goals?.length) {
      parts.push(`Goals:\n${brief.persona.goals.map(g => `- ${g}`).join('\n')}`);
    }
  }

  if (brief.research_guidance) {
    const rg = brief.research_guidance;
    parts.push(`\n## Research Guidance`);

    if (rg.angles?.length) {
      parts.push(`Angles to take:\n${rg.angles.map(a => `- ${a}`).join('\n')}`);
    }
    if (rg.must_cover?.length) {
      parts.push(`Must cover:\n${rg.must_cover.map(m => `- ${m}`).join('\n')}`);
    }
    if (rg.do_not_cover?.length) {
      parts.push(`Do NOT cover:\n${rg.do_not_cover.map(d => `- ${d}`).join('\n')}`);
    }
    if (rg.depth_guidance) {
      parts.push(`Depth: ${rg.depth_guidance}`);
    }
  }

  if (brief.source_material) {
    parts.push(`\n## Source Material\n${brief.source_material}`);
  }

  if (brief.section_hints?.length) {
    parts.push(`\n## Suggested Sections\n${brief.section_hints.map(s => `- ${s}`).join('\n')}`);
  }

  if (brief.delegation_focus) {
    parts.push(`\n## Delegation Focus\n${brief.delegation_focus}`);
  }

  parts.push(`\n## Output Requirements
- Generate a complete playbook JSON matching the schema
- Include 4-6 sections with varied content formats
- Include 3-5 FAQ items optimized for SEO
- Hero section should have benefit-focused headline and 2-3 stats
- Before/after comparison showing transformation`);

  return parts.join('\n');
}

/**
 * Generate playbook content from brief
 */
async function generatePlaybookContent(
  brief: Brief,
  options: GenerateOptions = {}
): Promise<GeneratedPlaybook> {
  const model = options.model || 'gemini-3-flash-preview';

  const { output, usage } = await generateText({
    model: google(model),
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(brief),
    experimental_output: Output.object({
      schema: generationSchema,
    }),
    maxOutputTokens: 8000,
    temperature: 0.7,
  });

  if (!output) {
    throw new Error('No output generated');
  }

  return output as GeneratedPlaybook;
}

/**
 * Main orchestrator
 */
async function main() {
  const args = process.argv.slice(2);
  const briefPath = args.find(a => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');

  if (!briefPath) {
    console.error('Usage: bun scripts/generate_playbook.ts <brief.yaml> [--dry-run]');
    process.exit(1);
  }

  const logger = createPipelineRun();
  const phase1 = createPhaseLogger(logger, 'Phase1');

  try {
    // Parse brief
    phase1.start('parseBrief', briefPath);
    const brief = await parseBrief(briefPath);
    phase1.success('parseBrief');

    if (dryRun) {
      console.log('\n--- DRY RUN ---');
      console.log('Brief parsed successfully:');
      console.log(`  slug: ${brief.slug}`);
      console.log(`  area: ${brief.area}`);
      console.log(`  topic: ${brief.topic.slice(0, 100)}...`);
      console.log('\nWould generate playbook JSON to:');
      console.log(`  src/content/playbooks/${brief.slug}.json`);
      logger.logSummary('success', 'Dry run complete');
      return;
    }

    // Generate content
    phase1.start('generateContent', `Generating playbook for ${brief.slug}`);
    const playbook = await generatePlaybookContent(brief);
    phase1.success('generateContent');

    // Enforce slug from brief (LLM may generate a different one)
    playbook.meta.slug = brief.slug;

    // Write output
    const outputPath = `src/content/playbooks/${brief.slug}.json`;
    phase1.start('writeOutput', outputPath);
    await Bun.write(outputPath, JSON.stringify(playbook, null, 2));
    phase1.success('writeOutput');

    logger.logSummary('success', `Generated: ${outputPath}`);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.logSummary('error', message);
    console.error(error);
    process.exit(1);
  }
}

main();
