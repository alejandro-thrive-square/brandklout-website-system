# 2026-09-18 - Redesigned ad funnels built locally for staging

Brandklout needs two separate tracks for Mason Park. Production keeps the exact Webflow-derived
paid pages so ads can run now. Staging needs the same six routes rebuilt in the new Mason Park
design system while the client reviews the larger site.

## Done

Six redesigned local routes now exist under `workflows/09-static-rebuild/home/`:

| Campaign | Landing | Consultation | Thank you |
| :--- | :--- | :--- | :--- |
| Invisalign | `/invisalign` | `/invisalign-consultation` | `/invisalign-thank-you` |
| $189 New Patient | `/new-patient-special` | `/new-patient-special-consultation` | `/new-patient-thank-you` |

The four lead pages are eight-chapter paid journeys derived from the reviewed staging service and
new-patient pages. They inherit the established typography, photography, chapter motion, pinned
path, proof, FAQ, invitation and reduced-motion behavior. The paid layer adds a focused header, a
persistent phone/form rail, a campaign form chapter, short offer and proof pins, and campaign copy.
Both thank-you pages are campaign-specific and contain no form.

The exact campaign mapping is preserved from workflow 10:

- Invisalign: `YbX91GhEDKkCN4GH4gka`
- $189 New Patient: `AFu5BpJpMjgSnSf8yybc`

`place-ad-embeds.mjs` runs after Instatic conversion. It replaces the four placeholders with
`brandklout.embed-origins` modules and adds the existing GHL number-pool scripts to all six pages.
It refuses crossed mappings or missing counts and does not carry the old Elfsight widget into the
redesign.

Implementation commit: `9b2d0ac` (`feat(mason-park): redesign six ad funnel pages for staging`).

## Verified

- `check.mjs`: six pages, 0 errors, 0 warnings.
- `journey-audit.mjs`: all four lead pages pass with eight chapters, three pins and 21 scrub hooks.
- `probe-ad-journey.mjs`: offer and proof pins active at mid-range on all four pages; treatment
  tracks change at 25, 50 and 75 percent on all four.
- `qa-ad-pages.mjs`: 36 renders, six pages at 360, 390, 768, 1024, 1440 and 1920, 0 problems.
- Canary inspected at 1440 and 390. The form card, fixed CTA rail and mobile hero are coherent.
- `to-instatic.mjs --media instatic-media-map.json`: all six routes export as body-only page JSON
  with the expected four form placeholders.
- No rendered em dash copy on the six pages.

## Current state

Local only. Neither `staging.masonparkdental.com` nor production was written or published. The live
production pages in workflow 10 remain unchanged.

## Next

1. Get an explicit staging-publish confirmation in the active conversation.
2. Back up and inventory staging.
3. Run the documented export, converter and import sequence, including `place-ad-embeds.mjs` after
   `apply-image-alt.mjs`.
4. Re-import the site script bundle after the six page rows exist, because script scope is a page-id
   snapshot.
5. Publish staging and verify all six URLs, both form IDs, form loading, redirects to the correct
   thank-you pages, call-number swapping, mobile CTA reachability and CSP.
6. Keep production untouched until the client approves the staging redesign and authorizes launch.

## Gotchas

- The production and staging instances share scripts but not intent. Always pass
  `INSTATIC_BASE_URL=https://staging.masonparkdental.com`; the worktree `.env` defaults to
  production.
- Four pages take forms; two thank-you pages must never contain one.
- Both campaigns use different GHL forms. A crossed mapping silently puts leads into the wrong
  pipeline.
- Local HTML shows a branded placeholder. The real iframe exists only after the converted node is
  replaced by the embed plugin module.
- The two consultation routes intentionally use the same full high-trust arc as their landing
  routes, with a consultation-specific arrival. They are not the old Webflow visual design.
- Production remains the exact Webflow port for active ads. Do not import this staging bundle to
  production while approval is pending.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The implementation is
commit `9b2d0ac`; this run file, the index and the standing runbook are committed separately.

## Infrastructure

The local checks ran on Windows. The Node scripts use platform-neutral filesystem APIs and the
existing Chrome path convention; the import workflow remains compatible with Ubuntu 24.04 LTS on
the Hostinger VPS.

