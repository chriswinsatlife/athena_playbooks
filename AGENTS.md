## Files and Folders

- This project uses Astro, DaisyUI, and Tailwind V4.
- `tailwind_templates/catalyst-ui-kit/` it the official Tailwind UI Kit and the preferred starting point for new styles, components, etc; it is a default theme intended to be duplicated from and then customized.
- `tailwind_templates/oatmeal-mist-instrument/` is the official Tailwind theme with specific styles, page layouts, and so on that we can copy from.
- `maggie_appleton_components/` is a collection of well-designed Astro components.
- `athena/` contains information about the project's purpose; specifically the playbook generation
- For testing, use `agent-browser`; see `docs/browser_cli_instructions.md`.
- Verify all pages are error free yourself, without being asked by the user; keep checking the page with `agent-browser` and fixing issues until it is immaculate.
- Do not use emojis in code, output, or documentation. Unicode symbols (✓, ✗, →, ⚠) are acceptable.
- Refer to `docs/css_tricks_com_crafting_strong_dx_with_astro_components_and_typescript.md` for details on Astro and Typescript best practices.
- Refer to `.opencode/skill/daisyui/` for DaisyUI-specific best practices when writing any front-end file.
- Never use all caps for filenames or directory names or variables, unless strictly necessary (e.g. screaming snake case variable required in `.env` by a third-party library).
- Original/older playbook format: `athena/coda_playbooks_doc/CqI5pastxC.txt`
- Use `lower_snake_case` for every filename, directory name, etc.
