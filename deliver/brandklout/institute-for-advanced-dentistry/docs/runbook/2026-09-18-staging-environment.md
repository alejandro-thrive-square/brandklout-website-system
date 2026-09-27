# 2026-09-18 — staging.ifadentistry.com, a second Instatic instance for the redesign

## Why

The site is about to be redesigned end to end. Instatic's publish is all-or-nothing — one click
replaces **every** public page — so the redesign cannot live as drafts on production: the next
time anyone publishes a typo fix, the half-finished redesign ships with it. A separate instance
is the only way to work on a live site.

Production is untouched by this run. It serves the same bytes it served this morning.

## Done

Followed [`deliver/process/21-instatic-staging-clone`](../../../../process/21-instatic-staging-clone/21-instatic-staging-clone.md),
which is the promoted module (Dr. Nahlah → Mason Park → here, third run).

**The environment** — Railway project `Institute for Advanced Dentistry`
(`3449a121-3580-485b-97f5-8c8903f8e409`), new environment `staging`
(`8afccdc8-a3ec-4e91-9c89-53d25a95b1db`) duplicated from `production`.

1. `environmentCreate` with `sourceEnvironmentId` = production.
2. `PUBLIC_ORIGIN` upserted to `https://staging.ifadentistry.com` — the staging host **alone** —
   with `skipDeploys: true`, *before* anything that could trigger a deploy. A duplicate copies
   production's `PUBLIC_ORIGIN` verbatim, and an instance that only allows production origins
   renders its login page perfectly and then refuses the login POST with `403 invalid origin`.
3. `volumeCreate` at `/app/storage` (`55e39064-0193-4639-b766-4c1fffee7f72`). A duplicated
   environment gets **no volume at all**; without one the whole site is lost on the next deploy.
4. `customDomainCreate staging.ifadentistry.com` (`887b7c85-5658-4a5d-9f9b-e4afcc3d63be`), then
   both Cloudflare records: CNAME `staging` → `vf0ncwno.up.railway.app` created **DNS-only**, and
   TXT `_railway-verify.staging`. Certificate went `VALIDATING_OWNERSHIP` → `ISSUING` → `VALID`
   in ~3 minutes; the CNAME was then flipped to proxied.
5. The Railway service domain the duplicate minted,
   `institute-for-advanced-dentistry-staging.up.railway.app`, was **deleted**. It bypasses
   Cloudflare, so no edge rule can de-index it. Staging now has exactly one door.
6. Admin claimed immediately via `POST /admin/api/cms/setup` with the same
   `INSTATIC_EMAIL`/`INSTATIC_PASSWORD` as production, so one login works on both. Until it is
   claimed, `/setup` is open to anyone who finds the host.

**Kept out of Google** — Cloudflare response-header transform rule
(ruleset `32c523fab5c043a1b1aadbca0075bed3`), `(http.host eq "staging.ifadentistry.com")` →
`X-Robots-Tag: noindex, nofollow`. `robots.txt` deliberately still allows the crawl: Google has to
fetch the page to read `noindex`, and a `Disallow` would block the fetch and leave a linked URL
indexed with no way to remove it. The pages **do** emit a canonical pointing at production — injected at
runtime, so it is invisible to a raw-HTML check — which is exactly the dangerous pairing. It is
dropped on the staging host; see the leak table below.

**Seeded from production**, split path (the archive with media is 289.76 MB, over the ~95 MB
Railway edge wall; the document alone is 12.98 MB):

| Step | Result |
| :--- | :--- |
| `clone-site.mjs --strategy replace` | 59 pages, 4 tables, 59 rows, 2.5 s |
| `pull-media.js` (container → container) | 3,672 files, 511.2 MB in **8.9 s**, 0 failures |
| `chunk-media.py … 70` + `import-media-chunks.mjs` | 820 media rows over 6 chunks, all 200 |
| `clone-plugins.mjs` | `brandklout.embed-origins` v1.6.0 + 6 settings keys — 1 of 1 |
| `publish-rows.mjs --table posts` | 0 of 0 (this site has no collection rows; run it anyway) |
| publish | 59 pages |

**Gates**

- `diff-sites.mjs` — 59 compared, **59 content-equivalent, 0 differences**, `srcset a=639 b=639`.
- `check-noindex.mjs` — exit 0: staging `noindex, nofollow`, production untouched.
- `verify-staging-clean.mjs` — exit 0 over three paths: no canonical, `og:url` or `meta robots`
  pointing off staging, no analytics or call tracking, and production still loading all of it.
  **This is the gate to re-run after any change to either site.**
- `check-origins.mjs --all` — clean; staging registered in
  [`20-instatic-domain-origins/sites.json`](../../../../process/20-instatic-domain-origins/sites.json)
  and reported "serves the admin AND is an allowed origin".
- Spot checks through the edge: `/`, `/dental-services/dental-implants/`, `/about-our-practice/`,
  `/contact-us/` all 200 — the zone's WordPress URL rewrites are path-only, so staging inherits
  them and answers every legacy URL exactly like production. Page CSP is byte-identical to
  production's, Sienna is present, and a sample image returns the same 2,498 bytes on both hosts.

**Four leaks into production's world, found and closed.** All four were live on staging after a
textbook-clean seed, and every one of them had a gate reporting OK over it. Rendering the page is
what found them; reading the HTML did not.

| # | Leak | Fix |
| :--- | :--- | :--- |
| 1 | `000-brandklout-tags.js` gated on `/(^\|\.)ifadentistry\.com$/` — which `staging.ifadentistry.com` passes. GTM `GTM-5XR78DN7` + the GoHighLevel **number pool** fired on every staging page. | `tags/site-tags.js` returns early on `/^staging\./`; pushed and published to staging. |
| 2 | Every page injected `<link rel="canonical" href="https://www.ifadentistry.com/">` **at runtime**, on a host served with `noindex`. This is the one pairing Google can resolve against the canonical's target — production. | `runtime.js` drops canonical/`og:url` on a staging host. |
| 3 | Cloned `<meta name="robots" content="follow, index, …">` contradicting the header. | Same guard. |
| 4 | A second container, `GTM-K8N3JK3Q`, still loading. Its bootstrap is **inline**, and `prepare-wp.mjs` flagged Google scripts by `id`/`src` only, so it was never gated on any host. | `prepare-wp.mjs` now tests the script text too; `runtime.js` also drops tag-bearing inline code on staging. |

Fixes 2–4 live in the clone's `runtime.js`, but staging's bundle was cloned *before* they existed,
so `src/scripts/site.js` was patched in place on staging, by
[`patch-staging-runtime.mjs`](../../workflows/21-instatic-upload/patch-staging-runtime.mjs)
beside `runtime.js`, rather than rebuilding all 59 pages. **Every guard is
host-conditional** — `if (STAGING) …`, never a deletion — so the patched bundle is a no-op on a
production host and safe if it is ever promoted.

Proven by the new gate [`verify-staging-clean.mjs`](../../../../process/21-instatic-staging-clone/verify-staging-clean.mjs),
which renders the page and reads the DOM and the network, on staging **and** production:
all green over `/`, `/contact-us/` and `/dental-services-dental-implants`.

The GoHighLevel **form** still loads on staging, deliberately — reviewers have to be able to submit
it. Its session call goes with it. **Tell anyone reviewing that a test submission lands in the
practice's real GoHighLevel inbox.**

## Gotchas

- **"Is this my production domain" is not a gate.** `staging.ifadentistry.com` satisfies it. Three
  separate places in this codebase had that exact test — the tag asset, the clone runtime's `PROD`
  flag, and `verify-tags.mjs`'s own skip guard — and all three treated staging as production.
  Search for the domain regex, not for the word staging.
- **`verify-tags.mjs` reported `18 FAILED` on staging and was right to.** The tags are off there on
  purpose. Its guard now skips a staging host and points at `verify-staging-clean.mjs`, which
  asserts the opposite. A gate that fails when things are correct gets ignored, and then it is
  worth nothing on the day it fails for a real reason.
- **`check-noindex.mjs` said "production emits no canonical" while all 59 pages emitted one.** It
  parses raw HTML and this site's head is replayed by `site.js` after parse. Its note now says so.
  The rendered-DOM gate is the one to trust.
- **Production's copy of the tag asset and `site.js` is deliberately behind the repo.** The new
  lines are no-ops on a production host, and a production publish bakes all 59 pages, so it was not
  worth spending one on a behaviour-neutral change. Any future legitimate publish carries them.
  This is not drift.
- **Build backslashes in a patch script with `String.fromCharCode(92)`.** A needle containing `\.`
  written through a bash heredoc loses a level of escaping, and the script then reports 0
  occurrences of a line that is demonstrably in the file. That cost a cycle here.
- **`MSYS_NO_PATHCONV=1` on anything taking a `/` argument.** Without it Git Bash turned
  `--paths /` into `C:/Program Files/Git/` and puppeteer reported `ERR_NAME_NOT_RESOLVED` against
  a URL with a Windows path glued to the end of it.
- **`chunk-media.py`'s 90 MB default overshot**: `chunk00` 97.2 MB, `chunk02` 103.3 MB, because the
  13.28 MB manifest is added to *every* chunk. Both imported anyway, but re-chunked at `70` →
  six chunks, largest 83.2 MB. Read the printed sizes.
- **The split path keeps srcset variants; `--media` does not.** `pull-media.js` copies every file
  `find` listed, variants included, so parity was `a=639 b=639` here where Mason Park's one-shot
  clone scored `a=715 b=0`. The module doc previously read as if variants never travel.
- **`skipInitialDeploys: true` does not prevent a deploy** — `volumeCreate`/`customDomainCreate`
  trigger one. Harmless only because `PUBLIC_ORIGIN` was set first.
- **Mason Park's staging minted no service domain; this one did.** Always check `serviceDomains`.
- **Local DNS lied for the first few minutes.** The VPN cached NXDOMAIN, and after the proxy flip a
  stale cache still pointed at Railway directly. `curl --resolve staging.ifadentistry.com:443:104.21.1.28`
  is what proves edge behaviour — testing without it silently bypasses every Cloudflare rule.
- **The Cloudflare token minted for this run was revoked** (`1520296bce6b7cb153046a448c768fd4`).
  The shared `CLOUDFLAREAPI` has no zone permissions; mint a scoped one, use it, revoke it.

## Next

- The redesign happens on `https://staging.ifadentistry.com/admin`, not on production.
- **Promotion is `clone-site.mjs --strategy merge-overwrite`, never `--media`** — a media-bearing
  import would rewrite production's media rows and destroy its srcset variants. Run `diff-sites.mjs`
  after.
- **Decide what happens to the WordPress URL rewrites.** The zone rewrites `/dental-services/*` and
  five other patterns on *every* host, so a redesign that changes URL structure will be fighting
  them on staging before it ever reaches production. They are in
  [`docs/dns/URL-RULES.md`](../dns/URL-RULES.md).
- Nothing else about production changed; its open items are still in [`../RUNBOOK.md`](../RUNBOOK.md).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). No secrets here: ids and hostnames
only.
