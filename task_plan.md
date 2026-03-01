# Task Plan: Members Directory + Public Member SEO Pages

## Goal
Implement public `/members` and `/members/[username]` pages with shared verification logic, sidebar community growth module, and sitemap coverage without exposing private user email data.

## Current Phase
Complete

## Phases
### Phase 1: Requirements & Discovery
- [x] Confirm required routes, SEO behavior, and verification logic reuse.
- [x] Identify existing avatar, template, sidebar, navbar, and sitemap implementation points.
- [x] Confirm privacy constraints and existing DB fields.
- **Status:** complete

### Phase 2: Shared Domain + Data Layer
- [x] Add centralized verification helper.
- [x] Add members read service + public member types.
- [x] Extend template read service for published templates by seller.
- **Status:** complete

### Phase 3: UI + Routing
- [x] Add `/members` page with search/pagination and SEO metadata.
- [x] Add `/members/[username]` public profile page with verification checklist and templates.
- [x] Add reusable member avatar component and integrate in members pages.
- [x] Add community block to extra sidebar.
- [x] Add navbar `MEMBERS` link.
- **Status:** complete

### Phase 4: SEO + Sitemap + Validation
- [x] Add members URLs to sitemap.
- [x] Run type/lint checks.
- [x] Validate no email leak in public types/render paths.
- **Status:** complete

### Phase 5: Delivery
- [x] Summarize file changes and test results.
- **Status:** complete

## Key Questions
1. Should all users be public members? (Resolved: yes)
2. Should users with no templates still have public profile pages? (Resolved: yes)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Members scope includes all users | Matches “growing community” goal and user instruction |
| Verification requires Twitter/X + Stripe | Explicit user requirement and existing app behavior |
| Public member types exclude email | Prevents private data leakage |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Next.js build fails in `ascii-phone-showcase.tsx` due missing `three` type declarations | 1 | Confirmed unrelated pre-existing issue; lint passes and members changes compile at source level |
|       | 1       |            |
