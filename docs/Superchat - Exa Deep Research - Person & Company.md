Re: `docs/Superchat - Exa Deep Research - Person & Company.json`

This is real research steering. The "Prompts & Queries" node contains:

**Per-job variables:**

- `person_query` - multi-paragraph research directive with identity anchoring, verification rules, source prioritization
- `person_system_prompt` - research assistant persona with verification checklist, balanced approach mandate
- `person_analysis_prompt` - output structure with explicit anti-patterns ("NO process words", "NO inline citations", mandatory clickable URLs)
- `company_query` - structured research areas with exact headings, citation requirements
- `company_system_prompt` - source priority hierarchy (official site → G2/Capterra/Sacra/Tegus → sitemaps → ad libraries → job listings → financial news → interviews → case studies), anti-patterns (avoid UGC, outdated info, speculation)
- `company_analysis_prompt` - synthesis requirements, tone rules ("no sensationalist garbage", "avoid trite hackneyed garbage")
- `max_depth` - crawl depth limit
- `time_limit` - research time limit (270s)
- `max_urls` - URL limit (15)

**Dynamic inputs per job:**

- `person_name`
- `company_name`
- `company_url`
- `company_description`

The brief schema needs to support this level of steering.
