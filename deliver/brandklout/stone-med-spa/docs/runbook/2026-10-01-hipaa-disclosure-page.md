# 2026-10-01, latest — /hipaa-disclosure added, staging and production

The task was to inject one page, **HIPAA Disclosure** at `/hipaa-disclosure`, to match what the Webflow sites carry (stonedentalimplantcenter.com,
grandmissiondentistry.com). It is an injection only: no push-site, no other page, no nav, footer, component or CSS change, and no footer link.

## Done

- **New `05-instatic-upload/add-hipaa-page.mjs`** clones the instance's own `/privacy-policy` row: navbar,
  drawer, hero, aside (effective date, questions, "On this page"), CTA, footer, and the same class
  rules read off that instance. It then swaps in the legal column, using the HHS model Notice of Privacy Practices from
  `05-instatic-upload/hipaa/hhs-model-notice.reference.html` (the Webflow text, fetched
  2026-10-01) **verbatim**, except for the practice parts. It is nine numbered sections, each node has a fresh id, and the footer's
  `aria-current` is dropped. Title and SEO title are `HIPAA Disclosure | Westlake Medical Aesthetics`, with its own meta
  description. It is indexable: no robots meta, and the canonical points at itself.
- **Practice details used:** entity **Westlake Medical Aesthetics**, address 72 Andorra Dr, Suite 110B, Westlake, TX 76262,
  phone (817) 674-2061, website westlaketxmedspa.com, Privacy Policy link `/privacy-policy`,
  effective **October 1, 2026** (in the aside, where the privacy page carries its date). The site has one location.
- **Staging:** page `9WljW02zn_gJSCsRrt5F6`, `{"publishedPages":27}`. **Production:** page
  `8BXxdHwXXfRT1hWX0E0cR`, `{"publishedPages":27}`. Shell seqs unchanged (staging 24, production 28).
  The backups are in `.tmp/backup-{staging,prod}-2026-10-01*-pre-hipaa/`.
- **Publish guard.** Publishing is whole-site. The script publishes only if (a) the draft matched live before the
  write (`draftMatchesPublished`), or a recorded clean baseline exists, and (b) just before publishing, no other row moved,
  every other row is `published` with `updatedAt <= publishedAt`, and the shell seq equals the
  clean one. Both instances were clean (26/26 matching) before the write.

## Verified

- `/hipaa-disclosure` returns 200 on both hosts, carries the entity name, and its title, description and canonical are right. The www redirect lands on 200. Termly and Sienna are present.
  The screenshots at 1440 and 390 look native, with no horizontal overflow.
- **Production, the other 26 pages, full bodies saved before and after:** 23 are byte-identical. `/`, `/book` and
  `/results` differ only in `brandklout.embed-origins.embed.js?v=27 → ?v=28`, the per-publish
  cache-buster. Every page also carries `/_instatic/assets/<publishId>/`, which changes on every publish.
- **Staging, the other 26:** every raw hash changed but every **byte length is identical**. Only hashes were kept
  before the publish there, not bodies, so the check is "same length + the same two per-publish tokens",
  proven on production.

## Flagged / Next

- **No legal entity is stated** anywhere on the site (Privacy and Terms both say "Westlake Medical
  Aesthetics"), so the practice name stands in. The GHL consent text names *Stone Surgical PLLC*
  (2026-09-17 run). Ask the client which entity is the HIPAA covered entity, then set `ENTITY` in the script
  and re-run.
- **No email** is published on the site, so the reference's Email line is left out. Set `EMAIL` when supplied.
- **The footer has a legal-links row** (© line · Privacy Policy · Terms of Service, plus Termly's
  runtime Cookie Preferences). No HIPAA link was added, as asked.
- **The sitemap (Cloudflare Worker, 25 URLs) does not list `/hipaa-disclosure`.** It lists
  `/privacy-policy`. It needs a worker redeploy (`06-cloudflare-sitemap`), which was not done here.
- The privacy page's intro already mentions "our separate Notice of Privacy Practices under HIPAA… at our office"
  and could link here. It was left untouched because it is outside the scope.

## Gotchas

1. **A full `push-site.mjs` will DELETE this page.** It uses `mode: 'replace'`, which removes every row not in
   its source, and `/hipaa-disclosure` is not in site-src. After any full re-push, re-run
   `add-hipaa-page.mjs --apply --publish` on that instance.
2. **An incremental save with an unchanged shell keeps the shell seq.** The `seq` in the save response is
   the document's, not the shell's. The first staging run compared against it and refused to publish, correctly.
   The draft page was then published by the second run.
3. **`shell.updatedAt` is not maintained** (staging's read 2026-09-11 after many shell saves), so it cannot
   say whether the shell changed since publish. Use the shell seq at a known-clean moment.
4. **Raw-HTML hashes change on every publish** (`/_instatic/assets/<publishId>/`, and `?v=N` on
   plugin module JS). Normalise both before calling a page "changed".

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md). Committed with the work it describes. Not pushed and not merged.
