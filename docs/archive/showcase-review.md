# Showcase Review Guide

## Start Dev Server

```bash
bun run dev
```

Or with npm:
```bash
npm run dev
```

## Access Showcase

Open: http://localhost:4321/showcase

## What to Check

- All components rendering without hydration errors
- Console errors/warnings in browser DevTools
- Visual correctness of components
- Responsive behavior (test on mobile/tablet widths)

## How to Check Console Errors

1. Open the showcase in browser
2. Press F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows/Linux)
3. Click Console tab
4. Look for red errors or yellow warnings
5. Refresh page to catch hydration errors

## Issue Report Template

For each issue found, include:

```
Component: [Component name]
Issue: [Brief description]
Steps to reproduce: [What you did]
Console error: [Copy exact error message if any]
Screenshot: [Attach if visual issue]
```

## Notes

- Review all 182 components systematically
- Report any broken functionality or visual bugs
- Note components that are missing or don't render