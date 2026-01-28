# Heroicons (Vendored Subset)

This repo vendors a small subset of Heroicons SVGs so playbooks/diagrams can use icons without importing React components.

- Upstream: https://github.com/tailwindlabs/heroicons
- License: MIT

## How To Update

Run:

```bash
node scripts/fetch_heroicons.mjs
```

SVGs will be written under:

- `athena/brand/icons/vendor/heroicons/24/outline/`
