# Workflow: 14 - Migration SEO & Redirects (Stone Surgical Arts)

Client instance of [process/14-migration-seo-redirects](../../../../process/14-migration-seo-redirects/14-migration-seo-redirects.md).
It sends every URL of the old `stonesurgicalarts.com` WordPress site to its page on
**`https://www.dfwsurgicalarts.com`**, one hop, 301.

> [!IMPORTANT]
> **Integrity Rule**: a change to the map, the scripts, or the deploy order is documented here in
> the same commit. The map lives in `build-redirects.mjs` and nowhere else. Never edit the
> generated Worker.

## Client-Facing Overview

The old site's addresses still have links and search rankings behind them. Today every one of them
lands on the new home page. After this, each lands on the matching page: a neck lift page goes to
the neck lift, and an old article goes to its new version.

## What is there today

- `stonesurgicalarts.com` is a zone on the Brandklout Cloudflare account.
- It carries one **Single Redirect**, expression `true`, which sends every path to
  `https://dfwsurgicalarts.com` and drops the path.
- The apex A record (a Squarespace IP) and the `www` CNAME (`cdn.webflow.com`) are proxied, but
  nothing ever reaches either origin.

## Why a Worker, not the Bulk Redirect list the process module uses

- **Single Redirects run before Bulk Redirects**, so no list could fire while the catch-all rule
  exists.
- **Without the rule, a list needs its own catch-all row.** Cloudflare's documentation does not say
  which row wins when an exact URL and a catch-all both match.
- **A Worker makes the order explicit:**
  1. the exact old URL,
  2. then the longest matching old section,
  3. then the home page.
- **It also avoids the account-level `http_request_redirect` phase**, which carries Dr. Nahlah's
  live list.
- **The build tests what ships.** `resolve()` is embedded into the Worker by source, so the build's
  check against every known old URL exercises the code that is deployed.

## The map's rules

| Old URL | Goes to | Category |
| :--- | :--- | :--- |
| An article from `old-blog/` or `news/` | Its adaptation, derived from `source` in `blog-data.mjs` | `article` |
| A procedure with its own page | That page (`/neck-lift`, `/blepharoplasty`, `/myellevate-neck-lift`, `/face-and-neck-lift`) | `procedure` |
| Any other surgical procedure | `/treatments`, which lists it with its fee | `procedure` |
| Skin and non-surgical | `/treatments` | `procedure-provisional` |
| Before/after, testimonials | `/results` | `results` |
| Contact, booking, financing, pre-op | `/book` | `booking` |
| Oral surgery and implants | `/` | `out-of-scope` |
| Privacy, HIPAA, terms, ADA | `/` | `no-equivalent` |
| Anything else | `/`, as today | `fallback` |

The treatment of each group was decided, or left open, as follows:

- **Oral surgery is out of scope by decision (2026-09-15).** This site is Stone Surgical Arts
  only. The implant center is a separate project, so no URL is sent to it.
- **Skin and non-surgical is undecided.** There are 19 URLs in this group. `/treatments` does list
  those services with fees, so they land somewhere true, but where that pillar should send people
  was never settled. Moving them means changing the `PP` rows and rebuilding.
- **The new site has no privacy or HIPAA page.** Those old URLs have nowhere better to go than the
  home page. That gap is a site problem, not a redirect one.

## Run order

```bash
node build-redirects.mjs          # map + Worker; fails if any destination is not 200 live
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs            # dry run
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs --apply
node verify-redirects.mjs         # every old URL, apex and www, with and without the slash; ends "FAIL  none"
CLOUDFLARE_API_TOKEN=... node deploy-redirects.mjs --rollback --apply   # puts the catch-all back
```

**The deploy order matters.** The catch-all runs before Workers, so the steps go:

1. Upload the Worker.
2. Bind its routes: `stonesurgicalarts.com/*` and `www.stonesurgicalarts.com/*`.
3. Save the rule to `.tmp/out/backup-dynamic-redirect.json`.
4. Remove the rule.

There is no moment with no redirect at all.

### The token

The shared `CLOUDFLAREAPI` key has **no zone permissions**, so it cannot read or change the
catch-all rule. Mint a short-lived token from it instead:

- Call `POST /accounts/{id}/tokens`.
- Zone policy, on `stonesurgicalarts.com`: Workers Routes Write and Dynamic URL Redirects Write.
- Account policy: Workers Scripts Write.
- Keep the value out of the repo, and revoke the token with `DELETE /accounts/{id}/tokens/{tokenId}`
  when done.

## Gotchas

- **`verify-redirects.mjs` fails on every row until the deploy.** Before it, every URL answers 301
  to `https://dfwsurgicalarts.com` with the path dropped. That is the before-state the verifier is
  there to replace, not a verifier bug.
- **`/≡`, `/wp-login.php`, `/robots.txt`** and the other system URLs fall back to the home page on
  purpose. Google treats a home-page redirect for a dead URL as a soft 404, which is the honest
  answer.
- **One article source slug contains a comma**
  (`oral-surgery-stone-gentle,-expert-care-…`). It is matched after `decodeURIComponent`, so the
  `%2C` form works too. That is why the map is JSON inside the Worker and not a comma-separated
  list.

## Output Artifacts

- `.tmp/out/stone-legacy-redirects.js`: the Worker, generated.
- `.tmp/out/redirect-map.json`: the map, plus one audit row per known old URL.
- `.tmp/out/redirect-audit.csv`: the same rows, for the client.
- `.tmp/out/backup-dynamic-redirect.json`: the removed catch-all rule, written by `--apply` and
  read by `--rollback`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). The scripts and every file in
`.tmp/out/` are committed; they are the record of what is deployed. No token or secret is ever
written here.
