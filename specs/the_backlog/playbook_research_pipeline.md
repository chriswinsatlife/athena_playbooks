# Playbook Research Pipeline

Automated research pipeline that enriches playbook briefs with curated sources, tool discovery, and structured analysis before content generation.

Status: **Next Up** - input spec and prompts defined, implementation pending

## References

- Input spec: `specs/next_up/playbook_research_task_input.md`
- Implementation: `scripts/research_playbook.ts` (planned)
- Prompts:
  - `prompts/playbook_research_system.md` - system prompt with verification checklist, source priorities
  - `prompts/playbook_research_query.md` - 9-section research template (problem, workflows, tools, delegation, etc)
  - `prompts/playbook_analysis.md` - synthesis output format

## Input

5-field JSON per `specs/next_up/playbook_research_task_input.md`:

```json
{
  "slug": "gift-automation",
  "topic": "Automating gift-giving for birthdays, holidays, anniversaries...",
  "area": "relationships",
  "research_guidance": "Focus on practical delegation systems, not DIY...",
  "source_material": "(optional) existing content to transform"
}
```

## Output

Exa search results + LLM synthesis:

```json
{
  "slug": "gift-automation",
  "research_summary": {
    "confidence_level": "high",
    "research_date": "2026-01-30"
  },
  "sources": [
    {
      "url": "https://athena.com/resources/...",
      "title": "How to Systematize Gift-Giving",
      "type": "case_study",
      "relevance_score": 5,
      "key_findings": ["...", "..."]
    }
  ],
  "delegation_analysis": {
    "pathway": "direct-offensive",
    "modality": "process-driven",
    "ea_level_required": "intermediate"
  },
  "tool_stack": { "required": [...], "optional": [...] },
  "templates_found": [...],
  "implementation_evidence": { "real_examples": [...], "common_mistakes": [...] }
}
```

## Pipeline Steps

```
1. Parse input JSON (slug, topic, area, research_guidance, source_material)
2. Generate search queries from topic + research_guidance
3. Execute Exa searches in parallel (tool-focused, practitioner examples)
4. LLM filters sources by relevance (keep score >= 3)
5. LLM synthesizes findings per playbook_analysis.md structure
6. Output enriched JSON to briefs/enriched/<slug>.json
```

## Tech Stack

- Bun + Vercel AI SDK v6 + Zod
- Exa API for search (practitioner examples, tool docs, case studies)
- Prompt templates with Handlebars-style interpolation

## Integration

Runs before `generate_playbook.ts`. Outputs to `briefs/enriched/<slug>.json` for main pipeline consumption.
