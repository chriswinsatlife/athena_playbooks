---
description: "Asymmetric process overview layout with a dominant title billboard and a vertical step-by-step flow."
model: google/gemini-3-pro-image-preview
layout_type: split_process_billboard
aspect_ratio: "16:9"
---
# Split-Billboard Process Template

This diagram is used to introduce a high-level concept or workflow. It combines a bold, catchy title section with a simplified vertical process flow to explain how a specific technology or methodology works in practice.

## Layout Structure

- **Split Composition:** The layout is divided into two primary vertical zones (approximately 60:40 or 55:45 ratio).
- **Left Zone (Billboard):** Contains the primary headline and branding. Elements are left-aligned.
- **Right Zone (Flow):** Contains a vertical sequence of containerized steps (cards).
- **Flow Direction:** Vertical, top-to-bottom, indicated by linear connectors between cards.
- **Alignment:** The billboard text is left-aligned. The flow cards are centered within their respective zone.

## Proportions and Spacing

- **Billboard Title:** Occupies ~40% of the total height in the upper-left quadrant.
- **Card Sizing:** The central card in the flow is typically ~25-30% larger than the preceding and following cards to create a focal point.
- **Margins:** External margins are generous, approximately 5-8% of the total width/height.
- **Vertical Spacing:** Gaps between cards in the flow are roughly equal to 50% of a small card's height.

## Visual Hierarchy

- **Primary Element:** The first line of the main title, emphasized by a high-contrast background shape.
- **Secondary Element:** The second line of the main title and the central "hero" card in the process flow.
- **Tertiary Elements:** The top and bottom cards in the flow and the brand logo in the bottom-left corner.
- **Hierarchy Drivers:** Size is the main driver for text; containment and elevation (shadows) distinguish the process steps from the background.

## Typography Hierarchy

- **H1 (Primary Title):** Extra-bold, sans-serif, ~10% of total layout height. Set in all-caps or title case.
- **H2 (Secondary Title):** Extra-bold, sans-serif, ~80% of H1 size.
- **Card Headings:** Bold, sans-serif, ~25% of H1 size.
- **Card Body Text:** Regular weight, ~75% of Card Heading size.
- **Alignment:** Billboard text is left-aligned; Card text is left-aligned within centered containers.

## Color Usage Pattern

- **background-color:** A light, neutral, warm-toned solid color.
- **primary-color:** Used for the high-contrast "brush-stroke" highlight behind the H1 and for the flow connectors (arrows).
- **text-on-primary:** High-contrast text (usually white or very light) sitting inside the primary-color highlight.
- **surface-color:** Pure white used for the process cards to make them pop against the neutral background.
- **text-primary:** Darkest neutral used for the main titles and card headings.
- **text-secondary:** Muted neutral used for card descriptions and supporting details.
- **border-color:** Not explicitly used; separation is achieved via shadows.

## Shapes and Elements

- **Highlight Shape:** A rectangular "organic" or "distressed" brush-stroke box behind the main title, giving a hand-drawn or urgent feel.
- **Cards:** Rounded rectangles with a small corner radius (approx. 2-4%).
- **Elevation:** Subtle, soft drop shadows on surface-color cards to create depth.
- **Connectors:** Simple, thin-stroke downward-pointing arrows centered between cards.
- **Icons:** Simple glyphs or brand logos placed on the left side within cards to categorize the step.

## Key Design Patterns

- **Asymmetry:** The heavy visual weight on the left is balanced by the vertical rhythm on the right.
- **Visual Rhythm:** The vertical stack of cards creates a clear "1-2-3" reading order.
- **Negative Space:** Significant breathing room around the billboard and between the two main zones to prevent visual clutter.

## Content Zones

- `$CONTENT_TITLE_HIGHLIGHT` - The main keyword or topic (inside the highlight box).
- `$CONTENT_TITLE_SUB` - The secondary part of the headline.
- `$CONTENT_FLOW_START` - First step in the process (small card).
- `$CONTENT_FLOW_HERO` - The central, most important step (large card with description).
- `$CONTENT_FLOW_END` - Final step or outcome (small card).
- `$CONTENT_LOGO` - Brand or source identification in the bottom-left.

## Critical Reproduction Notes

1. **The Highlight Texture:** The rectangular box behind the main title must have an "organic" or "hand-painted" edge to contrast with the clean geometric cards.
2. **Vertical Alignment:** Ensure the arrows and the centers of the cards in the right zone are perfectly aligned on a vertical axis.
3. **Contrast:** Maintain high contrast between the `text-on-primary` and the `primary-color` background.
4. **Card Padding:** Ensure internal padding within cards is consistent across all three steps.

## Anti-patterns

- **Sharp Corners:** Avoid using perfectly sharp 90-degree corners for the process cards.
- **Overcrowding:** Do not add more than 4 cards to the right zone; the layout relies on vertical white space.
- **Centered Billboard:** Do not center the left-side text; it must be left-aligned to maintain the "billboard" look.
- **Heavy Borders:** Avoid thick borders on cards; use shadows for separation instead.