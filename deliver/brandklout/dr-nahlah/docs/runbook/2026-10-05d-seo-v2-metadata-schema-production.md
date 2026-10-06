# 2026-10-05d — SEO v2 on PRODUCTION: titles, descriptions, image alts, AEO schema (after the GSC drop)

## Why
Search Console showed a massive drop. User asked to improve metadata (images, SEO title, SEO
description) and the AEO schema "right away tonight", with the team's reference
https://www.hackensackdentalimplants.com/ (a Brandklout Webflow build that performs).

## What the reference does (and we copied)
Title "{Treatment} in {City}, {ST} | {short brand}"; description opens with the same treatment +
city and names the doctor; schema per treatment page = Service + FAQPage, doctor page = Person,
posts = BlogPosting (+FAQ), home = Dentist + FAQ + ImageGallery. Its H1s are also
"{Treatment} in {City}, ST" (NOT changed here: copy/design, needs the client).

## Found
- **The rendered page Google indexes carried a second, older head.** `src/scripts/seo-head.js`
  rewrote title / description / og:* / canonical after load and added its own Article; 26
  `src/scripts/jsonld/<page>.js` assets injected a legacy graph (dangling `/#practice` ids,
  MedicalProcedure with performerType/provider); `site.js` appended a second FAQPage from the
  accordions, so every FAQ page carried two FAQPage blocks once rendered.
- **All 43 posts had no article schema**: aeo-schema 1.2.0 matched entries by row title, the posts
  publish `<title>` = seoTitle, so every post resolved to the `/post` template (`/post#webpage`).
- Org schema: offices pointed at the retired `/contact-maclean`; McLean "fax" = its phone,
  Alexandria "fax" = the current-patients line; no geo, no sameAs.
- Titles had lost the location on most service pages (`/dental-implants` "… | Virginia").
- 43 content images published `alt=""`.

## Done (all on production, published, verified)
- **aeo-schema 1.3.0** (main `fa5a5063`): entries indexed by seoTitle too. Installed on staging
  (NOT published there: its draft holds the unreviewed class map) and on production.
- `22-instatic-api-sync/seo-v2/meta.json`: 30 titles (≤60 chars, treatment + "McLean & Alexandria,
  VA") and descriptions (135–160). `seo-v2/push-seo-v2.mjs` writes them to the row `title` cell (the
  published <title>), the seoTitle/seoDescription cells, the open-graph overrides and the aeo blocks.
  `04-design/.tmp/site-src/seo.json` updated to match.
- `seo-v2/build-schema.mjs` → organizationJson (Dentist + 2 Dentist departments with legalName,
  geo, hasMap, ContactPoints, hours, isAcceptingNewPatients; sameAs FB/IG/GBP; medicalSpecialty
  enum), site-wide Person (Dr. Esam Nahlah, sameAs Healthgrades/Vitals/RealSelf), full Person on
  /meet-dr-nahlah (credentials, memberships, VCU), Service + Surgical/MedicalProcedure + reviewedBy
  on 11 treatment pages, FAQPage on 6 (+ the FAQ page's own), MedicalCondition lists on
  /dental-conditions and /emergency-dentistry, ContactPage → office, ImageGallery on /smile-gallery,
  OfferCatalog → each Service, BlogPosting on all 43 posts with the ORIGINAL WordPress
  datePublished, author = Dr. Nahlah, image = the post's OG card.
- `seo-head.js` trimmed 55 KB → 2.3 KB (only noindex for the 21 ads/thank-you/template paths +
  apple-touch-icon). `seo-v2/retire-runtime-jsonld.mjs`: 26 jsonld/*.js stubbed, site.js FAQ append removed.
- `seo-v2/push-alt-text.mjs`: 43 media altTexts (each image viewed; `seo-v2/alt-proposals.json`).
- Sitemap worker: all 81 `<lastmod>` → 2026-10-05, redeployed.
- Gates: `seo-v2/verify-seo-v2.mjs` ALL CLEAN (84 URLs: one title/description/canonical, meta =
  meta.json, one JSON-LD graph, BlogPosting dates/author, Service + FAQ, no empty alt, noindex
  intact). validator.schema.org: 0 issues on 11 sampled pages; the home page's last issue
  (OfferCatalog provider) was removed and checked in the live graph (validator throttled after).
- Backups (local, gitignored): `22-instatic-api-sync/.tmp/backups/seo-v2-*`, `runtime-jsonld-*`,
  `pages-rows-full-pre-seo-cells-*`; plugin snapshot under main's instatic-plugins/output/rollouts.

## Gotchas
- **Never regenerate seo-head.js** (`13-content-export-import/.tmp/gen-seo-head.mjs` is marked
  RETIRED): it would put the JS title/description overrides back.
- A re-run of build-schema reads back what the last push stored; it unwraps arrays and strips
  numeric keys (one run spread an array into `{"0":…,"1":…}` on all 43 posts; repaired, verified).
- `SurgicalProcedure` is a type, not a `procedureType` value; `Service.additionalType
  MedicalProcedure` makes validators reject `provider`; OfferCatalog has no `provider`.
- The pages' own FAQ answers say "does not offer IV sedation"; that negation is the client rule
  and sits in the schema on purpose. The verify gate allows exactly that phrase.
- Vimeo thumbnails publish `alt="<title>" … alt=""` (doubled; the first wins).
- `deploy-worker.mjs --apply` uploads, then 403s listing routes; the upload is what matters.
  `/sitemap.xml?x=` is not routed (no trailing `*`), so test the bare path.
- `/our-facility`'s `2058719.jpg` looks AI-generated, not the real suite; `/all-on-4`'s quote photo
  is stock, not the named patient. Flag to the client.

## Staging synced to production (2026-10-05, late)
Asked: "if we promote staging, does it wipe the metadata?" Yes, it would have: promotions carry
staging's rows (the <title> is the row's title cell) and, via clone-site, the shell (old
seo-head.js + jsonld scripts). Synced staging's DRAFT (not published; its class-map draft is
untouched): `seo-v2/plugin-stores.mjs` (101 og overrides, 83 aeo blocks incl. the site-wide
Person, organizationJson), `push-seo-v2.mjs` (30 rows, seo-head.js trimmed),
`retire-runtime-jsonld.mjs`, `media-alt-parity.mjs`. Media library: production's 100 rendered
images whose alt lived only in the og override or custom HTML now carry it as altText too
(`fill-library-alts.mjs`); every image any live page or stylesheet references has library alt;
the 155 still blank are unreferenced migration uploads. Ads-page backdrop photos are
`aria-hidden` with `alt=""` on purpose; Vimeo thumbnails sit inside labelled play buttons.
**`seo-v2/parity-check.mjs` → STAGING MATCHES PRODUCTION.** Run it before every promotion
(now in main's staging-clone.md, Promote).

## Next
- **Search Console access** (none in the master .env): submit the sitemap, request indexing of the
  top service pages, check Enhancements (FAQ / Breadcrumb), date the drop.
- H1s in the reference's form ("Dental Implants in McLean, VA") and deeper service copy (pages are
  ~35% shorter than the WordPress versions): content, needs client sign-off.
- 33 post meta descriptions are still the old WordPress ones. Staging has none of tonight's content.
