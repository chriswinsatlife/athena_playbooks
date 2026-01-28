# Icons

## V1

- [https://github.com/tailwindlabs/heroicons]
- `iconia-pro`, copied to `src/assets/icons`

## V2

- [https://nucleoapp.com]
    - $129 one time purchase, Athena Brex

## V3

- Custom icons where needed

---

## Appendix

| Library            | SVG Count | Styles                                           | Categories     | SVG Quality                                  |
| ------------------ | --------- | ------------------------------------------------ | -------------- | -------------------------------------------- |
| iconia-pro         | 33,051    | 6 (Thin, Regular, Dashed, Two Tone, Solid, Flat) | 58             | Clean, semantic paths, no hardcoded colors   |
| Icon54 v4          | 20,213    | 1 (zipped)                                       | Unknown        | (zipped)                                     |
| magicoon           | 10,904    | 4 (Light, Regular, Filled, Duotone)              | Flat structure | Has embedded CSS with hardcoded #25314c fill |
| huge-icons-pack    | 4,040     | 1 (bulk)                                         | 24             | Hardcoded #28303F fills, opacity layers      |
| universal-icon-set | 1,560     | 2 (Light/Solid)                                  | 12             | Hardcoded #12131A fills                      |

- `~/Downloads/UI8 2026 Icons/huge-icons-pack/`
- `~/Downloads/UI8 2026 Icons/Icon54 v4 zip/`
- `~/Downloads/UI8 2026 Icons/iconia-pro/`
- `~/Downloads/UI8 2026 Icons/magicoon UI icons library v1.3/`
- `~/Downloads/UI8 2026 Icons/universal-icon-set/`

Best choice: `iconia-pro`

Reasons:

- Largest library (33k SVGs)
- 6 weight/style variants per icon
- 58 well-organized categories
- Clean SVG code with fill-rule="evenodd" and no embedded CSS classes
- No hardcoded colors in the paths (just fill attribute, easy to override)
- Most recent (Jun 2022)
  Runner-up: magicoon if you need fewer but still substantial icons (10k) with 4 styles, though the embedded CSS classes with hardcoded colors require more cleanup for theming.
