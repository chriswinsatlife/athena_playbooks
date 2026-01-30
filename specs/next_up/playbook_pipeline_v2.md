# Playbook Authoring Pipeline V2

Multi-step AI generation pipeline for Athena playbooks using JSON content collections.

Tech: Bun + Vercel AI SDK v6 + Zod. No framework (Mastra etc) for v1.

## Vercel AI SDK v6 Patterns

IMPORTANT: `generateObject` and `streamObject` are **deprecated**. Use `generateText` with `Output.object()` instead.

### Installation

```bash
bun add ai @ai-sdk/anthropic zod
```

### Structured Output Generation

```typescript
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Define schema with Zod
const playbookSchema = z.object({
  meta: z.object({
    title: z.string().describe('SEO-friendly title'),
    description: z.string().describe('Meta description, 150-160 chars'),
  }),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.object({
      format: z.enum(['prose', 'checklist', 'steps', 'specs']),
      // ... rest of content schema
    }),
  })),
});

// Generate structured output
const { output } = await generateText({
  model: anthropic('claude-sonnet-4-5'),
  output: Output.object({
    name: 'Playbook',
    description: 'A complete playbook for delegation',
    schema: playbookSchema,
  }),
  system: 'You generate Athena playbooks for EA delegation...',
  prompt: briefContent,
});
```

### Output Types Available

- `Output.text()` - plain text (default)
- `Output.object({ schema })` - typed object with Zod validation
- `Output.array({ element })` - array of typed elements
- `Output.choice({ options })` - enum/classification
- `Output.json()` - unstructured JSON

### Streaming Structured Output

```typescript
import { streamText, Output } from 'ai';

const { partialOutputStream } = streamText({
  model: anthropic('claude-sonnet-4-5'),
  output: Output.object({ schema: playbookSchema }),
  prompt: briefContent,
});

for await (const partialObject of partialOutputStream) {
  console.log(partialObject); // Partial object as it streams
}
```

### Error Handling

```typescript
import { generateText, Output, NoObjectGeneratedError } from 'ai';

try {
  const { output } = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema }),
    prompt,
  });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.error('Failed to generate:', error.cause);
    console.error('Raw text:', error.text);
  }
}
```

### Provider Options

```typescript
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';

const { output } = await generateText({
  model: anthropic('claude-sonnet-4-5'),
  output: Output.object({ schema }),
  prompt,
  temperature: 0.7,
  maxOutputTokens: 4000,
  providerOptions: {
    anthropic: {
      // Enable structured output mode
      structuredOutputMode: 'auto',
    } satisfies AnthropicProviderOptions,
  },
});
```

## Observability (v1: Console Logging)

For v1, we use structured console logging. Each step logs:
- Phase/step identifier
- Input summary (truncated)
- Duration
- Success/failure status
- Error details on failure

### Logging Utility

```typescript
// lib/pipeline_logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface StepLog {
  phase: string;
  step: string;
  status: 'start' | 'success' | 'error';
  durationMs?: number;
  input?: string;
  output?: string;
  error?: string;
  tokens?: { input: number; output: number };
}

const startTime = new Map<string, number>();

export function logStep(log: StepLog) {
  const key = `${log.phase}:${log.step}`;
  
  if (log.status === 'start') {
    startTime.set(key, Date.now());
    console.log(`[${log.phase}] ${log.step} starting...`);
    if (log.input) console.log(`  Input: ${log.input.slice(0, 100)}...`);
    return;
  }
  
  const duration = Date.now() - (startTime.get(key) || Date.now());
  const emoji = log.status === 'success' ? 'ok' : 'FAIL';
  
  console.log(`[${log.phase}] ${log.step} ${emoji} (${duration}ms)`);
  
  if (log.tokens) {
    console.log(`  Tokens: ${log.tokens.input} in / ${log.tokens.output} out`);
  }
  
  if (log.error) {
    console.error(`  Error: ${log.error}`);
  }
  
  startTime.delete(key);
}
```

### Usage in Pipeline

```typescript
// scripts/generate_playbook.ts
import { logStep } from '../lib/pipeline_logger';

async function generatePlaybook(briefPath: string) {
  // PHASE 1: Content generation
  logStep({ phase: 'Phase1', step: 'generateContent', status: 'start', 
            input: briefPath });
  
  try {
    const { output, usage } = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      output: Output.object({ schema: playbookSchema }),
      prompt: briefContent,
    });
    
    logStep({ phase: 'Phase1', step: 'generateContent', status: 'success',
              tokens: { input: usage.promptTokens, output: usage.completionTokens } });
  } catch (error) {
    logStep({ phase: 'Phase1', step: 'generateContent', status: 'error',
              error: error.message });
    throw error;
  }
  
  // PHASE 2a: Diagrams
  logStep({ phase: 'Phase2', step: 'generateDiagrams', status: 'start' });
  // ...
}
```

### Sample Output

```
[Phase1] parsebrief ok (12ms)
[Phase1] generateContent starting...
  Input: slug: gift-automation, topic: Gift automation for birthdays...
[Phase1] generateContent ok (4523ms)
  Tokens: 1247 in / 3891 out
[Phase2] generateDiagrams starting...
[Phase2] generateDiagrams ok (892ms)
[Phase2] generateEmbeds starting...
[Phase2] generateEmbeds FAIL (234ms)
  Error: NoObjectGeneratedError: Failed to parse JSON response
```

### Upgrade Path: Langfuse

When you need full observability (traces, cost tracking, replays), add Langfuse:

```bash
bun add langfuse-vercel @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```typescript
// Enable per-request telemetry
const { output } = await generateText({
  model: anthropic('claude-sonnet-4-5'),
  output: Output.object({ schema }),
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'generate-playbook-content',
    metadata: {
      slug: brief.slug,
      phase: 'Phase1',
    },
  },
});
```

Then set up the exporter:

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseExporter } from 'langfuse-vercel';

const sdk = new NodeSDK({
  traceExporter: new LangfuseExporter(),
});
sdk.start();
```

## Design Principles

- JSON as source of truth: AI generates structured JSON validated by Zod schema
- Multi-step generation: content, diagrams, and images in separate phases
- Existing components: leverage built components for rich content embeds
- Deterministic rendering: Astro templates render JSON to HTML; no MDX parsing complexity
- Parallel generation: diagrams and images can be generated concurrently after content

## Architecture Overview

```
INPUT: Manual brief + source material (v1)
       Automated research pipeline (v2, see playbook_research_pipeline.md)

PHASE 1: Content Generation (AI)
├── Input: brief YAML + optional source material
├── Output: src/content/playbooks/<slug>.json
└── Validation: Zod schema in src/content/config.ts

PHASE 2: Asset Generation (AI + Tools)
├── 2a: Diagrams (parallel)
│   ├── AI generates Mermaid source from diagram intents
│   ├── Tool renders .mmd → .svg
│   └── Output: public/playbooks/<slug>/diagrams/*.svg
├── 2b: Illustrations (parallel)
│   ├── AI generates images from illustration intents
│   ├── Uses tools/generate_illustration.ts
│   └── Output: public/playbooks/<slug>/images/*.png
└── 2c: Component Data (parallel)
    ├── AI generates structured data for embeds
    └── Output: inline in JSON or public/playbooks/<slug>/data/*.json

PHASE 3: Build (Astro)
├── Astro reads JSON from src/content/playbooks/
├── Dynamic route renders [slug].astro
├── Template components render each section type
└── Output: static HTML
```

## Input Format (v1: Manual)

Briefs are manually authored YAML with extensive steering for LLM generation.
Playbooks are ALWAYS for Athena clients. No "audience" field at brief level.

### Required Fields

- `slug` - kebab-case identifier
- `area` - one of the 16-area taxonomy
- `topic` - MINIMUM 300 chars, multiple paragraphs covering scope, workflows, edge cases, success criteria

### Optional But Critical Fields

- `persona` - specific reader archetype with pain points, goals, context
- `research_guidance` - steering for AI research, including:
  - `whitelist` / `blacklist` - source control
  - `primary_sources` - URLs to scrape directly
  - `angles` / `frameworks` / `mental_models` - framing guidance
  - `must_cover` / `do_not_cover` - scope control
  - `quality_signals` / `red_flags` - what makes sources good/bad
  - `keywords` / `negative_keywords` - search guidance
  - `depth_guidance` - surface overview vs practitioner vs expert
- `source_material` - existing content to transform
- `section_hints` - suggested structure
- `delegation_focus` - what aspect of delegation to emphasize

### Example Brief

```yaml
slug: gift-automation
area: relationships

topic: |
  Automating gift-giving for birthdays, holidays, anniversaries so the client
  spends under 30 seconds per gift. Covers database setup, historical data
  population, reminder cadences (30 days default), EA gift research workflow,
  client approval (reply with number 1-5), order fulfillment, thank-you tracking.
  
  Key workflows: one-time setup, EA backfill from email, recurring approval flow.
  Edge cases: international shipping (6+ weeks), custom items, corporate compliance.
  Success: never miss a date, excited thank-you texts, 10+ hours/year reclaimed.

persona:
  archetype: Time-starved founder who values relationships but forgets dates
  pain_points:
    - Forgets birthdays until day-of
    - Gives generic gifts from lack of research time
    - Feels guilty about dropped balls
  goals:
    - Never miss an important date
    - Give genuinely thoughtful gifts

research_guidance:
  whitelist:
    - thestrategist.com
    - wirecutter.com
    - athena.com/resources
  blacklist:
    - affiliate listicles
    - Amazon best seller lists
  must_cover:
    - Database setup (Airtable)
    - Historical gift data population
    - Reply with a number approval flow
  do_not_cover:
    - Specific gift recommendations
    - DIY calendar reminders
  quality_signals:
    - Specific actionable steps
    - Time estimates
    - Edge case handling

source_material: |
  From existing Coda playbook: Airtable with People, Gifts, Gift Events tabs...

section_hints:
  - What elite gift-giving looks like
  - One-time client setup (10 min checklist)
  - EA onboarding and historical data population
  - The recurring gift workflow
  - Special cases (international, corporate)

delegation_focus: |
  Vicarious-offensive: EA monitors calendar and surfaces opportunities proactively.
  Client's only job is to approve one of the curated options.
```

Run: `bun scripts/generate_playbook.ts briefs/gift-automation.yaml`

## Directory Structure

```
src/
├── content/
│   ├── config.ts                    # Zod schemas for all collections
│   └── playbooks/
│       ├── gift-automation.json
│       └── personal-crm.json
├── pages/
│   └── playbooks/
│       ├── index.astro              # Library landing with filters
│       └── [slug].astro             # Dynamic playbook route
└── components/
    └── playbook/
        ├── Hero.astro
        ├── ToolsGrid.astro
        ├── BeforeAfter.astro
        ├── Section.astro            # Dispatches to format-specific renderers
        ├── SectionChecklist.astro
        ├── SectionSteps.astro
        ├── SectionSpecs.astro
        ├── SectionProse.astro
        ├── FAQ.astro
        ├── RelatedPlaybooks.astro
        └── embeds/
            ├── DiagramEmbed.astro
            ├── NotificationEmbed.astro
            ├── MessagesEmbed.astro
            ├── CalendarEmbed.astro
            ├── EmailEmbed.astro
            └── DataTableEmbed.astro

public/
└── playbooks/
    └── <slug>/
        ├── diagrams/
        │   └── workflow.svg
        ├── images/
        │   └── hero.png
        └── data/
            └── calendar-before.json
```

## Existing Components Inventory

These components are already built and accept structured JSON/YAML data:

| Component | Location | Data Props | Use Case |
|-----------|----------|-----------|----------|
| Notifications | src/components/Notifications.astro | notifications[], style, mode | Push notification mockups (iOS, macOS, Android, Windows, Liquid Glass) |
| Messages | src/components/Messages.astro | messages[], style, mode | Chat conversations (WhatsApp, iMessage, ChatGPT, Claude Code, OpenCode, Telegram) |
| Calendar | src/components/Calendar.astro | events[], style, view, mode | Calendar before/after (Google, Apple, Outlook) |
| EmailThread | src/components/EmailThread.astro | messages[], subject, labels | Email thread mockups (Gmail style) |
| DataTableViewer | src/components/DataTableViewer.astro | data[], columns[], style | Database views (Sheets, Notion, Airtable, Excel) |

## Existing Tools Inventory

| Tool | Location | Purpose |
|------|----------|---------|
| generate_illustration.ts | tools/generate_illustration.ts | AI image generation with style templates and QA |
| analyze_illustration_reference.ts | tools/analyze_illustration_reference.ts | Extract style templates from reference images |
| Mermaid renderers | dataviz/mermaid_js/src/cli/*.js | Render Mermaid diagrams to SVG |

## JSON Schema: Playbook Content

### Embed Types

The content schema supports embedding rich interactive components:

```typescript
// Embed discriminated union
const embedSchema = z.discriminatedUnion('type', [
  // Diagram embed
  z.object({
    type: z.literal('diagram'),
    id: z.string(),
    src: z.string(),                    // Path to rendered SVG
    alt: z.string(),
    caption: z.string().optional(),
  }),
  
  // Notification embed (uses existing Notifications.astro)
  z.object({
    type: z.literal('notifications'),
    style: z.enum(['macos', 'ios', 'android', 'windows', 'liquidglass']),
    mode: z.enum(['light', 'dark', 'auto']).optional(),
    notifications: z.array(z.object({
      app: z.string(),
      title: z.string(),
      body: z.string().optional(),
      time: z.string().optional(),
      icon: z.string().optional(),
    })),
  }),
  
  // Messages embed (uses existing Messages.astro)
  z.object({
    type: z.literal('messages'),
    style: z.enum(['whatsapp', 'imessage', 'chatgpt', 'claudecode', 'opencode', 'telegram']),
    mode: z.enum(['light', 'dark', 'auto']).optional(),
    agent: z.string().optional(),       // For opencode footer
    messages: z.array(z.object({
      user: z.number(),
      text: z.string(),
      name: z.string().optional(),
      avatar: z.string().optional(),
      timestamp: z.string().optional(),
    })),
  }),
  
  // Calendar embed (uses existing Calendar.astro)
  z.object({
    type: z.literal('calendar'),
    style: z.enum(['google', 'apple', 'outlook']),
    view: z.enum(['week', 'day']).optional(),
    mode: z.enum(['light', 'dark', 'auto']).optional(),
    date: z.string().optional(),
    events: z.array(z.object({
      title: z.string(),
      start: z.string(),
      end: z.string(),
      color: z.enum(['blue', 'green', 'red', 'purple', 'orange', 'cyan', 'pink', 'yellow']).optional(),
      location: z.string().optional(),
    })),
  }),
  
  // Email embed (uses existing EmailThread.astro)
  z.object({
    type: z.literal('email'),
    subject: z.string(),
    labels: z.array(z.string()).optional(),
    mode: z.enum(['light', 'dark', 'auto']).optional(),
    messages: z.array(z.object({
      from: z.object({ name: z.string(), email: z.string() }),
      to: z.array(z.object({ name: z.string(), email: z.string() })),
      cc: z.array(z.object({ name: z.string(), email: z.string() })).optional(),
      body: z.string(),
      date: z.string(),
      attachments: z.array(z.object({
        name: z.string(),
        size: z.string().optional(),
        type: z.enum(['pdf', 'doc', 'image', 'spreadsheet', 'archive', 'other']).optional(),
      })).optional(),
    })),
  }),
  
  // Data table embed (uses existing DataTableViewer.astro)
  z.object({
    type: z.literal('datatable'),
    style: z.enum(['sheets', 'notion', 'airtable', 'excel', 'plain']),
    data: z.array(z.record(z.unknown())),
    columns: z.array(z.object({
      key: z.string(),
      label: z.string().optional(),
      type: z.enum(['text', 'number', 'checkbox', 'tag', 'date', 'url']).optional(),
    })).optional(),
    showRowNumbers: z.boolean().optional(),
    showHeader: z.boolean().optional(),
  }),
  
  // Before/After comparison (two calendars, two tables, etc)
  z.object({
    type: z.literal('comparison'),
    layout: z.enum(['side-by-side', 'stacked']).optional(),
    before: z.object({
      label: z.string(),
      embed: z.lazy(() => embedSchema),  // Recursive
    }),
    after: z.object({
      label: z.string(),
      embed: z.lazy(() => embedSchema),
    }),
  }),
  
  // Image embed
  z.object({
    type: z.literal('image'),
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    width: z.number().optional(),
  }),
]);
```

### Section Content with Embeds

```typescript
const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().optional(),
  
  content: z.discriminatedUnion('format', [
    z.object({ format: z.literal('prose'), text: z.string() }),
    z.object({ format: z.literal('specs'), items: z.array(z.object({ label: z.string(), value: z.string() })) }),
    z.object({ format: z.literal('checklist'), items: z.array(z.object({ label: z.string(), details: z.string().optional(), substeps: z.array(z.string()).optional() })) }),
    z.object({ format: z.literal('steps'), items: z.array(z.object({ label: z.string(), details: z.string().optional() })) }),
  ]),
  
  // Embeds: rich UI mockups illustrating the content
  embeds: z.array(embedSchema).optional(),
  
  // Optional callout for tips/warnings
  callout: calloutSchema.optional(),
});
```

Note: No audience/actor field. Playbooks are always for clients. The prose content itself
describes what the client does vs what they delegate to the EA.

## Phase 1: Content Generation

### Input: Brief YAML

Phase 1 receives a manually authored brief containing:
- Metadata: slug, area, extensive topic description
- Research guidance: whitelists, blacklists, angles, scope control
- Optional: persona, source_material, section_hints

### AI Prompt Structure

```markdown
# Playbook Generation Task

## Context
- Athena helps clients delegate to EAs
- This playbook covers: {topic}
- Playbook audience: Athena clients (prospective and existing)
- Area: {area from 16-area ontology}

## Source Material (if provided)
{paste existing playbook text, Coda doc, or notes}

## Known Tools (if provided)
{tool list}

## Output Format
Generate valid JSON matching this schema:
{paste Zod schema or JSON Schema}

## Content Requirements
- Hero: benefit-focused headline, 3 stats
- 4-6 sections covering setup and workflow
- Each section: intro paragraph, structured content (checklist/steps/specs), optional closing
- FAQ: 3-5 questions for SEO
- Include diagram intents for any workflows
- Include embed intents for UI mockups (notifications, messages, calendars)

## Embed Intent Format
For each embed, include a placeholder with generation intent:

"embeds": [
  {
    "type": "messages",
    "style": "whatsapp",
    "intent": "EA sending gift options to client",
    "messages": []  // To be filled in Phase 2
  }
]
```

### Diagram and Embed Intents

Phase 1 output includes intents, not final content:

```json
{
  "diagram_intents": [
    {
      "id": "gift-workflow",
      "placement": "section:what-elite-looks-like",
      "intent": "Flowchart: gift event triggers → EA research → client picks → gift ships → thank you received",
      "style": "flowchart-td"
    }
  ],
  "embed_intents": [
    {
      "id": "ea-gift-email",
      "placement": "section:what-elite-looks-like",
      "type": "messages",
      "style": "whatsapp",
      "intent": "EA sending 5 gift ideas to client with links and prices"
    },
    {
      "id": "calendar-comparison",
      "placement": "section:before-after",
      "type": "comparison",
      "intent": "Before: messy calendar with no gift reminders. After: clean calendar with 30-day gift prep blocks"
    }
  ]
}
```

## Phase 2: Asset Generation

### 2a: Diagram Generation

```bash
# For each diagram intent:
# 1. AI generates Mermaid source
# 2. CLI renders to SVG

bun scripts/generate_playbook_diagrams.ts gift-automation
```

Script reads `diagram_intents` from JSON, calls AI to generate Mermaid, saves to:
- `public/playbooks/gift-automation/diagrams/gift-workflow.mmd` (source)
- `public/playbooks/gift-automation/diagrams/gift-workflow.svg` (rendered)

Then updates JSON with resolved paths:
```json
{
  "sections": [{
    "embeds": [{
      "type": "diagram",
      "id": "gift-workflow",
      "src": "/playbooks/gift-automation/diagrams/gift-workflow.svg",
      "alt": "Gift automation workflow"
    }]
  }]
}
```

### 2b: Illustration Generation

```bash
# For hero images and decorative illustrations
bun tools/generate_illustration.ts athena_playbook_style \
  "gift boxes and calendar" \
  "professional illustration for playbook hero" \
  -o public/playbooks/gift-automation/images \
  --reference prompts/illustration_styles/athena_playbook_reference.png
```

### 2c: Embed Data Generation

For each embed intent, AI generates the structured data:

```bash
bun scripts/generate_playbook_embeds.ts gift-automation
```

Example: generates WhatsApp conversation for "EA sending gift options":

```json
{
  "type": "messages",
  "style": "whatsapp",
  "mode": "light",
  "messages": [
    { "user": 2, "name": "Sarah (EA)", "text": "Hi! Mom's birthday is in 30 days. Here are 5 gift ideas:" },
    { "user": 2, "text": "1. Ceramic planter set - $45 (she mentioned wanting more plants)\n2. Cashmere scarf - $89 (her favorite color blue)\n3. Cooking class voucher - $120 (Italian, her favorite)\n4. Photo book of family pics - $65\n5. Spa gift card - $100" },
    { "user": 2, "text": "All available on Amazon with 2-day shipping. Which number?" },
    { "user": 1, "text": "3" },
    { "user": 2, "text": "Done! Confirmation coming to your email." }
  ]
}
```

## Phase 3: Rendering

### Dynamic Route

```astro
---
// src/pages/playbooks/[slug].astro
import { getCollection, getEntry } from 'astro:content';
import PlaybookLayout from '@layouts/PlaybookLayout.astro';
import Hero from '@components/playbook/Hero.astro';
import ToolsGrid from '@components/playbook/ToolsGrid.astro';
import BeforeAfter from '@components/playbook/BeforeAfter.astro';
import Section from '@components/playbook/Section.astro';
import FAQ from '@components/playbook/FAQ.astro';

export async function getStaticPaths() {
  const playbooks = await getCollection('playbooks', 
    ({ data }) => data.status === 'published'
  );
  return playbooks.map(p => ({ 
    params: { slug: p.id }, 
    props: { playbook: p } 
  }));
}

const { playbook } = Astro.props;
const { data } = playbook;
---

<PlaybookLayout 
  title={data.meta.title} 
  description={data.meta.description}
  jsonLd={buildFAQSchema(data.faq)}
>
  <Hero {...data.hero} optimized_for={data.meta.optimized_for} />
  
  <ToolsGrid playbook_tools={data.tools} />
  
  {data.before_after && <BeforeAfter {...data.before_after} />}
  
  {data.sections.map(section => (
    <Section {...section} />
  ))}
  
  <FAQ items={data.faq} />
</PlaybookLayout>
```

### Section Component (Embed Dispatch)

```astro
---
// src/components/playbook/Section.astro
import SectionChecklist from './SectionChecklist.astro';
import SectionSteps from './SectionSteps.astro';
import SectionSpecs from './SectionSpecs.astro';
import SectionProse from './SectionProse.astro';
import EmbedRenderer from './EmbedRenderer.astro';

const { id, title, icon, audience, intro, content, closing, embeds } = Astro.props;

const formatComponents = {
  checklist: SectionChecklist,
  steps: SectionSteps,
  specs: SectionSpecs,
  prose: SectionProse,
};

const ContentComponent = formatComponents[content.format];
---

<section id={id} class:list={['playbook-section', `audience-${audience}`]}>
  <h2>
    {icon && <span class="section-icon">{icon}</span>}
    {title}
  </h2>
  
  {intro && <p class="section-intro">{intro}</p>}
  
  <ContentComponent {...content} />
  
  {embeds?.map(embed => (
    <EmbedRenderer embed={embed} />
  ))}
  
  {closing && <p class="section-closing">{closing}</p>}
</section>
```

### Embed Renderer (Component Dispatch)

```astro
---
// src/components/playbook/EmbedRenderer.astro
import Notifications from '@components/Notifications.astro';
import Messages from '@components/Messages.astro';
import Calendar from '@components/Calendar.astro';
import EmailThread from '@components/EmailThread.astro';
import DataTableViewer from '@components/DataTableViewer.astro';
import DiagramEmbed from './embeds/DiagramEmbed.astro';
import ComparisonEmbed from './embeds/ComparisonEmbed.astro';
import ImageEmbed from './embeds/ImageEmbed.astro';

const { embed } = Astro.props;
---

{embed.type === 'diagram' && <DiagramEmbed {...embed} />}
{embed.type === 'notifications' && <Notifications {...embed} />}
{embed.type === 'messages' && <Messages {...embed} />}
{embed.type === 'calendar' && <Calendar {...embed} />}
{embed.type === 'email' && <EmailThread {...embed} />}
{embed.type === 'datatable' && <DataTableViewer {...embed} />}
{embed.type === 'comparison' && <ComparisonEmbed {...embed} />}
{embed.type === 'image' && <ImageEmbed {...embed} />}
```

## CLI Scripts

### Full Pipeline Orchestrator

```bash
# Generate from brief YAML
bun scripts/generate_playbook.ts briefs/gift-automation.yaml

# Dry run (show plan, don't execute)
bun scripts/generate_playbook.ts briefs/gift-automation.yaml --dry-run
```

### Orchestrator Flow

```typescript
// scripts/generate_playbook.ts (pseudo-code)

async function generatePlaybook(briefPath: string, options: Options) {
  const brief = await parseBrief(briefPath);
  
  // PHASE 1: Content generation
  console.log('Phase 1: Generating content...');
  const playbook = await generateContent(brief);
  const jsonPath = `src/content/playbooks/${brief.slug}.json`;
  await Bun.write(jsonPath, JSON.stringify(playbook, null, 2));
  
  // PHASE 2: Asset generation (parallel)
  console.log('Phase 2: Generating assets...');
  await Promise.all([
    generateDiagrams(brief.slug, playbook.diagram_intents),
    generateIllustrations(brief.slug, playbook.illustration_intents),
    generateEmbeds(brief.slug, playbook.embed_intents)
  ]);
  
  // Update JSON with resolved asset paths
  const finalPlaybook = resolveAssetPaths(playbook, brief.slug);
  await Bun.write(jsonPath, JSON.stringify(finalPlaybook, null, 2));
  
  // Validate
  console.log('Validating...');
  const validation = await validatePlaybook(brief.slug);
  if (!validation.success) {
    console.error('Validation failed:', validation.errors);
    process.exit(1);
  }
  
  console.log(`Done: ${jsonPath}`);
}
```

### generate_playbook_diagrams.ts

```bash
bun scripts/generate_playbook_diagrams.ts <slug> [--dry-run]
```

### generate_playbook_embeds.ts

```bash
bun scripts/generate_playbook_embeds.ts <slug> [--dry-run]
```

### validate_playbook.ts

```bash
bun scripts/validate_playbook.ts <slug>
```

Validates JSON against Zod schema, checks asset paths exist.

## Supersedes

This spec supersedes:
- `specs/next_up/playbook_authoring_pipeline_v1_v2.md` (MDX-based approach)

Integrates with:
- `specs/next_up/playbook_data_model_ontology.md` (taxonomy, areas, scoring)
- `specs/next_up/playbook_content_data_model.md` (JSON schema details)

## Implementation Phases

### Phase A: Foundation
- Create src/content/config.ts with Zod schemas
- Create src/pages/playbooks/[slug].astro
- Create basic section renderer components
- Manual JSON authoring to validate approach

### Phase B: Embed Integration
- Create EmbedRenderer.astro
- Create thin wrapper components in src/components/playbook/embeds/
- Test with hand-authored embed data

### Phase C: AI Generation
- Create generate_playbook.ts orchestrator
- Create generate_playbook_diagrams.ts
- Create generate_playbook_embeds.ts
- Prompt engineering for consistent output

### Phase D: Library UI
- Create playbooks/index.astro with filtering
- Create area landing pages
- Create tool landing pages
- SEO optimization

## Open Questions

- Versioning: do we track playbook versions for A/B testing content?
- Localization: do we need i18n support in the schema?
- Analytics: do we embed event tracking in components?
- Comments: do we support user comments/questions per section?
