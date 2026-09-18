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

## Offer-Specific Adaptations
- **Development from Scratch**: Required before Wireframe.
- **Figma to Webflow**: Skipped unless the client also needs missing content gathered or rewritten.
- **Migration to Webflow**: Skipped unless redesign or new-page scope requires new content intake.
- **Webflow Improvements & Updates**: Optional when new pages, sections, or copy-heavy requests need structured intake.
- **AI Site with Claude, Vercel & Airtable**: Required unless the signed handoff already includes an approved content package sufficient for Claude wireframing.

## Technical Setup
- **Executor status**: `01-content-intake.py` remains a placeholder. Three Node executors were written for this client on 2026-08-20 and are reusable for any intake that starts from an existing live site:

| Script | Does | Run as |
| :--- | :--- | :--- |
| `extract_assets.mjs` | Pulls every asset reference out of captured HTML: `img src`, **`srcset`**, `<source>`, `video src`/`poster`, `url()` in inline and block CSS, icon `<link>`s, `og:image`, escaped URLs inside Webflow JSON attributes, and embeds found in `href`/`data-*` as well as `iframe src` | `node extract_assets.mjs <html-dir> <out.json>` |
| `download_assets.mjs` | Downloads the media. Groups Webflow's responsive families (`-p-500`, `-p-800`, original) and keeps the **largest** of each, recording the whole family so the build regenerates smaller sizes instead of upscaling. Emits `asset-catalogue.json` | `node download_assets.mjs <out-dir> <assets.json...>` |
| `capture_rendered.mjs` | Drives the live page under CDP, scrolls it so lazy widgets boot, and keeps both the rendered DOM and the **JSON those widgets fetched**. This is how third-party content that is absent from the static HTML gets captured | `node capture_rendered.mjs <url> <out-dir> [settleMs]` |

### Traps this phase proved

- **A URL list is not the deliverable.** Download the files. `<img src>` alone misses `srcset`, CSS backgrounds, posters and video.
- **Third-party review, booking and form widgets render nothing into the static HTML.** The reviews on this client's pages exist only after Elfsight boots. `capture_rendered.mjs` gets them, and its network capture yields the authoritative rating and count straight from the source, which settles copy arguments with data instead of a guess.
- **Filter tracking pixels out of the asset catalogue.** A Meta Pixel `noscript` beacon is an `<img>` and downloads as a 0-byte extensionless file.
- **`*.avif` was missing from the repo's media gitignore rules** and was added on 2026-08-20. Check that any new format the site serves is actually covered before committing.

- **Likely integrations**: Google Docs/Drive, OpenAI/Anthropic, ClickUp.

## Output Artifacts
- `deliver/[client-name]/workflows/01-content-intake/.tmp/questionnaire-template.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/client-response/`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/content-intake-summary.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/open-questions.md`
- `deliver/[client-name]/docs/content-intake-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-content-intake-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
