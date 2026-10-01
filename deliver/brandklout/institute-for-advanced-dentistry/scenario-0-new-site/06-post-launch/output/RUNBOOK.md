# scenario-0-new-site · 06-post-launch · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

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
