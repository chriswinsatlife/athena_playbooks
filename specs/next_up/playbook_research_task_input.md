# Playbook Research Task Input

Per-job input for the playbook research pipeline. 5 plaintext fields.

## Fields

```
slug              Required. kebab-case identifier.
topic             Required. Extensive description of what the playbook covers, 
                  the problem it solves, key workflows, edge cases, success criteria.
                  NOT a one-liner. Multiple paragraphs.
area              Required. One of 16-area taxonomy.
research_guidance Required. The steering block. What to research, source priorities,
                  whitelists/blacklists, must-cover topics, do-not-cover topics,
                  quality signals, anti-patterns. Plaintext, as long as needed.
source_material   Optional. Existing content to transform (Coda doc, transcript, notes).
```

## Example

```json
{
  "slug": "gift-automation",
  "topic": "Automating gift-giving for birthdays, holidays, anniversaries, and thank-you occasions so the client spends under 30 seconds per gift decision. The core problem: busy executives forget important dates, scramble last-minute for generic gifts, and feel guilty about dropped balls in relationships that matter. The solution: a proactive system where the EA monitors upcoming occasions, researches personalized gift options based on recipient preferences and history, presents curated choices, handles ordering and shipping, and tracks thank-you responses. Key workflows: one-time database setup, EA backfill from email receipts, recurring approval flow (reply with number 1-5), thank-you tracking. Edge cases: international shipping (6+ weeks lead time), corporate compliance limits, last-minute additions. Success: never miss a date, gifts that prompt 'how did you know?' reactions, 10+ hours/year reclaimed, zero gift-related guilt.",
  "area": "relationships",
  "research_guidance": "Focus on practical delegation systems, not DIY reminder hacks. Prioritize sources from thestrategist.com, wirecutter.com, athena.com/resources. Avoid affiliate listicles, Amazon best seller roundups, generic gift guides. Must cover: Airtable/Notion database setup with People, Gifts, Gift Events tables; historical gift population from email receipts; 30-day reminder cadence; reply-with-number approval flow; international shipping handling; corporate gift compliance. Do not cover: specific gift recommendations (those are per-recipient), gift card strategies, DIY calendar reminders. Quality signals: specific templates, time estimates, real approval flow examples, edge case handling. Red flags: vague 'systemize your gifts' advice, no mention of EA delegation, self-managed reminder focus. Depth: practitioner level, enough to implement. Frame around time ROI and relationship investment."
}
```

## Static Prompt Templates

The research system prompt, analysis prompt, and output schema are defined separately and reused across all jobs. They interpolate the 5 input fields.

See: `prompts/playbook_research_system.md`, `prompts/playbook_research_query.md`, `prompts/playbook_analysis.md`
