# scenario-0-new-site · 01-client-inquiry · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-05 · Concept pages carry no working links

Asked for: remove the links to the old site from the concept pages; each concept is a homepage to
pick a style from, and a click that lands on livewelldentalva.com confuses the client.

### Done

- `output/code/strip-links.mjs` removed every outbound link from the five concept pages (310 in all:
  old-site pages, `tel:`, Google Maps, Instagram, Facebook, YouTube, Yelp). The anchors stay as
  `<a>` without `href`, so buttons and nav look the same but do nothing.
- Kept: the "All 5 concepts" back link (deck navigation), concept 02's `#d2-main` skip link, the
  SVG `#q5-circle` reference and the Google Fonts `<link>`s. `index.html` untouched (its links only
  open the concepts).
- Republished with `publish-deck.mjs` (7 pages); live check: 0 old-site URLs, 0 `tel:`, only
  `/concepts` (and `#d2-main`) left as hrefs.

### Next

Unchanged: send https://livewell-dental-staging.up.railway.app/concepts to the client via Brandklout.

### Gotchas

- Any new concept or edit must stay link-free: run `node code/strip-links.mjs` from `output/` before
  `publish-deck.mjs`. It is idempotent.

## 2026-10-01 · Instatic instance, staging, logins, plugins, and the concept deck

Asked for: redesign the Webflow site for Instatic; build style options for the client on the
Hackensack model (an index, each direction its own subpage); publish them on Livewell's Instatic
staging (the user's choice over Cloudflare Pages or Webflow).

### Done

| What | Value |
| :--- | :--- |
| Railway | project `Livewell Dental` `47337011-9328-4c36-b1ff-a09b2434262a`, service `e26f9492-ca6a-4e90-97cf-de726964af2c` |
| Production | env `1c37ad95-1e0a-4bc1-b6f9-f7c9905f684f`, https://livewell-dental-production.up.railway.app, volume `/app/storage`. Nothing published |
| Staging | env `b2df050a-3f65-4f56-96b9-7c9be2d50ba1`, https://livewell-dental-staging.up.railway.app, own volume and `PUBLIC_ORIGIN` |
| Logins | Alejandro (owner, claimed at first boot) and Sang (admin, Mason Park hash copied over `railway ssh`, `user.create` audit row) on both |
| Plugins | embed-origins 1.8.0, open-graph 1.2.3, aeo-schema 1.2.0 on both |
| Credentials | `[livewell-dental]` in `~/.webzite/.env`: `RAILWAY_PROJECT_ID`, `INSTATIC_BASE_URL` (production), `INSTATIC_STAGING_URL`, `INSTATIC_PASSWORD` reference |
| Deck | `output/concepts/`: `content.md`, `directions.md`, `index.html`, five `concept-0N-*.html` |
| Deck live | https://livewell-dental-staging.up.railway.app/concepts and `/concept-01-refined-heritage`, `-02-diagnostic-precision`, `-03-living-well`, `-04-the-journal`, `-05-quiet-luxury` |

The five: 01 Refined Heritage (recommended; Marcellus + Figtree, navy/gold), 02 Diagnostic Precision
(Hanken Grotesk + Plex Mono, teal), 03 Living Well (Fraunces + Outfit, clay/sand), 04 The Journal
(Cormorant + Space Grotesk, editorial), 05 Quiet Luxury (Bodoni Moda + Jost, champagne/sage). All
light, all 14 homepage sections in the same order, GSAP motion, working compare, menu and films.
Every page clean at 1440 and 390 locally and live (`output/code/shoot-concept.mjs`; heights match).

Commands: `with-setup-env.mjs -- node tools/instatic-site/setup/provision-instance.mjs --name "Livewell Dental"`,
`staging-env.mjs <project> <prod env> <service> "Livewell Dental"`, `install-plugin.mjs <p> --apply`
per host, `with-setup-env.mjs INSTATIC_BASE_URL=<staging> -- node output/code/publish-deck.mjs`.

### Next

1. Send the client https://livewell-dental-staging.up.railway.app/concepts (via Brandklout); record the
   pick in `docs/project-overview.md`.
2. Confirm the contact model (phone + booking page; no homepage form today) and the Asana project.
3. Termly website id, pin the image by digest, then scenario 1 step 01 in full and step 02.

### Gotchas

- **Each deck page is one Embed (snippet mode).** A publish re-renders the snippet verbatim; the
  snippet carries the concept's fonts, styles and scripts. Re-run `publish-deck.mjs` after any edit:
  it updates by slug with `baseSeqs`.
- **Instatic's reset CSS** makes a few images a little larger live (concept 04's results collage at
  390). Nothing overflows; compare `code/shots/<concept>` with `code/shots/live/<slug>` after an edit.
- Every live page requests one random 100-character same-origin path that 404s. Hackensack's staging
  does the same: it is the platform, not the deck.
- Staging has no domain, so noindex is injected by the deck pages themselves (the first line of every
  snippet). At launch: `staging.<domain>` with the Cloudflare header rule, then drop the generated host.
- The Railway token failed "Not Authorized" until `railway whoami` refreshed it.
- The credential logos on the CDN are WHITE artwork; every concept darkens them with a filter.
- Concept 03 originally used the front-desk photo twice; the pillar now uses the spare
  `office_with_doctor.webp` (original only, the `-p-1600` variant 403s).

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
