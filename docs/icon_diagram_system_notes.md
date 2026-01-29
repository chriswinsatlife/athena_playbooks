Current system

High-level constraints
- Diagrams render inline as SVG inside articles.
- No PNG/JPEG diagram assets.
- No iframes.
- No zoom/pan/scroll UI. Optional full-viewport `<dialog>` is allowed.

Flow diagram renderer

- Component: `components/playbooks/flow_diagram_client.astro`
  - Renders an inline `<svg>` and runs a client-side renderer.
  - Supports per-diagram stylesheet selection via `cssHref` (defaults to `public/diagrams/gifting_playbook_flow/runtime.css`).
  - Supports per-diagram icon configuration:
    - `iconSet` (default `athena`)
    - `iconBasePath` (default `/diagrams/icon_sets`)
    - `iconMode` (`inline` or `sprite`, default `inline`)
  - Full-screen view: native `<dialog>`, clones the inline SVG. No zoom/pan.

- Runtime: `public/diagrams/gifting_playbook_flow/flow_runtime.js`
  - Renders JSON to SVG using D3 + Dagre.
  - Node content is rendered via `<foreignObject>` so we can do stacked layout and line clamping.
  - Node content fields:
    - Legacy: `label` (renders as primary body text)
    - Rich: `headline`, `body`, `footer`
    - Icon: `icon` (slug string; also tolerates `{ name: string }` for future schema)
  - Icon loading (slug -> SVG):
    - Per-diagram override first: `/diagrams/<diagram_dir>/icons/<slug>.svg`
      - `diagram_dir` is derived from the JSON `dataUrl` path.
    - Then icon set: `${iconBasePath}/${iconSet}/icons/<slug>.svg`
  - Icon performance:
    - Preloads unique slugs once per render.
    - Caches fetched + sanitized results in-memory across renders.
    - Uses the loaded icon markup during measurement so node height accounts for the icon row.
  - Sanitization:
    - Removes scripts, event handlers (`on*` attrs), external `href`s.
    - Allows basic shapes and also `defs` + gradients/masks.
    - Namespaces internal IDs and rewrites internal `url(#...)` references.
    - Preserves `fill/stroke: url(#...)` and normalizes other fills/strokes toward `currentColor`.

Icon assets

- Initial set:
  - `public/diagrams/icon_sets/athena/icons/gift.svg`
  - `public/diagrams/icon_sets/athena/icons/check.svg`
  - `public/diagrams/icon_sets/athena/icons/alert.svg`
  - `public/diagrams/icon_sets/athena/icons/clock.svg`

How to use

- Add an icon file:
  - `public/diagrams/icon_sets/<set>/icons/<slug>.svg`
  - Must include a `viewBox`.
- Reference it in diagram JSON:
  - `"icon": "<slug>"`
- (Optional) override icon set per diagram:
  - `<FlowDiagram ... iconSet="partner_acme" cssHref="/diagrams/partner_acme/runtime.css" />`
