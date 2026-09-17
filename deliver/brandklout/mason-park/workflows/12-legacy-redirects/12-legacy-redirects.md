# Workflow: 12 - Legacy Redirects (bestdentistinkatytx.com)

Client instance of [process/14-migration-seo-redirects](../../../../process/14-migration-seo-redirects/14-migration-seo-redirects.md).
It sends every URL of the old `bestdentistinkatytx.com` WordPress site (apex and `www`, http
and https) to its page on **`https://www.masonparkdental.com`**. Each URL gets a single 301.
It is modeled on Stone's `14-migration-seo-redirects` (a Worker, not a Bulk Redirect list).

> [!IMPORTANT]
> **Integrity Rule**: when the map, the scripts or the deploy order change, update this file in
> the same commit. The map lives only in `build-redirects.mjs`. Never edit the generated Worker.

## Client-Facing Overview

The old site's addresses still have links, bookmarks and Google rankings pointing at them. Each
one now lands on the matching page of the new site. An old service page goes to that service,
an old team page goes to the team, and so on.

## State on 2026-09-17

- The **Cloudflare zone is pending**. The domain is registered with Squarespace (Tucows), and
  its nameservers are still `nsc1–4.squarespacedns.com`. The redirects take effect only once the
  registrar's nameservers are changed to **`ajay.ns.cloudflare.com` and
  `ruth.ns.cloudflare.com`**. Nothing in Cloudflare can do that step; someone with the registrar
  login has to do it.
- The old origin (SiteGround, `35.208.39.228`) answers 503 because the site was taken offline
  after the [security incident](../../docs/security-incident-2026-08-24.md). The Worker never
  sends a request to it.
- The following are deployed on the zone:
  - The Worker `mason-park-legacy-redirects`.
  - Its routes, `bestdentistinkatytx.com/*` and `www.bestdentistinkatytx.com/*`.
  - `www` A, proxied. The Worker needs a proxied record to run on.
  - `mail` A `35.208.39.228`, **DNS only**. The live Squarespace DNS has this record, but the
    Cloudflare scan missed it.
- **Email stays on SiteGround.** The MX records (`mx10/20/30.mailspamprotection.com`), SPF,
  `autodiscover` and `mail` were all left as they are.

## The map's rules

| Old URL | Goes to | Category |
| :--- | :--- | :--- |
| A page the new site serves at the same address (71 of them: `/services/*`, `/our-team`, …) | The same path | `same-path` |
| An article, `/<slug>` (161) | `/blog/<slug>` **if production serves it**, otherwise `/` | `article` / `article-pending` |
| `/blog`, `/blog-*` theme layouts, `/category/*`, `/tag/*`, `/author/*` | `/blog` if live, otherwise `/` | `blog` |
| Old service slugs and every `/dental-library/*` entry | The nearest `/services/*` page | `service` |
| `/about*`, `/team*`, `/contact`, `/faq`, `/patient-resources/*`, `/dental-dictionary/<letter>` | The page that replaced them | `practice` |
| `/mpd-invisalign`, `/mpd-new-patient` | `/invisalign`, `/new-patient-special` | `landing` |
| `/portfolio/*`, `/sample`, `/test`, `/shop` (ThemeREX demo pages) | `/` | `theme-demo` |
| Anything else (`/wp-content/…`, `/feed`, unknown) | `/` | `fallback` |

`.tmp/out/redirect-audit.csv` lists the destination of every known URL, one row per URL.

## Run order

Run it from this folder.

```bash
node build-redirects.mjs                     # map + Worker; checks every destination is 200 on www, fails otherwise
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs            # dry run
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs --apply    # DNS, Worker (+ workers.dev preview), routes
node verify-redirects.mjs --via https://mason-park-legacy-redirects.agency-45e.workers.dev   # before activation
node verify-redirects.mjs                    # after activation: apex + www, slash variants, http; ends "FAIL  none"
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs --rollback --apply   # unbind the routes
```

**Once the blog is on production, run `build` and then `deploy --apply` again.** The build checks
each article live, so the 161 `article-pending` rows switch to `/blog/<slug>` on their own. You
do not need to change any code.

### The token

The shared `CLOUDFLAREAPI` key has no zone permissions, and neither does `CLOUDFLAREMASONPARK`.
Mint a short-lived token instead:

1. Call `POST /accounts/{id}/tokens` with a 3-hour expiry.
2. Grant it a zone policy on `bestdentistinkatytx.com` with Zone Read, DNS Write, Workers Routes
   Write, Dynamic URL Redirects Write, Zone Settings Write and Cache Purge.
3. Grant it an account policy with Workers Scripts Write.
4. Revoke it when done with `DELETE /accounts/{id}/tokens/{tokenId}`.

The 2026-09-17 token was revoked the same session.

## Gotchas

- **A pending zone is not served at the edge.** `curl --resolve` to a Cloudflare IP answers 409
  (or fails TLS), so the only way to check the map before activation is the workers.dev preview
  (`--via`).
- **After activation, the edge certificate takes a few minutes.** Until Universal SSL is issued,
  `https://` fails the handshake while `http://` already redirects. Wait for it before running
  `verify-redirects.mjs`.
- **The zone also carries records that are not in the live DNS.** `_dmarc` (`p=quarantine`),
  `google._domainkey`, a proxied `ftp`, and `localhost` are all in the zone but not live (checked
  over DoH on 2026-09-17). They go live when the nameservers change. The one to decide on is
  **DMARC `p=quarantine`**: ask whoever runs the practice's email before switching.
- **Inventory is the 2026-08-05 crawl only (343 URLs).** The process module also wants a Wayback
  CDX sweep, but the Internet Archive was offline on 2026-09-17. URLs the crawl missed still get a
  301, to the home page. Re-run the sweep, add any valuable misses to `TABLE`, and rebuild.
- `verify-redirects.mjs` with no `--via` fails on every row until the zone is active. That is
  the before-state, not a bug.

## Output Artifacts

- `.tmp/out/mason-park-legacy-redirects.js`: the Worker, generated.
- `.tmp/out/redirect-map.json`: the map, `blogLive`, and one audit row per known old URL.
- `.tmp/out/redirect-audit.csv`: the same rows, for the client.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). The scripts and `.tmp/out/` are
committed, because they are the record of what is deployed. No token or secret is ever written
here.
