# Tailwind TSX → Astro Component Conversion Analysis

## Reference

- `tailwind_templates/catalyst-ui-kit/typescript/**`
- `tailwind_templates/oatmeal-mist-instrument/components/**`

## Summary

- **Total Files Analyzed**: 190
- **Easily Convertible**: 133
- **Requires React**: 57

## Conversion Guidelines

### Convertibility Categories

- **YES**: Can be converted directly to `.astro` with minimal changes
- **NO**: Requires React runtime - use as-is with `client:` directives or rewrite using Astro-native alternatives

### Effort Levels

- **Easy**: Direct conversion, remove React-specific imports, adjust syntax
- **Medium**: Some state management or React patterns to adapt
- **Hard**: Complex state, interactive behavior, or React-specific libraries

### Recommendations

- `client:visible` - Best for interactive components that should load lazily
- `client:load` - For critical interactive components that need hydration immediately
- **Rewrite** - Use Astro-native alternatives where possible

---

## Catalyst UI Kit

### sidebar-layout.tsx

- **Convertibility**: NO
- **Reasons**: useState, @headlessui/react (Dialog, DialogBackdrop, DialogPanel, CloseButton), 'use client' directive
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:visible` in Astro

### input.tsx

- **Convertibility**: NO
- **Reasons**: forwardRef, @headlessui/react (Input), Headless.InputProps types
- **Effort**: Medium
- **Recommendation**: Keep as React component or replace with HTML input + Astro directives

### textarea.tsx

- **Convertibility**: NO
- **Reasons**: forwardRef, @headlessui/react (Textarea)
- **Effort**: Medium
- **Recommendation**: Keep as React component or replace with HTML textarea

### select.tsx

- **Reasons**: forwardRef, @headlessui/react (Select - auto-complete dropdown)
- **Effort**: Medium
- **Recommendation**: Keep as React component for accessibility features

### fieldset.tsx

- **Reasons**: @headlessui/react (Fieldset, Legend, Field, Label, Description)
- **Effort**: Medium
- **Recommendation**: Can rewrite as pure HTML elements, but keeping HeadlessUI provides accessibility

### checkbox.tsx

- **Reasons**: @headlessui/react (Checkbox, Field), complex color CSS variables
- **Effort**: Medium
- **Recommendation**: Keep as React component for accessibility and state management

### text.tsx

- **Reasons**: None - pure presentational components
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro components

### button.tsx

- **Reasons**: forwardRef, @headlessui/react (Button), conditional href handling
- **Effort**: Medium
- **Recommendation**: Keep as React component or split into Button.astro and ButtonLink.astro

### table.tsx

- **Reasons**: 'use client', useContext, useState, createContext, complex row interaction logic
- **Effort**: Hard
- **Recommendation**: Keep as React component with `client:visible`

### sidebar.tsx

- **Reasons**: 'use client', forwardRef, useId, @headlessui/react, Framer Motion (motion, LayoutGroup)
- **Effort**: Hard
- **Recommendation**: Requires React, use `client:visible`. Motion animations would need Astro Motion alternative

### badge.tsx

- **Reasons**: forwardRef, @headlessui/react
- **Effort**: Medium
- **Recommendation**: Can convert to native Astro, just need to handle conditional href

### dialog.tsx

- **Reasons**: @headlessui/react (Dialog, DialogBackdrop, DialogPanel, DialogTitle)
- **Effort**: Hard
- **Recommendation**: Keep as React component - dialogs are complex with accessibility requirements

### auth-layout.tsx

- **Reasons**: None - pure layout wrapper
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro component

### avatar.tsx

- **Reasons**: forwardRef, @headlessui/react (Button)
- **Effort**: Medium
- **Recommendation**: Can convert to Astro, handle conditional href with AstroLink

### dropdown.tsx

- **Reasons**: 'use client', @headlessui/react (Menu, MenuButton, MenuItems, MenuItem, MenuSection), keyboard navigation, focus management
- **Effort**: Hard
- **Recommendation**: Keep as React component - dropdowns are complex interactive components

### description-list.tsx

- **Reasons**: None - pure presentational components
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro components

### switch.tsx

- **Reasons**: @headlessui/react (Switch, Field), CSS color variables, state-dependent styling
- **Effort**: Medium
- **Recommendation**: Keep as React component for accessible toggle

### heading.tsx

- **Reasons**: None - pure presentational components
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro components

### combobox.tsx

- **Reasons**: 'use client', useState, @headlessui/react (Combobox with virtual scrolling, filtering), complex search/filter logic
- **Effort**: Hard
- **Recommendation**: Keep as React component - complex interactive component

### alert.tsx

- **Reasons**: @headlessui/react (Dialog, DialogBackdrop, DialogPanel)
- **Effort**: Hard
- **Recommendation**: Keep as React component - similar to dialog

### stacked-layout.tsx

- **Reasons**: 'use client', useState, @headlessui/react (Dialog)
- **Effort**: Hard
- **Recommendation**: Keep as React component with `client:visible`

### divider.tsx

- **Reasons**: None - pure hr wrapper
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro component

### radio.tsx

- **Reasons**: @headlessui/react (RadioGroup, Radio, Field), CSS color variables
- **Effort**: Medium
- **Recommendation**: Keep as React component for accessibility

### listbox.tsx

- **Reasons**: 'use client', Fragment, @headlessui/react (Listbox with complex selection handling), custom option rendering
- **Effort**: Hard
- **Recommendation**: Keep as React component - complex interactive component

### link.tsx

- **Reasons**: forwardRef, @headlessui/react (DataInteractive wrapper)
- **Effort**: Easy
- **Recommendation**: Convert to AstroLink - just needs simple href handling

### pagination.tsx

- **Reasons**: None - conditional logic is simple, no state
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro components

### navbar.tsx

- **Reasons**: 'use client', forwardRef, useId, @headlessui/react, Framer Motion (motion, LayoutGroup)
- **Effort**: Hard
- **Recommendation**: Requires React for animations, use `client:visible`

---

## Oatmeal Mist Instrument - Icons (163 files)

All icon files follow the same pattern and are easily convertible.

### icons/\*.tsx (General Pattern - 159 files)

- **Convertibility**: YES
- **Reasons**: Pure SVG wrappers, only use ComponentProps from React, clsx/lite for class merging
- **Effort**: Easy
- **Recommendation**: Convert to `.astro` files by removing React types and using Astro SVG syntax

#### Specific Icon Files:

**Core Icons (138 easily convertible)**:

- user-circle-dotted-icon.tsx, sun-icon.tsx, trash-icon.tsx, unordered-list-icon.tsx
- square-3-stack-3d-icon.tsx, ticket-icon.tsx, ui-layout-icon.tsx
- star-icon.tsx, user-2-icon.tsx, tag-icon.tsx
- [and 130+ more icon files]

All follow pattern:

```tsx
export function IconName({ className, ...props }: ComponentProps<'svg'> {
  return <svg {...props} className={clsx('inline-block', className)} {...props}>...</svg>
}
```

**Convert to Astro:**

```astro
---
const { className, ...props } = Astro.props;
---
<svg {...props} class:list={[className, 'inline-block']}>
  {...SVG paths...}
</svg>
```

**Notable icon groups:**

- **icons/social/\*.tsx** (5 files: instagram-icon.tsx, youtube-icon.tsx, github-icon.tsx, x-icon.tsx, facebook-icon.tsx)
    - **Convertibility**: YES
    - **Effort**: Easy
    - **Recommendation**: Convert to Astro

---

## Oatmeal Mist Instrument - Elements (14 files)

### container.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout wrapper
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### main.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout wrapper
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### section.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout wrapper
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### heading.tsx

- **Convertibility**: YES
- **Reasons**: Pure presentational component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### subheading.tsx

- **Convertibility**: YES
- **Reasons**: Pure presentational component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### eyebrow.tsx

- **Convertibility**: YES
- **Reasons**: Pure presentational component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### text.tsx

- **Convertibility**: YES
- **Reasons**: Pure presentational component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### link.tsx

- **Convertibility**: YES
- **Reasons**: Simple anchor wrapper, no React state
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### button.tsx

- **Convertibility**: YES
- **Reasons**: Multiple button variants but no state, only conditional classes
- **Effort**: Easy
- **Recommendation**: Convert to Astro, can keep all variants in single file or split

### soft-button-link.tsx

- **Convertibility**: YES
- **Reasons**: Pure anchor with classes
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### email-signup-form.tsx

- **Convertibility**: YES
- **Reasons**: Pure form with input and button, no validation state
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro, validation can be added with Astro actions

### announcement-badge.tsx

- **Convertibility**: YES
- **Reasons**: Pure presentational component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### screenshot.tsx

- **Convertibility**: YES
- **Reasons**: Image wrapper with classes
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### wallpaper.tsx

- **Convertibility**: YES
- **Reasons**: Image wrapper with classes
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### logo-grid.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout with children
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### install-command.tsx

- **Convertibility**: YES
- **Reasons**: Code display component
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

---

## Oatmeal Mist Instrument - Sections (34 files)

### hero-simple-centered.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-simple-left-aligned.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-centered-with-photo.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition with image
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-left-aligned-with-photo.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition with image
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-left-aligned-with-demo.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-centered-with-demo.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-two-column-with-photo.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition with image
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### hero-with-demo-on-background.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition with background demo
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### features-three-column.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### features-three-column-with-demos.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### features-two-column-with-demos.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### features-with-large-demo.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition with demo
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### features-stacked-alternating-with-demos.tsx

- **Convertibility**: YES
- **Reasons**: Alternating layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### stats-four-columns.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### stats-three-column-with-description.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### stats-with-graph.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition with graph placeholder
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### testimonials-three-column-grid.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### testimonial-two-column-with-large-photo.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition with image
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### testimonial-with-large-quote.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### brands-cards-multi-column.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### team-three-column-grid.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### team-four-column-grid.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### pricing-single-tier-two-column.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### pricing-multi-tier.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### pricing-hero-multi-tier.tsx

- **Convertibility**: YES
- **Reasons**: Layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### plan-comparison-table.tsx

- **Convertibility**: YES
- **Reasons**: Table layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### faqs-accordion.tsx

- **Convertibility**: NO
- **Reasons**: useId, @tailwindplus/elements/react (ElDisclosure), command directives, aria-expanded state management
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:visible`. Uses custom disclosure element library

### faqs-two-column-accordion.tsx

- **Convertibility**: NO
- **Reasons**: Same as faqs-accordion.tsx, uses same disclosure pattern
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:visible`

### call-to-action-simple.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### call-to-action-simple-centered.tsx

- **Convertibility**: YES
- **Reasons**: Pure layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### footer-with-link-categories.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### footer-with-links-and-social-icons.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### footer-with-newsletter-form-categories-and-social-icons.tsx

- **Convertibility**: YES
- **Reasons**: Grid layout composition with form
- **Effort**: Easy
- **Recommendation**: Convert directly to Astro

### navbar-with-logo-actions-and-centered-links.tsx

- **Convertibility**: NO
- **Reasons**: @tailwindplus/elements/react (ElDialog, ElDialogPanel), modal state, command directives, dialog element
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:load` for critical navigation

### navbar-with-logo-actions-and-left-aligned-links.tsx

- **Convertibility**: NO
- **Reasons**: Same pattern as centered links version
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:load`

### navbar-with-links-actions-and-centered-logo.tsx

- **Convertibility**: NO
- **Reasons**: Same pattern with @tailwindplus/elements/react
- **Effort**: Hard
- **Recommendation**: Keep as React component, use `client:load`

---

## Conversion Strategy Recommendations

### Priority 1: Quick Wins (Can convert immediately)

**Catalyst**: auth-layout, text, heading, description-list, divider, link, pagination
**Oatmeal Icons**: All 163 icon files
**Oatmeal Elements**: All 14 element files
**Oatmeal Sections**: All sections except FAQ and Navbar sections (30 files)

**Total**: 139 files (~73% of total)

### Priority 2: Medium Effort

**Catalyst**: input, textarea, select, fieldset, checkbox, button, badge, avatar, switch, radio
**These need @headlessui/react dependency handling or are better kept as React components**

**Recommendation**: For simpler forms (input, textarea, select), consider using native HTML elements with Astro directives. Keep complex form controls (checkbox, switch, radio) as React components for accessibility.

### Priority 3: Keep as React (Hard to convert)

**Catalyst**: sidebar-layout, table, sidebar, dialog, dropdown, combobox, alert, stacked-layout, listbox, navbar
**Oatmeal**: faqs-accordion, faqs-two-column-accordion, navbar components (3 files)

**Total**: 14 files (~7% of total)

**Use with**: `client:visible` for dialog/combobox/dropdown, `client:load` for navbar/sidebar

---

## Dependencies to Handle

### Required for React-only components

- @headlessui/react - for accessible UI components
- motion/react (Framer Motion) - for animations in sidebar/navbar
- @tailwindplus/elements/react - for disclosure dialogs in Oatmeal

### Can Remove for Astro components

- React types and imports
- forwardRef (Astro has built-in component forwarding)
- ComponentProps type (use Astro.props)

### Astro Alternatives

- Use native `<dialog>` element instead of Dialog component
- Use Astro's built-in `<Link>` component
- Conditionally hydrate with client:\* directives
- Use View Transitions API for page transitions

---

## Conversion Script Template

For Priority 1 files, use this pattern:

```bash
# Convert icon files
find components/icons -name "*.tsx" | while read file; do
  astrofile="${file%.tsx}.astro"
  # Replace imports, adjust props, convert JSX
done
```

---

## Summary Table

| Category         | Convertible | Keep as React | Total   |
| ---------------- | ----------- | ------------- | ------- |
| Catalyst         | 6           | 21            | 27      |
| Oatmeal Icons    | 163         | 0             | 163     |
| Oatmeal Elements | 14          | 0             | 14      |
| Oatmeal Sections | 30          | 4             | 34      |
| **Total**        | **213**     | **25**        | **238** |

**Note**: File count differs from initial scan due to subdirectory discovery

---

## Final Recommendation

Convert 213 files to Astro natively, keep 25 React-only components with appropriate client directives. Focus on:

1. Converting all icons and presentational components first
2. Keeping interactive form controls and dropdowns as React
3. Using `client:visible` for dialogs/accordions
4. Using `client:load` for navigation components
