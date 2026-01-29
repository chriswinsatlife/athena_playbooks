# Component Review Checklist

## Review Categories

- [ ] Icons
- [ ] Elements
- [ ] Sections
- [ ] Catalyst

## Issues Log

### Template Entry (Copy This)

```markdown
## [Component Name]

| Field | Value |
|-------|-------|
| Issue Type | (hydration error / visual bug / missing import / other) |
| Description | |
| Browser Console Error | (paste error here if any) |
| Screenshot | ![screenshot](path/to/screenshot.png) |
| Status | pending review / reviewing / fixed / won't fix |
```

---

## Entries

### Example: Header Component

| Field | Value |
|-------|-------|
| Issue Type | visual bug |
| Description | Logo overlaps with navigation on mobile viewport (375px) |
| Browser Console Error | None |
| Screenshot | ![header-mobile-bug](.assets/screenshots/header-mobile-bug.png) |
| Status | reviewing |

### Example: Button Element

| Field | Value |
|-------|-------|
| Issue Type | hydration error |
| Description | Button color flashes from blue to black on page load in Safari |
| Browser Console Error | `Warning: Text content did not match. Server: "Submit" Client: "Save"` |
| Screenshot | ![button-flash](.assets/screenshots/button-flash.png) |
| Status | pending review |

### Example: ContactSection

| Field | Value |
|-------|-------|
| Issue Type | missing import |
| Description | LucideIcon not imported, renders as empty square |
| Browser Console Error | `ReferenceError: Mail is not defined` |
| Screenshot | ![contact-missing-icon](.assets/screenshots/contact-missing-icon.png) |
| Status | fixed |

---

## Summary

- Total Issues: \_\_\_
- Pending Review: \_\_\_
- Reviewing: \_\_\_
- Fixed: \_\_\_
- Won't Fix: \_\_\_