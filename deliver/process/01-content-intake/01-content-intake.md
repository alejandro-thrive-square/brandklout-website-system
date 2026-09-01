# Workflow: 01 - Content Intake

## Client-Facing Overview
We collect the business information, page content, proof points, offers, and brand inputs needed to plan the website correctly before wireframing begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Send, receive, and normalize the post-signing website-content questionnaire for projects where Deliver is responsible for building the site from scratch. This workflow is separate from Sales discovery: Sales qualifies the project and hands off scope; Deliver collects the detailed content needed to create the actual website.

## Inputs From Sales / Previous Phase
- Signed contract and approved scope.
- Sales handoff package from `sales/process/04-contract-onboarding`.
- Audience notes, offer fit, known content gaps, and any existing client documents.

## Execution Steps
1. Send the website-content questionnaire to the client.
2. Receive the completed questionnaire and any attached source material.
3. Normalize answers into structured page/content notes, open questions, and reusable copy blocks.
4. Confirm that the minimum content required for wireframing is present before passing the package to Wireframe.
5. When the engagement includes a competitive read, **screen the competitor set before scraping it**. Record the candidates, the criteria and the per-candidate evidence in `competitor-screen.csv` and a short selection report. Never state a rejection reason that has not been verified against the live site.
6. **When the client is rebranding or replacing a site, recover the retired one before writing anything.** A practice's own published copy is the best content source there is: it is already approved, already in their voice, and already accurate about their own procedures. See below.

### Recovering a client's retired site

Rebrands routinely destroy the best content the client will ever have. If the old site is gone, assume the copy is recoverable until proven otherwise, and recover it *before* commissioning new writing — on the Stone engagement this turned a thin seven-page build into a full one and produced ~26,000 words of the client's own copy plus 60 of their own FAQ pairs.

Working scripts to copy and adapt: `deliver/brandklout/stone-dental-implant-center/workflows/01-content-intake/.tmp/archive-text/` — `fetch-archive.mjs` (bulk fetch), `refetch-stubs.mjs` (repair pass), `extract-treatments.mjs` (structure the result into JSON).

Five traps, all of which cost time on that engagement:

1. **A 301 on the live domain does not mean the content is gone.** Deep URLs still in Google's index may 404 after a wholesale redirect to a sister site. Go to the archive rather than concluding the copy no longer exists.
2. **`web.archive.org` rate-limits; it does not usually ban.** A hard block that resets every request was gone the next day. Wait a day before building a workaround — a whole session was once spent reading copy off screenshots that could simply have been fetched.
3. **Recent captures may be bot-challenge interstitials.** Cloudflare-style "One moment, please…" pages archive with status 200 at ~5 KB. Asking for the *closest* or *newest* snapshot returns those, not the page. Read the full CDX history and take the **largest** 200 capture — length separates a real page (~140 KB) from an interstitial.
4. **A pinned timestamp returns ~80-byte redirect stubs** wherever the nearest capture is a 301. Detect them by size and refetch those URLs individually.
5. **The template chrome repeats on every page** — nav, footer, and often a testimonial carousel sitting *in the middle* of the content. Cut it at both ends and excise the middle block, or one page's worth of real copy arrives buried in twenty-five copies of the same menu.

Two content judgements to make, not just extraction:

- **Reviews and testimonials carry the old brand's mix.** A cosmetic rebrand inherits mostly non-cosmetic reviews. Select; do not bulk-import.
- **Before/after photography does not transfer.** Consent was given for a site that no longer exists, under a brand that has been retired. Publish only cases the client re-supplies with current written consent. Record this as a launch blocker rather than quietly recovering the images.

### Competitor screening criteria (in priority order)
1. **Catchment overlap** - competes for the same searcher. Weighted highest for local-service clients.
2. **Same lead procedure or service** - leads with the client's highest-value offer, rather than listing it.
3. **Comparable content footprint** - roughly 0.5x to 2x the client's URL count, so differences read as strategy, not scale.
4. **Independent operator** - two domains run by one business are one data point; check street address and suite number, not just branding.
5. **Machine-readable sitemap** - required for a complete rather than sampled crawl.

Rank by criterion 1 first; it decides whether a gap is a gap *for this client*. Name the runner-up and the reason it lost, so the choice can be revisited if the client's growth plan changes. Do not rank on rankings, traffic or backlink estimates unless the engagement actually carries a keyword-tool subscription; an unverifiable number presented as data is worse than no number.

## Offer-Specific Adaptations
- **Development from Scratch**: Required before Wireframe.
- **Figma to Webflow**: Skipped unless the client also needs missing content gathered or rewritten.
- **Migration to Webflow**: Skipped unless redesign or new-page scope requires new content intake.
- **Webflow Improvements & Updates**: Optional when new pages, sections, or copy-heavy requests need structured intake.
- **AI Site with Claude, Vercel & Airtable**: Required unless the signed handoff already includes an approved content package sufficient for Claude wireframing.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate/send questionnaires, parse returned documents, extract structured content blocks, and flag missing answers.
- **Likely integrations**: Google Docs/Drive, OpenAI/Anthropic, ClickUp.

## Output Artifacts
- `deliver/[client-name]/workflows/01-content-intake/.tmp/questionnaire-template.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/client-response/`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/content-intake-summary.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/open-questions.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/gap-analysis/competitor-screen.csv` (when a competitive read is in scope)
- `deliver/[client-name]/workflows/01-content-intake/.tmp/gap-analysis/COMPETITOR-SELECTION.md` (when a competitive read is in scope)
- `deliver/[client-name]/docs/content-intake-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-content-intake-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
