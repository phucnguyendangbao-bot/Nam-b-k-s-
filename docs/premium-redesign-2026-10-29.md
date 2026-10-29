# Nam Bộ Ký Sự — premium cultural editorial

## Audit and plan

The starting working tree already contained an uncommitted Apple Store inspired pass: system fonts, brighter surfaces, navigation and horizontally scrolling shelves. These changes were retained and extended. The repository uses Next.js App Router, a server-rendered catch-all route, a read-only publication adapter and one `app/design/` token system. No database migration is needed.

Routes, source ledger, approval hashes, 32 public dossiers, 22 unpublished drafts, media rights records and the existing 3D tours remain intact. Desktop and mobile baseline screenshots of the previously deployed website are under `outputs/premium-qa/before/`.

1. Refine the existing tokens: heritage green, neutral surfaces, body spacing, readable contrast and shared motion durations.
2. Replace repeated homepage shelves with a cinematic licensed photograph, reusable twelve-column bento, editorial lead and supporting stories. A direct link opens all twelve domains in the knowledge library, including without JavaScript.
3. Make the article header independent of the reading/sidebar grid, retain source/rights details, optimize local documentary images and fix seven-question definition-list layout.
4. Add accent-insensitive map search intersecting with existing theme/tour filters. Preserve dynamic loading of Leaflet/MapLibre. Use only approved text for the scroll narrative and vocabulary.
5. Verify desktop/tablet/mobile, keyboard, reduced motion, no-JavaScript reading, data invariants and production build; inspect screenshots and report measurements separately from field Core Web Vitals.

## Implementation

- `components/bento.tsx` supplies the active `BentoGrid` and `BentoCard`: large, tall, standard, horizontal, image and text variants with defined responsive columns.
- Hero uses the existing licensed Tràm Chim photograph and its credit; Next Image supplies responsive sizes and image priority.
- Photographs link back to dossiers containing full rights records. Domains without cleared photos use typographic/graphic treatments rather than invented historical imagery.
- Scroll story: four source-reviewed dossiers (Cần Giờ, Ninh Kiều, Cái Răng floating market and Bình Thủy), normal scrolling, desktop sticky imagery with soft transitions; inline images/text on mobile and without JavaScript. Reduced motion disables transforms.
- Vocabulary retains reviewed definitions, editorial-example labels and original dossier links in a keyboard-operable tab selector. The dictionary retains its existing browsing controls.
- Community memory section describes the actual local draft workflow; no testimonials or invented memories.
- Discovery, collections, dictionary, timelines, sources and tours inherit the same tokens. Article content stays source-linked and constrained for reading.

## Verification

TypeScript, ESLint, all 41 Node tests and the Next.js production build passed on 2026-10-29. The data audit reports 12 domains, 32 public dossiers, 22 drafts and no duplicate records; no database migration or publication status change was applied.

Final browser QA results and deployment identifiers are recorded in `outputs/deploy-status.txt`. Real-user LCP/CLS/INP require production traffic; local measurements do not establish a field Core Web Vitals pass.

Known limitations in the local snapshot requested for deployment: automated axe checks flag overlapping geographic pins (the separate place list supplies equivalent controls). With JavaScript fully disabled, the existing root `app/loading.tsx` streaming boundary leaves the server-rendered page hidden, so the story component's plain HTML fallback does not establish working no-JavaScript navigation for the entire application. This needs a separate rendering change. Local interaction timings also do not establish the requested real-user INP target.
