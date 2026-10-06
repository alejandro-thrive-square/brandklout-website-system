# Scenario 2 · 03 QA and Publish

## Purpose
Prove the change works on the published staging page, then ship it to production without shipping
anything else. A publish ships the whole draft, so this step decides between:
- a staging publish for review;
- a production publish on the user's go-ahead.

## Inputs
- The change on the staging draft (step 02), and `change-list.md`.
- The baseline `publish/status` from step 01.

## Checklist
- [ ] `publish/status` re-read: the draft differs from published only by our change
- [ ] Staging published and gated, controls clicked, in a real browser
- [ ] Production changed and published only after an explicit go-ahead in this conversation
- [ ] Post-publish checks on production
- [ ] Requester answered (after confirmation), runbook run written, standing runbook updated, committed

## Steps
1. **Re-check what a publish would ship.** Run `node tools/instatic-api-sync/insta-api.mjs status`
   on staging. If
   `draftMatchesPublished` was already false in the step 01 baseline, the other work ships too:
   tell the user before publishing.
2. **Publish staging.** `node tools/instatic-api-sync/insta-api.mjs publish` with
   `INSTATIC_BASE_URL` set to the staging host.
3. **Gate staging.** From the client's scenario copy, with `--base` on the staging host where the
   gate takes one:
   - `tools/instatic-site/gates/verify-live.mjs` (must end `FAIL  none`), `check-pages.mjs --base`,
     `click-controls.mjs --base`, `facts-sweep.mjs`, `cross-client-grep.mjs --base`;
   - every GHL form id on the touched pages: `node tools/termly-ghl-consent/gates/check-ghl-form.mjs <ids>`.
     Save-and-exit must be off, and the form needs all 11 consent fields. Both are fixed in GHL;
   - every page with a GHL embed: `tools/ghl-forms/check-embed.mjs <origin> [--page /ads-…]` must print `ok` (no `loading="lazy"` on a GHL iframe: the form never appears in Firefox, 2026-10-06);
   - consent: `node tools/termly-ghl-consent/consent-kit.mjs check <urls> --termly-proxy > <workdir>/consent.txt 2>&1`.
     Before a choice nothing tagged fires. After Accept no `script[type="text/plain"][data-categories]`
     is left;
   - DNI, where touched: `tools/termly-ghl-consent/gates/dni-proof.mjs`. Each run claims a real pool
     number, so keep runs few.
4. **Drive the page in a real browser** for what raw HTML cannot show:
   - Click every control you touched (FAQ, slider, menu, CTA) and assert the state change.
   - Check responsive widths 1440, 991, 767 and 479. Block the Sienna widget when measuring.
   - For BugHerd items, re-shoot in WebKit at 1512x735. A site-wide item is checked on every page
     that carries the element (`deliver/docs/BUGHERD.md` §4), not only the pinned page.
   - Forms: GHL forms behind Turnstile render blank under automation and on localhost. Prove the
     form on the deployed domain.
   - Send the staging links to the user or requester for approval.
5. **Production.** On the user's go-ahead, apply the same change to production (step 02 with the
   production `INSTATIC_BASE_URL`), read `publish/status`, publish, and repeat the checks from steps
   3 and 4 that matter for this change on the production domain.
6. **Close.**
   - Draft the reply to the Asana or BugHerd task. Post it and mark the task done only after the user
     confirms.
   - Add the run to this step's `output/RUNBOOK.md` with Done (and SHAs), Next and Gotchas. Add its
     row to the client `RUNBOOK.md` and update its standing state.
   - Commit on the client branch.

## Conditionals
- If a control "does nothing" on live, then write the click test first. Markup, console,
  computed-style and pixel gates all passed on dead arrows for two weeks on another client.
- If the pool swaps nothing on pages without an Embed block, then `connect-src` is missing
  `services.leadconnectorhq.com`: add it to the Embed Origins `connectOrigins`.
- If a script works from curl but 503s in the browser, then the CSP (`script-src 'self'`) blocked
  it; self-host it or add it through the Embed Origins settings.
- If tagged scripts stay `text/plain` after Accept, then consent is broken in the other direction.
  A gate that checks only "nothing fires before consent" passes it.
- If Google Ads says "Destination not crawlable", then fetch the page as AdsBot (desktop and mobile),
  and check DNS, robots and noindex before touching the page.

## Do / Don't
- Do treat the staging publish as normal and the production publish as the user's decision.
- Do verify in a real browser DOM for anything injected at runtime: DNI, Termly, site scripts, embeds.
- Do check consent in both directions: before the choice, and after Accept.
- Don't clear cookies per page when testing DNI. Every fresh visitor burns a real pool number.
- Don't trust a green gate you have not seen fail. Gates with hardcoded page lists, raw-HTML gates and
  gates that never click all reported clean on broken pages.
- Don't post in Asana or BugHerd, or mark tasks done, without the user's confirmation.

## Tools
- `tools/instatic-api-sync/insta-api.mjs publish`, `publish/status`.
- `tools/instatic-site/gates/`: `verify-live`, `check-pages`, `click-controls`, `facts-sweep`, `cross-client-grep`.
- `tools/termly-ghl-consent/gates/check-ghl-form.mjs`, `gates/dni-proof.mjs`, `consent-kit.mjs check`.

## Outputs
- `<workdir>/gates/*.log`, `<workdir>/consent.txt`
- The run in this step's `output/RUNBOOK.md`
- `deliver/brandklout/<client>/RUNBOOK.md`, updated

## Evidence
- `tools/instatic-site/README.md` (gates, step map).
- `tools/termly-ghl-consent/termly-ghl-consent.md` (consent checks, DNI).
- `.claude/runbook/2026-09-22-termly-consent-rolled-out-to-29-sites.md`.

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
