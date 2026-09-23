# Ads Landing Pages · 01 Campaign Intake

## Purpose
Collect everything a paid-traffic combo needs before a single page is built: the offer, the
campaign list, one Go High Level (GHL) form per campaign, the thank-you URL each form redirects
to, how the conversion fires, and the assets. Write it into one `combo.json` that every later
step and every gate reads.

## Inputs
- The Brandklout request (Asana task, chat or BugHerd). It names the client and the campaigns.
- The client's live site and its platform (Instatic or Webflow). Seven clients are live on
  Webflow: Arvada, Grand Mission, Legacy, Livewell, Marvel, Stone Dental, Oceanic.
- The client's runbook: `deliver/brandklout/<client>/docs/runbook/INDEX.md`.
- The client's Google Drive map: `deliver/brandklout/docs/GOOGLE_DRIVE.md`.
- The reference set: Livewell's live combo (see `02-build-the-combo.md`).

## Checklist
- [ ] Campaign list confirmed: name, offer, and the three slugs for each.
- [ ] One GHL form id per campaign. Never one shared form for two campaigns.
- [ ] Each form's thank-you redirect URL written down (production host, nested under the folder).
- [ ] Conversion method known for each campaign, and who owns the Google Ads account.
- [ ] Phone number to show, and whether a GHL number pool (DNI) runs on these pages.
- [ ] Consent: the site's Termly setup, and whether pools and GTM are consent-held.
- [ ] Offer copy facts confirmed by the client: prices, "free", warranty, sedation claims.
- [ ] Assets located: doctor film, patient films, before and afters, office photos, credentials.
- [ ] `combo.json` written and committed.

## Steps
1. **Read the request.** List the campaigns Brandklout asked for. Typical dental offers:
   dental implants, All-on-X or All-on-4, veneers, Invisalign, emergency, new patient special.
   One campaign equals one combo of three pages. Two offices with the same three offers is six
   combos (Dr. Nahlah: 2 offices x 3 offers = 18 pages).
2. **Name the slugs.** All pages live under `/ads-landing-pages/`. Use the Livewell pattern:
   - landing: `/ads-landing-pages/<offer>`
   - consultation: `/ads-landing-pages/<offer>-consultation`
   - thank you: `/ads-landing-pages/thank-you-<offer>` or `<offer>-thank-you` (pick one per site
     and keep it).
   For more than one office, put the office first: `<office>-<offer>`.
3. **Get the forms.** Ask Brandklout (they own GHL) for one form per campaign. For each form id:
   - run `node scripts/check-ghl-form.mjs <formId> > .tmp/ghl-forms.log 2>&1` and read it;
   - save-and-exit must be **off**, or visitors see "Submission in progress" on an untouched form;
   - "on submit" must be **redirect**, to that campaign's thank-you URL on the production host;
   - it should carry the ten `privacy_*` fields the consent bridge writes into (see
     `tools/termly-ghl-consent`).
   Settings are changed in GHL by Brandklout. Nothing on the site can fix them.
4. **Pin the conversion.** For each campaign, record how the lead is counted: a page view of the
   thank-you URL, as a Google Ads conversion tag in GTM, or as a GA4 key event imported into Ads.
   Write the owner (Brandklout ads team or the client). We do not create conversions ourselves
   unless asked.
5. **Phone and DNI.** Write the display phone in a swappable format: `(NNN) NNN-NNNN`,
   `NNN-NNN-NNNN` or `NNN.NNN.NNNN`. Never spaces, a non-breaking space or an en dash. If a number
   pool runs, record its script path and which pages it covers (`pools` in `combo.json`). Two
   offices mean two pools, scoped per page.
6. **Collect assets.** Pull from the client's Drive (`node scripts/drive.mjs ls/pull`, see
   `deliver/brandklout/docs/GOOGLE_DRIVE.md`) and the live site. To capture every image an existing
   ad set or reference page uses, run
   `node deliver/process/scenario-3-ads-landing-pages/scripts/grab-page-images.mjs --out <media dir> <url>=<title> ...`.
   Media stays out of git. Inventory:
   - the doctor on film (hero), and filmed patient stories (the practice's own patients only);
   - one strong before and after for the journey, more for the results gallery;
   - office and treatment room photos (the space);
   - credential logos, the review count and rating, the review widget if the site has one.
7. **Confirm claims.** List every number or promise the copy will make ("320+ reviews", price
   ranges, "free consultation", warranty, same-day teeth, sedation). Each needs a source on the
   client's own site or from the client in writing.
8. **Write `combo.json`.** Copy `scripts/combo.example.json` to
   `deliver/brandklout/<client>/workflows/ads-landing-pages/combo.json` and fill it. Set `origin`
   to staging while building; `productionOrigin` stays the live host.

## Conditionals
- If the client already runs ad pages at root slugs, then list them in `combo.json` notes and
  plan redirects to the new nested slugs (Instatic has no redirects: use the Cloudflare Worker from
  scenario 1).
- If Brandklout sends one form for several campaigns, then ask for one per campaign before
  building. A shared form cannot redirect to more than one thank-you page, so conversions mix.
- If the client has no before and afters, then plan reviews and rooms in their place. Do not
  borrow another practice's cases.
- If the client has no patient films, then do not use generic presenter clips on a paid page.
  Use reviews, or ask the client to film.
- If the site has two offices, then each office gets its own forms, its own pool and its own
  combos.
- If a claim cannot be sourced, then drop it or flag it for Brandklout. Do not invent it.

## Do / Don't
- Do keep one form per campaign and one thank-you page per campaign.
- Do write the phone in a DNI-swappable format everywhere, including the footer.
- Do record who owns Google Ads and GHL. We usually cannot log in to either.
- Don't compute or record prices, rates or quotes for the engagement anywhere under
  `deliver/brandklout/` (the offer's own price on the page, confirmed by the client, is fine).
- Don't use "no cost, no obligation" or urgency lines unless Brandklout approves them
  (Dr. Nahlah BugHerd #33, #40, #43).
- Don't share a veneer page with an implant film, or show one practice's film on another's site
  (the agency Vimeo account is shared across clients).

## Tools
- `scripts/check-ghl-form.mjs <formId>...` or `--combo combo.json`: reads the public form, fails
  on save-and-exit on or a wrong redirect.
- `scripts/grab-page-images.mjs --out <dir> <url>=<title> ...`: downloads a page set's images with
  a manifest per page.
- `scripts/combo.example.json`: the manifest template (Livewell's live values).
- `scripts/drive.mjs` (repo root): client Google Drive listing and pulls.
- `tools/termly-ghl-consent/termly-ghl-consent.md`: the consent kit and the `privacy_*` fields.

## Outputs
- `deliver/brandklout/<client>/workflows/ads-landing-pages/combo.json`
- `deliver/brandklout/<client>/workflows/ads-landing-pages/.tmp/ghl-forms.log`
- `deliver/brandklout/<client>/workflows/ads-landing-pages/INTAKE.md`: campaigns, offer facts
  with sources, asset inventory, open questions for Brandklout.
- Media in the client's gitignored media folder (never in git).

## Evidence
- bk-dr-nahlah / `docs/runbook/2026-09-17-ads-landing-pages-nine-pages-built-locally.md`,
  `2026-09-21-bugherd-32-48-ads-review-applied.md`, `2026-09-21d-warranty-claim-withheld-from-the-ads-pages.md`
- bk-mason-park / `docs/runbook/2026-09-18-ad-pages-rebuilt-in-livewells-flow.md`
- bk-ifa-dentistry / `workflows/21-instatic-upload/check-ghl-form.mjs` (the save-and-exit finding, 2026-09-21)
- bk-arvada / `docs/Arvada-Ad-Campaign-Images/` (image manifests per campaign)
- Live forms read 2026-09-23: Livewell `WFEJsiC2yvdshNv2x2ff`, Mason Park `YbX91GhEDKkCN4GH4gka`
  (still redirects to the old root thank-you slug), Dr. Nahlah `8jq7yzSeCzZrIkuA3sSG`.

## Version Control
Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
