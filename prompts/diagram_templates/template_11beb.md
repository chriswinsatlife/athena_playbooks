---
description: "A three-tier isometric floating stack diagram with numbered side annotations."
model: google/gemini-3-pro-image-preview
layout_type: isometric_floating_stack
aspect_ratio: "3:2"
---
# Isometric Layered Hierarchy Template

This diagram is used to illustrate a foundational or hierarchical relationship between concepts, where each layer builds upon the one below it. The 3D "floating" effect emphasizes discrete but connected stages.

## Layout Structure

- **Split Composition:** The layout is divided into two primary horizontal zones: a graphic zone on the left (~55% width) and an annotation zone on the right (~45% width).
- **Vertical Alignment:** Three 3D isometric platforms are stacked vertically with significant "white space" gaps between them.
- **Center-Point Anchoring:** Each text block on the right is vertically centered with the corresponding 3D platform on the left.
- **Flow Direction:** Sequential numbering typically flows from the bottom (foundation) to the top (pinnacle).

## Proportions and Spacing

- **Platform Scaling:** The bottom platform is the largest (occupying ~40% of the graphic's width). Each subsequent layer above it is reduced in size by approximately 20-25% to create a tapering pyramid effect.
- **Inter-layer Gaps:** The vertical gap between platforms is approximately 25-30% of the height of an individual platform's face.
- **Margins:** External margins are generous, approximately 10% of total width/height on all sides.
- **Annotation Spacing:** The distance between the graphic and the numbered circles is approximately 5% of total width.

## Visual Hierarchy

- **Primary Elements:** The 3D platforms, rendered with high-contrast borders, serve as the primary visual anchor.
- **Secondary Elements:** Numbered circular badges provide the secondary navigational hook, guiding the sequence of reading.
- **Tertiary Elements:** Descriptive text blocks provide the granular detail.
- **Emphasis:** The top-most (smallest) platform often receives the most vibrant color application to signify the "peak" or ultimate goal.

## Typography Hierarchy

- **Level Headers:** Bold, uppercase, or heavy-weight font. Size is approximately 1.5x the body text.
- **Body Text:** Regular weight, standard line height (~1.2 - 1.3).
- **Index Numbers:** Heavy weight, centered within circular borders, matching the header size or slightly larger.
- **Alignment:** All annotation text is left-aligned.

## Color Usage Pattern

- **background-color:** A solid, neutral, off-white or very light tint to provide high contrast for the graphic.
- **primary-color:** Applied to the top surface of the 3D blocks.
- **secondary-color:** A slightly darker shade or different tone of the primary color, applied to the "thickness" (side faces) of the blocks to create 3D depth.
- **border-color:** A heavy, dark (often black or near-black) stroke used for all outlines, including shapes and circular badges.
- **text-primary:** Dark, high-contrast color for headers and body text.
- **surface-color:** Used for the interior of the numbered circles, often matching the background or a very light neutral.

## Shapes and Elements

- **Shape Language:** Isometric rhombuses (tops) and parallelograms (sides). The style is "illustrative" rather than technical, featuring slightly heavy or variable-width strokes.
- **Border Treatment:** Thick, uniform outer strokes on all 3D shapes. Internal edges (where top meets side) may have slightly thinner strokes.
- **Depth:** No drop shadows or gradients are used. Depth is achieved strictly through isometric projection and color value differences between the top and side planes.
- **Badges:** Simple circular containers with thick borders for the index numbers.

## Key Design Patterns

- **Isometric Consistency:** All platforms share the same isometric angle (typically 30 degrees).
- **Rhythmic Gapping:** The equal spacing between floating layers creates a sense of lightness and modularity.
- **Hand-drawn Quality:** The thick, bold outlines give the diagram an approachable, editorial feel rather than a corporate-software aesthetic.

## Content Zones

- `$CONTENT_INDEX_[1-3]` - The sequence number for the layer.
- `$CONTENT_HEADER_[1-3]` - The short, punchy title for each layer.
- `$CONTENT_DESCRIPTION_[1-3]` - 1-2 lines of descriptive text for each layer.
- `$CONTENT_BRAND_MARK` - Optional small logo or source identifier in the bottom right corner.

## Critical Reproduction Notes

1. **Maintain the Gap:** Do not allow the 3D blocks to touch; the "floating" air gap is essential for the visual style.
2. **Stroke Weight:** Use a significantly thicker stroke than standard charts to maintain the illustrative character.
3. **Perspective:** Ensure the isometric perspective is mathematically consistent so the stack looks stable.
4. **Color Logic:** The sides of the blocks must be darker than the tops to correctly communicate depth.

## Anti-patterns

- **Realistic 3D:** Avoid gradients, textures, or realistic lighting/shadows.
- **Thin Lines:** Do not use hair-line or standard 1pt technical strokes.
- **Center Alignment for Text:** Do not center the annotation text blocks; they must be left-aligned to maintain the "column" feel.
- **Overcrowding:** Do not add more than 4-5 layers, as the tapering effect will make the top layers too small to be meaningful.