# Ads Landing Pages · 03 QA and Launch

## Purpose
Prove each combo works on the deployed domain before Brandklout points ad spend at it: the form
in the hero loads and fills its card, it redirects to the campaign's thank-you page, the
conversion can fire there, the pages are noindex, the phone swaps, consent holds, and no ad
blocker can hide anything. Then publish to production and hand the URLs over.

## Inputs
- `deliver/brandklout/<client>/scenario-3-ads-landing-pages/01-campaign-intake/output/combo.json` (with `origin` set to the
  host under test).
- The combo published on staging (step 02).
- Chrome installed (`CHROME_PATH` if not the default Windows path). Node 22 or later.

## Checklist
- [ ] `verify-combo-live.mjs` green on staging, then on production.
- [ ] `check-ghl-form.mjs --combo` green: every form redirects to its own thank-you page.
- [ ] `verify-form.mjs` green at 1440 and 390: one form, right id, fills its card, not clipped.
- [ ] `probe-adblock.mjs --combo` green on a filtering network.
- [ ] `check-conversion.mjs` read, and the conversion method confirmed with the Ads owner.
- [ ] `dni-proof.mjs` shows a swap on one page (production only, one visitor).
- [ ] `check-pool-scope.mjs` green when pools are scoped per page.
- [ ] One real test lead end to end, by a human, on the production domain.
- [ ] Visual pass at 1440, 1280, 991, 767, 479 and 390; the reviewer's Safari 1512x735 too.
- [ ] Runbook written, URLs sent to Brandklout.

## Steps
All commands run from this step folder (the client's copy of `03-qa-and-launch/`) (or with that path
prefixed). Redirect output to a file; never pipe a Node fetch script on Windows.

1. **Static gate, staging.**
   `node verify-combo-live.mjs --combo <combo.json> --origin https://staging.<domain> > output/verify-combo.log 2>&1`
   Checks, per page: 200 for a browser and for AdsBot-Google with `?gclid=`; noindex (meta, or
   the Instatic seo-head route); absent from `/sitemap.xml`; the campaign's form on landing and
   consultation, no form and a `tel:` link on thank-you; landing links to its consultation page;
   no `ad`-named class or id; every manifest tag present; phone in a swappable format. Per form:
   redirect to the production thank-you URL, save-and-exit off.
2. **Forms.** `node tools/termly-ghl-consent/gates/check-ghl-form.mjs --combo <combo.json> > output/ghl-forms.log 2>&1`. A failure
   here is fixed in GHL, not on the site: we change the form through Codex, one small saved step per
   run, then rerun the gate (step 3 of `01-campaign-intake.md`; since 2026-10-04). Then the embeds on every combo page: `tools/ghl-forms/check-embed.mjs <origin> --page <each combo path>` must print `ok` (no `loading="lazy"` on a GHL iframe: the form never appears in Firefox, 2026-10-06).
3. **Form in the hero, rendered.**
   `node verify-form.mjs --combo <combo.json> --origin https://staging.<domain> --widths 1440,390 > output/verify-form.log 2>&1`
   It waits 14 s per page for the frame to grow. It asserts structure, size and clipping, not
   visibility: behind Cloudflare Turnstile the form stays invisible in any automated browser and
   on localhost (error 600010), including the client's own live forms. A person on the real
   domain is the only proof the form shows.
4. **Ad blockers.** `node probe-adblock.mjs --combo <combo.json> --origin … > output/adblock.log 2>&1`.
   Run it on this workstation (NordVPN Threat Protection is a filtering network). If it reports no
   foreign sheet, the network is not filtering and the result proves less; the name check in step
   1 still holds.
5. **Conversion.** `node check-conversion.mjs --combo <combo.json> > output/conversion.log 2>&1`.
   It lists the GTM, Google Ads (`AW-`) and GA4 (`G-`) ids reaching each thank-you page and
   whether the thank-you path is named in the container. "GA4 only" means the conversion must be a
   GA4 key event imported into Google Ads (Livewell today). Confirm with the Ads owner and write
   the answer into `combo.json` `conversion`.
6. **DNI.** Production only. Staging must never run the pools or real GTM (a staging clone burns
   pool numbers and pollutes data): guard those tags by host. **First read the pool in GoHighLevel**
   (Settings › Phone Numbers › Number Pools, through Codex): which number it swaps. The ad pages
   must SHOW that number in a format the pool matches. West LA's pool swapped the main line while
   the ads showed the new-patient line, so the installed pool would have swapped nothing
   (2026-10-07; the client chose to show the main line). On Instatic the pool goes in as an
   embed-origins `siteScripts` line scoped `#pages=<prefix>*` (1.8.0+; upgrade with
   `plugins.mjs rollout` first), with `services.leadconnectorhq.com` and `services.msgsndr.com` in
   `connectOrigins`. Walk as one visitor:
   `node tools/termly-ghl-consent/gates/dni-proof.mjs --relay --combo <combo.json> > output/dni.log 2>&1`. Use `--accept` if the
   client consent-holds the pools. Same number across pages is correct sticky DNI. Never clear
   cookies between pages. Then `node check-pool-scope.mjs --combo <combo.json> > output/pool-scope.log 2>&1`
   when pools are scoped per office or per page.
7. **Consent.** Termly banner shows on first visit, the site's preferences link works, GHL forms
   receive the `privacy_*` fields (the form's field count is printed by `check-ghl-form.mjs`).
   Follow `tools/termly-ghl-consent` for the full check.
8. **Visual pass.** Screenshot each page at the house breakpoints and at 390. Walk the scroll in
   steps so reveals fire. Check: the hero form fills its card, no box clipped, before and after
   sliders drag, FAQ toggles, films play, the phone and address are right for the office.
   "Box isn't aligned" on bordered cards is usually a stagger reveal mid-flight.
9. **Human test lead.** One person, real browser, production domain: submit the landing-page
   form with test details marked TEST, land on the thank-you page, confirm the lead in GHL and the
   conversion in Google Ads or Tag Assistant. Tell Brandklout to delete the test lead.
10. **Production.** Publish, then re-run steps 1 to 6 with `--origin` set to production.
    Instatic: check `publish/status` before publishing so nothing unexpected rides along. Webflow:
    publish through Scenario 6 step 03; know which domains it reaches.
11. **Old routes.** If ads previously pointed at root slugs, 301 them to the nested pages
    (Webflow: 301 redirects in site settings; Instatic: the Cloudflare Worker from scenario 1).
    Ask Brandklout to update the ads' final URLs anyway.
12. **Hand over.** Send Brandklout the three URLs per campaign, the form ids, and anything they
    must change in GHL or Google Ads. Write the runbook.

## Conditionals
- If the form shows blank in automation, then prove it on the deployed domain; never debug it
  from localhost.
- If the iframe sits at 300px in a wider card, then the slot's placeholder CSS is on the Embed
  block: scope it to `:not(.wz-embed)`.
- If an element computes `position:absolute` on the live page only, then an ad blocker hit a class
  name. Rename it `lp-*` and republish.
- If Google Ads flags "Destination not crawlable" while AdsBot gets 200, then check the ad's final
  URL, tracking template and suffix, check for unpublished pages, then appeal (Stone Dental).
- If the pool swaps nothing on pages without an Embed block (Instatic), then `connect-src` is
  missing `services.leadconnectorhq.com`.
- If the phone does not swap on one page, then look for a spaced, nbsp or en dash copy of it.
- If a visitor sees "Submission in progress", then save-and-exit is on in GHL.
- If the site uses Webflow and a script embed does nothing in preview, then register it as a page
  script.

## Do / Don't
- Do run every gate from `combo.json`. A hardcoded page list goes blind the day a campaign is added.
- Do run browser gates one at a time, in the foreground.
- Do measure an embed against its clipping ancestor, not its own wrapper.
- Don't clear cookies between pages in a DNI test.
- Don't run pools or real GTM on staging.
- Don't call a combo done until a human test lead reached the thank-you page.

## Tools
- `scripts/verify-combo-live.mjs --combo c.json [--origin …]`: fetch-only gate for every page and form.
- `tools/termly-ghl-consent/gates/check-ghl-form.mjs --combo c.json`: form redirect, save-and-exit and the 11 consent fields.
- `scripts/verify-form.mjs --combo c.json [--widths 1440,390]`: rendered form size, id, clipping, CSP.
- `scripts/probe-adblock.mjs --combo c.json`: cosmetic filter hits over CDP.
- `scripts/check-conversion.mjs --combo c.json`: Google tags reaching each thank-you page.
- `tools/termly-ghl-consent/gates/dni-proof.mjs --relay --combo c.json`: proves the number pool swaps (production).
- `scripts/check-pool-scope.mjs --combo c.json`: each URL has exactly the pools it should.
- `tools/termly-ghl-consent/`: consent kit and checks.

## Outputs
- `deliver/brandklout/<client>/scenario-3-ads-landing-pages/<step>/output/*.log` (gate logs, committed when small).
- The run in this step's `output/RUNBOOK.md`, its row in the client `RUNBOOK.md` and a refreshed
  standing state there.

## Evidence
- bk-dr-nahlah / `docs/runbook/2026-09-18-ads-livewell-flow-live-on-instatic.md`,
  `2026-09-22-ghl-dni-number-swap-verified-live.md`, `2026-09-22d-two-dni-pools-scoped-per-office.md`,
  `2026-09-22e-dni-pools-without-consent-and-csp-fix.md`
- bk-mason-park / `docs/runbook/2026-09-18-redesigned-ad-funnels-published-to-staging.md`,
  `2026-09-18-webflow-ad-pages-on-production-verified-and-fixed.md`
- bk-stone-dental / `docs/runbook/2026-09-16-ads-destination-not-crawlable-check.md`
- The six other gates ran green against Livewell's live combo on 2026-09-23. dni-proof was only
  syntax-checked, so that no real pool number was claimed.

## Version Control
Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
