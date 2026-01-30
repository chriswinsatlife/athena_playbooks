#!/usr/bin/env bun

/**
 * Research Playbook Pipeline
 *
 * Runs Exa Research API against a playbook research task brief,
 * polls for completion, and writes enriched output.
 *
 * Usage: bun scripts/research_playbook.ts <path-to-brief.json>
 */

import { loadResearchTask, type ResearchTask } from '../lib/schemas/research_task';

const EXA_API_BASE = 'https://api.exa.ai/research/v0/tasks';
const POLL_INTERVAL_MS = 10_000; // 10 seconds, matching n8n Wait nodes
const MAX_POLL_ATTEMPTS = 60; // 10 minutes max

interface ExaCreateResponse {
  id: string;
  status: string;
}

interface ExaTaskResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  text?: string;
  citations?: Record<string, string>;
  operations?: unknown[];
  costDollars?: { total: number };
  timeMs?: number;
  model?: string;
  error?: string;
}

interface EnrichedOutput {
  slug: string;
  area: string;
  topic: string;
  research: string;
  sources: string[];
  operations: unknown[];
  cost_usd: number;
  time_ms: number;
  model: string;
  created_at: string;
}

function log(phase: string, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${phase}] ${message}`);
}

function logError(phase: string, message: string) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${phase}] ERROR: ${message}`);
}

async function loadPromptTemplate(name: string): Promise<string> {
  const path = `prompts/${name}.md`;
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`Prompt template not found: ${path}`);
  }
  return file.text();
}

function interpolateTemplate(template: string, task: ResearchTask): string {
  let result = template;

  // Simple mustache-style interpolation: {{ field }}
  result = result.replace(/\{\{\s*slug\s*\}\}/g, task.slug);
  result = result.replace(/\{\{\s*topic\s*\}\}/g, task.topic);
  result = result.replace(/\{\{\s*area\s*\}\}/g, task.area);
  result = result.replace(/\{\{\s*research_guidance\s*\}\}/g, task.research_guidance);

  // Handle conditional blocks: {{ #if field }}...{{ /if }}
  // source_material
  if (task.source_material) {
    result = result.replace(
      /\{\{\s*#if\s+source_material\s*\}\}([\s\S]*?)\{\{\s*source_material\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g,
      (_match, before, after) => `${before}${task.source_material}${after}`
    );
  } else {
    result = result.replace(
      /\{\{\s*#if\s+source_material\s*\}\}[\s\S]*?\{\{\s*\/if\s*\}\}/g,
      ''
    );
  }

  // Remove other conditional blocks we don't have data for
  result = result.replace(
    /\{\{\s*#if\s+\w+\s*\}\}[\s\S]*?\{\{\s*\/if\s*\}\}/g,
    ''
  );

  // Clean up any remaining template variables we didn't handle
  result = result.replace(/\{\{\s*\w+\s*\}\}/g, '');

  return result.trim();
}

async function createResearchTask(instructions: string, apiKey: string): Promise<ExaCreateResponse> {
  const response = await fetch(EXA_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      instructions,
      model: 'exa-research-pro',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exa API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function pollTaskStatus(taskId: string, apiKey: string): Promise<ExaTaskResult> {
  const response = await fetch(`${EXA_API_BASE}/${taskId}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exa API poll error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function cleanMarkdownOutput(text: string): string {
  // Remove ```markdown fences if present (matching n8n pattern)
  return text
    .split('\n')
    .filter((line) => line !== '```markdown' && line !== '```')
    .join('\n')
    .trim();
}

function extractUniqueSources(citations: Record<string, string> | undefined): string[] {
  if (!citations) return [];
  return [...new Set(Object.values(citations))];
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: bun scripts/research_playbook.ts <path-to-brief.json>');
    process.exit(1);
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    logError('Init', 'EXA_API_KEY environment variable is not set');
    process.exit(1);
  }

  // 1. Load and validate research task
  log('Load', `Loading brief from ${inputPath}`);
  let task: ResearchTask;
  try {
    task = await loadResearchTask(inputPath);
    log('Load', `Validated task: ${task.slug} (${task.area})`);
  } catch (error) {
    logError('Load', `Failed to parse research task: ${error}`);
    process.exit(1);
  }

  // 2. Load and interpolate prompt template
  log('Template', 'Loading prompt template: playbook_research_query.md');
  let instructions: string;
  try {
    const template = await loadPromptTemplate('playbook_research_query');
    instructions = interpolateTemplate(template, task);
    log('Template', `Interpolated template (${instructions.length} chars)`);
  } catch (error) {
    logError('Template', `Failed to load/interpolate template: ${error}`);
    process.exit(1);
  }

  // 3. Create Exa research task
  log('Research', 'Submitting to Exa Research API...');
  let taskId: string;
  try {
    const createResponse = await createResearchTask(instructions, apiKey);
    taskId = createResponse.id;
    log('Research', `Task created: ${taskId} (status: ${createResponse.status})`);
  } catch (error) {
    logError('Research', `Failed to create research task: ${error}`);
    process.exit(1);
  }

  // 4. Poll for completion
  log('Poll', `Polling every ${POLL_INTERVAL_MS / 1000}s (max ${MAX_POLL_ATTEMPTS} attempts)...`);
  let result: ExaTaskResult | null = null;
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await Bun.sleep(POLL_INTERVAL_MS);

    try {
      const status = await pollTaskStatus(taskId, apiKey);
      log('Poll', `Attempt ${attempt}: status = ${status.status}`);

      if (status.status === 'completed') {
        result = status;
        break;
      } else if (status.status === 'failed') {
        logError('Poll', `Task failed: ${status.error || 'Unknown error'}`);
        process.exit(1);
      }
      // Continue polling if pending or running
    } catch (error) {
      logError('Poll', `Poll attempt ${attempt} failed: ${error}`);
      // Continue trying
    }
  }

  if (!result) {
    logError('Poll', 'Max poll attempts reached without completion');
    process.exit(1);
  }

  // 5. Process and clean results
  log('Process', 'Processing research results...');
  const cleanedText = cleanMarkdownOutput(result.text || '');
  const sources = extractUniqueSources(result.citations);
  const costUsd = result.costDollars?.total ?? 0;

  log('Process', `Research complete: ${cleanedText.length} chars, ${sources.length} sources, $${costUsd.toFixed(2)}`);

  // 6. Build enriched output
  const enriched: EnrichedOutput = {
    slug: task.slug,
    area: task.area,
    topic: task.topic,
    research: cleanedText,
    sources,
    operations: result.operations || [],
    cost_usd: Math.round(costUsd * 100) / 100,
    time_ms: result.timeMs || 0,
    model: result.model || 'exa-research-pro',
    created_at: new Date().toISOString(),
  };

  // 7. Ensure output directory exists and write
  const outputDir = 'briefs/enriched';
  const outputPath = `${outputDir}/${task.slug}.json`;

  log('Write', `Writing enriched output to ${outputPath}`);
  try {
    await Bun.write(outputPath, JSON.stringify(enriched, null, 2));
    log('Write', 'Output written successfully');
  } catch (error) {
    logError('Write', `Failed to write output: ${error}`);
    process.exit(1);
  }

  // 8. Summary
  console.log('\n=== Research Complete ===');
  console.log(`Slug: ${task.slug}`);
  console.log(`Area: ${task.area}`);
  console.log(`Research length: ${cleanedText.length} chars`);
  console.log(`Sources: ${sources.length}`);
  console.log(`Cost: $${costUsd.toFixed(2)}`);
  console.log(`Time: ${((result.timeMs || 0) / 1000).toFixed(1)}s`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error) => {
  logError('Fatal', `Unhandled error: ${error}`);
  process.exit(1);
});
