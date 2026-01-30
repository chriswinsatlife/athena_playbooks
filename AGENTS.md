# Athena Playbook Ventian Arsenal AI Pipeline

## Context

- [Athena](https://www.athena.com/) is a premium executive assistant service.
- Athena clients are startup founders and executives, venture capitalists and other private equity personnel, larger-scale or rapidly scaling SMB entrepreneurs (often professional services like law, medicine and boutique consulting; real estate; bootstrapped SaaS; high-end "creators" e.g. `@thepediatricianmom`); mid-market and enterprise company executives or director+ level managers, etc).
- The purpose of this repo is to generate long-form content and supporting assets (e.g. D3 visualizations, Dagre and Mermaid Diagrams, genAI illustrations and other media, etc).
- The content is focused around the concept of a playbook, which are essentially SOPs and strategic approaches for how to achieve some goal, manage an ongoing concern, optimize some area in one's personal or professsional life, and so on. These necessarily involve utilizing the executive assistant, and often also involve AI agents alongside specific software stacks. See `athena/coda_playbooks_doc/CqI5pastxC.txt` for illustrative outline.
- The playbooks will be generated using a structured data schema from other artifacts, e.g. general web research performed by AI agents, specific podcast episodes, biographies, raw corpuses of email or messages or calendar data or automation workflow JSON, and so on.
- The playbooks will connect structured data to a set of custom components for rendering rich experiences.
- Playbooks are for prospective clients (primary audience) and existing clients (secondary audience). Playbooks are **NEVER** for executive assistants.
- The Athena style guide is at: `athena/brand/athena_com_style_guide.md`.
- The Athena brand voice guide is at: `athena/brand/athena_com_voice_and_copy.md`.

## Stack

- This project uses Astro, DaisyUI, Tailwind V4, Bun, D3/Dagre, Mermaid, MDX, and Vercel AI SDK v6.
- Use the `grepapp` and `ref` CLI tools to get latest documentation.
- Use the `exa` CLI tool to get latest code context (i.e. current implementations) or answers (simple reponses to questions).
- `tailwind_templates/catalyst-ui-kit/` it the official Tailwind UI Kit and the preferred starting point for new styles, components, etc; it is a default theme intended to be duplicated from and then customized.
- `tailwind_templates/oatmeal-mist-instrument/` is the official Tailwind theme with specific styles, page layouts, and so on that we can copy from.
- The Oatmeal template is reasonably close to the Athena brand style, and can be used as a starting point for pages/styles/components, which can be adapted based on new design assets or the Athena style guide.
- `maggie_appleton_components/` is a collection of well-designed Astro components for reference.
- There is a `docs/illustration_generation_system.md`
- There is a metaprompting system (`docs/diagram_generation_system.md`) which enables generating prompts as markdown files for imitating the layouts, styles, or other aspects of any input image file; use `tools/analyze_reference.ts` to create templates and `tools/generate_diagram.ts` to generate on-brand diagrams

## Astro Component Library

- The playbook component library is `src/components/`, e.g.:
  - `Messages.astro` - WhatsApp, iMessage, ChatGPT, Claude Code, Telegram, OpenCode
  - `Notifications.astro` - macOS, iOS, Android, Windows, Liquid Glass
  - `Calendar.astro` - Google, Apple, Outlook week/day views
  - `EmailThread.astro` - Gmail-style email threads
  - `DataTableViewer.astro` - Sheets, Notion, Airtable, Excel
  - `SocialQuote.astro` - Twitter, LinkedIn, Podcast, Book, Article
  - `PlaybookCard.astro` - Playbook cards for listings
  - `StackChips.astro` - Tool stack chips
  - `PromptLauncher.astro` - Buttons to copy prompts to preferred AI assistant to implement the playbook
- The core playbook components are used as rich elements within playbooks to highlight content, display impact, depict scenarios, simulate an experience, add social proof, etc
- The root directory's `components/` folder contains general marketing/landing page components, e.g.:
  - `sections/` - Hero variants, pricing, testimonials, footers, CTAs, team grids, stats
  - `elements/` - Buttons, links, inputs
  - `catalyst/` - UI kit components
  - `icons/` - Icon library
  - Some of these may be copied/extended for playbook-related use cases, though all playbook-specific components should be in the `src/` directory version
- There is a Mermaid-based diagram system (`dataviz/mermaid_js/`), with corresponding Astro component (`components/playbooks/Diagram.astro`), and a separate D3/Dagre-based diagram system (`dataviz/dagre.md` and `dataviz/mermaid_js/d3_and_dagre_flowchart_demo.html`); when making diagrams, be sure to ask the user for clarification if it is unclear which approach should be used

## What Goes Where

- `athena/` contains information about the project's purpose; specifically the playbook generation.
- All plans, product requirement documents, and specifications go in `specs/`, in appropriate subdirectories based on the status of the item.
- Documentation for the repo, its utilities, its workflows, its architecture, its runbooks, and so on live in `docs/` or subdirectories within.
- There are demos for the component library listed here: `docs/demo_pages.md`; update regularly when creating or modifying Astro components

## Rules of Engagement

- Never use all caps for filenames or directory names or variables, unless strictly necessary (e.g. screaming snake case variable required in `.env` by a third-party library).
- Strongly prefer Bun and avoid Node to the maximum extent possible. Always check Bun.com documentation for ways to avoid using Node or implement a feature with the latest Bun APIs, primitives, and syntax. Refactor any discovered Node usage to Bun immediately if encountered. Only utilize Node if multiple non-Node implementations were tried relentlessly and could not be implemented to success.
- Verify all pages are error free yourself, without being asked by the user; keep checking the page with `agent-browser` and fixing issues until it is immaculate.
- Do not use emojis in code, output, or documentation. Unicode symbols (✓, ✗, →, ⚠) are acceptable.
- When making Mermaid diagrams, review `.opencode/skill/beautiful-mermaid/SKILL.md`
- When making Mermaid diagrams, consider: setting `htmlLabels: false` in config, settings `wrappingWidth` in config to override default, and using backtick syntax `["\text here\`"]`instead of`text<br/>here`
- Use `lower_snake_case` for every filename, directory name, etc.
- For testing, use `agent-browser`; see `docs/browser_cli_instructions.md`.
- Refer to `docs/css_tricks_com_crafting_strong_dx_with_astro_components_and_typescript.md` for details on Astro and Typescript best practices.
- Refer to `.opencode/skill/daisyui/` for DaisyUI-specific best practices when using DaisyUI.
