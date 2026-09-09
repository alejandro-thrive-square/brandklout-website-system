# Workflow: 19 - Cloudflare Launch (sitemap, 301 map, canonical host)

## Client-Facing Overview
When a site moves onto Instatic, three things have to exist at the edge that Instatic itself cannot provide: an XML sitemap, the 301 map from the old platform's URLs, and one canonical hostname. This module ships all three to Cloudflare, generated from the live build and verified against production before anyone calls it done.

> [!IMPORTANT]
> **Integrity Rule**: Any change to these scripts, the config shape, or the deployment order must be documented here immediately, and mirrored into [PROCESS_INDEX.md](../PROCESS_INDEX.md) when routing changes.

## Operational Purpose

Instatic **0.0.16** (= current `github.com/corebunch/instatic` `main`) serves no sitemap, emits no `<link rel="canonical">`, and has no redirect layer. Verified against the source and the docs, not inferred:

- `docs/features/publisher.md` documents `<head>` assembly exhaustively — ten items, none of them canonical, `og:`, `twitter:` or `robots`.
- `/sitemap.xml`, `/sitemap_index.xml` and `/sitemap.txt` all 404. There is no route.
- `SiteSettings` carries only `metaTitle`, `metaDescription`, `faviconUrl`, `language`.

Every alternative to Cloudflare is closed on documented grounds:

| Option | Why not |
|---|---|
| A page with slug `sitemap.xml` | the publisher always wraps output in an HTML shell |
| Ship the XML as a plugin asset | `/uploads/*` is served with `nosniff` + `attachment` for non-inert MIME types |
| A plugin public route | mounts under `/admin/api/cms/plugins/<id>/runtime/*`; still needs an edge rewrite |
| Cloudflare Snippets | Pro and above |
| **Cloudflare Worker** | **works on Free, owns the path directly** |

The one native primitive that exists is the `site.pages` loop source (`docs/features/loops.md`, *"used by sitemaps"*), but it renders through the publisher and therefore produces an HTML index page, not XML. Worth building anyway as an internal-linking asset — it is not a substitute.

## Setup

```bash
cd deliver/<client>/workflows/14-migration-seo-redirects   # or wherever the client instance lives
cp <this module>/cloudflare-launch.config.example.json cloudflare-launch.config.json
```

Fill in `apex`, `canonicalHost`, `workerName`, `listName`, and the `subpathProbes` for that site's old CMS. Then add to the **repo-root `.env`**:

```
CLOUDFLARE_API_TOKEN=...        # CLOUDFLAREAPI is also accepted
```

### The API token

Create it under **Manage account → Account API tokens**. Minimum scopes:

| Scope | Permission | For |
|---|---|---|
| Account | Workers Scripts → Edit | uploading the Worker |
| Account | **Account Filter Lists** → Edit | the Bulk Redirect *list* |
| Account | Mass URL Redirects → Edit | the Bulk Redirect *rules* |
| Account | Account Rulesets → Edit | the rule that activates the list |
| Zone | Workers Routes → Edit | binding `/sitemap.xml` |
| Zone | Zone → Read | resolving the zone id |
| Zone | Dynamic URL Redirects → Edit | the apex → www redirect |

Scope the zone policy to **that client's zone only**. The token otherwise sees every zone on the Brandklout account.

## Run order

```bash
node ../15-instatic-api-sync/.tmp/inventory.mjs         # pages, from the live build
node ../15-instatic-api-sync/.tmp/inventory-posts.mjs   # posts
node .tmp/live-status.mjs                               # what actually 200s

node build_cloudflare.mjs        # -> .tmp/out/{sitemap.xml, *-cloudflare-301.csv, sitemap-worker.js}
node verify_cloudflare.mjs --live

node deploy-worker.mjs --apply
node deploy-redirects.mjs --apply
node deploy-canonical-host.mjs --apply
node verify-live.mjs             # replays EVERY redirect row against production
```

Every `deploy-*` script is a dry run without `--apply`, and every one is idempotent.

## The seven things that cost a live mistake on Dr. Nahlah (2026-08-25)

1. **Never route `/robots.txt` through the Worker.** On a Cloudflare zone the content-signals `robots.txt` is generated **at the edge**, not by Instatic. Proof: a sibling zone on the same Instatic instance with no Worker route still returns the full file. Put a Worker on that path and its origin fetch 404s, the fallback fires, and the policy is **replaced** — observed 1248 B → 70 B in production. `deploy-worker.mjs` therefore binds `/sitemap.xml` only. Consequence: robots.txt carries no `Sitemap:` line, so submit the sitemap directly in Search Console and Bing.
2. **`http_request_dynamic_redirect` runs BEFORE `http_request_redirect`** — backwards from the names. Single Redirects beat Bulk Redirects, so an old URL arriving on the apex takes two hops. Measured, not assumed.
3. **A redirect-kind list cannot be referenced in a boolean expression.** `... and not (http.request.full_uri in $list)` is rejected with `20127`. Redirect lists are reachable only through `from_list` on a Bulk Redirect rule. This is why (2) is not worked around — enumerating the paths in the host rule would duplicate the redirect map into a second place nothing regenerates.
4. **Two objects, not one.** A Bulk Redirect *list* does nothing alone; the account-level *rule* is what makes traffic follow it. This is the "I uploaded the CSV and nothing happened" bug.
5. **The list permission is not the rules permission.** `Mass URL Redirects` covers the rules; the list needs **`Account Filter Lists`** (shown as `Account Rule Lists` in the newer UI). Missing it gives `403 10000: Authentication error`, which reads like a bad token.
6. **Account-owned tokens 401 on `/user/tokens/verify`** while being perfectly valid. Verify at `/accounts/{id}/tokens/verify`, or just exercise a real read.
7. **`preserve_path_suffix` defaults to TRUE.** With `subpath_matching` on, the default sends `/blog/some-post` → `/target/some-post`, 404ing every subpath hit from a CSV that looks correct. Force it FALSE.

Also: the CSV must have **no header row**, `source_url` must carry a hostname and no query string, and every rule is emitted twice (bare + trailing slash) because Instatic serves `/foo` and `/foo/` both as 200 — Webflow used to strip the slash before matching and does not here.

## Cost and scaling

Cloudflare **zones are free at any count**. The binding limits are the Bulk Redirect quotas, and the trap is that they are **per account**, not per zone — and they *"depend on the highest Cloudflare plan on your account"*.

| | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| Bulk Redirect **rules** | 15 | 15 | 15 | 50 |
| Bulk Redirect **lists** | 5 | 5 | 5 | 25 |
| **URL redirects across lists** | 10,000 | 25,000 | 50,000 | 1,000,000 |

Single Redirects are **per zone** (Free: 10 rules), so the canonical-host rule never scales into a problem. Workers: 100 scripts/account and 100,000 requests/day on Free.

**Baseline from Dr. Nahlah: 190 URL redirects per site** (104 rules, doubled for trailing slashes), 1 list, 1 rule, 1 Worker, 1 Single Redirect.

- **20 sites** — ~3,800 redirects. Fits Free with 62% headroom. **$0.**
- **200 sites** — ~38,000 redirects. Exceeds Free (10k) **and Pro (25k)**; needs Business.

**Consolidate lists from day one.** With a 5-list account cap, one list per site breaks at the sixth site. `source_url` carries the hostname, so a single list holds many sites — partition by client batch, not per site.

Because the quota follows the **highest** plan on the account, the upgrade is **one zone**, not all of them.

## Version Control

Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md). The generated artefacts in `.tmp/out/` are worth committing — they are the record of what was deployed. Never commit `cloudflare-launch.config.json` if it ever gains a secret; the token lives only in the repo-root `.env`.
