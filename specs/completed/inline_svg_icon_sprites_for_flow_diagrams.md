---
title: Inline SVG icon sets for JSON flow diagrams
status: in_progress
owner: opencode
last_updated: 2026-01-29
---

Goal
- Support per-node icons for JSON flow diagrams, referenced by slug, rendered as inline SVG inside articles (no PNG/JPEG).

Constraints
- Diagrams render inline as `<svg>` via Astro components.
- No iframes.
- No zoom/pan/scroll UI; optional full-viewport `<dialog>` lightbox OK.
- Each diagram can specify its own stylesheet (brand variants).

Background in this repo
- JSON flow diagrams mount via `components/playbooks/flow_diagram_client.astro` and render via `public/diagrams/gifting_playbook_flow/flow_runtime.js`.
- Node content is HTML inside `<foreignObject>` (for wrapping + stacked layout).

Non goals
- Raster exports (PNG/JPEG/PDF) for diagrams.
- Remote icon URLs.
- Unsanitized SVG ingestion.

User stories
- As an author, I set `icon: "gift"` on a node and it renders with consistent styling.
- As an author, I can add custom SVG icons to a directory and reference them by slug.
- As a designer, I can render the same diagram with different CSS (Athena vs partner).
- As a security reviewer, I can confirm icons cannot execute script or load external resources.

Recommended approach

Summary
- Icons are resolved by slug to local SVG assets.
- The renderer loads and sanitizes icon SVGs once per diagram render, caches results, then inlines icon markup into the node’s `<foreignObject>` HTML.
- Optional optimization: support per-diagram `<defs><symbol>` sprite injection, but treat it as a best-effort enhancement because `<use>` inside `<foreignObject>` can be inconsistent across browsers.

Rationale
- Inline per-node SVG inside `<foreignObject>` is the most compatible with the current renderer (HTML layout + line clamping).
- Still enables “icon sets” and per-diagram style without network calls to third-party hosts.

Data model

Node fields (existing + new)
- `icon`:
  - string slug: `"gift"`
  - or object (future): `{ "name": "gift", "set": "athena" }`
- Stacked text fields (already supported): `headline`, `body`, `footer`.

Slug rules
- Match `^[a-z0-9_]+$`.
- No path separators.

Component API

`components/playbooks/flow_diagram_client.astro`
- Existing props
  - `id` (string)
  - `dataUrl` (string)
  - `height` (number)
  - `maxLines` (number)
  - `cssHref` (string)
- New props (this spec)
  - `iconSet?: string` default `athena`
  - `iconMode?: 'inline' | 'sprite'` default `inline`
  - `iconBasePath?: string` default `/diagrams/icon_sets`

Behavior
- The component passes icon config via `data-*` attributes on `.flow-embed` so the runtime can resolve icons per diagram instance.

File layout

Default icon sets (recommended)
- `public/diagrams/icon_sets/<set>/icons/<slug>.svg`
- Optional prebuilt sprite (Phase 2)
  - `public/diagrams/icon_sets/<set>/sprite.svg`
  - `public/diagrams/icon_sets/<set>/manifest.json`

Per-diagram overrides (optional)
- `public/diagrams/<diagram_dir>/icons/<slug>.svg`

Resolution order
- If the diagram is rendered from a directory (e.g. `.../gifting_playbook_flow/*.json`), check:
  - `/diagrams/<diagram_dir>/icons/<slug>.svg`
  - `/diagrams/icon_sets/<iconSet>/icons/<slug>.svg`

Rendering behavior

Mode: `inline` (default)
- For each used icon slug:
  - fetch the SVG file (same-origin)
  - sanitize and normalize it
  - store sanitized markup in an in-memory cache keyed by URL
- In each node `<foreignObject>`, render the icon as inline SVG markup inside `.node-icon`.

Mode: `sprite` (optional)
- Load a prebuilt sprite for the icon set (single fetch of `sprite.svg`).
- Inject `<defs>` into the diagram `<svg>`.
- Render the node icon as `<svg><use href="#..."/></svg>`.
- If `<use>` fails to render in `<foreignObject>` in a given browser, fall back to `inline` (feature detect per diagram and cache that decision).

Sanitization

Threat model
- Icon SVG files are executable content unless sanitized.
- We must prevent scripts, event handlers, and external resource loading.

SVG denylist
- Remove entirely: `script`, `foreignObject`, `iframe`, `object`, `embed`, `image`, `audio`, `video`, `link`, `a`.
- Remove any attribute starting with `on`.
- Remove `href` / `xlink:href` unless it is an internal fragment reference (`#...`) and the referenced id exists inside the sanitized symbol.
- Drop inline `style` attributes by default.

SVG allowlist
- Elements: `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`.
- Optional (only if needed): `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`.

Normalization
- Ensure a `viewBox` exists.
- Prefer `fill="currentColor"` and `stroke="currentColor"` for themeable icons, unless the icon set opts out.
- Namespace internal `id` values to avoid collisions if symbols are used.

Caching and performance
- Cache sanitized SVG markup in memory per page session.
- Avoid fetching icons not used by the current diagram.
- For `sprite` mode, rely on browser caching of `sprite.svg` across diagrams.

Testing
- Add a lab page rendering:
  - same diagram with `iconMode=inline` and `iconMode=sprite`
  - two diagrams on the same page with the same icon slugs
- Verify:
  - icons render
  - no third-party network requests
  - sanitized SVG cannot execute scripts
  - per-diagram stylesheet does not affect other diagrams

Rollout
- Phase 1
  - Implement `inline` mode with directory-based icons and strict sanitization.
  - Keep current hardcoded inline icons as a fallback for missing assets.
- Phase 2
  - Add optional `sprite` mode and an icon-sprite build script (Bun) to generate `sprite.svg` + `manifest.json`.
- Phase 3
  - Move all diagrams to slug-based icon sets; add at least one partner set to validate multi-brand styling.

Acceptance criteria
- A node can specify `icon: "gift"` and render it as inline SVG.
- Icons can be swapped by changing `iconSet` without changing diagram JSON.
- Each diagram can specify a stylesheet (`cssHref`) independent of iconSet.
- No PNG/JPEG diagram usage; no iframes.
- Imported SVGs are sanitized (no scripts/handlers/external refs).

Alternatives
- Per-node embedded SVG blobs in JSON
  - Pros: no asset pipeline
  - Cons: bloated JSON, harder to sanitize and diff
- Fetch per-icon external URLs
  - Pros: flexible
  - Cons: violates security posture and “inline only” intent; adds failure modes
- Global page-level sprite
  - Pros: smaller markup across many diagrams
  - Cons: cross-diagram coupling, id collisions, harder portability
