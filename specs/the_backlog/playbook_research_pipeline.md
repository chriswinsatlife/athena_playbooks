# Playbook Research Pipeline (Future)

Automated research pipeline that enriches playbook briefs with curated sources, tool discovery, and generated outlines before content generation.

Status: **Backlog** - implement after Phases 1-3 are working

## Purpose

Currently, playbook briefs are manually authored with optional source_material. This pipeline would automate:
- Tool/service discovery for the playbook topic
- Best practices research from web sources
- Outline generation with section-specific sources
- Source relevance filtering

## Input

Simple brief YAML:

```yaml
slug: gift-automation
topic: Gift automation for birthdays, holidays, and thank-you occasions
area: relationships
audience: both
research_guidance: |
  - Personal CRM tools (Clay, Monica, Dex, etc)
  - Gift recommendation services
  - Calendar/reminder automation patterns
```

## Output

Enriched brief JSON with sources:

```json
{
  "slug": "gift-automation",
  "topic": "...",
  "outline": {
    "sections": [
      { "id": "tools", "title": "Tools & Templates", "sources": [...] }
    ]
  },
  "tool_candidates": [
    { "name": "Clay", "url": "https://clay.com", "category": "crm" }
  ],
  "global_sources": [...]
}
```

## Pipeline Steps

```
0a. Parse brief
0b. Generate search queries from topic + research_guidance
0c. Execute searches (Tavily/Exa) in parallel
0d. AI filters sources by relevance (keep score >= 3)
0e. Generate outline with research flags per section
0f. Section-specific research for flagged sections
```

## Tech Stack

- Bun + Vercel AI SDK v6 + Zod
- Tavily API for general web search
- Exa API for tool/code-focused search
- Same pattern as mAIstro n8n workflow (workflow ID: rscJDp0jyTjleNNA)

## Integration

This pipeline runs before `generate_playbook.ts` and outputs to `briefs/enriched/<slug>.json`, which the main pipeline can consume.

## Reference

- mAIstro workflow: `n8n workflow mermaid --id rscJDp0jyTjleNNA`
- Main pipeline spec: `specs/next_up/playbook_pipeline_v2.md`
