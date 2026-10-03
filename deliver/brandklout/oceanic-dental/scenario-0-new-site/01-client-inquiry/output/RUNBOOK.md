# scenario-0-new-site · 01-client-inquiry · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-02 · Instatic instance, staging, logins, plugins, and the concept deck (`933f8103`)

Asked for: "build the style selection for Oceanic like we did for Livewell", scraping the old site
for assets. Followed bk-livewell's run step for step.

### Done

| What | Value |
| :--- | :--- |
| Railway | project `Oceanic Dental` `deb953e8-ca59-48c7-bac6-c2782ec06649`, service `466a6bc4-703d-4d3c-bae8-7f300def8dc7` |
| Production | env `741826da-a3b1-4366-adf4-bf4ee6890274`, https://oceanic-dental-production.up.railway.app, volume `/app/storage`. Nothing published |
| Staging | env `cecd337a-92c5-4ef5-a8f4-c4c968323cec`, https://oceanic-dental-staging.up.railway.app, own volume and `PUBLIC_ORIGIN` |
| Logins | Alejandro (owner, claimed at first boot) and Sang (admin, Mason Park hash copied over `railway ssh`, `user.create` audit row) on both; `check-origins.mjs` OK on both |
| Plugins | embed-origins 1.8.0, open-graph 1.2.3, aeo-schema 1.2.0 on both; `plugins.mjs status` no drift |
| Credentials | `[oceanic-dental]` in `~/.webzite/.env`: `RAILWAY_PROJECT_ID`, `INSTATIC_BASE_URL` (production), `INSTATIC_STAGING_URL`, `INSTATIC_PASSWORD` reference |
| Deck | `output/concepts/`: `content.md` (13 sections), `directions.md`, `index.html`, five `concept-0N-*.html` (built by five parallel agents) |
| Deck live | https://oceanic-dental-staging.up.railway.app/concepts and `/concept-01-coastal-concierge`, `-02-clinical-clarity`, `-03-golden-hour`, `-04-tide-journal`, `-05-shoreline-retreat` |

The five: 01 Coastal Concierge (recommended; their own Oceanic Font + Nunito Sans, teal/aqua, the
swell), 02 Clinical Clarity (Sora + DM Mono, grid, the scan), 03 Golden Hour (DM Serif Display +
Plus Jakarta Sans, cream/coral, the sunrise), 04 The Tide Journal (Instrument Serif + Inter Tight,
editorial, the tide wipe), 05 Shoreline Retreat (Italiana + Albert Sans, arches, the arrival). All
light, all 13 sections in order, GSAP motion, working compare (keyboard + drag), menu, films, inert form.
Local and live shots at 1440 + 390: no overflow, no broken images, no JS errors; live heights within 0.5% of local.

### Next

1. Send https://oceanic-dental-staging.up.railway.app/concepts (via Brandklout); record the pick in
   `docs/project-overview.md`.
2. Confirm scope with Brandklout (this run assumed the Livewell model: Webflow to Instatic) and the Asana project.
3. Pin the image by digest, then scenario 1 step 01 in full and step 02.

### Gotchas

- **Phone numbers:** the rendered homepage shows DNI pool numbers; the deck uses the real ones,
  HB (714) 841-0203 and FV (714) 378-0085, typed with plain hyphens.
- **The "stacked black" logo (`66e5631f..._Layer_1.png`) is a pale outline flower**, nearly invisible on
  white. Every concept uses the colour wordmark `6722a3d1..._OCEANIC-LOGO-WEB.png` instead.
- The homepage's Cantrell + Bonin photo is out of date (Bonin is gone from the team page); the deck
  uses the 2026 doctors group.
- The office photos have text baked in ("Serene & Cozy", "Modern & Welcoming"): never overlay type.
- YouTube iframes show "Error 153" from a local file (no referrer); they work hosted. Ignore the
  YouTube `qoe`/doubleclick aborts in local shoot logs.
- Every live page requests one random 100-character same-origin path that 404s: the platform.
- Each deck page is one Embed (snippet mode); re-run `publish-deck.mjs` after any edit (it updates by slug).
- `assets.mjs push oceanic-dental` ignores the bare slug and pushes every client, rewriting their `assets.tsv` here. Use `--client oceanic-dental`, and revert other clients' files before committing.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
