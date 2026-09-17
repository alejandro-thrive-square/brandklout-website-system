# 2026-09-17 — Privacy Policy and Terms of Service, on staging

The ask: "We need to create privacy policy and terms of service pages, guide from
https://www.stonedentalimplantcenter.com/". **Staging only**, and production is unchanged.

## Done (`fc127a11`)

- **Two new pages**, `/privacy-policy` (13 sections) and `/terms-of-service` (18 sections). They
  follow the implant centre's `/privacy-policy` and `/terms-of-service` (effective 2026-08-27)
  section by section, rewritten for Westlake Medical Aesthetics. The sources are
  `site-src/pages/privacy-policy.body.html` and `terms-of-service.body.html`. Each file header
  lists what was left out and why.
- **Left out on purpose:**
  - **The A2P 10DLC / SMS program sections.** The implant centre runs a GHL texting opt-in. This
    site has no SMS program, and its booking form is inert.
  - **Stone Surgical Arts PLLC as the operator.** The practices are separate businesses.
  - Dental, insurance and implant content, and cost ranges.
  - Any email address, because none exists for this practice.
- **Adapted:**
  - Cherry and CareCredit.
  - Video consultations.
  - A Membership section that defers to the signed agreement, with no price.
  - The Texas Medical Board for record retention.
  - The treatment trademarks.
  - Stone Surgical Arts named as a separate practice under links.
  - Texas law with Tarrant County venue, as on the implant centre.
- **Layout** (`css/67-legal.css`): a short cover, then a sticky white rail with the effective
  date, the phone and a table of contents, beside numbered sections at 68ch. The body has no
  motion. `build-site.mjs` **generates** the table of contents from the `legal_section` ids and
  h2s (`{{LEGAL_TOC}}`). The bullets reuse `.detail_list`.
- **Footer:** Privacy and Terms now link to these pages. Until today they went to the implant
  centre's pages. **The "SMS Terms" link was removed**, because there is no SMS program. The
  /book form's privacy note links to the policy.
- The upload lists grew to 13: `build-import-input.mjs`, `verify-live.mjs`, `visual-diff.mjs` and
  `compare-live.mjs`. `seo.json` has the two entries.
- `.tmp/snapshot-staging.mjs` now logs real counts. It used to print "pages 1 media 0 … missing
  73", which was the response wrapper and not the site.

### Staging push

The backup is `.tmp/backup-staging-2026-09-17-legal/`, taken at seq 4 with 11 pages. No one had
edited staging since the brief run. Steps:

1. `build-import-input`.
2. `ship.sh`, using the 2026-09-15 session's `link-staging` dir. `check-link` returned OK.
3. `push-site --apply --force`, which saved seq 5.
4. Publish, which returned `{"publishedPages":13}`.

No new media was needed, because both cover photos were already uploaded.

### Gates

- **Local:** `audit` FAIL none, `all-pages` 13 × 3 widths (156 assertions) clean, `menu-test`
  9/9, and `probe` console clean on both pages.
- **Staging:**
  - `verify-live` FAIL none (13 routes, 13/13 titles). `css-parity` FAIL none.
  - `compare-live` found no differences on either page.
  - `visual-diff` at 1440 was 3.6% and 4.4%. At 390 it was 8.3% and 15% (+27px). I looked at the
    terms page at 390: one paragraph re-wraps and everything below it shifts, and the sections
    are identical.

## Next

1. **The client (or their counsel) reviews both pages before production.** They are adapted
   from the implant centre's policy text. They are not legal advice written for this business.
2. **Legal entity name and email.** The pages say "Westlake Medical Aesthetics" and give only the
   phone. When the client supplies the entity (for example "… PLLC") and a contact email, add
   them to both contact blocks and both intro paragraphs.
3. **If texting or a GHL form goes live:** port section 3 of the implant centre's privacy policy
   and the SMS section of its terms, add an SMS Terms page, and restore the footer link.
4. **Analytics / Termly.** The policy mentions analytics "such as Google Analytics" in general
   terms. If GTM or Termly is added (process module 23), add a Cookie Policy page too.
5. **Production:** push with the next production release. Then add both slugs to the sitemap
   (`06-cloudflare-sitemap`, which reads production's pages) and redeploy the Worker.

## Gotchas

- **`id="contact"` is reserved on this build.** `build-site.mjs` gives the closing CTA band
  `id="contact"` unless the body already has one. A legal "Contact us" section with that id would
  quietly take the anchor from the CTA. The legal pages use `contact-us`.
- **`probe.mjs` wants the file name** (`privacy-policy.html`). A bare slug captures the local
  server's "nf" 404 page and still exits cleanly.
- **Don't trust snapshot-staging's counts from before this run.** The API wraps pages in `rows`
  and media in `assets`.

## Version Control

Tracked. Committed with the work it describes.
