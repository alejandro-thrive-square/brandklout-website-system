## 2026-10-01: /hipaa-disclosure added, staging and production. PUBLISHED AND VERIFIED LIVE

One new page, the HHS model Notice of Privacy Practices our Webflow sites carry
(stonedentalimplantcenter.com/hipaa-disclosure, grandmissiondentistry.com/hipaa-disclosure).
This was an injection, not a sweep. One page row was added. No other page, the footer, the nav,
components or site CSS were touched, and no footer link was added.

- Production: https://www.drnahlah.com/hipaa-disclosure (row `8H6_-DYWstIO3hNh8TbIs`)
- Staging: https://staging.drnahlah.com/hipaa-disclosure (row `0m_72SdlgDLrYWvz_6GZp`)
- Title `HIPAA Disclosure | Dr. Nahlah Implants & Prosthodontics`, own meta description,
  self-canonical, no robots tag (indexable, like the privacy pages). Effective Date: October 1, 2026.

### Who the notice names

The practice has **two legal entities, one per office**. The site's own privacy and terms pages
say so (the `/privacy-policy` chooser links one document per office). The notice therefore
names both entities. Wording is otherwise the canonical notice, verbatim:

> This Notice of Privacy Practices applies to Esam Abou Nahlah, DDS, MS, PLLC (McLean office)
> and Implants And Prosthodontics Specialists, PLLC (Alexandria office) ("Dr. Nahlah Implants
> & Prosthodontics Specialists," "we," "us," or "our").

The contact block has one section per entity: the address, the phone, and the website.
- McLean: (703) 448-3312.
- Alexandria: (571) 617-7245 for new patients and (703) 940-5410 for current patients.

The Privacy Policy link goes to `/privacy-policy`, the chooser.
**No email line**, because the practice publishes no email address anywhere (see Open).

### How

- `22-instatic-api-sync/push-hipaa-page.mjs` builds the page.
  - It copies THIS host's live `/privacy-policy-maclean`: nav, drawer, hero, footer and class
    ids, all with fresh node ids.
  - It replaces the hero words (crumb, `HIPAA <em>disclosure</em>.`, lead, "Read the notice")
    and the `.lg-body` children.
  - The body keeps the site's legal convention (`57-legal.css`, `gen-legal.mjs`):
    `<section><h2>` per heading, `<p>` per paragraph, and list items as "• " paragraphs.
  - The model notice's `<h3>`s became `<h2>`s on purpose. `.pk h3{font-size:var(--h3)}`
    would render them LARGER than the section headings.
  - The model notice's required header line ("Your Information. Your Rights. Our
    Responsibilities. This notice describes how medical information…") is the hero lead, the
    slot where the sibling legal pages put their opening paragraph.
- What the script writes:
  - one `changedPages` entry (incremental, `baseSeqs: {}` because the row is new, and the shell
    sent back unchanged);
  - the `seoTitle` and `seoDescription` cells, by PATCH (a flat slug, so the route is safe);
  - on production only, an open-graph override and an aeo-schema WebPage block. These mirror
    the sibling pages; staging has neither for any page.
- Publish guard. `--publish` refuses unless all four hold:
  - every other row's `seq` is as `--apply` recorded it;
  - the shell hash is the same;
  - the new page's seq is the same;
  - `draftPages = publishedPages + 1`.
- Both hosts started at `draftMatchesPublished: true`, 58/58, and both published 59/59.
- `hash-live-pages.mjs` hashes every page row and every sitemap URL per host, before and after.
  The page bodies are kept in `.tmp/hipaa/bodies/`.

### Verified

- `/hipaa-disclosure` returns 200 on both hosts, with both entity names, both addresses, the
  date, the HHS complaint line and the `/privacy-policy` link. There are no Stone, Westlake or
  Grand Mission strings.
- **Production, 101 other URLs: byte-identical after masking publish artefacts only.**
  The masked artefacts are:
  - the per-publish asset folder id in `/_instatic/assets/<id>/`;
  - the embed-origins cache-buster `?v=36→37`;
  - Cloudflare's per-request `data-cfemail` key (it decodes to the same address).
  `.tmp/hipaa/char-diff.mjs` lists every differing span and `norm-compare.mjs` does the masked
  compare.
- **Staging, 58 other URLs: the length of every page is unchanged.** Its bodies were not kept for
  the before run, so a byte-level compare isn't available there. The draft-side guard (no row
  seq moved, shell identical) is the proof.

### Gotchas

- **Every URL's raw hash changes on ANY full publish**, even with an identical draft. Compare
  with the three artefacts masked, or a "byte-identical" check always fails.
- **Per-row publish (`POST /data/rows/:id/publish`) cannot publish a page.** Page routing joins
  `data_row_versions.site_snapshot_id`, which only a full publish writes. A new page always
  needs a full publish, so verify the draft is clean first.
- Python's `open()` died on MAX_PATH under `.tmp/hipaa/bodies/` (long post slugs). Do the
  comparisons in Node.

### Open / flagged

1. **The sitemap does not list `/hipaa-disclosure`.** `/sitemap.xml` is a static file from the
   2026-08-25 Cloudflare worker run, and every `lastmod` in it is from August.
   `/five-year-warranty` and the ChatGPT page are missing from it too. The page is indexable but
   unlisted until that file is regenerated.
2. **The two office privacy policies carry another practice's details.** This is live content and
   it is NOT touched here:
   - `info@grandmissiondentistry.com` (Cloudflare-obfuscated);
   - a Texas phone, (281) 789-8836, twice;
   - "grandmissiondentistry.com" as the SMS opt-in site;
   - the Texas Data Privacy and Security Act.
   The McLean policy's contact block also gives Alexandria's (571) 617-7245, and both policies
   name "Esam Nahlah Dentistry". This needs a decision and a fix of its own.
3. **No practice email exists** for the notice's contact block. Add one if the practice supplies it.
4. **Footer:** it HAS a legal-links row (`.foot-base`: © line, then Privacy Policy and Terms of
   Service). It is inline in every page, not a component, so adding a HIPAA link there is a
   59-page node edit.
5. `seo-head.js` has no entry for the page. That's harmless (it returns early for unlisted
   paths), and the static head is correct.
6. `site-src` doesn't have the page. It exists only on the instances.

### Version Control

Committed on `bk-dr-nahlah`.
