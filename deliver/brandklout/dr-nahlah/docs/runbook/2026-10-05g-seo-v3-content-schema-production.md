# 2026-10-05g — SEO v3 on PRODUCTION: structured data built from each page's content

## Why
The 2026-10-05e audit: the v2 graph was valid but was entity boilerplate. Every Service and
procedure node carried only its meta description. User: "AEO should be attached to the actual
content and the relevant content that is on the page. We should have a very detailed AEO schema."
Then: "Let's go" on step 1 of the audit's order.

## Done (production published 2026-10-06 ~03:47Z; staging DRAFT synced, not published)
All under `workflows/22-instatic-api-sync/seo-v3/`:
- `scan-sections.mjs` → `out/sections.json`: every sitemap page as sections read from the live HTML
  (h2, lead lines, h3 items, `<details>` Q/A with trailing nav links cut, images + alts,
  Vimeo/YouTube ids, tables, quotes), the visible `.pk-crumb` trail, and for articles the body
  split at its h2s.
- `fetch-facts.mjs` → `out/facts.json`: Vimeo metadata (team token; descriptions are full
  transcripts), YouTube watch-page metadata for the 8 library films, and Wikipedia + Wikidata
  ids for 34 concepts (REST summary API; wbsearchentities rate-limits).
- `build-schema-v3.mjs` → `out/{blocks,organization}.json`, extending the v2 blocks. From the
  page copy: Service `description` = the hero line (meta description kept as
  `disambiguatingDescription`), `hasOfferCatalog` = the options the page lists, procedure
  `preparation`/`howPerformed`/`followup` = its own timeline steps, `HowTo` for every
  step-by-step section (7), `ItemList`s for benefits, indications, cost factors, FP1/FP2/FP3,
  commitments, what-to-bring and before/after cases (33), the whitening comparison as a `Table`,
  `LoanOrCredit` x3 (the published lender terms), `WarrantyPromise` + the Precare `Service`, FAQPage
  rebuilt from the accordions (the 3 cut-off answers fixed) and on the 5 question-led articles,
  `VideoObject` for every embedded film (23), the 5 team `Person`s, the full credential record
  on Dr. Nahlah (13 of 14: "IV Sedation Certificate" left out by the client rule), the Tysons
  Study Club, McLean `amenityFeature` = the six machines on /our-facility, BlogPosting
  `wordCount`/`abstract`/`articleSection`/`about`/`mentions`, Blog `blogPost` list, and
  Wikipedia/Wikidata `sameAs` on the procedures, the page `about` Things and `knowsAbout`.
- **Breadcrumbs = the trail the page shows** (`Home › Implants › All-on-4`; articles `Home ›
  Journal › <H1>`). aeo-schema `emitBreadcrumbs` is now **false**: the generated one named the last
  crumb with the full SEO title. Ads pages therefore carry no breadcrumb (they are noindex).
- `push-seo-v3.mjs --apply` (82 blocks + organizationJson + the flag, backup under
  `.tmp/backups/seo-v3-*`), then `do-publish.mjs`.
- Staging: `seo-v2/plugin-stores.mjs` export/import now carries the `emit*` switches, and
  `parity-snapshot.mjs` compares them. `seo-v2/parity-check.mjs` = STAGING MATCHES PRODUCTION.

## Verified
- `seo-v3/verify-seo-v3.mjs` = **SEO v3 CLEAN** on 81 URLs: one graph, schema.org-vocabulary
  clean, breadcrumb names = the visible trail, FAQ = the page's "?" accordions with answers
  found on the page, one VideoObject per embedded film, no dangling `hasPart`. The same gate on the
  pre-v3 production: 80 wrong breadcrumbs, 23 undescribed films, 2 answers not on the page.
- `seo-v2/verify-seo-v2.mjs` = ALL CLEAN (84 URLs, ads pages' noindex intact).
- `seo-v3/vocab-check.mjs`: checks every type, property-domain, range and enum value against the
  schema.org vocabulary file. It was clean on v2's live graph and caught `ItemList.about` in v3.
  validator.schema.org was throttling (302 to a captcha) all session.

## Gotchas
- **Escapes through `node -e` / python heredocs land wrong in this shell**: `\b` became a
  backspace and `\1` a 0x01 byte in a regex, and `\\.` lost a backslash. Write regex-bearing code
  with the Write/Edit tools, and grep the file for `[\x01-\x08]` after any scripted edit.
- Platform video descriptions are not the site's copy: the YouTube "Wellness Hour" ones mention
  IV sedation, a tysonsdental.com link, "since 2000" and "10,000 implants". `platformText()` drops
  any sentence matching the rule (`RULE_BREAK`). YouTube films carry no `publisher` (third-party
  channel).
- `ItemList` has no `about`; the cases' subject goes on each ImageObject.
- Service nodes carry no Wikipedia `sameAs` (a practice's service is not the encyclopedia
  concept); the procedure and the WebPage's `about` Thing do.
- Re-running the builder reads v2's `seo-v2/out/blocks.json` as its base, not the live store, so
  it never compounds; the live store is only read for the pages v2 did not build (legal,
  thank-you, the FAQ page).
- A heading rename on any page breaks the build loudly (`sec()` throws); `out/sections-used.txt`
  lists the 64 sections it depends on. Rescan, rebuild, push, publish, verify after copy edits.

## Flag to the client / CS
- `/about` says "Over 7,000 dental implants placed"; `/meet-dr-nahlah` and home say 18,000+. Neither
  number is in the schema until one is confirmed.
- The veneers page's crumb links "Cosmetic" to /smile-makeover; crowns and whitening link it to
  /cosmetic-dentistry (the schema mirrors what each page shows).
- Six old post descriptions plus one post body still say "Dental Group of Tysons" (open CS item).

## Next
- Process lesson to land **on main** (not done here: main's worktree had another session's
  uncommitted work): aeo-schema README + scenario-0 05-launch: build blocks from the page's
  sections, not meta; emitBreadcrumbs off + the visible trail; vocab-check as the gate.
- Audit step 2 is mostly done here (VideoObject, case ImageObjects). Step 3: the double H1 on
  all 43 posts (the collection body repeats the title as an h1). robots.txt Sitemap line was
  done by a parallel session (`82352347`).
- Search Console: submit the sitemap, then watch Enhancements (Breadcrumbs, FAQ, Videos).
