## CURRENT PRIORITY (2026-08-20, late): Marvel Dental emergency funnel

New Brandklout client. Live Webflow site **Marvel Dental Main** `69aedbc6b0c7e78051fd6a2c`
(marveldentaldds.com), Clifton NJ, Dr. Anna Gazu. Four other "Marvel Dental" sites in the workspace
are archived design iterations, not the deliverable.

**Someone had already cloned Arvada's campaign triplet onto the site earlier that day** (pages
created ~19:20 UTC): `/ads-landing-pages/emergency-dentist`, `-consult`, `-thank-you`, carrying
Arvada's `camp_` classes AND Arvada's Colorado copy. They are unpublished. This session did NOT
touch them; the rebuild is local. Page ids and the whole picture: `deliver/brandklout/marvel-dental/docs/project-overview.md`.

Done in `58b5d0b` (local rebuild) and `bdb0696` (**installed on the site and published to the
Webflow subdomain**: verify-v2 3/3 against the served pages, class layer 1224/1224, mobile call
bar hit-tested at 390). Nothing has gone to marveldentaldds.com.
- `workflows/04-design/.tmp/v1/` — class layer (re-themed by `_shared/theme.mjs`), three slotted
  templates, content JSON, rendered pages.
- `docs/brand.md` — the measured brand basis. This client has no style guide; that file is it.
- `node workflows/08-qa/.tmp/gate.mjs` → 3/3 pass, one warning (the GHL form id).
- Render: `node workflows/07-webflow-build/.tmp/native/render-page.mjs emergency [consult|ty]`.
- Shots: `node workflows/08-qa/.tmp/shots.mjs`, detail: `slices.mjs <page> <width> <y…>`.

**Next**: swap the LeadConnector form id into the consultation page's HtmlEmbed, then the client's
sign-off, then publish to marveldentaldds.com (not done, user's call).

Tooling in `07-webflow-build/.tmp/native/`, all idempotent and re-runnable:
`diff-classes.mjs` (read-only), `apply-classes.mjs [--dry]`, `extras.mjs` (Arvada leftovers a
value diff cannot see), `build-page.mjs <pageId> <body.html> --clear`, `verify-v2.mjs`. QA in
`08-qa/.tmp/`: `shots.mjs [--live]`, `slices.mjs <page> <width> <y…> [--live]`,
`mobile-bar-check.mjs`, `gate.mjs`.

**Blocked on the client**: the LeadConnector form id (placeholder `REPLACE_WITH_MARVEL_FORM_ID`
today), and three real review quotes (their review block is a third-party widget, so no quote text
exists in the DOM to reuse).

**Gotchas worth remembering.** `update_style` silently ignores a SHORTHAND property name
(`border: 1px solid x` is accepted and changes nothing) while `whtml_builder` parses shorthands,
so send longhands. A class that owns a combo gives the write to the COMBO, leaving the bare global
empty. This site serves NO global anchor reset, so every link class must set its own colour and
`text-decoration` or it renders browser-blue and underlined. And five office-interior images the live site still renders return
**403 AccessDenied** from the Webflow CDN. Not a fetch problem, the files are genuinely
unreachable. Always range-GET an image URL before building it in.
