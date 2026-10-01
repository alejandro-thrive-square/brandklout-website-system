## 2026-10-01b: "HIPAA Disclosure" in the footer legal row, every page. PUBLISHED AND VERIFIED (production + staging)

This is the follow-up to the 2026-10-01 run. A footer link to `/hipaa-disclosure`, labelled
**HIPAA Disclosure**, sits in the existing legal-links row right after Privacy Policy. It went
on every page of both instances (59 page rows each). Nothing else was edited.

### How

- **There is no shared footer component.** All 59 rows on both hosts carry their own
  `footer.foot`, and each has the identical `.foot-base` row:
  `span · span · span>a(/privacy-policy) · span>a(/terms-conditions)`.
  There is no separator glyph: `12-footer.css` lays the row out as flex, `gap:1rem`,
  `space-between`, wrapping. So the new item is a clone of the Privacy Policy `span>a`, with
  fresh ids, inserted after it.
- `22-instatic-api-sync/push-hipaa-footer-link.mjs`, run with plan, then `--apply`, then
  `--publish`.
  - It refuses unless the host starts at `draftMatchesPublished`.
  - It writes in chunks of 10 pages, each chunk with its own `baseSeqs` and `shellBaseSeq`, and
    sends the shell back untouched.
  - `toChangedPage` carries the `404` and `post` templates through the write.
  - `seoTitle`/`seoDescription` on `index` and `hipaa-disclosure` were dropped by the write (a
    known trap). The script re-applies them by PATCH.
  - The read-back requires every pre-existing node to be deep-equal to before, exactly two new
    nodes per page, and every non-body cell unchanged.
  - `--publish` refuses if any row's seq or the shell moved after `--apply`.
- Site source: `04-design/.tmp/site-src/partials/footer.html` and `lp-foot.html` (the ads-page
  footer) both gained `<span><a href="hipaa-disclosure.html">HIPAA Disclosure</a></span>`.
  `final-site/` was rebuilt. Its diff is that one line on each of the 56 built pages and
  nothing else.

### Verified

- `.tmp/hipaa/footer-compare.mjs` checks every page in two ways:
  - the link appears **exactly once, between Privacy Policy and Terms of Service**;
  - with that one span removed and the publish artefacts masked, the page is
    **byte-identical** to before.
  The masked artefacts are the asset folder id, the embed-origins `?v=`, and the `cfemail` key.
  - Production: **102/102 URLs**, which includes the 43 journal posts rendered through `post`.
  - Staging: **59/59**.
  `/hipaa-disclosure` returns 200 on both.
- Layout (`.tmp/hipaa/footer-layout.mjs`, puppeteer-core). The `.foot-base` row was measured
  live with the link and with it removed, on `/`, `/hipaa-disclosure` and an ads page, on both
  hosts:
  - **1440:** 1 row → 1 row, 48px → 48px.
  - **390:** 3 rows → 3 rows, 105px → 105px.
  - No item wraps internally, and nothing overflows.

### Gotchas

- **Termly's runtime "Cookie Preferences" control lands in the same row.** It is inserted at
  runtime, so the rendered order is Privacy Policy · HIPAA Disclosure · Cookie Preferences ·
  Terms of Service. It isn't in the page nodes, and nothing was changed about it.
- **Element screenshots of the footer are useless on this site.** The Termly banner covers it,
  and the GSAP smoother offsets the clip even with the banner hidden. Measure the geometry
  instead, as `footer-layout.mjs` does.
- **`site-test.mjs` will now count `hipaa-disclosure.html` as a dead link on every built page.**
  The page lives only on the instances and has no `site-src` body. Add it to `PAGES` (with a
  body) the next time `site-src` is the route, or teach the gate about instance-only pages.
- A full `push-site` would push 56 pages that already carry the link, and the instance's own
  `/hipaa-disclosure` row would be left alone.

### Version Control

Committed on `bk-dr-nahlah`.
