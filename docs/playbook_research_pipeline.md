# Playbook Research Pipeline

Runs Exa Research API against a research task to produce enriched research for playbook generation.

## Usage

```bash
bun scripts/research_playbook.ts briefs/gift-automation.json
```

Requires `EXA_API_KEY` in environment.

## Exa Research API

Uses the Exa Research API (`https://api.exa.ai/research/v0/tasks`):
- POST to create task with `instructions` and `model` (exa-research or exa-research-pro)
- Response includes `researchId` and `status`
- Poll GET until `status === "completed"`
- Result includes `text`, `citations`, `costDollars`, `timeMs`

Docs: https://exa.ai/docs/reference/exa-research

## Input

5 plaintext fields in JSON:

```json
{
  "slug": "gift-automation",
  "topic": "Extensive description of what the playbook covers...",
  "area": "relationships",
  "research_guidance": "The steering block. Source priorities, must-cover topics...",
  "source_material": "Optional. Existing content to transform."
}
```

**Fields:**
- `slug` - kebab-case identifier (required)
- `topic` - multiple paragraphs covering problem, workflows, edge cases, success criteria (required, min 200 chars)
- `area` - one of 16 areas: calendar, email, travel, finance, health, fitness, nutrition, learning, career, relationships, family, home, legal, insurance, giving, admin (required)
- `research_guidance` - the steering block telling AI what to research, source priorities, whitelists/blacklists, must-cover, do-not-cover, quality signals (required, min 100 chars)
- `source_material` - existing content to transform (optional)

## Output

Writes to `briefs/enriched/<slug>.json`:

```json
{
  "slug": "gift-automation",
  "area": "relationships",
  "topic": "...",
  "research": "Cleaned markdown research output",
  "sources": ["https://...", "https://..."],
  "operations": [],
  "cost_usd": 0.45,
  "time_ms": 45000,
  "model": "exa-research-pro",
  "created_at": "2026-01-30T..."
}
```

## How It Works

1. Load and validate research task JSON against Zod schema
2. Load prompt template from `prompts/playbook_research_query.md`
3. Interpolate template with task fields (`{{ slug }}`, `{{ topic }}`, etc.)
4. POST to Exa Research API (`https://api.exa.ai/research/v0/tasks`)
5. Poll for completion every 10 seconds (max 10 minutes)
6. Clean results (remove markdown fences)
7. Extract unique sources from citations
8. Write enriched output to `briefs/enriched/<slug>.json`

## Files

```
lib/schemas/research_task.ts    Zod schema, parseResearchTask(), loadResearchTask()
prompts/playbook_research_query.md    Query template (what to research)
prompts/playbook_research_system.md   System prompt template
prompts/playbook_analysis.md          Analysis prompt template
scripts/research_playbook.ts          Main pipeline script
briefs/<slug>.json                    Input research tasks
briefs/enriched/<slug>.json           Output enriched research
```

## Template Interpolation

Templates use mustache syntax:
- `{{ slug }}` - simple variable
- `{{ #if source_material }}...{{ /if }}` - conditional block

## Example

Create a research task:

```json
{
  "slug": "inbox-zero",
  "topic": "Achieving and maintaining inbox zero through EA delegation. The problem: executives drown in email, miss important messages, waste hours on triage. The solution: EA pre-processes inbox, drafts responses, surfaces only what requires client decision. Key workflows: initial inbox audit, ongoing daily triage, escalation rules, draft approval flow.",
  "area": "email",
  "research_guidance": "Focus on delegation patterns, not productivity hacks. Must cover: Gmail/Outlook delegation setup, label/folder taxonomy, response templates, escalation criteria, SLA expectations. Avoid: personal productivity tips, app recommendations, 'touch it once' advice. Prioritize: athena.com, superhuman.com/blog, zapier.com/blog."
}
```

Run:

```bash
bun scripts/research_playbook.ts briefs/inbox-zero.json
```

## Next Steps

The enriched research feeds into `scripts/generate_playbook.ts` which produces the final playbook JSON for rendering.
