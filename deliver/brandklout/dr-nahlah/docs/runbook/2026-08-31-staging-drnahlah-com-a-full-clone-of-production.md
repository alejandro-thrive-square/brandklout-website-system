## DONE 2026-08-31: staging.drnahlah.com — a full clone of production, LIVE and VERIFIED, committed `f5e9c66`

Dr. Nahlah now has a real staging environment. It is a complete copy of production —
same 37 pages, 43 posts, 501 media assets, all four plugins — on its own Railway
environment, its own volume, its own domain. Nothing done there can reach the live site.

**Full procedure, measurements and scripts:
[`workflows/18-instatic-staging-clone/`](../deliver/brandklout/dr-nahlah/workflows/18-instatic-staging-clone/18-instatic-staging-clone.md).**
This entry is the live state and the traps; that file is how to do it again.

### Live state

| | |
|---|---|
| staging site | `https://staging.drnahlah.com` (Cloudflare-proxied → Railway) |
| staging admin | `https://staging.drnahlah.com/admin` — same `.env` credentials as production |
| platform host | **deleted** — `dr-nahlah-staging.up.railway.app` now 404s, deliberately |
| Railway | project `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5`, service `Dr Nahlah`, env `staging` |
| `PUBLIC_ORIGIN` (staging) | `https://staging.drnahlah.com` — single door |
| indexing | `X-Robots-Tag: noindex, nofollow` via Cloudflare, staging hostname only |
| canonical on staging | **off** (`emitCanonical: false` on Open Graph) — see below |
| `PUBLIC_ORIGIN` (production) | **unchanged** — five origins, still clean |
| staging owner | `XHvJtb2w5DXnlodWvHqQd` "Alejandro Milano" (production's is `s3cLf3kX8As7JDwesFlIy`) |

Verified: `diff-sites.mjs` reports **37/37 pages content-equivalent, 0 differences**;
posts listing renders all 43 with detail routes 200; origin probe returns **401** for
`staging.drnahlah.com` and **403** for a bogus origin — i.e. a person can actually log in.
Railway reports `Verified: yes`, certificate `VALID`. Production untouched throughout —
`cms.db` mtime never moved and `check-origins.mjs --all` stayed green the whole way.

### Indexing — DONE, and the order it had to happen in

Staging stays **public on purpose**: BugHerd review happens on it, so Cloudflare Access
would break the workflow staging exists for. De-indexed instead:

1. Deleted the generated Railway domain — it bypasses Cloudflare, so no rule could ever
   reach it. Had to go FIRST, because step 3 removes the only thing that protected it.
2. Cloudflare Response Header Transform Rule on zone `drnahlah.com`
   (`f126e891760316b7946887faacf306bd`): ruleset `18e6e6c0ac15437395bfbf71562ce1c6`,
   rule `fbb0a95c55c948708ca9d056f66ff8ba`, expression `http.host eq "staging.drnahlah.com"`,
   sets `X-Robots-Tag: noindex, nofollow`. Verified it fires on staging and NOT on
   `www.drnahlah.com`, `drnahlah.com` or `encorercm.com`.
3. `emitCanonical: false` on staging's Open Graph plugin, then republished.
4. robots.txt deliberately left ALLOWING the crawl — Google must fetch the page to read
   the `noindex`.

`check-noindex.mjs` exits 0: staging de-indexed, production untouched.

### Domain cleanup — three hosts retired from PRODUCTION

`encorercm.com`, `www.encorercm.com` and `dr-nahlah.up.railway.app` were all removed from
the Railway service and from `PUBLIC_ORIGIN`, which is now
`https://www.drnahlah.com,https://drnahlah.com`. All three answer 404; the live site is
healthy and `drnahlah.com` still 301s to `www`.

- **`encorercm.com` had been `PUBLIC_ORIGIN[0]` — the CANONICAL origin** — even though it
  was only ever the Instatic feasibility test. The client's own domain is now first, which
  is what module 20 requires and what decides `expectedOrigin()` and the secure-cookie flag.
- **The encorercm.com DOMAIN was NOT touched.** It carries live Google Workspace email
  (`MX -> smtp.google.com`). Deleting the zone would have killed those mailboxes. Only its
  use as an Instatic origin was removed. It currently 404s — decide whether it should 301
  to drnahlah.com or serve its own thing; a Single Redirect ruleset can be added with the
  `CLOUDFLAREAPI` token (rulesets are writable on that zone; DNS is NOT — the token has no
  DNS permission on any zone).
- **Before retiring any platform host, check `INSTATIC_BASE_URL` in EVERY worktree for
  that client.** Dr. Nahlah's pointed at `www.drnahlah.com` so it was safe.
  **`bk-mason-park` and `bk-mason-park-kids` both point at `mason-park.up.railway.app`** —
  doing the same cleanup on Mason Park without repointing those first breaks the whole
  `18-instatic-embeds` toolkit.
- Module 20 gained a **"Retiring the platform host"** section and its stale
  `Current state` table/values were corrected; `sites.json` updated and re-verified
  (`check-origins.mjs --all` clean) in line with its Integrity Rule.

### Still to do

1. **SSL/TLS → Full (strict)** in Cloudflare. Safe: Railway serves a real Let's Encrypt
   cert with `CN=staging.drnahlah.com`.
2. **The rest of the working tree is still uncommitted** — ~341 files from earlier
   sessions (the portrait-centring fix, design `.tmp` artifacts, BugHerd exports).
   `f5e9c66` deliberately staged only the staging-clone and module-20 paths, so that work
   is untouched and still needs its own commit from whoever owns it.
3. Add staging to `process/20-instatic-domain-origins/sites.json` — `check-origins.mjs`
   now resolves the host and reports `OK`, so this is unblocked.
4. Graduate the workflow to a root `deliver/process/` module before Mason Park uses it.

### The traps — read these before touching staging again

- **A duplicated Railway environment copies `PUBLIC_ORIGIN` verbatim** and does **not**
  copy the volume. So it boots blank *and* listing production's domains — the exact
  module-20 trap: login page renders, login POST 403s. Both were true here on day one.
- **Plugins do not travel in an export bundle.** Staging came up with 0 of 4 and looked
  perfect while missing every canonical, `og:*` and JSON-LD block — 22.8 KB pages instead
  of 45 KB. This is the one that would ship a redesign to production with no SEO layer.
- **Imported collection rows are not live until published one by one.** All 43 posts
  imported with `status: "published"`, the `/posts` page body hashed *identical* to
  production, publish status matched — and the listing rendered **zero** articles with
  every post URL 404. `POST /data/rows/:id/publish` per row, then publish the site.
  (Red herring: the missing `authorUserId` looks exactly like the cause. It is not — the
  importer drops it unconditionally and remapping it changed nothing.)
- **Never clone by volume.** `railway volume files` runs at **170 KB/s** and `cms.db` is
  1.48 GB — ~2.5 h each way. The site document is **4.88 MB / ~3 s**. Production's
  database is ~97% version history: the same site is 40 MB on staging.
- **413 above ~95 MB** on the Railway edge, rejected on Content-Length in ~1 s. The
  media-bearing export is 535 MB and simply cannot be imported whole.
- **Step-up rotates the session cookie.** Use the rotated one or everything after 401s.
- **Cloudflare's managed `robots.txt` is ACCOUNT-WIDE.** `www.drnahlah.com`,
  `staging.drnahlah.com` and `encorercm.com` — two different domains — all serve the
  byte-identical file (sha256 `8fa3036c68bfcbd3`). **Editing it to block staging would
  de-index production.** Use a hostname-scoped Transform Rule, never robots.txt.
- **Never ship `noindex` together with a canonical.** Google can apply the noindex to the
  canonical's target, which is production. `check-noindex.mjs` fails the pair on sight.
- **A `noindex` site must still be crawlable.** Blocking it in robots.txt stops Google
  fetching the page, so it never reads the `noindex` and a linked URL stays indexed.
- **Proton VPN poisons DNS for brand-new subdomains.** `10.2.0.1` served a cached
  NXDOMAIN for `staging.drnahlah.com` long after it resolved fine on `8.8.8.8`, `1.1.1.1`
  and `9.9.9.9`. The browser won't open it and `check-origins.mjs` reports `ENOTFOUND`
  against a host that is demonstrably working. Reconnect the VPN; `ipconfig /flushdns`
  does nothing because the stale entry is upstream. **Do not debug the domain — check
  `nslookup ... 8.8.8.8` first.**
- **Cloudflare proxied (orange) does NOT block Railway domain verification.** Railway
  verifies via the `_railway-verify.*` **TXT** record and Cloudflare never proxies TXT.
  The CLI showed `VALIDATING_OWNERSHIP` for a while purely from lag. Do not grey-cloud.

### Working method worth reusing

`railway ssh -s "Dr Nahlah" -e <env>` works, and the image ships its own TypeScript source
at `/app/server` and `/app/src` with `bun` on PATH. Every question above was settled by
reading the actual handler instead of guessing at the API — that is how the all-or-nothing
publish, the per-row publish route, the argon2id hashing and the 413's true origin were
all found. Also: `bun -e` with `bun:sqlite` gives `VACUUM INTO` for a consistent,
zero-downtime snapshot of a live database (43.8 s for 1.48 GB), which is the correct way
to copy SQLite if you ever must.
