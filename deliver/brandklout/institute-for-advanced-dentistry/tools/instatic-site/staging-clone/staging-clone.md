# Instatic Staging Clone & Promotion (tools/instatic-site/staging-clone)

> [!NOTE]
> **Moved 2026-09-23** from `deliver/process/21-instatic-staging-clone/` (newest copy: branch
> `bk-brandklout-website`, 2026-09-22) into `tools/instatic-site/staging-clone/` for the
> system-v2 layout. Scenario 0 uses it at 01-client-inquiry (stand up staging) and 05-launch
> (promote staging to production, keep staging out of Google). Old module numbers below
> (18, 19, 20, 22, 23) now live under `deliver/process/tools/` without the number.

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
>
> **Fifth run: Mason Park Dental for Kids, 2026-09-27** (branch `bk-mason-park-kids`), the first
> run on a site that was **already live with staging and production as two domains on ONE
> instance**, so the staging domain had to be moved off production's service (see **Moving a
> staging DOMAIN off a live production service**). It found a seventh thing that does not travel,
> **plugin runtime data** (215 Open Graph per-page overrides, every page's description and URL),
> and added `STAGING_RESOLVE` to `verify-staging-clean.mjs` for a workstation whose resolver
> still holds the old target.
>
> **Fourth run: Brandklout's own website, 2026-09-22** (branch `bk-brandklout-website`), the
> first **one-shot** run since Mason Park (34.6 MB with media) and the first on a native Instatic
> build that had **no SEO plugins at all**. It added `--no-analytics` to
> `verify-staging-clean.mjs`, corrected this doc on what `siteUrl` should be on a staging host
> (see **`og:url` is the leak that survives `emitCanonical: false`** below), and is the run that
> proves the gate catches a leak the clone itself introduced.
>
> **Third run: Institute for Advanced Dentistry, 2026-09-18** (branch `bk-ifa-dentistry`),
> the first on the split path since Dr. Nahlah, and the first on a **WordPress clone** rather
> than a native Instatic build. It added one script — `verify-staging-clean.mjs`, the
> rendered-DOM leak gate — and a warning to `check-noindex.mjs`, which had reported clean
> over a canonical pointing at production on all 59 staging pages. What else this run added
> to the doc: the split path *keeps* srcset variants, `chunk-media.py`'s default target can
> overshoot the size wall, a duplicated environment does mint a service domain, and the whole
> **Analytics and call tracking** section — four separate tag and canonical leaks, each sitting
> behind a gate that said OK.

> [!WARNING]
> Numbering note (historical): this module used to be `21`, a number the client-local
> `21-instatic-upload` folders also use. In system-v2 neither is numbered; the upload pipeline's
> shared parts live in `tools/instatic-site/` beside this folder. See
> [PROCESS_INDEX.md](../../../PROCESS_INDEX.md).

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
> [process/instatic-domain-origins](../../instatic-domain-origins/instatic-domain-origins.md):
> the staging login page renders perfectly and the login POST is refused `403 invalid
> origin`. Fix `PUBLIC_ORIGIN` **before** anyone is given the link. Confirmed again on Mason
> Park, which was born holding all three production origins.

The volume **id** is shared across environments (it is a project-level record) while each
environment holds its own **instance**. Seeing production's `RAILWAY_VOLUME_ID` in staging's
variables is correct and does not mean they share data.

## The seven things that DO NOT travel in an export bundle

Each one fails silently and looks like nothing.

| # | Missing | What you see | Fix |
|---|---|---|---|
| 1 | **Plugins** | canonical, `og:*`, JSON-LD all absent; 22.8 KB pages instead of 45 KB | `clone-plugins.mjs` |
| 2 | **Media bytes** | every image 404s | `--media`, or `pull-media.js` |
| 3 | **Media rows** | media library empty | `--media`, or `chunk-media.py` + `import-media-chunks.mjs` |
| 4 | **srcset variants** | no responsive images (visually identical) | *no fix - accept* |
| 5 | **Users / authorship** | `authorUserId` becomes `null`; only the claimed admin can log in | authorship: *accept*; logins: copy the user rows (see Gotchas) |
| 6 | **Row publish state** | collection listing renders **0** items, detail URLs **404** | `publish-rows.mjs` |
| 7 | **Plugin runtime data** (Open Graph per-page overrides) | per-page descriptions fall back to defaults; `diff-sites.mjs` can still pass | copy them: `GET /plugins/brandklout.open-graph/runtime/pages` on the source, `POST .../runtime/override` per page on the target, host rewritten (Mason Park Kids: `og-export.mjs` + `staging-seo.mjs` in its worktree) |

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

> [!NOTE]
> **The split path does NOT lose variants - it is the better path for parity.** This row is
> about the `--media` archive only. `pull-media.js` copies whatever `find` listed on the
> source volume, and variants are ordinary files there, so they travel. Measured on the
> Institute for Advanced Dentistry, 2026-09-18: 3,672 files / 511.2 MB pulled in 8.9 s, and
> `diff-sites.mjs` reported `srcset a=639 b=639` against Mason Park's `a=715 b=0`.
> So on a site big enough to need the split path you get **better** fidelity than a small
> site gets from one shot. If a small site's srcset parity ever matters, use the split path
> deliberately rather than `--media`.

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
python chunk-media.py ./output/prod-full.zip ./chunks 70    # 70, not the 90 default — see below
node import-media-chunks.mjs --to <staging> --chunks ./chunks

# always, both paths:
node clone-plugins.mjs --from <prod> --to <staging> --files ./output/plugins
node publish-rows.mjs --site <staging> --table posts
#   publish the site, then prove it:
node diff-sites.mjs --a <prod> --b <staging>
```

> [!CAUTION]
> **`chunk-media.py`'s 90 MB default can still produce chunks over the 95 MB wall.** The
> target sizes the MEDIA in a chunk, and the full manifest - 13.28 MB on the Institute for
> Advanced Dentistry - is then added to every one of them. At the default, that run produced
> `chunk00` at 97.2 MB and `chunk02` at 103.3 MB. Both happened to import, so the wall is not
> a hard 95, but do not rely on that: pass an explicit target that leaves room for the
> manifest. `70` gave six chunks, largest 83.2 MB, all 200. Read the printed sizes before
> importing - the script tells you, and it is the only warning you get.

Plugin CODE is not downloadable over the API - pull it off the source container first
(200-252 KB for all four):

```bash
MSYS_NO_PATHCONV=1 RAILWAY_PROJECT_ID=<id> railway ssh -s "<Service>" -e production \
  "sh -lc 'tar czf - -C /app/storage/uploads/plugins . | base64 -w0'" \
  | grep -v '^Using SSH' | tr -d '\r\n' > output/all.b64
base64 -d output/all.b64 > output/all.tgz
mkdir -p output/plugins && tar xzf output/all.tgz -C output/plugins
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

## Moving a staging DOMAIN off a live production service

When staging used to be just a second domain on production's service (Mason Park Kids until
2026-09-27), the domain has to move. In order:

1. Create the environment and upsert `PUBLIC_ORIGIN` (staging host only, `skipDeploys`).
2. **Delete the minted service domain before anything deploys.** An unclaimed instance on a
   public `*.up.railway.app` host can be claimed by anyone.
3. `volumeCreate` at `/app/storage`.
4. `customDomainDelete` on production, then `customDomainCreate` on staging. The existing
   `_railway-verify.staging` TXT is still valid (same token); only the CNAME target changes.
5. Point the CNAME at the new target **DNS-only**, and have a claim loop already polling
   `/setup/status`. It claims on the first `needsSetup: true` (Mason Park Kids: 201 within seconds).
6. Seed, plugins, overrides, SEO settings, publish. Then proxy the CNAME.

Production's `PUBLIC_ORIGIN` still lists the staging host afterwards. That is harmless (the host
no longer routes to production); removing it restarts production, so do it in a quiet window.

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
3. **Disable `emitCanonical` AND point `siteUrl` at the staging host** on staging's Open Graph
   plugin, then republish. Both, not just the first — see the box below.
4. **Leave `robots.txt` allowing the crawl.** Counterintuitive but essential: Google has to
   FETCH the page to read `noindex`. A `Disallow` blocks the fetch, so the instruction is
   never seen and a linked URL can sit indexed with no way to remove it.
5. `node check-noindex.mjs --staging <url> --production <url>` - must exit 0.
6. `node verify-staging-clean.mjs --staging <url> --production <url>` - must exit 0. Step 5
   reads the raw HTML and step 6 renders the page; on a WordPress clone only step 6 can see
   the canonical, so **both** are required before anyone gets the link.

> [!CAUTION]
> **`og:url` is the leak that survives `emitCanonical: false`.** Turning the canonical off is the
> obvious half of the fix and it is not enough: `og:url` is written from the same `siteUrl`
> setting and keeps pointing at production. Brandklout, 2026-09-22 — canonical off, staging
> published, `check-noindex.mjs` clean, and `verify-staging-clean.mjs` failed all three paths on
> `og:url -> https://brandklout.ai/`. **Set `siteUrl` to the staging host**, which turns every
> emitted URL — `og:url`, `og:image`, and AEO Schema's `@id`s — into staging's own. On a host
> served `noindex` there is nothing to lose by doing so, and the entity graph stops colliding with
> production's. The old gotcha below, that copying `siteUrl` verbatim "usefully stops Google
> indexing staging as a separate site", predates the rendered-DOM gate and is **superseded**.

> [!WARNING]
> **Never let `noindex` and a canonical coexist.** Google treats them as contradictory and
> can apply the `noindex` to the canonical's target - which is production. That is why step
> 3 exists, and why `check-noindex.mjs` fails the pair on sight.

## Analytics and call tracking: what a staging HOST silently switches on

Google is not the only thing that has to be kept off staging. A staging clone is a complete
copy of the site's code assets, so **every third-party tag in them runs on staging too** —
reporting review sessions into the practice's analytics and, where there is call tracking,
burning real pool numbers on people who are not patients.

The trap is that these tags are usually already gated, and the gate looks right:

```js
if (!/(^|\.)ifadentistry\.com$/i.test(location.hostname)) return   // GTM + GHL number pool
```

That was written to keep the tags off the `*.up.railway.app` review link, and it does.
`staging.ifadentistry.com` is a **subdomain of the production zone**, so it passes — the very
host the gate exists to exclude is the one host it lets through. Found on the Institute for
Advanced Dentistry, 2026-09-18, the day staging was created.

**Check every host-gated asset when you stand up staging**, and exclude by name rather than
by an allow-list of production hosts, so a new production host keeps working:

```js
if (/^staging\./i.test(location.hostname)) return
```

Push that to **staging only** and publish there. Production needs no change — the condition
is a no-op on a production host — so there is no reason to spend a production publish on it.
Note the divergence in the runbook so the next person does not read it as drift.

Worth grepping for on any client before handing the link over: `googletagmanager`,
`leadconnectorhq`, `gtag(`, `fbq(`, `clarity`, `hotjar`.

### Grepping the source is not enough — three of the four leaks were invisible in it

On IFA the tag asset was only the leak anyone could see. Rendering the staging page found three
more, and each had a gate reporting OK over it:

| Leak | Why the gate missed it |
| :--- | :--- |
| `<link rel="canonical">` → **production**, on every noindexed staging page | `check-noindex.mjs` parses raw HTML; this head is replayed by `site.js` *after* the document parses. It printed "production emits no canonical" while all 59 pages emitted one. |
| `<meta name="robots" content="index, follow">` cloned from WordPress | Same — injected at runtime, contradicting the `X-Robots-Tag` header. |
| A second GTM container, `GTM-K8N3JK3Q` | The clone's own gate flags Google scripts by `id` and `src`. An **inline** bootstrap has neither, so it was never flagged and ran on every host. |

The canonical is the one that can actually cost the client money: `noindex` plus a canonical
pointing at production is the pairing Google can resolve *against the canonical's target*.

**So the gate has to render the page, not read the bytes.** That is
[`verify-staging-clean.mjs`](./verify-staging-clean.mjs):

```bash
MSYS_NO_PATHCONV=1 node verify-staging-clean.mjs \
  --staging https://staging.<client>.com --production https://www.<client>.com \
  --paths "/,/contact-us/"
```

It checks the rendered DOM for a canonical, `og:url` or `meta robots` pointing anywhere but
staging; checks that no analytics or call-tracking request is made; and checks **production still
makes them**, because each of these can be "fixed" on staging by breaking the live site.
`MSYS_NO_PATHCONV=1` is required — Git Bash turns a `/` argument into `C:/Program Files/Git/`.

> [!NOTE]
> **An embedded form is page content, not tracking.** Booking and contact forms are often served
> by the same vendor as the call tracking, and reviewers must be able to submit them, so the
> form's own bundle and its session call are expected on staging. The gate allows those and fails
> only on the analytics tag and the number **pool** — the pool assigns a real tracked number per
> visitor, so a month of review traffic is a month of numbers billed against non-patients.
> Do tell the client that staging form submissions land in their real inbox.

### Fixing it on a cloned bundle without rebuilding

The guards belong in the clone's runtime, but staging's copy of that bundle was cloned *before*
they existed, and rebuilding the whole WordPress clone to deliver a few lines would churn every
page. Patch the code asset in place instead — read the shell, replace whole lines, `saveShell`,
publish. The worked example is `patch-staging-runtime.mjs`, which lives beside the `runtime.js` whose
lines it mirrors (`bk-ifa-dentistry`, `workflows/21-instatic-upload/`). It applies each guard only
if its marker is absent, so it is safe to re-run as guards are added.

**Write every guard host-conditionally** (`if (STAGING) …`), never as a deletion. A deletion is a
landmine the day someone promotes that asset: it would silently take production's analytics or
canonicals down. A host-conditional guard is a no-op on production and safe to promote.

> [!CAUTION]
> Build the backslashes in a patch script with `String.fromCharCode(92)` or read them from the
> file. A needle containing `\.` does not survive being written through a bash heredoc — the
> heredoc halves the backslashes, the regex loses a level, and the script reports "0 occurrences"
> of a line that is demonstrably there.

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
- The zip packer is the shared `tools/instatic-plugins/pack-plugin.mjs` (`clone-plugins.mjs --packer` to override)
- `pull-media.js` - container-to-container media bytes (large sites)
- `chunk-media.py` / `import-media-chunks.mjs` - media rows under the 413 wall
- `publish-rows.mjs` - per-row publish for collections
- `diff-sites.mjs` - **the parity gate**; run after every seed and every promotion
- `check-noindex.mjs` - **the safety gate**, headers and raw HTML; run after ANY Cloudflare change
- `verify-staging-clean.mjs` - **the leak gate**, rendered DOM and network: canonical, `og:url`,
  `meta robots`, analytics and call tracking, on staging AND production. `--no-analytics` for a
  site that never had tags — see the gotcha; it is an assertion, not a mute button

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
- **`siteUrl` is per-environment plugin config, and on staging it must be the STAGING host.**
  `clone-plugins.mjs` copies it verbatim, which leaves staging emitting `og:url` (and, unless you
  also turn it off, a canonical) at production — the pairing that can cost production its
  indexing. Fix it right after the clone, before anyone opens the link, and never promote plugin
  settings back to production.
- **Instatic has no robots or SEO controls at all** - page cells are only `title`, `slug`,
  `body`; `canonical`/`og:*` come from the Open Graph **plugin**. De-indexing happens at the
  edge.
- **The Cloudflare-managed `robots.txt` is account-wide.** Editing it to block staging blocks
  production.
- **`noindex` + canonical is the one combination that can hurt production.**
- **The `.up.railway.app` host cannot be protected** - it bypasses Cloudflare entirely.
  Delete it on staging. On PRODUCTION, check `INSTATIC_BASE_URL` in **every** worktree for
  that client before retiring it: Mason Park's had been deleted by an earlier session and
  `bk-mason-park/.env` still pointed at it, so the whole `instatic-embeds` toolkit was
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
- **Cloudflare proxied (orange) does NOT block Railway domain verification.** It did stall
  `www.ifadentistry.com` once, though, so the cheapest order is: create the CNAME **DNS-only**
  alongside the verification TXT, wait for `CERTIFICATE_STATUS_TYPE_VALID` (~3 min), then flip
  it to proxied. On the IFA staging host that went `VALIDATING_OWNERSHIP` -> `ISSUING` ->
  `VALID` in about 3 minutes with no intervention.
- **A duplicated environment DOES mint its own service domain.** Mason Park's did not, which
  reads in this doc as if none ever do. IFA's staging was born with
  `institute-for-advanced-dentistry-staging.up.railway.app`. Check `serviceDomains` and delete
  it - it is the door Cloudflare cannot reach.
- **`skipInitialDeploys: true` does not prevent a deploy.** `volumeCreate` / `customDomainCreate`
  trigger one anyway. That is harmless *if* `PUBLIC_ORIGIN` was upserted first with
  `skipDeploys: true`, which is why that is step 2. Confirmed again on IFA: one deploy, SUCCESS,
  booted with the staging origin.
- **Third-party tags gated on `*.<production-domain>` fire on staging** - see the analytics
  section. Grep the code assets before anyone opens the link.
- **A gate that reads raw HTML cannot see a runtime-injected canonical.** On a WordPress
  clone the whole head is replayed by `site.js`. Render the page.
- **An inline tag bootstrap has no `src` and no `id`**, so a gate matching those two fields
  never flags it. Match the script TEXT as well.
- **Patch staging's bundle host-conditionally, never by deleting.** The day that asset is
  promoted, a deletion takes production's tags or canonicals with it.
- **`MSYS_NO_PATHCONV=1` for any script taking a `/` argument** - Git Bash rewrites it to
  `C:/Program Files/Git/` and the failure looks like a DNS error.
- **A site with NO analytics fails the leak gate, correctly.** `production still loads its tags
  (NONE)` is indistinguishable from "someone deleted the tags out of a shared asset", so the gate
  refuses to guess. Pass `--no-analytics` to assert that this site never had any — it prints `n/a`
  and says so out loud, and it FAILS if production turns out to load tags after all. Look at the
  live site before reaching for it. Brandklout is the case: no GTM, no GA, no call tracking.
- **A clone of a plugin-less site is plugin-less, and that is not the clone's fault.** Brandklout
  production had only `embed-origins` — no canonical, no `og:*`, no JSON-LD on any page, since it
  was provisioned. `clone-plugins.mjs` reported `1 of 1` and was right. "Plugin count matches" is a
  parity gate, not a correctness one: check what the SOURCE emits before trusting it.
- **Never clone by volume.** 170 KB/s, and the database is mostly history.
- **Plugin runtime data does not travel** (7th row above). Mason Park Kids had 215 Open Graph
  overrides on production and 0 on the fresh staging; `diff-sites.mjs` passed anyway. Count
  them on both sides.
- **Users do not travel either.** Copy the non-owner rows (password hashes included) over
  `railway ssh` + `bun:sqlite`, base64-wrapped so no hash reaches a shell or a transcript.
- **A stale local resolver hides the new staging from every gate.** Node: a `dns.lookup`
  preload pinning the host to a Cloudflare IP. Chrome: `STAGING_RESOLVE=host:ip` for
  `verify-staging-clean.mjs` (it becomes `--host-resolver-rules`).

## Technical Setup

- **Railway**: workspace Brandklout, one project per client.
  - Dr. Nahlah `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5`, service `Dr Nahlah`, envs
    `production` / `staging`, volume `af327467-4a21-4936-b209-c341af76a449`.
  - Mason Park `e4a73ef0-64a3-48e5-b3c3-b2ea60737acc`, service `Mason Park`, envs
    `production` (`f2bfcbee-...`) / `staging` (`a05d3098-3049-452c-aea7-32b7e898c457`),
    volume `0f96015c-0dae-4a4e-8b21-1aff9f157a41`, both at `/app/storage`.
  - Institute for Advanced Dentistry `3449a121-3580-485b-97f5-8c8903f8e409`, service
    `Institute for Advanced Dentistry`, envs `production` (`5de03003-3478-4608-83d8-4ce900b220f7`)
    / `staging` (`8afccdc8-a3ec-4e91-9c89-53d25a95b1db`), volumes
    `823fdbab-30f1-4f45-b9a1-3335bf8b6c7d` (production) and
    `55e39064-0193-4639-b766-4c1fffee7f72` (staging), both at `/app/storage`. Staging stood up
    2026-09-18 for a full redesign; custom domain `staging.ifadentistry.com`
    (`887b7c85-5658-4a5d-9f9b-e4afcc3d63be`), no service domain.
  - Brandklout `550ebd58-0e74-444e-96d5-2b836a2db98a`, service `Brandklout`, envs
    `production` (`ebac465d-468b-4cd3-afc6-78da721e0eb0`) / `staging`
    (`f28a1ce0-3f0f-4254-b019-bf878c74b7bf`), volumes
    `9ff3c19b-cbc1-4c29-b02d-b57ae6ba81d2` (production) and
    `ac20baa7-045b-4557-848e-cbe14720e0d9` (staging), both at `/app/storage`. Staging stood up
    2026-09-22; custom domain `staging.brandklout.ai` (`228c71cb-81e7-4d43-8b87-cc7f119e5915`),
    service domain `brandklout-staging.up.railway.app` **deleted**.
  - Mason Park Kids `a135c5ec-da62-4643-a775-c6a39317fb1b`, service `d1d1ce4a-...`, envs
    `production` (`f9cddccd-2fbf-4e54-8898-722250075937`) / `staging`
    (`2433658d-4971-46e9-8dfc-e83cd8c96a2c`), volumes `8a02136a-...` (production) and
    `eca481f9-9c82-4727-8f13-884c83e858d9` (staging), both at `/app/storage`. Staging stood up
    2026-09-27; custom domain `staging.masonparkpediatricdental.com`
    (`f05ba5ab-450e-4f8b-bc14-63e6b106dde5`), service domain deleted. Cloudflare header rule
    `afd975c134ad4a66bad61d5de82c42df` (zone `190398a3…`). No analytics on production (Termly only).
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

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts and this `.md`
are committed; `output/`, `chunks/` and any exported bundle are not - they carry full site
content and media. No secrets here.
