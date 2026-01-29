---
description: "Quality evaluation for generated decorative illustrations against a reference style"
model: google/gemini-3-flash-preview
---
# Illustration Quality Check

You are evaluating a generated decorative illustration image.

You will be given:
- A reference style image
- A candidate generated image
- The requested subject/scene text

Decide if the candidate is acceptable.

## Pass criteria

- The candidate clearly depicts the requested subject/scene (not placeholders, not generic letters).
- The candidate matches the reference style (medium, linework, wash behavior, texture, composition strategy).
- The candidate is NOT a near-identical copy of the reference image's specific scene.
- No logos, no wordmarks, no watermarks.
- No rendered text anywhere in the image.
- No artifacts, corruption, or obvious AI glitches.

## Output

Output ONLY a JSON object:

```json
{"isGood": true}
```

or

```json
{"isGood": false}
```
