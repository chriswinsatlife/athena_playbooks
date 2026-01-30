import { z } from 'zod';

export const researchTaskSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).describe('kebab-case identifier'),
  topic: z.string().min(200).describe('Extensive description of what the playbook covers, problem, workflows, edge cases, success criteria. Multiple paragraphs.'),
  area: z.enum([
    'calendar', 'email', 'travel', 'finance', 'health', 'fitness',
    'nutrition', 'learning', 'career', 'relationships', 'family',
    'home', 'legal', 'insurance', 'giving', 'admin'
  ]).describe('Primary area from 16-area taxonomy'),
  research_guidance: z.string().min(100).describe('The steering block. Source priorities, whitelists/blacklists, must-cover, do-not-cover, quality signals, anti-patterns. As long as needed.'),
  source_material: z.string().optional().describe('Existing content to transform'),
});

export type ResearchTask = z.infer<typeof researchTaskSchema>;

export function parseResearchTask(input: unknown): ResearchTask {
  return researchTaskSchema.parse(input);
}

export async function loadResearchTask(path: string): Promise<ResearchTask> {
  const file = Bun.file(path);
  const data = await file.json();
  return researchTaskSchema.parse(data);
}
