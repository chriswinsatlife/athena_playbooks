## Mockup Analysis Summary

The reference mockup (`docs/playbook_page_mockup.png`) is a premium, editorial-style playbook design with these key patterns:

### Slice 0: Hero Section

- Custom watercolor-style illustration (not photo)
- Large elegant serif headline
- "STACK" section with horizontal pill-shaped tool badges containing brand icons
- Author bio block with circular headshot + Athena branding
- Drop cap for body text start
- Cream/off-white background (#F9F9F7)
- "Quiet luxury" aesthetic with vast whitespace

### Slice 1: Process Diagram Card

- Large beige card container with rounded corners
- Three-column horizontal process flow (Quarterly → As Needed → Continuous)
- Dark forest green column headers
- Avatar in top-left for authority
- **"Copy the Prompt" sidebar** with ChatGPT/Claude/Gemini/Grok buttons
- Monochromatic green palette

### Slice 2: Flowchart Section

- Standard flowchart shapes (diamonds for decisions, rectangles for actions, pills for start/end)
- Yes/No logic badges on connector lines
- Same "Copy the Prompt" sidebar pattern
- Sage/mint green borders and connectors

### Slice 3: Quote/Philosophy Section

- Centered text with vertical dividers (editorial framing)
- Profile card with avatar, serif headline, URL
- Bold dark green footer block
- Satirical/irreverent quote attributed to "Confucius"

### Slice 4: Q&A / FAQ Section

- Display italic serif for "Questions & Answers" header
- Bold sans-serif for questions (skimmable)
- Serif for answers (readable)
- Horizontal rule dividers
- Red margin annotation noting "This is AEO & SEO shit"

### Slice 5: CTA + Related Content

- Tan/beige CTA block with aggressive placeholder copy
- Dark green button
- "More Playbooks" section on dark green background
- Rounded content cards in sage green
- Italic serif "Relationships" category heading

### Slice 6: Discovery/Footer

- Dark forest green background
- "More playbooks from Jonathan" and "Startup Founders" sections
- Large rounded placeholder cards
- Italic serif headings, muted sans-serif subheadings

---

### Key Differences from Current Implementation

| Mockup                                    | Current                |
| ----------------------------------------- | ---------------------- |
| Custom watercolor illustration            | No hero image          |
| "Copy the Prompt" sidebar with AI buttons | Not implemented        |
| Flowchart/process diagrams                | Steps as numbered list |
| Vertical dividers framing text            | No dividers            |
| Dark green footer sections                | Plain CTA              |
| "More Playbooks" discovery section        | Not implemented        |
| Italic serif display headings             | Standard Playfair      |
| Author profile card                       | Not implemented        |

### Current Implementation

Latest preview URL: [http://localhost:4321/playbooks/automated-gifting-system/]

### Notes

- The current implementation (`src/pages/playbooks/[slug].astro`), alongside the JSON schema which populates the page, does include some elements which are desirable but _absent_ from the conceptual mockup (`docs/playbook_page_mockup.png`), which focused more on aesthetics and was made _prior_ to the finalization of the playbook data model & schema
- We may need to create more components or create final designs for components which were YOLO'd with code in the existing page but not present in the illustrative mockup
- There are many desirable components which assist with communicating the narrative, value, tactics, and key moments of the playbook which were _neither_ in the illustrative mockup _nor_ in the current implementation; we may need to update our prompting or schema to facilitate the usage of these components; these include amongst other things, quotes, messages, emails, calendar items, and so on in `src/components/`

#### In current implementation but NOT in mockup, i.e. "needs design":

- BeforeAfter transformation cards
- SectionSpecs tables
- SectionChecklist with substeps
- FAQ accordion
- References section

#### In mockup but NOT yet fully implemented, i.e. "needs Astro component" or "needs implementation in template page":

- Custom watercolor hero illustrations
- Author/profile cards
- Flowchart/process diagrams (FlowDiagram component exists but not wired to generated playbooks)
- Vertical dividers framing editorial text
- "More Playbooks" discovery section with cards

#### Rich embed components available but unused, i.e. "needs update to prompt/schema/other" (and possibly guidance on how to include these from both a design and content standpoint):

- Messages.astro - WhatsApp/iMessage/ChatGPT conversations
- Calendar.astro - Google/Apple/Outlook views
- EmailThread.astro - Gmail-style threads
- Notifications.astro - macOS/iOS/Android alerts
- DataTableViewer.astro - Sheets/Notion/Airtable tables
- SocialQuote.astro - Twitter/LinkedIn/Podcast quotes
