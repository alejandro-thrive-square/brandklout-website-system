# 2026-09-25 — One name per doctor: Dr. Dave Cho, Dr. William Sung, Dr. Tam Nguyen

The client:

> we need to make the naming of the doctors very consistent. Sometimes we name them with first name and
> last name and other times it's just the last name and that can be confusing to patients

**Done and live on staging and production.**

## The rule

Always **Dr. Dave Cho**, **Dr. William Sung**, **Dr. Tam Nguyen**. With a credential, use a comma:
"Dr. Dave Cho, DMD". A list reads "Dr. Dave Cho and Dr. William Sung", with Dr. Cho first. **Patients'
reviews are not edited**: they are quoted verbatim (`<blockquote>`, `p.pr-chip`, `p.cp-review`, and the
`const R` block in the ad generator).

This is rule 0 in `.tmp/bugherd/plan-2026-09-24/doctors/BRIEF.md`.

## What changed

- `.tmp/doctor-names.py --apply` rewrote 114 pages, `build-ads-landing-pages.mjs` (reviews kept), and
  88 article cells in `blog/cms-rows.json` (titles, SEO titles, meta descriptions, excerpts, bodies; slugs
  unchanged). Before: "Dr. Cho" ×415, "Dr. Sung" ×95, "Dr. Nguyen" ×40, "Dr Cho" ×24, "Drs. Cho & Sung"
  lists, and "Dr. William Sung DMD" without the comma.
- On production, `bugherd/patch-old-doctor-names.mjs` made 39 changes on 17 rows that exist only there:
  old team bios, old service pages, FAQs, the Spanish implant-cost page, and four of the root Webflow ad
  pages.
- Pushed with `bugherd/push-doctor-names-2026-09-25.sh`, which is the page chain plus `import-articles` and
  `publish-articles --force`. Backups: `backup-staging...2026-09-25T18-19-23.json` and
  `backup-www...2026-09-25T18-19-26.json`.

## Verified

- `doctor-names.py --check`: 0 short forms outside a review; a second `--apply` changes nothing.
  `check.mjs`: 230 pages, 0 errors. The ad generator reproduces its six pages byte for byte.
- Renders at four widths of home, Our Doctors, Our Team, About, Invisalign and the $189 ad page: no overflow.
  Home's 11.7px spans at 390 were there before this change.
- `doctor-names.py --live`: staging 223 URLs, production 253 URLs, 0 problems. Spot check: reviews on the live
  site still say "Dr. Nguyen" and "Dr Cho the main Dr" in the patients' words, and the gate skips them.

## Gotchas

- `blog/posts.json` and `blog/bodies/` still carry the short forms. They are older sources the CMS rows
  replaced; rebuilding the articles from them would bring the short forms back.
- A root ad page's `type-diff.mjs` will now report the edited sentences as "not found" against Webflow.
  This is expected, because the text changed.

## Open, for the client

- **Old production-only pages still describe Dr. Sung alone**, now under his full name. Examples: the old
  `services/pediatric-dental-care` ("Dr. William Sung will perform a gentle ... examination of your child"),
  `services/oral-surgery`, `services/restorative-dentistry`, `faq-page` ("Where is Dr. William Sung
  located?") and `dental-implant-costs`. These pages predate the rebuild and break the Dr. Cho leads rule.
  They could be rewritten, or redirected to the rebuilt pages.
- Some articles still name Dr. Sung before Dr. Cho ("Dr. William Sung &amp; Dr. Dave Cho").
- The old root Invisalign ad page says "Dr. Tam Nguyen plans your case": Webflow copy, unchanged.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
