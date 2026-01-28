# Create Brand Style Guide

## Input

`$ARGUMENTS`

Parse arguments:

- **Client name**: e.g., `athena`, `canva`, `paypal`
- **URL**: e.g., `https://canva.com`

If you're unable to identify the project/company name or their URL, stop and ask. If you're unsure of the exact URL, you **MUST** confirm with the user **BEFORE** running any steps of the workflow below.

## Workflow

### Step One: Verify Project Exists

```bash
test -dbrand && echo "OK" || echo "MISSING"
```

If MISSING, ask the user if you should create a new project. If so, run `bun run scripts/create_project.ts $CLIENT_NAME` first. Otherwise, continue.

### Step Two: Extract Brand with Firecrawl

```bash
bun run tools/firecrawl.ts brand {url} --out-dir brand
```

This command:

- Extracts colors, typography, spacing, and component styles
- Downloads logo, favicon, and OG image
- Generates a style guide markdown file

### Step Three: Verify and Report

```bash
eza -la brand/
```

Report:

- Style guide path
- Assets downloaded
- Key brand elements extracted

## Reference

- Example: `~/GitHub/irrational_labs_hq/projects/canva/brand/canva_style_guide.md`
