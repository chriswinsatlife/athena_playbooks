# Diagram Generation System

System for generating consistent, on-brand Athena playbook diagrams from reference images.

## Overview

Two-step workflow:
1. **Analyze** reference images to extract brand-agnostic layout templates
2. **Generate** on-brand diagrams using templates + Athena brand style

## Quick Start

```bash
# 1. Analyze a reference image to create a template
bun tools/analyze_reference.ts docs/lenny_diagrams_and_visuals/some_image.png my_template_name

# 2. List available templates
bun tools/generate_diagram.ts --list

# 3. Generate diagrams using a template
bun tools/generate_diagram.ts my_template_name "Title: Your Title | Step 1: First step | Step 2: Second step"
```

## Scripts

### analyze_reference.ts

Analyzes a reference image and outputs a brand-agnostic template file.

```bash
bun tools/analyze_reference.ts <image_path> [template_name]
```

**Arguments:**
- `image_path` - Path to reference image (png, jpg, etc.)
- `template_name` - Optional name for output template (defaults to cleaned filename)

**Options:**
- `--debug` - Print full prompt and response

**Output:** Creates `prompts/diagram_templates/<template_name>.md`

**Model:** `gemini-3-flash-preview` (with fallback to `gemini-3-flash`)

### generate_diagram.ts

Generates diagrams using a template and the Athena brand style.

```bash
bun tools/generate_diagram.ts <template> "<content>" [options]
bun tools/generate_diagram.ts --list
```

**Arguments:**
- `template` - Template name (without .md extension)
- `content` - Diagram content, pipe-separated sections

**Options:**
- `-n, --num-generations <n>` - Number of images to generate (default: 4)
- `-o, --output <dir>` - Output directory
- `--notes "<text>"` - Additional generation notes
- `--image-size <size>` - 1K, 2K, or 4K (default: 2K)
- `--aspect-ratio <ratio>` - Override template default
- `--keep-failed` - Keep images that fail quality check in `failed/`
- `--skip-quality-check` - Skip quality filtering
- `--debug` - Verbose output

**Output:** Creates images in `outputs/diagrams/`

**Models:**
- Generation: `gemini-3-pro-image-preview`
- Quality check: `gemini-3-flash-preview`

## File Structure

```
prompts/
  athena_brand_style.md             # Athena colors, fonts, visual rules
  analyze_diagram_reference.md      # Metaprompt for analyzing reference images
  diagram_quality_check.md          # Quality evaluation prompt
  system_instructions.md            # Appended to every generation prompt
  diagram_templates/                # Generated templates
    test_lenny_1.md
    (add more by running analyze_reference.ts)

tools/
  analyze_reference.ts              # Reference image analyzer
  generate_diagram.ts               # Diagram generator

outputs/
  diagrams/                         # Generated images
    failed/                         # Failed images (with --keep-failed)

docs/
  lenny_diagrams_and_visuals/       # Reference images from Lenny
```

## System Instructions

The file `prompts/system_instructions.md` contains instructions appended to every generation prompt. Current rules:

- **NO LOGOS** - Logo placement handled separately via post-processing
- **NO WATERMARKS** - No signatures or attribution in images
- **CLEAN EDGES** - Leave margins, don't extend to canvas edge
- **TEXT ACCURACY** - Correct spelling, clear rendering
- **FLAT BACKGROUND** - Solid colors, no gradients unless specified
- **CONSISTENT STYLE** - All elements stylistically unified

Edit this file to add or modify global generation rules.

## Template Format

Templates use YAML frontmatter + markdown body:

```markdown
---
description: "Brief description of the layout type"
model: google/gemini-3-pro-image-preview
layout_type: snake_case_identifier
aspect_ratio: "1:1"
---
# Template Name

Description of the layout.

## Layout Structure
- Spatial organization details
- Element arrangement

## Proportions and Spacing
- Size ratios (percentages, not pixels)
- Margin and padding ratios

## Visual Hierarchy
- Primary, secondary, tertiary elements
- How hierarchy is established

## Typography Hierarchy
- Relative font sizes
- Weight and alignment patterns

## Color Usage Pattern
- Uses generic terms: primary-color, secondary-color, accent-color
- background-color, surface-color, text-primary, text-secondary
- NO specific hex codes from reference

## Content Zones
- $CONTENT_TITLE
- $CONTENT_ITEMS
- (template-specific placeholders)

## Critical Reproduction Notes
1. Most important aspect
2. Second most important
...

## Anti-patterns
- Things to avoid
```

## Brand Style

The brand style file (`prompts/athena_brand_style.md`) defines:

**Colors:**
- Deep Forest Green: #1D442F (primary dark)
- Sage Green: #5A8669 (primary accent)
- Bright Green: #559F68 (highlight)
- Soft Mint: #BAD8C4 (light accent)
- Warm Cream: #E6E7DD (background)
- Dark Brown: #403422 (text)
- Gold/Tan: #D5A972 (accent)

**Typography:**
- Headings: Playfair Display
- Body: Figtree
- Handwritten (optional): Caveat, Edu

**Rules:**
- Solid flat backgrounds
- Rounded corners (8-16px)
- No logos (added separately)
- No gradients or busy patterns

## Example E2E Workflow

```bash
# Step 1: Analyze Lenny reference image
bun tools/analyze_reference.ts \
  docs/lenny_diagrams_and_visuals/a57910f7-d2b5-49a4-bea2-cc2f120e4986_2912x2912.png \
  staggered_step_grid

# Step 2: Check what was created
bun tools/generate_diagram.ts --list

# Step 3: Generate Athena-branded diagrams
bun tools/generate_diagram.ts staggered_step_grid \
  "Title: 5 Keys to Effective Delegation | Step 1: Identify - Find repetitive tasks | Step 2: Document - Write clear instructions | Step 3: Delegate - Hand off with context | Step 4: Review - Check and provide feedback | Step 5: Refine - Improve over time" \
  -n 4 --keep-failed

# Step 4: Review outputs in outputs/diagrams/
```

## Quality Checking

By default, generated images are quality-checked using `gemini-3-flash-preview`. The check evaluates:

- Text quality and legibility
- Layout accuracy vs template
- Content completeness
- Visual consistency
- Professional polish

Failed images are deleted (or moved to `failed/` with `--keep-failed`).

Use `--skip-quality-check` to disable filtering and keep all generated images.

## Batch Processing

To analyze all Lenny reference images:

```bash
for img in docs/lenny_diagrams_and_visuals/*.png; do
  name=$(basename "$img" .png | sed 's/^[a-f0-9-]*_//' | sed 's/_[0-9]*x[0-9]*$//')
  bun tools/analyze_reference.ts "$img" "$name"
done
```

## Environment

Requires `GOOGLE_GENERATIVE_AI_API_KEY` in environment or `.env` file.
