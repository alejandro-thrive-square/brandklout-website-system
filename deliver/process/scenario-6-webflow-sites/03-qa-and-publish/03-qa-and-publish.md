# Scenario 6 · 03 QA and Publish

## Purpose
Prove the change works on the published page, then ship it without shipping anything else.
On Webflow every publish is whole-site, so this step decides between three results:
- a staging publish for review;
- applied but unpublished;
- a live publish on the user's go-ahead.

## Inputs
- The change in the site's draft (step 02), and `change-list.md`.
- `publish-state.txt` from step 01 (the baseline pending set).
- The site's custom domains and staging host (`<shortName>.webflow.io`) from `wf-publish.mjs state`.

## Checklist
- [ ] Pre-publish gates pass on every touched page (tree audit, embeds, forms, lint)
- [ ] `wf-publish.mjs state` re-run: the pending set is only our pages, or the user knows it is not
- [ ] Staging publish done and verified in a real browser
- [ ] Live publish only after an explicit go-ahead in this conversation, with `customDomains` named
- [ ] Post-publish checks on a cache MISS
- [ ] Controls clicked, numbers swapped, forms rendered, consent checked both ways (where touched)
- [ ] Requester answered (after confirmation), runbook run written, standing runbook updated, committed

## Steps
1. **Pre-publish gates** (Designer draft):
   - `node wf-tree-audit.mjs --site <id> --pages <touched> --foreign "<other clients>" --phone <digits> > <workdir>/tree-audit.log 2>&1`.
     It must PASS. Read the warnings.
   - Every GHL form id on the touched pages: `node tools/termly-ghl-consent/gates/check-ghl-form.mjs --standard --origin <prod> --legal "<legal name>" --location <id> <ids>`
     (`--landing` on ad pages) and `site-style.mjs --compare` ([ghl-forms](../../tools/ghl-forms/README.md)).
     Save-and-exit off, all 11 consent fields, labels, captcha above Submit, `no-shift.css`. All of
     it is fixed in GHL through Codex, not on the site.
   - A reviews widget on the touched pages: `tools/elfsight-reviews/check-widget.mjs <widgetId> --render <page>`
     on staging and again live.
   - A registered script's hosted copy must be identical (`wf-register-script.mjs` checks it).
2. **Re-check what a publish would ship.**
   Run `node wf-publish.mjs state --site <id> > <workdir>/publish-state-after.txt 2>&1`.
   Compare it with the baseline. The PENDING list must be your pages, plus pages that were already
   pending. The first kind ships with your change; the second kind is someone else's work.
3. **Staging publish (default review).**
   - Run `node wf-publish.mjs staging --site <id> --yes`. It republishes the whole site to
     `<shortName>.webflow.io` only; custom domains are untouched.
   - This is safe and is how every Brandklout change was reviewed.
   - Skip it only when the client has no staging traffic concern and the user says so.
4. **Verify staging.**
   - Run `node live-page-check.mjs <staging urls> --foreign "<other clients>" --phone <digits>`.
   - Then drive the page in a real browser for what raw HTML cannot show:
     - Click every control you touched (FAQ, slider, menu, CTA) and assert the state change.
     - Check responsive widths 1440, 991, 767 and 479. Block the Sienna widget when measuring.
     - For BugHerd items, re-shoot in WebKit at 1512x735. A site-wide item is checked on every page
       that carries the element (`deliver/docs/BUGHERD.md` §4), not only the pinned page.
     - Pages with scroll motion: `node scripts/staging-verify.mjs --url <staging url> --baseline <local package>`.
     - Consent: `node tools/termly-ghl-consent/consent-kit.mjs check <urls> --termly-proxy > <workdir>/consent.txt 2>&1`.
       Before a choice nothing tagged fires. After Accept no `script[type="text/plain"][data-categories]`
       is left. Clicking the preferences control opens Termly's `<dialog>`.
     - DNI: one visitor, banner untouched. Count the assign-number 201s, confirm the text and `tel:`
       numbers both swap, and confirm a second page reuses the number. Each run claims a real pool
       number, so keep runs few.
     - Forms: GHL forms behind Turnstile render blank under automation and on localhost. Prove the
       form on the deployed domain, and compare with the client's own live form.
   - Send the staging links to the user or requester for approval.
5. **Decide the release.**
   - Nothing else pending, and the user says go: publish live (step 6).
   - Other work pending: leave the change **applied but unpublished**. It ships with the team's next
     publish. Tell the user exactly which pages are pending and whose they look like. Record it in
     the runbook.
   - The user explicitly accepts shipping the pending work: publish with `--ship-pending` and say so
     in the runbook.
6. **Live publish.**
   Run `node wf-publish.mjs live --site <id> --domains <every custom domain of this site> --expect <our page ids> --yes`.
   - List every custom domain the client uses (apex and `www`). A domain left out keeps serving the
     old build.
   - On a site that carries a second brand, the user decides whether that brand's domains are
     published too. Legacy is staging-only until `caldentalpasadena.com` is explained.
   - Single-page publishing is Enterprise-only. Do not try `pageId`.
7. **Post-publish checks.**
   - `publish_site` returns before the site finishes compiling, and Cloudflare and the Webflow CDN
     serve the old page for minutes.
   - Run `live-page-check.mjs` on the live URLs. It cache-busts and reports `cf-cache-status`. Only
     believe a failure seen on a MISS.
   - Repeat the browser checks from step 4 that matter for this change on the live domain.
   - A Termly check on this workstation needs `--termly-proxy`: NordVPN blanks `app.termly.io` in Chrome.
8. **Close.**
   - Draft the reply to the Asana or BugHerd task. Post it and mark the task done only after the user
     confirms.
   - Add the run to this step's `output/RUNBOOK.md` with Done (and SHAs), Next and Gotchas. Add its
     row to the client `RUNBOOK.md` and update its standing state: the live state,
     anything applied but unpublished, and the site scripts with their versions.
   - Commit on the client branch.

## Conditionals
- If `wf-publish.mjs state` shows pages you did not touch, then do not publish live. Leave the
  change applied but unpublished, and tell the user.
- If the user asks for a live publish anyway, then list the foreign pending pages in the
  conversation first, and use `--ship-pending` only after they confirm.
- If a check fails right after publishing with `cf-cache-status: HIT` and an `age` above 0, then it
  is the edge. Re-check on a MISS before changing anything.
- If a registered footer script does not run on one site, then look for malformed page markup (an
  unclosed `<style>` in page custom code). Move the script to the header. Check the parsed DOM,
  because the served HTML still contains the tag.
- If the Termly banner looks huge or broken, then check the site's global `img`/`svg`/`button`
  rules. The banner renders in the page, not in an iframe. `BrandkloutConsentPreferences` 1.3.0 or
  newer guards images.
- If a tracker still fires before consent and it is not tagged on the page, then it is fired by GTM
  (Omnia, Legacy). The fix is inside the GTM container.
- If tagged scripts stay `text/plain` after Accept, then consent is broken in the other direction (the
  Grand Mission ahrefs defect). A gate that checks only "nothing fires before consent" passes it.
- If a control "does nothing" on live, then write the click test first. Markup, console,
  computed-style and pixel gates all passed on dead arrows for two weeks on another client.
- If Google Ads says "Destination not crawlable", then fetch the page as AdsBot (desktop and mobile),
  and check DNS, robots and noindex before touching the page.
- If the change is on Instatic, then this is the wrong scenario: use `scenario-2-updates-expansions`.
- If the change is an ads combo (step 02 K), then also run Scenario 3 step 03's gates against its
  `combo.json` on staging and on the live domain.

## Do / Don't
- Do treat the staging publish as normal and the live publish as the user's decision.
- Do name `customDomains` explicitly on every live publish. Never rely on a default.
- Do verify in a real browser DOM for anything injected at runtime: DNI, Termly, registered scripts,
  embeds.
- Do check consent in both directions: before the choice, and after Accept.
- Do record "applied but unpublished" in the standing runbook. The next person to publish ships it.
- Don't publish over pending Designer work you did not make.
- Don't clear cookies per page when testing DNI. Every fresh visitor burns a real pool number.
- Don't trust a green gate you have not seen fail. Gates with hardcoded page lists, raw-HTML gates and
  gates that never click all reported clean on broken pages.
- Don't post in Asana or BugHerd, or mark tasks done, without the user's confirmation.

## Tools
- `tools/webflow-build/wf-tree-audit.mjs`: pre-publish Designer audit.
- `tools/termly-ghl-consent/gates/check-ghl-form.mjs <formId>`: save-and-exit flag and consent fields.
- `tools/webflow-build/wf-publish.mjs state|staging|live`: pending set and guarded publishes.
- `tools/webflow-build/live-page-check.mjs <urls>`: served-HTML first pass with cache status.
- `scripts/staging-verify.mjs --url <u> --baseline <dir>`: motion pins, 404s, console.
- `tools/termly-ghl-consent/consent-kit.mjs check <urls> --termly-proxy`: consent state and bridge version.

## Outputs
- `<workdir>/tree-audit.log`, `<workdir>/publish-state-after.txt`, `<workdir>/live-check.log`, `<workdir>/consent.txt`
- The run in this step's `output/RUNBOOK.md`
- `deliver/brandklout/<client>/RUNBOOK.md`, updated

## Evidence
- bk-stone-dental `docs/runbook/2026-09-03-this-session-third-session-em-dash-pass.md`: gotcha 4
  (full-site publish to four domains, go-ahead), gotcha 16 (staging-only publish verified), gotcha 21
  (stale CDN).
- bk-stone-dental `docs/runbook/2026-09-16-ads-destination-not-crawlable-check.md`.
- bk-arvada commit 1052fe9b (re-theme left unpublished: live behind staging); `output/v2-native/STATUS.md`
  (every publish subdomain-only). Live state on 2026-09-23: 17 pages pending since 2026-09-15.
- bk-grand-mission `output/publish-staging.mjs`, commit 9c4237a9 (publish returns before compile).
- bk-oceanic-dental `docs/runbook/2026-09-22-contact-pages-forms-dni-consent.md`: publish after
  confirming only our pages changed; DNI driven test; consent fields missing.
- bk-livewell `docs/runbook/2026-09-22b-cookie-banner-oversized-by-a-global-img-rule.md`.
- `.claude/runbook/2026-09-22-termly-consent-rolled-out-to-29-sites.md`: applied but unpublished on
  11 sites; footer scripts swallowed on South Bay and AVA.
- `deliver/docs/mcp-access.md`: second-brand domain cautions (Legacy, Stone).

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
