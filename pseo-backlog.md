# pSEO Backlog: Claws.supply Next Phase

## Goal
Expand scalable, indexable SEO surfaces beyond current category/template/member/docs pages while avoiding thin-content risk.

## Cluster 1: Template Use-Case Pages
- URL pattern: `/openclaw/use-cases/{useCaseSlug}`
- Example intents:
  - `seo agent template`
  - `customer support ai agent template`
  - `sales prospecting automation template`
- Page blocks:
  - Use-case summary and outcome framing
  - Best-fit template shortlist (real listings only)
  - Selection criteria table (price, recency, downloads, verification)
  - Safety and setup notes with docs links
- Guardrails:
  - Require at least 5 templates in pool before indexing.
  - `noindex` when below threshold.
  - Canonical self URL only for fully populated pages.

## Cluster 2: Template Comparison Pages
- URL pattern: `/openclaw/compare/{slugA}-vs-{slugB}`
- Example intents:
  - `{templateA} vs {templateB}`
  - `best openclaw template for {job}`
- Page blocks:
  - Side-by-side feature and positioning matrix
  - Price/rating/download diffs
  - Best-for recommendations by scenario
  - Seller trust and freshness comparison
- Guardrails:
  - Generate only for high-signal pairs (same category, minimum download floor).
  - Exclude near-duplicate pair inversions via canonical ordering.
  - Add canonical to ordered slug pair only.

## Cluster 3: Seller Topic Hubs
- URL pattern: `/members/{username}/topics/{topicSlug}`
- Example intents:
  - `{seller} marketing templates`
  - `{seller} openclaw templates`
- Page blocks:
  - Seller authority context + verification state
  - Seller templates filtered by topic with stats
  - Internal links to member profile and template pages
- Guardrails:
  - Index only when seller has 3+ published templates in topic.
  - `noindex` low-volume topic pages.
  - Canonical to parent member page when below threshold.

## Canonical and Indexing Policy
- Index only clean, deterministic URLs.
- `noindex` all parameterized variants unless explicitly approved for search demand.
- One canonical URL per logical document.
- Keep utility/account URLs noindex.

## Data and Quality Requirements
- Every indexed pSEO page must include:
  - Unique intro content aligned with search intent
  - Real marketplace data slices (not placeholder text)
  - At least one decision-support element (comparison table, rubric, or trust breakdown)
  - Internal links to adjacent pages in same cluster

## Rollout Plan
1. Implement cluster 1 with threshold-based indexing controls.
2. Measure impressions/clicks and index coverage in Search Console.
3. Add cluster 2 after duplicate-content checks pass.
4. Add cluster 3 with strict quality gates.

## Success Metrics
- Increase non-brand organic landing pages indexed.
- Improve impressions and clicks on template-intent queries.
- Maintain low soft-404 and duplicate-title rates.
- Maintain stable crawl stats without spike in excluded URLs.
