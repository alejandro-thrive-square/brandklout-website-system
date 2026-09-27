# Workflow: 18 - Instatic Staging Clone & Promotion

> [!IMPORTANT]
> **Integrity Rule**: any change to the clone procedure, the scripts, or the list of
> things that do not travel must be documented here in the same commit. This workflow is
> client-scoped to Dr. Nahlah while it is being proven; when Mason Park uses it, it
> graduates to a root `deliver/process/` module and this file becomes a pointer.

## Client-Facing Overview

The client edits a real, complete copy of their site at `staging.drnahlah.com` — same
pages, same posts, same images, same design — and nothing they do there can touch the
live site. When a change is approved, it is pushed to production in about three seconds.

## Operational Purpose

Instatic's publish is all-or-nothing. From `server/handlers/cms/publish.ts`:

> *"Publish is step-up gated because it's the single highest-blast-radius site action —
> **one click replaces every public page on the live host**."*

So a long piece of work cannot live as drafts on production: the moment anyone publishes
a one-word typo fix, the half-finished redesign ships with it. **A separate instance is
not a nicety, it is the only way to work on a live site.** That is what this workflow
builds, and what it then promotes back.

## The rule that governs everything here

> **Move the DOCUMENT, never the VOLUME.**

Measured on Dr. Nahlah, 2026-08-31:

| | via Railway volume | via export/import API |
|---|---|---|
| site document | 1,480 MB @ **170 KB/s** = ~2.5 h down + ~2.5 h up | **4.88 MB, ~3 s** |
| media | 3,478 files, ~3 s each ≈ hours | 670 MB in **10.3 s** (see below) |

The volume is 5.2 GB because `cms.db` is 1.48 GB, and `VACUUM INTO` proves that is real
data, not free pages — it is version history. The *current site* is 4.88 MB. The same
site re-imported onto staging occupies **40 MB**: production's database is ~97% history.

## What a Railway "duplicate environment" actually gives you

It copies the service, image, domains config and **every variable**. It does **not** copy
the volume — which is where the entire site lives. A duplicated environment therefore
boots as a **blank Instatic install** asking you to create an admin account.

> [!WARNING]
> It copies `PUBLIC_ORIGIN` **verbatim**, so the new environment is born listing only the
> *production* domains. That is exactly the trap from
> [process/20-instatic-domain-origins](../../../../process/20-instatic-domain-origins/20-instatic-domain-origins.md):
> the staging login page renders perfectly and the login POST is refused `403 invalid
> origin`. Fix `PUBLIC_ORIGIN` **before** anyone is given the link.

## The six things that DO NOT travel in an export bundle

This is the heart of this document. Each one fails silently and looks like nothing.

| # | Missing | What you see | Fix |
|---|---|---|---|
| 1 | **Plugins** | canonical, `og:*`, JSON-LD all absent; 22.8 KB pages instead of 45 KB | `clone-plugins.mjs` |
| 2 | **Media bytes** | every image 404s | `pull-media.js` |
| 3 | **Media rows** | media library empty | `chunk-media.py` + `import-media-chunks.mjs` |
| 4 | **srcset variants** | no responsive images (visually identical) | *no fix — accept* |
| 5 | **Users / authorship** | `authorUserId` becomes `null` | *no fix — accept* |
| 6 | **Row publish state** | collection listing renders **0** items, detail URLs **404** | `publish-rows.mjs` |

### 1. Plugins — the dangerous one

Dr. Nahlah production runs four: **AEO Schema, Open Graph, Link Editor, Embed Origins**.
A cloned site comes up with **zero** and looks completely fine.

`canonical` and `og:url` are *not* baked into page content and are *not* derived from
`PUBLIC_ORIGIN` — they come from the Open Graph plugin's `siteUrl` **setting**. Install
the plugin without its settings and you get the plugin but not the tags.

The consequence to be afraid of: a redesign approved on a plugin-less staging site ships
to production with **no schema, no OG tags and no canonicals**, and nothing anywhere says
so.

### 6. Row publish state — the subtlest one

After importing, staging had all 43 post rows with `status: "published"` and the original
`publishedAt`. The `/posts` page body hashed **identical** to production's. Publish status
on both read `draftMatchesPublished: true, publishedPages: 37`.

And `/posts` rendered **zero** articles, and every post URL 404'd.

`status: published` in a bundle is *metadata*, not a published *revision*. Site publish
covers the `pages` table; collection rows each need `POST /data/rows/:id/publish`. After
that plus one more site publish: 43 articles, detail routes 200.

> [!CAUTION]
> A false lead to skip: production's posts carry `authorUserId` and staging's are `null`,
> which looks exactly like the cause. It is not. The importer drops `authorUserId`
> unconditionally — remapping every reference in the bundle and re-importing changed
> nothing. The fix is the per-row publish.

### 4. Variants — why we accept it

Variants are generated at upload and are not in the bundle. A clone serves the same `src`
at the same width/height with no `srcset`: visually identical, larger transfer. The only
regeneration route is `POST /media/:id/replace`, which the source itself calls *"uniquely
dangerous"* and which rewrites storage paths — it would break all 501 asset references to
recover a performance optimisation. Not worth it.

**This is also the safety property that makes promotion safe**: promote with
`includeMedia: false` and production's media rows and variants are never touched.

## The 413 wall

`export {includeMedia:true}` on Dr. Nahlah returns **535 MB**. Importing it returns
**HTTP 413 in 1.2 s** — rejected on `Content-Length` by Railway's edge before the body is
sent. It is *not* Instatic: its only related cap is `MAX_ARCHIVE_MANIFEST_BYTES = 256 MB`
and that applies to the manifest entry, which is 4.9 MB.

- **~95 MB chunks are accepted.** Seven of them imported 501 media rows in ~58 s.
- For the bytes, skip HTTP entirely: have the target container `fetch` them from the
  source's public `/uploads`. **670.5 MB / 3,478 files in 10.3 s, zero failures.**

## Procedure

### A. Stand up the environment (once per client)

1. Railway → project → **New Environment**, duplicate production.
2. **Fix `PUBLIC_ORIGIN` immediately** — staging hosts only, canonical first. Keep the
   `<app>.up.railway.app` host only until the custom domain is proven; step 5 deletes it.
   ```bash
   railway variables --set "PUBLIC_ORIGIN=https://staging.<client>.com,https://<app>-staging.up.railway.app" \
     --service "<Service>" --environment staging
   railway deployment list --service "<Service>" --environment staging   # confirm a NEW deployment
   ```
3. Create the admin — a duplicated environment has none:
   ```
   POST /admin/api/cms/setup  { siteName, email, password (>= 12 chars), displayName }
   ```
   Check first with `GET /admin/api/cms/setup/status` → `needsSetup: true`.
4. Custom domain (free; production already runs four):
   ```bash
   railway domain staging.<client>.com --service "<Service>" --environment staging
   ```
   Add the printed **CNAME** and **TXT** in Cloudflare, then re-add the new host to
   `PUBLIC_ORIGIN`. Cloudflare **proxied (orange)** is correct and does not block Railway
   — ownership is verified via the TXT record, which Cloudflare never proxies. Then set
   SSL/TLS to **Full (strict)**; Railway issues a real Let's Encrypt cert for the host.

5. **Keep staging out of Google — and delete the platform host.** See the next section;
   this step is not optional, and its order matters.

## Keeping staging out of Google

Staging stays **public** — BugHerd review is done on it, so an auth gate (Cloudflare
Access) would break the very workflow it exists for. So it must be de-indexed instead,
and de-indexing has an order dependency that will bite you if you improvise it.

> [!CAUTION]
> **Do NOT edit Cloudflare's managed `robots.txt`.** It is served **account-wide**.
> Measured 2026-08-31: `www.drnahlah.com`, `staging.drnahlah.com` and `encorercm.com` —
> three hostnames across two different domains — all returned the byte-identical file
> (sha256 `8fa3036c68bfcbd3`, 1248 bytes). Adding `Disallow: /` there takes **production**
> out of Google, and the only symptom is a practice quietly losing its rankings.

**The setup, in this order:**

1. **Delete the generated Railway domain** and drop it from `PUBLIC_ORIGIN`. It does not
   pass through Cloudflare, so no rule can ever reach it — it is the one door that cannot
   be protected. It must go *first*, because step 3 removes the only thing protecting it.
   ```bash
   railway domain delete <app>-staging.up.railway.app --service "<Service>" --environment staging --yes
   railway variables --set "PUBLIC_ORIGIN=https://staging.<client>.com" --service "<Service>" --environment staging
   ```
   Not perfectly reversible: re-adding generates a *new* random hostname. Nothing should
   depend on it — `INSTATIC_BASE_URL` points at production.
2. **Cloudflare Response Header Transform Rule**, scoped to the staging hostname:
   `http.host eq "staging.<client>.com"` → set `X-Robots-Tag: noindex, nofollow`.
   Native, no Worker, and it covers every path including images and PDFs. On drnahlah.com
   this is ruleset `18e6e6c0ac15437395bfbf71562ce1c6`, rule `fbb0a95c55c948708ca9d056f66ff8ba`.
3. **Disable `emitCanonical`** on staging's Open Graph plugin, then republish.
4. **Leave `robots.txt` allowing the crawl.** Counterintuitive but essential: Google has to
   FETCH the page to read `noindex`. A `Disallow` would block the fetch, so the instruction
   is never seen and a linked URL can sit indexed with no way to remove it.
5. `node check-noindex.mjs --staging <url> --production <url>` — must exit 0.

> [!WARNING]
> **Never let `noindex` and a canonical coexist.** Google treats them as contradictory and
> can apply the `noindex` to the canonical's target — which is production. That is why
> step 3 exists, and why `check-noindex.mjs` fails the pair on sight.

### B. Seed it

```bash
node clone-site.mjs --from https://www.drnahlah.com --to https://staging.drnahlah.com --strategy replace
node clone-plugins.mjs --from https://www.drnahlah.com --to https://staging.drnahlah.com --files ./.tmp/plugins
# media bytes  -> see pull-media.js header for the three railway ssh commands
python chunk-media.py ./.tmp/prod-full.zip ./chunks
node import-media-chunks.mjs --to https://staging.drnahlah.com --chunks ./chunks
node publish-rows.mjs --site https://staging.drnahlah.com --table posts
cd ../../../../process/18-instatic-embeds/lib && INSTATIC_BASE_URL=https://staging.drnahlah.com node insta-api.mjs publish
node diff-sites.mjs --a https://www.drnahlah.com --b https://staging.drnahlah.com
```

### C. Promote

```bash
node clone-site.mjs --from https://staging.drnahlah.com --to https://www.drnahlah.com \
  --strategy merge-overwrite --rows about,contact
node publish-rows.mjs --site https://www.drnahlah.com --table posts   # only if collection rows moved
# publish, then:
node diff-sites.mjs --a https://staging.drnahlah.com --b https://www.drnahlah.com
```

`merge-overwrite` + `--rows` moves only what you changed and leaves the client's other
edits alone. `replace` derives deletions server-side (stored − shipped) and is a
whole-site cutover — highest blast radius, use deliberately.

## Gotchas

- **`PUBLIC_ORIGIN` is copied verbatim into a duplicated environment**, producing a trap
  host on day one. Fix before sharing the link; prove with `check-origins.mjs`.
- **Plugins are invisible when missing.** Make "plugin count matches" a gate on both
  directions, not a thing someone remembers.
- **Collection rows need per-row publish.** An empty listing looks like a content bug.
- **413 at ~95 MB+** on the Railway edge, rejected on Content-Length in ~1 s.
- **`export`/`import` are step-up gated** and step-up **rotates the session cookie** — use
  the rotated one or every following call 401s. The window is 15 min; re-elevate per chunk.
- **`16-instatic-plugins/install-plugin.mjs` will refuse three of the four plugins.** Its
  `GRANT` list is embed-origins' three permissions; AEO Schema asks for six. That guard is
  correct for a new install and wrong for a clone — `clone-plugins.mjs` grants exactly what
  the source had already granted.
- **`siteUrl` is per-environment plugin config.** Copied verbatim, staging canonicalises to
  production, which usefully stops Google indexing staging as a separate site. Never
  promote plugin settings back to production.
- **Instatic has no robots or SEO controls at all** — page cells are only `title`, `slug`,
  `body`, and `canonical`/`og:*` come from the Open Graph **plugin**, not the platform.
  De-indexing therefore has to happen at the edge.
- **The Cloudflare-managed `robots.txt` is account-wide.** Editing it to block staging
  blocks production. Proven by hash across three hostnames on two domains.
- **`noindex` + canonical is the one combination that can hurt production.** Never ship
  both; `check-noindex.mjs` exists to catch it.
- **The `.up.railway.app` host cannot be protected** — it bypasses Cloudflare entirely, so
  no Transform Rule, robots rule or Access policy touches it. Delete it on staging. On
  PRODUCTION leave it: it keeps its canonical, and module 20 wants it as the toolkit's
  fallback.
- **Cloudflare Access is the stronger control but breaks BugHerd**, which is the whole
  point of staging. That is why this workflow uses public + `noindex` instead. If a future
  client needs staging genuinely private, Access plus a service token for the scripts is
  the route — but expect the client review flow to change.
- **`railway ssh` works and the image ships its own source** at `/app/server` + `/app/src`,
  with `bun` on PATH. That is how every question here was answered — read the handler
  rather than guessing at the API.
- **Bash mangles container paths.** Prefix `railway volume files` calls with
  `MSYS_NO_PATHCONV=1` or `/` becomes `C:/Program Files/Git/`.
- **Proton VPN breaks DNS for new subdomains.** Its resolver (`10.2.0.1`) caches the
  NXDOMAIN from before the record existed, so a brand-new host is unreachable in the
  browser and `check-origins.mjs` reports `ENOTFOUND` while `8.8.8.8`, `1.1.1.1` and
  `9.9.9.9` all resolve it fine. Reconnect the VPN. `ipconfig /flushdns` does not help —
  the stale cache is upstream, not local.
- **Never clone by volume.** 170 KB/s, and `cms.db` is 1.48 GB of mostly history.

## Technical Setup

- **Railway**: workspace Brandklout, one project per client. Dr. Nahlah
  `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5`, service `Dr Nahlah`, environments
  `production` / `staging`, volume `af327467-4a21-4936-b209-c341af76a449` at `/app/storage`
  (the volume id is a project-level record; each environment holds its own instance).
- **Credentials**: repo-root `.env` — `INSTATIC_EMAIL` / `INSTATIC_PASSWORD`. Staging was
  set up with the same pair deliberately, so one login works on both.
- **Password hashing** is `Bun.password.hash(..., argon2id)` with **no pepper**, so a
  copied database keeps working logins. `INSTATIC_SECRET_KEY` encrypts only AI provider
  keys and **MFA/TOTP seeds** — copy a volume without it and MFA users are locked out.
- **Endpoints used**: `/export`, `/export/estimate`, `/import/archive`, `/plugins`,
  `/plugins/package`, `/plugins/:id/settings`, `/data/tables/:id/rows`,
  `/data/rows/:id/publish`, `/publish`, `/setup`, `/auth/step-up`.

## Output Artifacts

- `lib.mjs` — two-instance session/step-up helper
- `clone-site.mjs` — document seed and promote
- `clone-plugins.mjs` — plugins + settings
- `pull-media.js` — container-to-container media bytes
- `chunk-media.py` / `import-media-chunks.mjs` — media rows under the 413 wall
- `publish-rows.mjs` — per-row publish for collections
- `diff-sites.mjs` — **the parity gate**; run after every seed and every promotion
- `check-noindex.mjs` — **the safety gate**; staging de-indexed, production untouched.
  Run after ANY Cloudflare change

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts and
this `.md` are committed; `.tmp/`, `chunks/` and any exported bundle are not — they carry
full site content and media. No secrets here.
