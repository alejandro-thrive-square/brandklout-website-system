# Process 21 - Instatic Staging Clone & Promotion

> [!IMPORTANT]
> **Integrity Rule**: any change to the clone procedure, the scripts, or the list of things
> that do not travel must be documented here in the same commit.

> [!NOTE]
> **This module graduated from a client workflow on 2026-08-31.** It was proven on
> Dr. Nahlah as `deliver/brandklout/dr-nahlah/workflows/18-instatic-staging-clone/`, then
> run a second time for Mason Park, which is what promoted it here. The Dr. Nahlah copy is
> the historical record of the first run; **this file is the one to follow**. Two things
> changed in the move: `pack-plugin.mjs` is now vendored beside `clone-plugins.mjs` (a root
> module cannot reach into one client's workflow folder), and `clone-site.mjs` gained
> `--media`.

## Client-Facing Overview

The client edits a real, complete copy of their site at `staging.<their-domain>` - same
pages, same posts, same images, same design - and nothing they do there can touch the live
site. When a change is approved, it is pushed to production in about three seconds.

## Operational Purpose

Instatic's publish is all-or-nothing. From `server/handlers/cms/publish.ts`:

> *"Publish is step-up gated because it's the single highest-blast-radius site action -
> **one click replaces every public page on the live host**."*

So a long piece of work cannot live as drafts on production: the moment anyone publishes a
one-word typo fix, the half-finished redesign ships with it. **A separate instance is not a
nicety, it is the only way to work on a live site.**

## The rule that governs everything here

> **Move the DOCUMENT, never the VOLUME.**

| | via Railway volume | via export/import API |
|---|---|---|
| Dr. Nahlah site document | 1,480 MB @ **170 KB/s** = ~2.5 h down + ~2.5 h up | **4.88 MB, ~3 s** |
| Dr. Nahlah media | 3,478 files, ~3 s each = hours | 670 MB in **10.3 s** (container-to-container) |
| Mason Park, everything | 358 MB volume | **29.4 MB, 5.5 s export + 3.9 s import** |

Dr. Nahlah's volume is 5.2 GB because `cms.db` is 1.48 GB, and `VACUUM INTO` proves that is
real data, not free pages - it is version history. The *current site* is 4.88 MB. Re-imported
onto staging it occupies **40 MB**: production's database is ~97% history.

## Sizing the job FIRST - it decides which of two paths you take

Ask the source before you plan anything:

```bash
node clone-site.mjs --from <prod> --dry            # writes the bundle, imports nothing
```

or read `POST /admin/api/cms/export/estimate` directly with `{includeMedia:true}`.

| Archive with media | Path | Steps |
|---|---|---|
| **under ~95 MB** | **one shot** | `clone-site.mjs --media --strategy replace` |
| over ~95 MB | split | `clone-site.mjs` (no media) + `pull-media.js` + `chunk-media.py` + `import-media-chunks.mjs` |

Mason Park is 29.4 MB, so one import carried the document, the media rows **and** the media
bytes. Dr. Nahlah is 535 MB and cannot: the Railway edge answers **413 on Content-Length in
~1 s**, before the body is even sent. That wall - not Instatic - is why the three-step path
exists. (Instatic's only related cap is `MAX_ARCHIVE_MANIFEST_BYTES = 256 MB`, applied to the
manifest entry, which is ~5 MB.)

Do not reach for the split path because the doc describes it. Measure first.

## What a Railway "duplicate environment" actually gives you

It copies the service, image, domain *config* and **every variable**. It does **not** copy
the volume - which is where the entire site lives. A duplicated environment therefore boots
as a **blank Instatic install** asking you to create an admin account.

> [!WARNING]
> It copies `PUBLIC_ORIGIN` **verbatim**, so the new environment is born listing only the
> *production* domains. That is the trap from
> [process/20-instatic-domain-origins](../20-instatic-domain-origins/20-instatic-domain-origins.md):
> the staging login page renders perfectly and the login POST is refused `403 invalid
> origin`. Fix `PUBLIC_ORIGIN` **before** anyone is given the link. Confirmed again on Mason
> Park, which was born holding all three production origins.

The volume **id** is shared across environments (it is a project-level record) while each
environment holds its own **instance**. Seeing production's `RAILWAY_VOLUME_ID` in staging's
variables is correct and does not mean they share data.

## The six things that DO NOT travel in an export bundle

Each one fails silently and looks like nothing.

| # | Missing | What you see | Fix |
|---|---|---|---|
| 1 | **Plugins** | canonical, `og:*`, JSON-LD all absent; 22.8 KB pages instead of 45 KB | `clone-plugins.mjs` |
| 2 | **Media bytes** | every image 404s | `--media`, or `pull-media.js` |
| 3 | **Media rows** | media library empty | `--media`, or `chunk-media.py` + `import-media-chunks.mjs` |
| 4 | **srcset variants** | no responsive images (visually identical) | *no fix - accept* |
| 5 | **Users / authorship** | `authorUserId` becomes `null` | *no fix - accept* |
| 6 | **Row publish state** | collection listing renders **0** items, detail URLs **404** | `publish-rows.mjs` |

### 1. Plugins - the dangerous one

Both clients run the same four: **AEO Schema, Open Graph, Link Editor, Embed Origins**. A
cloned site comes up with **zero** and looks completely fine.

`canonical` and `og:url` are *not* baked into page content and are *not* derived from
`PUBLIC_ORIGIN` - they come from the Open Graph plugin's `siteUrl` **setting**. Install the
plugin without its settings and you get the plugin but not the tags.

The consequence to be afraid of: a redesign approved on a plugin-less staging site ships to
production with **no schema, no OG tags and no canonicals**, and nothing anywhere says so.

Make "plugin count matches" a gate in both directions.

### 4. Variants - why we accept it

Variants are generated at upload and are not in the bundle, **even with `--media`**. Measured
on Mason Park: production `/uploads` is 902 files / 41 MB, the clone is 153 files / 18 MB -
the 153 are the originals, the other 749 are `-w320`/`-w1024`/`-w1536` variants. `diff-sites.mjs`
reports `srcset a=715 b=0` and passes, because the same `src` is served at the same
width/height with no `srcset`: visually identical, larger transfer.

The only regeneration route is `POST /media/:id/replace`, which the source itself calls
*"uniquely dangerous"* and which rewrites storage paths - it would break every asset
reference to recover a performance optimisation. Not worth it.

**This is also the safety property that makes promotion safe**: promote without media and
production's media rows and variants are never touched. `clone-site.mjs` enforces that -
`--media` refuses any strategy but `replace`.

### 6. Row publish state - the subtlest one

`status: published` on an imported row is *metadata*, not a published *revision*. Site
publish covers the `pages` table; collection rows each need `POST /data/rows/:id/publish`.

On Dr. Nahlah, staging had all 43 post rows marked published, the `/posts` page body hashed
**identical** to production, publish status matched - and `/posts` rendered **zero** articles
with every post URL 404. Nothing warns you.

> [!CAUTION]
> A false lead to skip: production's posts carry `authorUserId` and staging's are `null`,
> which looks exactly like the cause. It is not. The importer drops `authorUserId`
> unconditionally - remapping every reference and re-importing changed nothing.

**Mason Park has no collection rows at all** (78 pages, `posts`/`components`/`layouts` all
empty - its articles are pages), so `publish-rows.mjs` correctly reported `0 of 0`. Run it
anyway; a no-op is the point.

## Procedure

### A. Stand up the environment (once per client)

1. Railway -> project -> **New Environment**, duplicate production. Via API:
   `environmentCreate(input: {name, projectId, sourceEnvironmentId})`.
2. **Fix `PUBLIC_ORIGIN` immediately** - staging hosts only, canonical first.
   ```bash
   railway variables --set "PUBLIC_ORIGIN=https://staging.<client>.com" \
     --service "<Service>" --environment staging
   ```
   Changing it triggers a fresh deployment; confirm one appears.
3. Add the custom domain:
   ```bash
   railway domain staging.<client>.com --service "<Service>" --environment staging
   ```
4. Add **both** DNS records in Cloudflare - the CNAME *and* the ownership TXT. Proxied
   (orange) is correct; ownership is verified via TXT, which Cloudflare never proxies.
5. Create the admin - a duplicated environment has none. Check
   `GET /admin/api/cms/setup/status` says `needsSetup: true`, then
   `POST /admin/api/cms/setup {siteName, email, password (>=12), displayName}`.
   Use the **same credentials as production** so one login works on both.
6. **Keep staging out of Google** - see below. Not optional, and its order matters.

> [!WARNING]
> **Railway will not route the domain until ownership is verified**, and until then every
> request - including a direct `Host:`-override probe at the `*.up.railway.app` target -
> answers `404 {"message":"Application not found"}` while the container is demonstrably
> running and listening. That looks exactly like a broken deploy. Check
> `status { verified }` before debugging anything else.

> [!CAUTION]
> **The verification TXT is not in `status.dnsRecords`.** That array carries only the
> traffic CNAME (`purpose: DNS_RECORD_PURPOSE_TRAFFIC_ROUTE`). The TXT lives on
> `status.verificationDnsHost` + `status.verificationToken`, and if you never ask for those
> two fields you will never see the record you are missing.
> ```graphql
> customDomain(id: $id, projectId: $p) {
>   status { verified verificationDnsHost verificationToken certificateStatus }
> }
> ```

### B. Seed it

```bash
# small site (archive under ~95 MB) - one shot, carries media rows AND bytes
node clone-site.mjs --from <prod> --to <staging> --strategy replace --media

# large site - document first, then media separately
node clone-site.mjs --from <prod> --to <staging> --strategy replace
#   media bytes -> see pull-media.js header for the three railway ssh commands
python chunk-media.py ./.tmp/prod-full.zip ./chunks
node import-media-chunks.mjs --to <staging> --chunks ./chunks

# always, both paths:
node clone-plugins.mjs --from <prod> --to <staging> --files ./.tmp/plugins
node publish-rows.mjs --site <staging> --table posts
#   publish the site, then prove it:
node diff-sites.mjs --a <prod> --b <staging>
```

Plugin CODE is not downloadable over the API - pull it off the source container first
(200-252 KB for all four):

```bash
MSYS_NO_PATHCONV=1 RAILWAY_PROJECT_ID=<id> railway ssh -s "<Service>" -e production \
  "sh -lc 'tar czf - -C /app/storage/uploads/plugins . | base64 -w0'" \
  | grep -v '^Using SSH' | tr -d '\r\n' > .tmp/all.b64
base64 -d .tmp/all.b64 > .tmp/all.tgz
mkdir -p .tmp/plugins && tar xzf .tmp/all.tgz -C .tmp/plugins
```

### C. Promote

```bash
node clone-site.mjs --from <staging> --to <prod> --strategy merge-overwrite --rows about,contact
node publish-rows.mjs --site <prod> --table posts   # only if collection rows moved
# publish, then:
node diff-sites.mjs --a <staging> --b <prod>
```

`merge-overwrite` + `--rows` moves only what you changed and leaves the client's other edits
alone. `replace` derives deletions server-side (stored - shipped) and is a whole-site
cutover - highest blast radius, use deliberately. **Never `--media` in this direction.**

## Keeping staging out of Google

Staging stays **public** - BugHerd review is done on it, so an auth gate (Cloudflare Access)
would break the very workflow it exists for. So it must be de-indexed instead, and
de-indexing has an order dependency that will bite you if you improvise it.

> [!CAUTION]
> **Do NOT edit Cloudflare's managed `robots.txt`.** It is served **account-wide**. Measured
> 2026-08-31: `www.drnahlah.com`, `staging.drnahlah.com` and `encorercm.com` - three
> hostnames across two different domains - all returned the byte-identical file (sha256
> `8fa3036c68bfcbd3`, 1248 bytes). Adding `Disallow: /` there takes **production** out of
> Google, and the only symptom is a practice quietly losing its rankings.

**In this order:**

1. **Delete the generated Railway domain** and drop it from `PUBLIC_ORIGIN`. It does not
   pass through Cloudflare, so no rule can ever reach it - it is the one door that cannot be
   protected. It must go *first*, because step 3 removes the only thing protecting it.
   *(Mason Park needed no such step: its staging environment never minted a service domain,
   so it was born a single door.)*
2. **Cloudflare Response Header Transform Rule**, scoped to the staging hostname:
   `http.host eq "staging.<client>.com"` -> set `X-Robots-Tag: noindex, nofollow`. Native,
   no Worker, covers every path including images and PDFs.
3. **Disable `emitCanonical`** on staging's Open Graph plugin, then republish.
4. **Leave `robots.txt` allowing the crawl.** Counterintuitive but essential: Google has to
   FETCH the page to read `noindex`. A `Disallow` blocks the fetch, so the instruction is
   never seen and a linked URL can sit indexed with no way to remove it.
5. `node check-noindex.mjs --staging <url> --production <url>` - must exit 0.

> [!WARNING]
> **Never let `noindex` and a canonical coexist.** Google treats them as contradictory and
> can apply the `noindex` to the canonical's target - which is production. That is why step
> 3 exists, and why `check-noindex.mjs` fails the pair on sight.

## When the zone has a geo-block or any other WAF rule

Mason Park's zone blocks all non-US traffic. Two things break that nobody connects to a WAF
rule, because neither reports as "blocked":

- **ACME validation.** Let's Encrypt validates from non-US vantage points, so
  `/.well-known/acme-challenge/*` must be reachable worldwide. With no path condition on the
  rule, every Railway certificate on that zone sits at `ISSUE_FAILED` forever. Mason Park's
  apex and www had been failing since 2026-08-28 for exactly this reason.
  **Exempt the path in the rule expression**, permanently - a temporary lift only survives
  until the next renewal:
  ```
  (ip.src.country ne "US")
    and (http.host ne "staging.<client>.com")
    and (not starts_with(http.request.uri.path, "/.well-known/acme-challenge/"))
  ```
  Then force a retry - a failed certificate does **not** re-attempt on its own:
  `mutation { customDomainIssueCertificate(id: "<customDomainId>") }`. Both Mason Park
  certificates went `ISSUE_FAILED` -> `ISSUING` -> `VALID` within minutes.
- **Your own staging.** Exempt the staging hostname too, or reviewers and the clone scripts
  outside the allowed country get a 403 from a site that is working perfectly.

The same applies to an **apex -> www redirect**: exempt the ACME path there as well, or the
apex's challenge is 301'd to www's, which serves a different token.

## Cloudflare API gotcha that will waste an hour

Requests to `api.cloudflare.com` **with no query string** came back
`{"code":10404,"message":"No route for that URI"}` from this workstation - on endpoints the
token demonstrably has permission for. Appending any valid query parameter fixes it:

```
GET  /zones/<id>/rulesets                 -> 10404 "No route for that URI"
GET  /zones/<id>/rulesets?per_page=50     -> 200
PUT  /zones/<id>/rulesets/<rid>           -> 10404
PUT  /zones/<id>/rulesets/<rid>?per_page=1 -> 200
```

It is easily mistaken for a missing permission. The rulesets API **validates query parameter
names**, so `?x=1` is rejected there with `unknown query parameter` - which is itself the
proof the request arrived and the token is fine. Use a real parameter (`per_page`); the DNS
API accepts anything.

## Output Artifacts

- `lib.mjs` - two-instance session/step-up helper
- `clone-site.mjs` - document seed and promote (`--media` for small sites)
- `clone-plugins.mjs` - plugins + settings
- `pack-plugin.mjs` - vendored zip packer (byte-identical to `16-instatic-plugins`')
- `pull-media.js` - container-to-container media bytes (large sites)
- `chunk-media.py` / `import-media-chunks.mjs` - media rows under the 413 wall
- `publish-rows.mjs` - per-row publish for collections
- `diff-sites.mjs` - **the parity gate**; run after every seed and every promotion
- `check-noindex.mjs` - **the safety gate**; run after ANY Cloudflare change

## Gotchas

- **`PUBLIC_ORIGIN` is copied verbatim** into a duplicated environment. Fix before sharing
  the link; prove with `check-origins.mjs`.
- **Railway will not route a custom domain until ownership is verified**, and answers
  `Application not found` until it does - on a container that is up and listening.
- **The verification TXT is not in `dnsRecords`** - ask for `verificationDnsHost` and
  `verificationToken`.
- **A failed certificate never retries itself.** Fix the cause, then call
  `customDomainIssueCertificate`.
- **A WAF rule with no path condition blocks ACME**, and the only symptom is a certificate
  that never issues.
- **Plugins are invisible when missing.** Gate on plugin count in both directions.
- **Collection rows need per-row publish.** An empty listing looks like a content bug.
- **413 at ~95 MB+** on the Railway edge, rejected on Content-Length in ~1 s.
- **`export`/`import` are step-up gated** and step-up **rotates the session cookie** - use
  the rotated one or every following call 401s. The window is 15 min.
- **`siteUrl` is per-environment plugin config.** Copied verbatim, staging canonicalises to
  production, which usefully stops Google indexing staging as a separate site. Never promote
  plugin settings back to production.
- **Instatic has no robots or SEO controls at all** - page cells are only `title`, `slug`,
  `body`; `canonical`/`og:*` come from the Open Graph **plugin**. De-indexing happens at the
  edge.
- **The Cloudflare-managed `robots.txt` is account-wide.** Editing it to block staging blocks
  production.
- **`noindex` + canonical is the one combination that can hurt production.**
- **The `.up.railway.app` host cannot be protected** - it bypasses Cloudflare entirely.
  Delete it on staging. On PRODUCTION, check `INSTATIC_BASE_URL` in **every** worktree for
  that client before retiring it: Mason Park's had been deleted by an earlier session and
  `bk-mason-park/.env` still pointed at it, so the whole `18-instatic-embeds` toolkit was
  pointing at a dead host.
- **Cloudflare Access is the stronger control but breaks BugHerd**, which is the whole point
  of staging.
- **`railway ssh` works and the image ships its own source** at `/app/server` + `/app/src`,
  with `bun` on PATH. Read the handler rather than guessing at the API.
- **Bash mangles container paths.** Prefix `railway ssh`/`railway volume files` calls with
  `MSYS_NO_PATHCONV=1` or `/` becomes `C:/Program Files/Git/`.
- **Python's `urllib` is blocked by Cloudflare's browser-integrity check** (`403`, error
  1010) on these zones; Node's `fetch` and `curl` pass. A setup POST that returns a bare 403
  is not an origin problem.
- **Proton VPN breaks DNS for new subdomains.** Its resolver caches the NXDOMAIN from before
  the record existed. Check `nslookup ... 8.8.8.8` before debugging the domain;
  `ipconfig /flushdns` does not help, the stale cache is upstream.
- **Cloudflare proxied (orange) does NOT block Railway domain verification.**
- **Never clone by volume.** 170 KB/s, and the database is mostly history.

## Technical Setup

- **Railway**: workspace Brandklout, one project per client.
  - Dr. Nahlah `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5`, service `Dr Nahlah`, envs
    `production` / `staging`, volume `af327467-4a21-4936-b209-c341af76a449`.
  - Mason Park `e4a73ef0-64a3-48e5-b3c3-b2ea60737acc`, service `Mason Park`, envs
    `production` (`f2bfcbee-...`) / `staging` (`a05d3098-3049-452c-aea7-32b7e898c457`),
    volume `0f96015c-0dae-4a4e-8b21-1aff9f157a41`, both at `/app/storage`.
- **Credentials**: repo-root `.env` - `INSTATIC_EMAIL` / `INSTATIC_PASSWORD`. Staging is set
  up with the same pair deliberately, so one login works on both.
- **Password hashing** is `Bun.password.hash(..., argon2id)` with **no pepper**, so a copied
  database keeps working logins. `INSTATIC_SECRET_KEY` encrypts only AI provider keys and
  **MFA/TOTP seeds** - a duplicated environment gets a fresh one, which is why MFA does not
  travel.
- **Endpoints used**: `/export`, `/export/estimate`, `/import/archive`, `/plugins`,
  `/plugins/package`, `/plugins/:id/settings`, `/data/tables/:id/rows`,
  `/data/rows/:id/publish`, `/publish`, `/publish/status`, `/setup`, `/auth/step-up`.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Scripts and this `.md`
are committed; `.tmp/`, `chunks/` and any exported bundle are not - they carry full site
content and media. No secrets here.
