# scenario-0-new-site · 06-post-launch · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-01 (later): HIPAA Disclosure in the footer legal row

### Done (`ea7dd53c`)

- **Production, all 60 pages:** `HIPAA Disclosure` → `/hipaa-disclosure` right after Privacy Policy in
  `ul#menu-legal-footer` (the footer is inlined per page; there is no shared component). Markup is the
  neighbours': a `' '` text node, then `<li class="menu-item menu-item-type-post_type menu-item-object-page
  bricks-menu-item"><a target="_self">` (class ids from the Privacy item; its per-item `menu-item-1333` / id not
  copied). On `/hipaa-disclosure` itself the link has `aria-current="page"`. `legal/push-footer-hipaa.mjs`:
  one incremental write of the 60 rows, the 3 rows' `seoTitle`/`seoDescription` restored by PATCH, templates
  asserted, published at seq 24 (`draftMatchesPublished` true before). Verified: 60/60 pages 200 with exactly one
  HIPAA link, and identical to before once that `<li>` and the per-publish tokens are removed.
- **Wrapping regression, fixed with approval:** five links no longer fit the row (a non-wrapping flex `ul` in a
  `space-between` row with the copyright), so every link broke onto two lines at 1440 and Terms onto three at 390.
  `legal-footer-wrap.css` (`flex-wrap: wrap`, `li { white-space: nowrap }`, right-aligned, left under 768px) went
  into the `site.css` shell asset as a fenced block by `push-legal-footer-wrap.mjs` (second publish, shell only);
  `build-wp.mjs` appends it too. Now every link is one line (18px) at 1440/1280/991/390; the row runs to two
  lines, and at 1440 the copyright also wraps to two lines. Only change in page HTML: the userStyles hash.
- **Rebuilt site (staging):** `site-src/partials/footer.html` `.foot__legal` has
  `· <a href="/hipaa-disclosure/">HIPAA Disclosure</a>` after Privacy Policy (trailing slash like its
  neighbours). Not pushed; it ships with the next full push. Isolated build checked: links stay whole; at 390 the
  line gains one row ("Accessibility" flows down).

### Next

- Staging still answers 404 for `/hipaa-disclosure`: the 13:38Z full push did not include it, although
  `site-src/pages/hipaa-disclosure.html` is committed. Check it is in the next build/push.

### Gotchas

- **`site-src/build.mjs` writes `seo.json` on EVERY build**, `--out`/`--only` included (line 151 is not guarded
  by `FULL`, despite the header comment). An isolated build replaces it with just the pages built; the
  index+hipaa-only version from this morning's check went into `e8861d52`. Harmless for a push (a full
  build rewrites it, and `push/prepare.mjs` refuses pages missing from it), but restore it after any
  partial build: `git checkout -- seo.json`.
- A re-run of `prepare-wp.mjs`/`build-wp.mjs` (a fresh WordPress-clone import) does not carry the footer
  link; re-run `legal/push-footer-hipaa.mjs` (idempotent) after one.

## 2026-10-01: HIPAA Disclosure page injected (production), staged in site-src (staging)

### Done (`ee7f64db`)

- **Production `https://www.ifadentistry.com/hipaa-disclosure` is live (200) since 2026-10-01 13:38Z, seq 23.**
  It is the HHS model Notice of Privacy Practices the Brandklout Webflow sites carry (Stone, Grand Mission),
  copied verbatim with only these swapped: entity **Institute for Advanced Dentistry PLLC** (from this site's
  own Privacy Policy and Terms), display name "Institute for Advanced Dentistry", Peoria address (the only
  office since Phoenix closed 2026-09-28), (602) 242-2256, info@ifadentistry.com, Privacy Policy link
  `/privacy-policy`, Effective Date October 1, 2026. Copy: `workflows/21-instatic-upload/legal/hipaa-disclosure.md`.
  Title `HIPAA Disclosure | Institute for Advanced Dentistry`; seoDescription set; robots index/follow, no canonical.
- **How:** `legal/push-hipaa.mjs` clones the stored `/privacy-policy` row (fresh node ids), swaps the h1 and the
  copy region, writes ONE page through an incremental `PUT /site-document`, then publishes only if every other
  row's id/seq/updatedAt is unchanged and `draftMatchesPublished` was true before the write. Production-only
  (refuses staging). `legal/verify-hipaa.mjs` renders it at 1440 and 390 (PASS both).
- **Nothing else changed:** all 59 other pages hashed before/after on the Railway origin — identical once the
  per-publish tokens are normalised (`/_instatic/assets/<publish id>/`, `embed.js?v=N`). No footer, nav,
  component, CSS or shell change. No footer link was added (deliberately; decision pending).
- **Staging is NOT injected.** Staging holds only the redesign (home + Dental Implants), has no privacy page to
  template from, and is pushed in `replace` mode from `03-design-build/output/code/site-src/`, which deletes any
  page not in the build. So the page is `site-src/pages/hipaa-disclosure.html` (the redesign's privacy
  template: hero, "On this page" aside, `jr-legal` prose) and reaches staging with the next full push.
  Checked with an isolated `build.mjs --out <scratch> --only hipaa-disclosure` render.

### Next

- Footer link: production's footer has a legal row (Privacy Policy · Terms of Service · Accessibility
  Statement, every page); the redesign's footer has `.foot__legal` (© … PLLC · Privacy Policy · Terms of
  Service …). Decide whether HIPAA Disclosure joins them.
- After the next staging full push: confirm `https://staging.ifadentistry.com/hipaa-disclosure` is 200.

### Gotchas

- **A cloned WordPress page carries the source page's `<head>`.** The body's `data-wz-head` lists the head items
  `site.js` replays; the privacy page's include `rel=canonical → /privacy-policy/` and its og/twitter tags. Cloned
  as is, the new page would canonicalise to the privacy page. `push-hipaa.mjs` drops every item naming it.
- **…and its footer current-page state** (`aria-current="page"`, `current-menu-item` on Privacy Policy). Copied from
  `/contact-us` instead.
- The page keeps the privacy page's body classes (incl. `wz-p-privacy-policy`); that is what gives it the dark
  header bar from `light-page-header.css` without a site.css change.
- Every publish changes every page's raw bytes (the asset path carries a publish id). Hash with those normalised.
- Puppeteer never reaches `load` on production (third-party tags); wait on `domcontentloaded` + a settle.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
