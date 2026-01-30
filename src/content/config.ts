/**
 * Astro Content Collections Configuration
 *
 * Re-exports Zod schemas from playbook_schemas.ts and defines Astro collections.
 * Import schemas from here for Astro components, or from playbook_schemas.ts for scripts.
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Re-export all schemas for use in Astro components
export * from '../lib/playbook_schemas';

import { playbookSchema } from '../lib/playbook_schemas';

// ---------------------------------------------------------------------------
// Content Collection Definition
// ---------------------------------------------------------------------------

const playbooks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/playbooks' }),
  schema: playbookSchema,
});

export const collections = {
  playbooks,
};
