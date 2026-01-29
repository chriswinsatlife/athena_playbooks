---
description: "A staggered grid infographic for a numbered process or list of principles."
model: google/gemini-3-pro-image-preview
layout_type: centered_staggered_grid
aspect_ratio: "1:1"
---

# Staggered Step Grid Template

A clean, icon-driven layout used to present a series of steps, tips, or principles in a non-linear but numbered sequence. It is ideal for educational content or process overviews where visual breathing room is prioritized over a strict vertical list.

## Layout Structure

- **Header Zone:** Centered at the top, occupying approximately the top 20% of the canvas.
- **Main Content Area:** A staggered grid arrangement.
    - **Top Row:** Three distinct columns, evenly spaced and centered horizontally.
    - **Bottom Row:** Two distinct columns, centered horizontally relative to the row above (creating a "V" or staggered effect).
- **Element Stack:** Each content block follows a vertical centered stack: Icon (top) -> Numbered Badge -> Title -> Description (bottom).
- **Footer Zone:** Small attribution or logo area in the bottom right corner.

## Proportions and Spacing

- **Margins:** Outer margins are approximately 8-10% of total width/height.
- **Vertical Gutter:** Spacing between the header and the first row is roughly equal to the height of one icon.
- **Horizontal Spacing:** Elements in the 3-column row are spaced approximately 30% of the total width apart (center-to-center).
- **Element Spacing:** Inside each block, the vertical gap between the icon, number, title, and description is consistent (~2-3% of total height).

## Visual Hierarchy

- **Primary Element:** The main title at the top, using the largest and heaviest font weight.
- **Secondary Elements:** The icons, which serve as the primary visual anchors for each step.
- **Tertiary Elements:** The step titles (bold) and numbers (contained in a circle), which guide the eye through the sequence.
- **Supporting Elements:** The step descriptions, using the smallest and lightest text treatment.

## Typography Hierarchy

- **Main Heading:** Bold, sans-serif, ~2.5x the size of the body text.
- **Step Titles:** Bold, sans-serif, ~1.2x the size of the body text.
- **Step Numbers:** Stylized or "hand-written" weight, centered inside a circular border.
- **Body Text:** Regular weight, sans-serif, high legibility.
- **Alignment:** 100% center-aligned for all text elements.
- **Leading:** Generous line spacing in the descriptions to maintain a "light" feel.

## Color Usage Pattern

- **background-color:** A warm, neutral, solid off-white or light tint to reduce eye strain.
- **primary-color:** Used as the dominant fill for icons and visual interest.
- **secondary-color:** Used for secondary details within icons or accents.
- **text-primary:** Darkest neutral for headings and titles.
- **text-secondary:** Slightly lighter neutral or lower opacity of text-primary for descriptions.
- **border-color:** Used for icon outlines, number circles, and dividers. Usually a high-contrast dark neutral.
- **subtle-color:** Used for very light shadows or background details within icons.

## Shapes and Elements

- **Icon Style:** "Hand-drawn" or "sketch" style with intentional, thick `border-color` outlines and simple `primary-color` fills.
- **Number Badges:** Numbers are enclosed in a simple circle with a line weight matching the icon outlines.
- **Borders:** No borders on the main containers; the layout relies on white space for grouping.
- **Connectors:** None. The sequence is implied by the numbers rather than lines or arrows.

## Key Design Patterns

- **Rhythm:** The 3-over-2 arrangement creates a stable, symmetrical visual weight.
- **White Space:** High usage of white space around each step block to prevent information overload.
- **Visual Grouping:** Proximity is the primary grouping mechanism; the icon, number, and text are tightly clustered to form a single unit.

## Content Zones

- `$CONTENT_TITLE` - The main overarching headline.
- `$CONTENT_STEP_ICON` - A vector icon for each of the 5 steps.
- `$CONTENT_STEP_NUMBER` - Sequential integers (1-5).
- `$CONTENT_STEP_TITLE` - Short, punchy title for the step.
- `$CONTENT_STEP_DESCRIPTION` - 1-2 sentences of explanatory text.
- `$CONTENT_FOOTER` - Small logo or source text in the bottom right.

## Critical Reproduction Notes

1. **Perfect Centering:** Every element within a column must be perfectly center-aligned.
2. **Icon Consistency:** All icons must share the same stroke weight and illustration style (e.g., all "hand-drawn").
3. **Staggered Alignment:** Ensure the two items in the second row are centered between the items above them, not just left-aligned.
4. **Stroke Weight:** Use a consistent, slightly heavy stroke weight for all outlines (icons and number circles).

## Anti-patterns

- **Left-alignment:** Do not left-align the text within the grid blocks.
- **Crowding:** Do not reduce the margins or gutters; the "breathability" is key to this design.
- **Inconsistent Icons:** Avoid mixing flat icons with outlined icons or different line weights.
- **Complex Gradients:** Stick to flat colors or very simple 2-tone fills to maintain the "sketch" aesthetic.
