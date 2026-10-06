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

## Cloudflare delivery (Dr. Nahlah, 2026-08-25) — supersedes the Webflow CSV

**Webflow is not the platform for this project.** The redirect map ships to **Cloudflare Bulk
Redirects** against the Instatic build. `build_redirects.py` emitted Webflow's two-column
"Import 301 redirects" format with `(.*)` wildcards; none of that is Cloudflare's format. Use
`build_cloudflare.mjs` + `verify_cloudflare.mjs` for delivery. The old script is kept because its
**mapping decisions** (the Wayback CDX sweep, the per-URL judgement calls) are read back in from
`.tmp/drnahlah-301-redirects-audit.csv` rather than re-guessed.

```bash
node ../15-instatic-api-sync/.tmp/inventory.mjs        # pages, from the live build
node ../15-instatic-api-sync/.tmp/inventory-posts.mjs  # posts
node .tmp/live-status.mjs                              # what actually 200s
node build_cloudflare.mjs                              # -> .tmp/out/
node verify_cloudflare.mjs --live                      # 32 assertions
```

### Rules that were Webflow's job and are now ours

These are the ones that silently produce a broken map if carried over unchanged.

1. **Trailing slashes must be emitted.** Rule 2 above ("never emit trailing slashes") is a
   *Webflow* rule — Webflow 301s `/foo/` → `/foo` itself, before redirect matching. **Instatic does
   not**: `/veneers` and `/veneers/` both return 200. The old site was WordPress, whose default
   permalinks carry a trailing slash, so the slashed form is what is indexed and linked. Emit both.
2. **`preserve_path_suffix` defaults to TRUE and must be forced FALSE.** With `subpath_matching`
   on, the default sends `/blog/some-post` → `/posts/some-post`, which does not exist. That is a
   404 on every subpath hit, and the CSV looks perfectly correct.
3. **No regex.** Cloudflare Bulk Redirects has no wildcards. `/blog/(.*)` becomes one row with
   `subpath_matching=TRUE`, which matches the source URL *and* everything beneath it — so the bare
   `/blog` row folds into the same row.
4. **CSV has no header row**, and `source_url` must carry a hostname and no query string. Column
   order is `SOURCE_URL,TARGET_URL,STATUS_CODE,PRESERVE_QUERY_STRING,INCLUDE_SUBDOMAINS,SUBPATH_MATCHING,PRESERVE_PATH_SUFFIX`.
5. **`include_subdomains=TRUE` on the apex** covers `www` and the apex in one row. Needed here
   because both hosts serve the site byte-identically.
6. **Limits are not a constraint.** Free plan allows 10,000 URL redirects across 5 lists.

### The sitemap has to be served by something

Instatic 0.0.16 has **no sitemap route** — `/sitemap.xml`, `/sitemap_index.xml` and `/sitemap.txt`
all 404 — and Cloudflare has no "upload a static file" slot. `build_cloudflare.mjs` therefore also
emits `.tmp/out/sitemap-worker.js`: a Worker serving `/sitemap.xml` plus a `robots.txt` that names
it, with everything else falling through to the origin. The origin's robots.txt is Cloudflare's
default content-signals file and contains **no `Sitemap:` line and no `User-agent` rule at all**.

### Exclude the entry template from the sitemap

The `posts` entry template is a row in the `pages` table with slug `post`. It has no public URL and
returns **404** in production. It must be filtered out of the sitemap, or the sitemap ships a known
dead URL. Filter on `cells.templateEnabled === true`, not on a slug name.

### Still open on this site (not redirect bugs, but they cost the same traffic)

- **Apex and `www` both serve 200, byte-identical, with no canonical and no redirect.** Duplicate
  content across two hosts. Fix with one Redirect Rule, apex → `https://www.drnahlah.com`.
- **Trailing-slash URLs serve 200 rather than redirecting**, and `/index` duplicates `/`. A
  normalising Redirect Rule would fix the class; the CSV covers the inventoried URLs either way.
- The publisher emits **no `<link rel="canonical">`** on any page, which is what would otherwise
  have absorbed both problems.

## DEPLOYED to Cloudflare 2026-08-25 — live on drnahlah.com

Account `45ec80048aabfb983a20f415546f62c7`, zone `drnahlah.com`
`f126e891760316b7946887faacf306bd` (**Free plan** — everything below fits Free).

| What | Where | Verify |
|---|---|---|
| Worker `drnahlah-seo` serving `/sitemap.xml` | routes on `www.` and apex | 200, `application/xml`, 79 URLs |
| Bulk Redirect list `drnahlah_301` (190 rows) | account list `5b3c18e4409c48cb84a9ff2fb10b99ae` | 190/190 land correctly |
| Bulk Redirect rule | account `http_request_redirect` ruleset `17b28c4e41c842958e5ec3016bd49ca8` | — |
| apex → www Single Redirect | zone `http_request_dynamic_redirect` ruleset `45a726dfdb624887b1bfe0480620c46e` | 301, query string preserved |

Scripts: `cf-api.mjs` (token from repo-root `.env`), `deploy-worker.mjs`,
`deploy-redirects.mjs`, `deploy-canonical-host.mjs` — all with `--apply` gates —
and `verify-live.mjs`, which replays **all 190** rows against production
(**210 assertions, 0 failures**).

### Gotchas earned here, all of which cost a live mistake or a 4xx

1. **Do NOT route `/robots.txt` through a Worker.** The content-signals
   `robots.txt` on this site is generated by **Cloudflare at the edge**, not by
   Instatic — proven by `encorercm.com/robots.txt` (same app, no Worker route)
   still returning the full 1248 bytes. A Worker on that path runs first, its
   origin fetch 404s (Instatic serves no robots route), and the fallback
   **replaces** the policy. Observed live: 1248 B → 70 B. Routes removed;
   robots.txt has no `Sitemap:` line as a result, which is an acceptable trade.
   **2026-10-05:** the Worker now embeds the policy verbatim (`CF_POLICY`) and
   appends only the `Sitemap:` line, so the `www.drnahlah.com/robots.txt*` route
   is safe to bind. It was bound, along with `sitemap.xml*`, on 2026-10-05. No
   token we hold may write zone Workers Routes or rulesets
   (`CLOUDFLAREDIAGNOSIS` reads everything but writes nothing), so route changes
   are made in the dashboard (Codex computer use). If Cloudflare changes its policy text, re-copy it.
2. **`http_request_dynamic_redirect` runs BEFORE `http_request_redirect`.**
   The opposite of what the phase names suggest. So a Single Redirect fires
   ahead of Bulk Redirects, and an old URL arriving on the apex takes two hops.
   Measured, not assumed.
3. **A redirect-KIND list cannot be used in a boolean expression.**
   `... and not (http.request.full_uri in $drnahlah_301)` is rejected with
   `20127: the redirect list is not allowed`. Redirect lists are reachable only
   through `from_list` on a Bulk Redirect rule. This is why gotcha 2 is not
   worked around — see `deploy-canonical-host.mjs` for why enumerating the paths
   instead would be worse.
4. **Two Cloudflare objects, not one.** A Bulk Redirect *list* does nothing by
   itself; the account-level *rule* in `http_request_redirect` is what makes
   traffic follow it.
5. **The permission for the list is not the permission for the rules.**
   `Mass URL Redirects` covers the rules; `/accounts/*/rules/lists` needs
   **`Account Filter Lists`** (shown as `Account Rule Lists` in the newer token
   UI). Missing it gives `403 10000: Authentication error`, which reads like a
   bad token rather than a missing scope.
6. **Account-owned tokens 401 on `/user/tokens/verify`.** Tokens created under
   *Manage account → Account API tokens* are not user tokens; verify them at
   `/accounts/{id}/tokens/verify`. A 401 there does not mean the token is bad —
   check a real read like `/zones` before concluding anything.
7. **The token sees every zone on the account** (7 Brandklout clients). Every
   script here hard-codes `drnahlah.com` and `deploy-redirects.mjs` refuses any
   row whose source or target is not that domain.

8. **Old WordPress sitemap URLs go in the Bulk Redirect list** (`redirect-legacy-sitemaps.mjs`).
   Search Console keeps a migrated site's old `sitemap_index.xml` / `*-sitemap.xml`
   entries and reports "Couldn't fetch" while they 404. A 301 to `/sitemap.xml`
   clears it without touching Search Console. Before blaming Cloudflare, check
   GraphQL `httpRequestsAdaptive` for Googlebot (`clientAsn` 15169) on `%sitemap%`:
   on 2026-10-05 the live sitemap was a 200 to Google and only the legacy URLs 404'd.

### Still open

- **`/sitemap.xml` is a snapshot.** Re-run `build_cloudflare.mjs` then
  `deploy-worker.mjs --apply` whenever the build gains or loses a page.
- **Trailing slashes still serve 200** (`/veneers/` and `/veneers`), and
  `/index` duplicates `/`. Normalising needs regex in a Single Redirect, which
  is **Business+**. The CSV covers both forms of every inventoried old URL, so
  this only affects URLs nobody linked to.
- **No `<link rel="canonical">` on any page** — the publisher emits none. This
  is the one remaining duplicate-content gap and the reason to build the
  `publish.html` SEO plugin.

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
