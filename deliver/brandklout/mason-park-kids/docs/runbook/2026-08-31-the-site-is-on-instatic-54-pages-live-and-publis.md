## 2026-08-31 - THE SITE IS ON INSTATIC. 54 pages live and published.

**Live admin: <https://mason-park-kids.up.railway.app/admin>** - owner
`alejandro@thrivesquare.com`, with the `INSTATIC_PASSWORD` already in `.env`.

The service domain was generated as `corebunchinstaticlatest-production-fb3b.up.railway.app` -
named after the container IMAGE, not the client - and was renamed the same day to match
`mason-park` and `dr-nahlah`. **Renaming a Railway service domain silently invalidates
`PUBLIC_ORIGIN`**: the login page at the new host renders fine and then refuses the login with
403, which is precisely the trap process 20 exists for. Order used, and the one to reuse: widen
`PUBLIC_ORIGIN` to hold BOTH hosts -> confirm the container actually applied it (probe the new
origin against the old host; 401 = accepted, 403 = not applied) -> rename -> narrow back to the
new host alone. Re-verified with `check-origins.mjs --all` and a real login.

Verified, not assumed: 54/54 routes answer 200, 144/144 image references resolve, class
attributes are emitted, fonts are self-hosted, favicon set. `node verify-live.mjs` re-checks all
of it in about a minute and is the thing to run after any change.

### The import runs headlessly. The old "it cannot" was about the MCP, not the API.

This is the big correction. `IMPORT.md` said the import needed the Site editor open in a browser.
That is true of the MCP connector - 29 of its `site_*` tools proxy through the in-editor chat
stream - and false of the admin REST API underneath, which is what
`deliver/process/18-instatic-embeds/lib/insta-api.mjs` speaks. Nobody sat in front of a browser
for any of this.

The one genuinely hard part: **pages are stored as node trees (`cells.body.nodes`), not HTML.**
The HTML→nodes converter is Instatic's own `@core/htmlImport`, so it runs INSIDE the container
over `railway ssh`, exactly as the parent practice solved it. The pipeline, in order:

```bash
cd deliver/brandklout/mason-park-kids/workflows/02-static-rebuild/.tmp
node push-media.mjs                 # upload; writes instatic-media-map.json
node to-instatic.mjs --media instatic-media-map.json --lean
node ship-payload.mjs               # pages -> container, sha-verified
node run-convert.mjs                # installs + runs container-convert.ts in /app
node fetch-nodes.mjs                # -> converted-pages.json
node import-pages.mjs --only core   # then without --only for the rest
node import-styles.mjs              # code assets + empty class rules
node install-fonts.mjs              # self-hosted DM Sans + Figtree
node set-favicon.mjs
node verify-live.mjs                # the proof
```

### Gotchas, all of which cost real time today

- **`{"publishedPages":54}` proves nothing about the live site.** It says 54 rows were written.
  Routes, images, classes and fonts are all separately breakable - hence `verify-live.mjs`.
- **Instatic emits no class attribute for a class it has no rule for.** Without the empty-rule
  registration in `import-styles.mjs` you get perfect structure and zero styling, which reads
  like a stylesheet that failed to load.
- **The published-page CSP blocks Google Fonts.** Base policy is `style-src 'self'
  'unsafe-inline'` with NO `font-src` (`/app/src/core/publisher/cspPlan.ts`), so `site.css`'s
  `@import` of `fonts.googleapis.com` can only fail - silently, into the fallback stack. Fixed by
  self-hosting both families through `POST /admin/api/cms/fonts/install`, which is also what the
  parent site does for Montserrat. The parent only escapes this because its plugins relax the CSP.
- **`to-instatic.mjs` does `rmSync(instatic/)`.** A media map written in there is read by the
  `--media` pass and deleted by that same run. It now lives at `.tmp/instatic-media-map.json`.
- **The two `Dentist-in-Katy-Office.webp` files are byte-identical** (both 95606 B, sha
  `8ca3aedb…`). The previous entry below, and `IMPORT.md`, claimed they differed in size because
  the photo was re-uploaded. They do not. Path-keying is still right, but it is insurance here,
  not a fix for a live bug. `push-media.mjs` groups by SHA-256 and uploads identical bytes once.
- **`--lean` costs nothing on this platform.** Instatic derives its own `-w64/-w320/-w350`
  variants on upload, so 29 uploaded files became 144 live references. Shipping the build's own
  srcset candidates just uploads a redundant second set. Keep `--lean`.
- **`insta-api.mjs`'s `pages` CLI read `.pages`; the endpoint returns `{rows:[…]}`.** It printed
  `[]` for a site full of pages - "nothing imported yet", the worst possible wrong answer. Fixed.

### Still open

1. **`jsonLd` and the meta `description` have nowhere to go.** A page row carries only `title`,
   `slug`, `body` - there is no per-page head field, so the original plan of "paste the JSON-LD
   into the head field" cannot be done. The parent site emits its `og:` tags and JSON-LD from the
   `webzite.open-graph` and `webzite.aeo-schema` **plugins**, which are not installed here. The
   packages exist at `../bk-mason-park/deliver/process/21-instatic-staging-clone/.tmp/plugins/`.
   Installing them is the way to close this; note they also relax the CSP. **Not done - it needs
   a decision, and it changes what the site emits.**
2. **DNS.** `pediatricdentistkatytx.com` is still on SiteGround and 301s to
   `mason-park.up.railway.app`, which is now itself dead (see below). When it moves to Cloudflare
   and points here, add apex AND www to `PUBLIC_ORIGIN` (comma-separated) and re-run
   `deliver/process/20-instatic-domain-origins/check-origins.mjs --all` BEFORE sending the link -
   a half-done cutover serves a normal login page and then refuses the login.
3. **The parent practice's `mason-park.up.railway.app` now 404s** "Application not found" - its
   service domain was removed. `www.masonparkdental.com` is healthy. `PUBLIC_ORIGIN` there still
   names the dead host, and process 20's own README uses it as its example "GIVE THIS LINK". Both
   want correcting in `bk-mason-park`, not here.
4. **Unchanged and still worth settling before the client sees it**: the suite/phone conflict
   (#104B / (281) 578-7100 on the imported pages vs #104A / (281) 769-8878 on the parent) and
   whether Dr. William Sung stays. Both are page copy, so resolving them now means an edit in
   Instatic rather than a rebuild.
5. **Revoke `.secrets/sg_pediatric_recovery`** - still outstanding.
