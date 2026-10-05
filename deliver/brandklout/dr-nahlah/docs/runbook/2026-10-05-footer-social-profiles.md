## 2026-10-05: "Find Us Online" in the footer: six social/review profiles. PUBLISHED AND VERIFIED (production only)

Asana task `1219087019480243`, "Add Social Media profiles to website": Facebook, Instagram,
RealSelf, Vitals, Healthgrades and Google. These six links now sit in the footer's first column,
under the blurb, on every site page. Ads landing pages are left without them on purpose.

### The profiles (none were given in the task; this is how each was found)

| Label | URL | Source |
| :--- | :--- | :--- |
| Facebook | `https://www.facebook.com/drnahlahprosthodontist/` | The page under the current brand, "Dr. Nahlah Implants & Prosthodontics Specialists", 1,264 followers. The OLD site and `seo.json` `sameAs` link `/DentalGroupofTysons/`, which no longer returns a page. |
| Instagram | `https://www.instagram.com/drnahlah/` | Old site; @drnahlah, 63K followers |
| RealSelf | `https://www.realself.com/dr/esam-abou-nahlah-mclean-va` | DDG `site:realself.com`. Answers 403 to curl, which is RealSelf's bot wall. |
| Vitals | `https://www.vitals.com/doctors/esam-abou-nahlah-gokheu` | The canonical URL. `/dentists/Dr_Esam_Abou_Nahlah` 301s to it. |
| Healthgrades | `https://www.healthgrades.com/dentist/dr-esam-abou-nahlah-26pyg` | Web search; returns 200 |
| Google | `https://maps.google.com/?cid=16584195885077624360` | The **McLean** Business Profile. The cid is `0xe626e64a678bf628` from the old site's Maps link at Jones Branch Dr. Alexandria has no link here. |

### How

- `22-instatic-api-sync/push-footer-social.mjs`, run with plan, then `--apply`, then `--publish`.
  It uses the same discipline as `push-hipaa-footer-link.mjs`:
  - writes go in chunks of 10, each with its own seqs;
  - the SEO cells on `index` and `hipaa-disclosure` are re-applied;
  - the read-back requires every pre-existing node to be deep-equal to before, plus exactly 14
    new nodes per page;
  - the shell must be identical afterwards.
- It edited **40 rows**: every row with `.foot-grid`, which includes the `post` template, so the
  43 journal posts are covered too. It **skipped 19 rows** with `.lp-foot-grid` (the ads pages
  and the ChatGPT page).
- Every new node is a clone of one already in that page's footer: the h2 clones "Treatments",
  and the ul, li and `base.link` clone that column's. **No class or CSS was added.** Two inline
  styles do the layout: the h2 has `margin-top:2rem`, and the ul has
  `grid-template-columns:repeat(3,max-content); column-gap:1.75rem`.
- The links use `target=_blank` and carry the `aria-label` "Dr. Nahlah on X (opens in a new
  tab)".
- Site source: the `partials/footer.html` row was added and `final-site/` rebuilt. The diff is
  11 lines on each site page. `lp-foot.html` is untouched.

### Verified

- `22-instatic-api-sync/.tmp/social/verify-social.mjs` checks every sitemap URL, plus two ads
  pages. Production passed **83/83**:
  - every site page has the row once, with six links and one `rel` each;
  - the ads pages have no row.
- Layout was measured live with puppeteer:
  - **1440:** two rows of three, 394px wide in a 394px column.
  - **390:** two rows of three, 356px in 356px.
  - No link wraps, and the page has no horizontal overflow.

### Gotchas

- **`base.link` with `target:_blank` emits `rel="noopener noreferrer"` itself.** The first
  publish also had `rel` in `htmlAttributes`, so every page carried the attribute twice.
  `one-offs/drop-footer-social-rel.mjs` removed it, and was published and verified. The push
  script no longer sets it.
- **Staging is NOT done.** Its draft already differed from live: the unpublished Client-First
  class-map work awaiting review (2026-10-04/05), and the script refuses on that. Once that draft
  is published or discarded, run
  `INSTATIC_BASE_URL=https://staging.drnahlah.com node push-footer-social.mjs` with plan, then
  `--apply`, then `--publish`. If the class map has renamed `foot-grid` or `foot-blurb`, the
  script will stop with a class-id count error; it won't guess.
- **Structured data still lists the dead Facebook URL.** The `sameAs` entries in `seo.json`
  (and the live schema) still name `/DentalGroupofTysons/` and only two profiles. Nothing was
  changed there.

### Version Control

Committed on `bk-dr-nahlah`.
