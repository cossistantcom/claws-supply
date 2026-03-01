# Findings & Decisions

## Requirements
- Build `/members` directory page and `/members/[username]` SEO pages.
- Display name, bio, verification status, and facehash fallback avatar when no image.
- Add centralized verification helper used by profile settings and public/template read paths.
- Show member’s published templates on their public page.
- Update right sidebar with joined-in-last-24h count and 10 latest member avatars.
- Add `MEMBERS` navbar link.
- Add members pages to sitemap.
- Never leak email in public APIs/types/components.

## Research Findings
- Existing verification logic duplicated in profile settings and template read mapping.
- Existing sidebar currently only renders ad-related content.
- Existing template card/grid can be reused for member published templates section.
- Current routes helper lacks members path builders.
- No existing members read service; must query `user` table directly.
- `user` schema already has required public member fields: `username`, `name`, `bio`, `image`, `createdAt`, `xAccountId`, `stripeVerified`.
- `sitemap.ts` already supports mixed dynamic entries and was straightforward to extend for members.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| New `lib/members/read-service.ts` with explicit select fields | Centralizes safe public member data access and avoids email leak |
| New `lib/profile/verification.ts` helper | Single source of truth for verified status across app |
| New `components/members/member-avatar.tsx` | Consistent facehash fallback in all public member surfaces |
| Reuse `buildSeoMetadata` for member pages | Keep canonical/robots handling consistent |
| Add seller-scoped published template listing to existing template read-service | Reuses current template row mapping and avoids duplicated template query logic |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Existing dirty git state unrelated to task | Preserved as-is; only modify relevant files |
| Build in sandbox fails due Turbopack port binding restriction | Re-ran build with escalated permissions |
| Build then fails on pre-existing `three` declaration error in `ascii-phone-showcase.tsx` | Logged as unrelated to members changes; did not alter unrelated rendering subsystem |

## Resources
- `/Users/anthonyriera/code/hourglass/apps/web/lib/templates/read-service.ts`
- `/Users/anthonyriera/code/hourglass/apps/web/components/profile/profile-settings-page.tsx`
- `/Users/anthonyriera/code/hourglass/apps/web/components/extra-sidebar.tsx`
- `/Users/anthonyriera/code/hourglass/apps/web/app/sitemap.ts`

## Visual/Browser Findings
- User-provided screenshot shows dark multi-column member cards with search, clear community positioning, and join CTA.
