# Playbook Authoring Pipeline V1 And V2

Goal: AI generates Athena playbook articles plus diagrams and supporting visual assets, in a repeatable directory structure, with an Astro component layer for consistent presentation.

This spec assumes:
- Playbooks are authored as MDX.
- Diagrams are authored as Mermaid flowcharts and rendered to branded SVG (SVG-only; no PNG/JPEG diagram outputs).

MDX integration note:
- The current root `package.json` does not include `@astrojs/mdx` yet. Serving playbooks as MDX pages will require adding that integration when implementing this spec.

## Context In This Repo

- Existing diagram renderer: superseded/removed.
- Renderer docs and frontmatter knobs: `dataviz/mermaid_js/README_flowrender.md`
- Current shared CSS (sketch-oriented): `dataviz/mermaid_js/styles/flowchart.css`
- Current renderer notes in this spec are historical; current direction is SVG-only outputs.

Problem observed in legacy playbook exports:
- Some playbook docs embed base64 images (hard to diff, huge files). Example: `athena/Playbooks_AK Copy.md`.

## Definitions

- Playbook article: an MDX file that renders as a page.
- Diagram source: a Mermaid flowchart (stored as text) used to generate SVG.
- Rendered diagram: generated `.svg` that is embedded inline in the article.
- Playbook assets: all non-text assets referenced by the playbook (diagrams, screenshots, generated illustrations, etc).
- Slug: URL-safe identifier for a playbook (example: `gift-automation`).

## Design Principles

- Deterministic builds: diagrams and images are generated assets, committed to the repo (or generated in CI) so the site build does not need a headless browser.
- AI-friendly: the AI writes small, reviewable files (MDX + diagram source text), not opaque base64 blobs.
- Consistent presentation: all diagrams/images in MDX go through a small set of Astro components.
- Per-playbook locality: everything needed for a playbook lives under its folder.

## Directory Structure

V1 introduces a single canonical layout under `athena/playbooks/`.

- `athena/playbooks/<slug>/playbook.mdx`
- `athena/playbooks/<slug>/assets/`
- `athena/playbooks/<slug>/assets/diagrams_src/`
- `athena/playbooks/<slug>/assets/diagrams/`
- `athena/playbooks/<slug>/assets/images_src/`
- `athena/playbooks/<slug>/assets/images/`
- `athena/playbooks/<slug>/assets/manifest.json`

Asset serving note:
- Astro only serves files under `public/` by default.
- V1 assumes a build step (or sync script) copies `athena/playbooks/<slug>/assets/**` to `public/playbooks/<slug>/assets/**` so MDX can reference `/playbooks/<slug>/assets/...`.

Notes:
- `*_src/` holds editable sources (Mermaid text, prompt inputs, etc).
- Rendered assets are placed in `assets/diagrams/` and `assets/images/`.
- `manifest.json` is the machine-readable index used for v2 features (copy/share) and future automation.

## Diagram Source Format

Each diagram source is a standalone file in `assets/diagrams_src/`.

- File extension: `.md` (preferred) or `.mmd`
- Optional YAML frontmatter for layout/styling overrides.
- First Mermaid fenced block is the diagram definition.

The frontmatter keys should match what the renderer already supports (see `dataviz/mermaid_js/README_flowrender.md` and `dataviz/mermaid_js/src/cli/flowrender.js`):
- `rankdir`, `nodesep`, `ranksep`, `startGap`, `endGap`, `labelOffset`
- typography: `fontFamily`, `fontMinPx`, `fontMaxPx`, `fontWeight`
- styling: `stroke`, `fill` (renderer currently maps these to node stroke/fill)

## Rendering Pipeline

### V1 Rendering Requirement

Render diagrams to SVG via a CLI step, not at Astro build time.

The current entry point is:
- `bun --prefix dataviz run render:all`

However, Athena should not ship the Rough.js visual style.

### V1 Renderer Changes

Create an Athena-specific renderer that keeps the same Mermaid+AST+Dagre approach but draws clean SVG primitives.

Files to add/change:
- Add `dataviz/mermaid_js/src/cli/flowrender_athena.js`
- Add `dataviz/mermaid_js/styles/athena_flowchart.css`
- Update `dataviz/package.json` scripts:
  - add `flowrender:athena` and `flowrender:athena:all`

Renderer behavior changes vs `dataviz/mermaid_js/src/cli/flowrender.js`:
- Remove Rough.js (`roughjs`) dependency and drawing calls.
- Replace node drawing with SVG primitives:
  - rect nodes: `<rect>` with `rx/ry`
  - diamond nodes: `<polygon>`
  - ellipse nodes: `<ellipse>`
- Replace edge drawing with a single `<path>` per edge, with a `<marker>` arrowhead.
- Embed a `<style>` block into the output SVG that references CSS variables (tokens) defined in `athena_flowchart.css`.
- Avoid external CDN dependencies in the renderer page HTML.
  - Avoid heavyweight browser installs in the build pipeline.
  - Prefer bundling required JS modules via Node rather than loading `d3/dagre/mermaid` from CDNs.

Output targets per diagram:
- `assets/diagrams/<diagram>.svg` (primary)

## Astro Component Layer

V1 uses components as presentation wrappers around generated assets.

Repo integration note:
- `astro.config.mjs` defines `@components` as an alias to `./components`.
- This spec places playbook presentation components under `components/playbooks/` so they can be imported from MDX via `@components/playbooks/...`.

## Serving Playbooks In Astro

This spec focuses on authoring and assets, but playbooks need a page route.

V1 recommended approach (simple, no content collections required):
- Treat `athena/playbooks/<slug>/playbook.mdx` as the source of truth.
- Create a build-time copy step that writes MDX into `src/pages/playbooks/<slug>.mdx` (or `src/content/playbooks/<slug>.mdx` once `@astrojs/mdx` is installed).

Files to add (implementation):
- Add `scripts/sync_playbooks_to_site.mjs`
  - reads `athena/playbooks/**/playbook.mdx`
  - writes to `src/pages/playbooks/<slug>.mdx` (or `src/content/playbooks/<slug>.mdx`)
  - copies assets to `public/playbooks/<slug>/assets/**`

Rationale:
- Keeps Astro build fast and deterministic.
- Avoids having Astro reach outside the project tree for MDX and raw asset files.

### Diagram Component

Create `components/playbooks/Diagram.astro`.

Responsibilities:
- Consistent figure layout (spacing, border, caption).
- Responsive sizing.
- Optional metadata affordances that can be expanded in v2.

Proposed props:
- `src` (string, required) : site-root path to SVG (example: `/playbooks/<slug>/assets/diagrams/workflow.svg`)
- `alt` (string, required)
- `title` (string, optional)
- `caption` (string, optional)

Implementation note:
- Render diagrams as inline SVG (no `<img>`, no iframes, no scroll/zoom UI).

### Image Component

Create `components/playbooks/PlaybookImage.astro`.

Responsibilities:
- Consistent image presentation and captions.
- Prevent base64 blobs in MDX by standardizing on file paths.
- Provide future hooks for attribution and downloads.

Proposed props:
- `src` (string, required)
- `alt` (string, required)
- `title` (string, optional)
- `caption` (string, optional)
- `credit` (string, optional)
- `creditUrl` (string, optional)
- `download` (boolean, default false)

## How AI Generates A Playbook

V1 generation contract (what the AI writes to disk):

- Create folder `athena/playbooks/<slug>/`.
- Write `athena/playbooks/<slug>/playbook.mdx`.
- Write one or more diagram sources to `athena/playbooks/<slug>/assets/diagrams_src/*.md`.
- Write or place image sources into `athena/playbooks/<slug>/assets/images_src/`.
- Write `athena/playbooks/<slug>/assets/manifest.json` with all referenced assets.

Then run rendering (local or CI):
- Render each `diagrams_src/*.md` to:
  - `assets/diagrams/<name>.svg`
- Generate images (if AI-generated) into `assets/images/<name>.<ext>`.

MDX authoring pattern:

```mdx
import Diagram from "@components/playbooks/Diagram.astro";
import PlaybookImage from "@components/playbooks/PlaybookImage.astro";

<Diagram
  src="/playbooks/gift-automation/assets/diagrams/gift-automation-workflow.svg"
  alt="Gift automation workflow"
  caption="A high-level workflow for identifying moments, selecting gifts, and executing orders."
/>

<PlaybookImage
  src="/playbooks/gift-automation/assets/images/gift-guidelines.png"
  alt="Gift guidelines card"
  caption="Guidelines for personalization, budget, and timing."
/>
```

## Manifest Schema

`athena/playbooks/<slug>/assets/manifest.json` exists to make v2 features reliable.

V1 fields (minimum):
- `schema_version` (number)
- `slug` (string)
- `title` (string)
- `diagrams` (array)
  - `id` (string)
  - `src_mermaid` (string) : repo-relative path to diagram source
  - `src_svg` (string) : repo-relative path to rendered svg
  - `alt` (string)
  - `caption` (string, optional)
- `images` (array)
  - `id` (string)
  - `src` (string)
  - `alt` (string)
  - `caption` (string, optional)

## V1 Deliverables

- File layout under `athena/playbooks/<slug>/...` as described.
- `components/playbooks/Diagram.astro`.
- `components/playbooks/PlaybookImage.astro`.
- Athena renderer skeleton `dataviz/mermaid_js/src/cli/flowrender_athena.js` and style tokens `dataviz/mermaid_js/styles/athena_flowchart.css`.
- A scriptable command that renders all playbook diagrams into their playbook folders (either by discovery in `athena/playbooks/**/assets/diagrams_src/*.md` or by reading each playbook manifest).
- A sync step that makes playbooks and assets available to the Astro site (`scripts/sync_playbooks_to_site.mjs`).

## V2 Enhancements

V2 adds interactive affordances without changing the authoring model.

### V2 Diagram Features

- Copy-to-clipboard:
  - copy Mermaid source
  - copy a markdown snippet that embeds the diagram component
- Download options:
  - SVG
  - PNG
- Social sharing preparation:
  - generate a share-optimized PNG (fixed width, optional background)
  - optional OG image per playbook

Implementation approach:
- Publish the Mermaid source to the client in one of these ways:
  - Option A: copy `assets/diagrams_src/*.md` into `assets/diagrams_public_src/*.mmd` during build
  - Option B: embed Mermaid source in `manifest.json` (small diagrams only)
  - Option C: serve raw source via an internal route (if SSR exists later)

### V2 Component Changes

Update `components/playbooks/Diagram.astro`:
- Add UI controls (copy, download) that read from the manifest and/or the published source.
- Optionally inline SVG (via `set:html`) to enable theme-aware styling adjustments.

Add `components/playbooks/AssetActions.astro` (optional):
- Shared control strip for download/copy/share across diagrams and images.

### V2 Image Features

- Standardize image variants:
  - original
  - optimized web format (webp/avif)
  - optional thumbnail
- Add optional "copy prompt" support for AI-regenerating an image when the source is generative.

## Open Questions (Need Decisions)

- Where playbooks are ultimately served from in Astro:
  - content collections under `src/content/playbooks/` vs direct routes reading `athena/playbooks/**`.
- Whether SVGs must be theme-aware (dark mode). If yes, prefer inlining SVG and/or embedding media-query styles in SVG output.
- Whether generated assets are committed to the repo or generated in CI and published as artifacts.
