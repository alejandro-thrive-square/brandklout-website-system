# Workflow: 14 - Migration SEO & Redirects

## Client-Facing Overview
We preserve search visibility during migration by mapping old URLs to Webflow URLs, preserving metadata, preparing redirects, and defining post-launch checks.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Protect migration SEO equity through URL inventory, redirect mapping, metadata preservation, sitemap/Search Console readiness, and redirect validation requirements.

## Inputs From Sales / Previous Phase
- Migration plan from `12-migration-audit-plan`.
- Content migration report from `13-content-export-import` when content has been exported or imported.
- Source URL inventory, target Webflow URL structure, metadata requirements, and redirect requirements.

## Execution Steps
1. Build the source URL inventory from crawl results, CMS exports, sitemap data, and known high-value URLs.
2. Map each changing URL to its target Webflow URL and mark unchanged URLs that need verification only.
3. Preserve or update meta titles, descriptions, Open Graph data, canonical notes, and schema recommendations.
4. Prepare sitemap and Google Search Console launch tasks.
5. Define redirect validation checks for QA, launch, and post-launch monitoring.

## Redirect Mapping Rules (Webflow)

These are hard rules, not preferences. Violating them produces redirect loops or dead rows.

1. **Three inventory sources, never one.**
   - The `01-content-intake` scrape captures only what was live *at scrape time*.
   - **Wayback CDX** (`http://web.archive.org/cdx/search/cdx?url=<domain>*&fl=original&collapse=urlkey&filter=statuscode:200`)
     surfaces earlier site generations whose inbound links still exist and whose old-platform
     redirect chains die with the migration. On Dr. Nahlah this found **29 URLs the scrape missed**.
   - `data_pages_tool.list_pages` on the target site is the only legal source of destinations.
2. **Never emit trailing slashes.** Webflow 301s `/foo/` → `/foo` itself, *before* redirect
   matching. Slash variants are dead rows. Verify once per site with
   `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" https://<host>/<page>/`.
3. **Never emit self-redirects.** A slug that survived the rebuild must be absent from the CSV —
   `/veneers → /veneers` is a loop. Keep it in the mapping table (it documents that the slug
   survived) and filter it at write time.
4. **Validate every destination against `list_pages`.** The generator must fail loudly when a
   rule points at a path that is not a live page. Typo'd destinations become mass 404s.
5. **Make wildcards order-independent.** Webflow's `(.*)` / `%1` matching is order-sensitive in
   ways that are hard to predict. Point overlapping wildcards (`/blog/(.*)` and `/blog/page/(.*)`)
   at the *same* destination so ordering cannot matter, or avoid the overlap entirely.
6. **Check the apex vs `www` host before testing.** Testing against the apex returns 301s for
   everything (apex → www) and hides real 404s. Test against the canonical host.
7. **Check `/sitemap.xml` and `/robots.txt` on the new site in the same pass.** Webflow's
   auto-sitemap is off by default; redirects without a sitemap still leave Google blind.

8. **A shipped redirect map expires every time the site gains a page.** A rule sends an old URL
   somewhere because that URL had no page. Build the page later and the rule does not become
   redundant — it becomes a bug, and a silent one: the URL keeps returning 200, so nothing looks
   broken, but it serves a *different* page and the new one is unreachable at its own address.
   Nobody notices, because everybody tests by clicking links on the new site rather than by typing
   the old URL.

   So the map is derived from the page set, never remembered. Re-run the reconciler whenever the
   build gains pages, and before every launch:

   ```bash
   node .tmp/reconcile.mjs            # report
   node .tmp/reconcile.mjs --write    # emit the reconciled CSV
   ```

   It reads the *built* site rather than a list in a comment, and reports three classes:
   **remove** (the old URL is a real page again — drop the rule), **re-point** (the URL is still
   gone but the content moved to a differently-named page), and **dead target** (the rule sends
   traffic to a page the build does not have).

   Found on Dr. Nahlah, 2026-08-17, all of it live at the time: 14 rules to remove and 4 to
   re-point out of 129. Two of the 14 were `/privacy-policy` and `/terms-conditions`, both
   redirecting to the home page — a healthcare practice publishing no reachable privacy policy.
   Verified against production, not inferred: `/video-gallery`, `/blog` and `/terms-conditions`
   each returned **200 serving a different page**, while an invented URL returned 404, which is
   what tells you the rules are installed and firing rather than absent.

## Reference Implementation

`deliver/brandklout/dr-nahlah/workflows/14-migration-seo-redirects/build_redirects.py` —
explicit per-URL mapping tables (pages / posts / legacy / WP structure), a validation pass that
enforces rules 2–4 above, and a coverage report that asserts every scraped URL is either
unchanged or covered. Copy it and replace the tables.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Crawl URLs, compare source/target slugs, generate redirect CSVs, validate metadata, and run post-launch redirect checks.
- **Likely integrations**: Webflow API, crawling tools, Google Search Console, schema validators, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/14-migration-seo-redirects/.tmp/url-inventory.csv`
- `deliver/process/14-migration-seo-redirects/.tmp/redirect-map.csv`
- `deliver/process/14-migration-seo-redirects/.tmp/metadata-preservation.csv`
- `deliver/process/14-migration-seo-redirects/.tmp/redirect-validation.json`
- `deliver/[client-name]/docs/seo-redirect-plan.md` (final, persisted)

## Run for Dr. Nahlah (2026-08-17)
- Executor: `build_redirects.py` in this folder. Run `python build_redirects.py`.
- Output: `.tmp/drnahlah-301-redirects.csv` (129 rules) + `.tmp/drnahlah-301-redirects-audit.csv`.
- Coverage: 78/78 live-at-migration URLs — 8 unchanged slugs, 70 redirected.
- Full write-up, mapping rationale and open items: [`docs/seo-redirect-plan.md`](../../docs/seo-redirect-plan.md).

### Reconciled the same day against the 28-page design build
The 129 rules were written against the **eleven-page** site. The design build in
`04-design/.tmp` has since grown to 28 pages, so 14 of those rules had quietly become
wrong — see rule 8 above.

- **Upload `.tmp/drnahlah-301-redirects.reconciled.csv` (115 rules), not the 129-rule file**,
  once the 28-page build ships. Until then the 129-rule map still matches what is live.
- Removed 14: `/about`, `/cosmetic-dentistry`, `/dental-conditions`, `/dental-implant-faq`,
  `/doctor-referral`, `/emergency-dentistry`, `/financing`, `/implant-supported-dentures`,
  `/oral-surgery`, `/our-team`, `/patient-center`, `/privacy-policy`, `/teeth-whitening`,
  `/terms-conditions`.
- Re-pointed 4: `/our-dental-facility` → `/our-facility`, `/dental-crowns-and-bridges` →
  `/crowns-and-bridges`, and both survey thank-you URLs → `/thank-you`.
- Regenerate with `node .tmp/reconcile.mjs --write`; the rename table it cannot infer lives in
  `RENAMED` at the top of that file.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-migration-seo-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
