# Playbook Generation Pipeline

Generates structured playbook JSON from brief YAML files using AI.

## Quick Start

```bash
# Dry run (parse brief, show what would be generated)
bun scripts/generate_playbook.ts briefs/gift-automation.yaml --dry-run

# Generate playbook
bun scripts/generate_playbook.ts briefs/gift-automation.yaml
```

Output: `src/content/playbooks/{slug}.json`

## Architecture

```
briefs/*.yaml          # Input: Human-authored steering documents
       |
       v
generate_playbook.ts   # Orchestrator: Parses brief, calls LLM, validates output
       |
       v
playbooks/*.json       # Output: Structured content for Astro rendering
       |
       v
[slug].astro           # Dynamic route renders the playbook
```

## Brief Schema

Briefs are YAML files that steer AI content generation. Location: `briefs/`

### Required Fields

- `slug`: URL-safe identifier (kebab-case)
- `area`: One of the 16-area taxonomy (see below)
- `topic`: Minimum 300 characters describing scope, workflows, edge cases

### Optional Fields

- `persona`: Target reader archetype with pain_points and goals
- `research_guidance`: Source control, angles, scope, quality signals
- `section_hints`: Suggested sections to include
- `delegation_focus`: What delegation pattern to emphasize
- `source_material`: Existing content to transform
- `tone`: Voice guidance beyond brand defaults

### Example Brief

```yaml
slug: gift-automation
area: relationships

topic: |
  Automating gift-giving for birthdays, holidays, anniversaries...
  [300+ chars describing scope, workflows, edge cases, success criteria]

persona:
  archetype: "Time-starved founder with 50+ relationships"
  pain_points:
    - Forgets birthdays until day-of
    - Sends generic gifts
  goals:
    - Never miss important dates
    - 30-second decision time per gift

research_guidance:
  must_cover:
    - Gift database setup
    - Reply-with-number workflow
    - Proactive reminder system
  do_not_cover:
    - Specific gift recommendations
    - DIY gift-making
  depth_guidance: "Practitioner depth"
  angles:
    - Delegation-first
    - Relationship ROI

section_hints:
  - The gift database
  - Setting up reminders
  - Reply-with-number workflow
  - Edge cases

delegation_focus: |
  Vicarious-offensive delegation: EA proactively surfaces opportunities
  and presents curated options. Client's only job is to pick a number.
```

## Output Schema

Generated JSON matches `playbookSchema` from `src/lib/playbook_schemas.ts`.

### Structure

```
meta           # Title, slug, description, area, type, delegation metadata
hero           # Headline, subheadline, value_prop, stats
tools[]        # Software/services used in the playbook
before_after   # Pain points vs benefits comparison
sections[]     # Main content (checklist, steps, specs, or prose format)
faq[]          # 3-8 questions for SEO
related[]      # Related playbook slugs
```

### Section Content Formats

- `checklist`: Items with optional substeps (setup tasks)
- `steps`: Numbered sequential workflow
- `specs`: Key-value pairs (requirements, specifications)
- `prose`: Markdown text (explanatory content)

## 16-Area Taxonomy

Personal:
- physical-health, mental-health, relationships, personal-finance
- learning-pkm, passion-projects, bucket-list, experiences-travel

Business:
- admin, finance, people, marketing
- sales, product, engineering, operations

## Configuration

### Model Selection

Default: `gemini-3-flash-preview`

Edit `scripts/generate_playbook.ts:152` to change:
```typescript
const model = options.model || 'gemini-3-flash-preview';
```

### Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for Gemini models

## Validation

The pipeline uses Zod schemas for both input (brief) and output (playbook) validation.

Brief validation errors show specific issues:
```
Brief validation failed:
  - topic: String must contain at least 300 character(s)
  - area: area must be one of: physical-health, mental-health, ...
```

Output validation ensures LLM response matches schema before writing.

The script enforces the brief's slug on the output (overrides whatever the LLM generates) to ensure filename and meta.slug always match.

## Files

- `scripts/generate_playbook.ts`: Main orchestrator
- `src/lib/brief_parser.ts`: Brief YAML parser with validation
- `src/lib/playbook_schemas.ts`: Pure Zod schemas (no Astro deps)
- `src/content/config.ts`: Astro content collection (re-exports schemas)
- `briefs/`: Input brief YAML files
- `src/content/playbooks/`: Output JSON files

## Extending

### Adding New Section Formats

1. Add schema to `src/lib/playbook_schemas.ts` (sectionContentSchema)
2. Add renderer component in `src/components/playbook/`
3. Update `Section.astro` to dispatch to new renderer

### Adding New Embed Types

Note: Complex embed types (datatable with dynamic columns) are excluded from generation due to Gemini schema limitations. Embeds are added manually or in post-processing.

### Custom Models

The script uses Vercel AI SDK. To use different providers:

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// In generatePlaybookContent():
model: openai('gpt-4o'),
// or
model: anthropic('claude-sonnet-4-20250514'),
```

## Troubleshooting

### "Brief file not found"
Ensure the path is relative to repo root: `briefs/filename.yaml`

### "topic must be at least 300 characters"
The topic field requires extensive detail. Include scope, workflows, edge cases, and success criteria.

### "No object generated: response did not match schema"
LLM output failed validation. Check the error for specific field issues. Common causes:
- Description too long (max 180 chars)
- Invalid area enum value
- Missing required fields

### Schema validation errors from Gemini
Some Zod patterns don't translate to Gemini's schema format:
- `z.record(z.unknown())` fails (use explicit object shapes)
- Complex discriminated unions may need simplification
