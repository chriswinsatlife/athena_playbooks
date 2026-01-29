---
title: Externalized Mermaid Flowchart Renderer (D3 + Dagre + Rough)
author: Amp
status: superseded
date: 2025-08-22
links:
  - label: Current demo (AST-first)
    href: file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/d3_dagre_mermaid_parser_demo.html
  - label: Mermaid parser notes
    href: file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/mermaid_js_docs/mermaid_parser.md
---

# Summary
Deprecated/superseded. This repo no longer ships the Playwright-based `flowrender` pipeline or any PNG/JPG/PDF export for diagrams. Current direction is SVG-only.

## Goals
- Externalize all styles to a CSS file; zero inline style constants in JS.
- Read Mermaid source from external `.md` or `.mmd` files.
- Support YAML frontmatter overrides in the `.md` (e.g., width, theme, gaps, fonts, roughness).
- Provide a Bun-based CLI to render to SVG/PNG/JPG/PDF headlessly.
- Keep the current features: AST-first parsing, gap from boxes, centered edge labels, shrink-to-fit text.
- Clear docs and examples.

## Non-goals
- Re-implement standard Mermaid rendering; we continue using D3/Dagre/Rough for the sketchy style.
- Interactive authoring UI (drag/drop editor) beyond basic inputs.
- General-purpose diagram types beyond Mermaid flowchart (sequence/class/etc.) in this iteration.

## Background & References
- Current demo: [d3_dagre_mermaid_parser_demo.html](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/d3_dagre_mermaid_parser_demo.html)
- Mermaid parser doc: [mermaid_parser.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/mermaid_js_docs/mermaid_parser.md)
- Existing content using frontmatter: [drug_prices.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/drug_prices.md)

## Requirements
- CLI
  - Command: `bun run flowrender --in <path.md|.mmd> --out <path.{svg,png,jpg,pdf}> [flags]`
  - Flags:
    - `--format svg|png|jpg|pdf` (default: inferred from `--out`)
    - `--width <px>` / `--height <px>` (override viewbox/output size)
    - `--theme <name>` (maps to CSS custom properties or stylesheet picks)
    - `--config <path.json>` (global defaults)
    - `--ast-only` (fail if AST parsing unavailable)
    - `--debug` (emit intermediate artifacts/logs)
  - Reads `.md` files with YAML frontmatter; finds the first ```mermaid code block or an explicit fenced block with id.
  - Exit codes: 0 success; 2 invalid input; 10 parse error; 20 render error; 70 unknown error.
- External stylesheet
  - All visual knobs referenced via CSS variables or classes in [flowchart.css](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/styles/flowchart.css).
- Frontmatter override keys (examples):
  - `rankdir`, `nodesep`, `ranksep`, `startGap`, `endGap`, `curveTightness`, `roughness`, `nodePaddingX`, `nodePaddingY`, `fontFamily`, `fontMaxPx`, `fontMinPx`, `labelOffset`, `stroke`, `fill`.
- Deterministic output
  - Given same inputs and versions, SVG identical; raster formats stable.

## Design
- File layout
  - Styles
    - [styles/flowchart.css](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/styles/flowchart.css) — CSS variables and classes for nodes, edges, labels, with a default theme and optional theme modifiers.
  - CLI + library
    - [src/cli/flowrender.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/cli/flowrender.ts)
    - [src/lib/parse_frontmatter.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/parse_frontmatter.ts)
    - [src/lib/build_graph.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/build_graph.ts)
    - [src/lib/render_svg.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/render_svg.ts)
    - [src/lib/export_image.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/export_image.ts)
    - [src/types.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/types.ts)
  - Examples
    - [examples/sample_flow.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/examples/sample_flow.md)
    - [examples/config.defaults.json](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/examples/config.defaults.json)

- Data flow
  1. CLI reads file → parse frontmatter (via `gray-matter`-like util) → extract Mermaid block and frontmatter overrides.
  2. Parse Mermaid using `@mermaid-js/parser` (`parse('flowchart', text)`); if `--ast-only` false and AST fails, fallback to UMD mermaid `getDiagramFromText` DB in a headless page.
  3. Map AST/DB to nodes/edges model and config.
  4. Render: load an HTML template (or jsdom + SVG) that imports D3/Dagre/Rough and the stylesheet; inject data and options; produce SVG string.
  5. Export:
     - SVG: write string as-is.
     - PNG/JPG/PDF: use Playwright (Chromium) to render the SVG in a headless page and snapshot/export PDF. Alternative: use `sharp` for PNG/JPG from SVG string.

- Interfaces (TypeScript-like)
```ts
export interface FrontmatterOverrides {
  rankdir?: 'LR'|'RL'|'TB'|'BT'|'TD';
  nodesep?: number; ranksep?: number;
  startGap?: number; endGap?: number; labelOffset?: number;
  curveTightness?: number; roughness?: number;
  nodePaddingX?: number; nodePaddingY?: number;
  fontFamily?: string; fontMaxPx?: number; fontMinPx?: number;
  stroke?: string; fill?: string;
}

export interface RenderRequest {
  mermaidSource: string;
  overrides: FrontmatterOverrides;
  width?: number; height?: number;
  theme?: string;
  astOnly?: boolean;
}

export interface RenderResult { svg: string; warnings: string[] }
```

- HTML template (headless rendering)
  - [src/lib/template.html](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/template.html) loads D3/Dagre/Rough + stylesheet, exposes a `window.renderGraph(req)` that returns SVG string. Playwright evaluates this in page context for PNG/JPG/PDF.

- Styles via CSS variables
```css
:root {
  --node-stroke: #9370db;
  --node-fill: #e8e8ff;
  --node-stroke-width: 2;
  --edge-stroke: #666;
  --font-family: 'Architects Daughter', cursive;
}
.node-rect, .node-ellipse, .node-diamond { stroke: var(--node-stroke); fill: var(--node-fill); }
.edge-path { stroke: var(--edge-stroke); }
```

## Implementation plan
1. Scaffolding
   - Create directories, add [styles/flowchart.css](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/styles/flowchart.css), [src/types.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/types.ts), and empty [src/lib/template.html](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/template.html).
   - Add `bun run flowrender --help` stub in [src/cli/flowrender.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/cli/flowrender.ts).
   - Verify: `bun run flowrender --help` prints usage (exit 0).

2. Frontmatter + Mermaid extraction
   - Implement [src/lib/parse_frontmatter.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/parse_frontmatter.ts) to return `{ frontmatter, mermaid }`.
   - Add example [examples/sample_flow.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/examples/sample_flow.md).
   - Verify: unit test prints parsed overrides and mermaid block.

3. AST-first parse + mapping
   - Implement [src/lib/build_graph.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/build_graph.ts) using `@mermaid-js/parser` with tolerant walking; optional fallback to DB when run inside Playwright page.
   - Verify: log node/edge counts for sample.

4. Serverless SVG render
   - Implement [src/lib/template.html](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/template.html) reusing logic from the current demo, parameterized by CSS variables and overrides; returns SVG string.
   - Implement [src/lib/render_svg.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/render_svg.ts) that spins up Playwright Page, calls `window.renderGraph`, returns SVG.
   - Verify: write SVG to disk; open to confirm visually.

5. Raster/PDF export
   - Implement [src/lib/export_image.ts](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/src/lib/export_image.ts) using Playwright screenshot and `page.pdf()`; optionally support `sharp` for local PNG/JPG from SVG string.
   - Verify: generate PNG, JPG, PDF with expected sizes.

6. Wire CLI
   - Parse flags, feed overrides, call render/export, set exit codes.
   - Add smoke tests and docs.

## Test plan
```bash
# Lint & typecheck (if TS)
bun run lint
bun run typecheck

# Unit: frontmatter parser
bun run test:unit -- parse_frontmatter

# AST parse + mapping
bun run test:unit -- build_graph

# Headless render smoke (writes artifacts)
bun run flowrender --in mermaid_js/examples/sample_flow.md --out /tmp/flow.svg
bun run flowrender --in mermaid_js/examples/sample_flow.md --out /tmp/flow.png --format png
bun run flowrender --in mermaid_js/examples/sample_flow.md --out /tmp/flow.pdf --format pdf
```
Expected:
- Exit code 0.
- Files exist and non-empty.
- SVG contains `<svg` and expected node labels; PNG/JPG visually show gaps around nodes and centered edge labels; PDF page fits diagram.

## Docs & help text
- New README: [README_flowrender.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/README_flowrender.md)
- Update existing: [README_d3_dagre_mermaid_parser_demo.md](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/README_d3_dagre_mermaid_parser_demo.md) to link to CLI.
- `--help` output with examples and frontmatter schema.

## Rollout & risks
- Dependencies add install size/time; keep the default path SVG-only and avoid heavyweight browser installs.
- AST schema drift between parser versions; mitigate by pinning `@mermaid-js/parser` and tolerant traversal; add version in output metadata.
- Resource-limited CI: make raster/PDF tests optional behind env flag.

## Acceptance criteria
- Given a `.md` file with YAML frontmatter and a Mermaid code block, running
  `bun run flowrender --in <file.md> --out out.svg` produces an SVG matching the D3/Dagre/Rough style with:
  - Shrink-to-fit labels, 
  - Edges not touching nodes,
  - Edge labels centered along edges.
- Styles can be changed by editing [styles/flowchart.css](file:///Users/chris/GitHub/ai_diagrams_charts_and_data_viz/mermaid_js/styles/flowchart.css) or frontmatter overrides without touching JS.
- PNG/JPG/PDF generation works headlessly and respects size overrides.
- `--ast-only` fails fast with a non-zero code if AST parsing is unavailable.
- Docs include usage, options, and examples and are sufficient for a new user to run the tool end-to-end.
