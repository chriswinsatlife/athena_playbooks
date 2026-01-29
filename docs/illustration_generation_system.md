# Illustration Generation System

System for generating decorative illustrations in a consistent style.

This is separate from the diagram system.

## Workflow

- Analyze a reference illustration to create a reusable style template
- Generate new artwork using that style template + subject/scene inputs

## Files

- Metaprompt: `prompts/analyze_illustration_reference.md`
- Style templates output dir: `prompts/illustration_styles/`
- Generator: `tools/generate_illustration.ts`
- QA prompt: `prompts/illustration_quality_check.md`
- Global constraints appended to prompts: `prompts/system_instructions.md`

Global constraints appended to illustration prompts:

- `prompts/illustration_system_instructions.md`

## Analyze Reference

```bash
bun tools/analyze_illustration_reference.ts <image_path> [output_name]
```

Example:

```bash
bun tools/analyze_illustration_reference.ts \
  docs/wattenberger_watercolor_footer_image.png \
  wattenberger_watercolor_footer_style
```

Output:

- `prompts/illustration_styles/wattenberger_watercolor_footer_style.md`

## Generate Artwork

```bash
bun tools/generate_illustration.ts <style_name> "<subject>" "<scene>" [options]
```

Example (with QA against the reference style image):

```bash
bun tools/generate_illustration.ts wattenberger_watercolor_footer_style \
  "a vintage bicycle" \
  "leaning in a wildflower patch along the bottom edge of a wide panoramic frame" \
  --reference docs/wattenberger_watercolor_footer_image.png \
  -n 4 --keep-failed
```

## Restyle an Existing Image

If you have an existing image (e.g., a photo or sketch) and want it re-illustrated in a style:

```bash
bun tools/generate_illustration.ts wattenberger_watercolor_footer_style \
  -f docs/jonathan_swanson.jpg \
  --reference docs/wattenberger_watercolor_footer_image.png \
  -n 4 --keep-failed
```

### Options

- `--list`
- `-n, --num-generations <n>` (default 4)
- `--image-size 1K|2K|4K` (default 2K)
- `--reference <path>` (recommended; enables QA)
- `--keep-failed` (stores fails in `outputs/illustrations/failed/`)
- `--skip-quality-check`
- `--debug`

## Notes

- The generation prompt is intentionally short and derived from the style template's "Prompt Skeleton".
- `prompts/system_instructions.md` is appended to every generation prompt. Most important: no logos.
