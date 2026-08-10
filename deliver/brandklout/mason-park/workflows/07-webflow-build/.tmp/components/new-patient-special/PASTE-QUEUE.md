# PASTE QUEUE — New Patient Special LP (`/new-patient-special`)

Source Asana task GID: 1217040406855582 · Site `6a60bdc0340e5f1784b4d553` · https://mason-park-dental.webflow.io
Built from `04-design/.tmp/new-patient-special/` — regenerate with the pipeline in
`07-webflow-build.md`, never by hand-editing payloads.

## Prerequisites (once per SITE — check before ANY paste)

1. **Backup**: duplicate the site in the dashboard first.
2. **Site Settings → Fonts**: **Fraunces** and **Inter** must be enabled BEFORE
   pasting. Webflow silently strips `font-family` from pasted styles when the
   family is not registered — no error, the whole page lands in system-ui.
3. **Site Settings → Custom Code → Head** ← `.tmp/pc/install-head.html`
   (REPLACES the old site head block: fonts link → fluid root → reading tier →
   1439 display rung → runtime-state rules → GSAP 3.13 CDN tags → MPD
   bootstrap). The bootstrap must be in the HEAD — section embeds call
   `MPD.add` mid-parse.
4. **Site Settings → Custom Code → Footer** ← `.tmp/pc/install-footer.html`
   (REPLACES the old site footer: minified mpd-flush.js — registerPlugin,
   conversion layer, selector-driven kit, buildJourney). SITE level only,
   exactly once. There is deliberately NO ScrollSmoother — do not add one.

## The queue (paste in this order, into a FRESH blank page)

| # | component | what | size |
| :--- | :--- | :--- | :--- |
| 0 | [`00-page-shell`](./00-page-shell/README.md) | Page shell (paste FIRST, on Body) | 113 nodes / 2 embeds |
| 1 | [`01-arrival`](./01-arrival/README.md) | “Arrival” (light) · scripted | 68 nodes / 11 embeds |
| 2 | [`02-catch`](./02-catch/README.md) | “The Catch” (light) · scripted | 17 nodes / 1 embeds |
| 3 | [`03-covers`](./03-covers/README.md) | “What It Covers” (light) · scripted | 68 nodes / 5 embeds |
| 4 | [`04-visit`](./04-visit/README.md) | “The Visit” (dark) · scripted | 38 nodes / 1 embeds |
| 5 | [`05-team`](./05-team/README.md) | “The Team” (light) · scripted | 76 nodes / 3 embeds |
| 6 | [`06-proof`](./06-proof/README.md) | “The Proof” (dark) · scripted | 81 nodes / 24 embeds |
| 7 | [`07-invitation`](./07-invitation/README.md) | “The Invitation” (light) · scripted | 80 nodes / 2 embeds |
| 8 | [`08-footer-8`](./08-footer-8/README.md) | Footer (SKIP on a fresh rebuild — the shell already has it) | 69 nodes / 2 embeds |

Every section pastes into `main#main` (select it in the Navigator each time;
new pastes append at the end, so queue order = page order). Set the Body's
`data-page-key` attribute to **`new-patient-special`** after the shell paste
(`Body → Settings → Custom attributes`) — the tracking-number lookup and the
QA readiness probe both key on it.

### One-paste alternative

`.tmp/pc/new-patient-special/PASTE-full-page.html` holds the WHOLE page as one
single-root paste (shell + all sections + footer). Fastest route for a fresh
page; use the per-section components for surgical moves and partial rebuilds.

## After pasting — ask the agent to

1. Verify page settings: title/meta (`noindex, nofollow` stays until launch).
2. Patch any content nits over the MCP — never re-paste for a typo.
3. Publish to staging and run the gates (`staging-verify`, `scrub-proof`,
   `root-proof` — one page at a time).

## Cleanup after the new pages are live (agent, over the MCP)

The old headless build kept each page's chapter scripts in PAGE-level custom
code. The new build carries them inside the sections, so once a page is
rebuilt from these components:

- clear that page's **page-level head and footer custom code**
  (`data_scripts_tool > put_page_freeform_code` with empty content — the old
  blocks are archived byte-for-byte in `.tmp/_installed/`);
- retire the old page (the old and new class definitions differ, so pasting
  onto a site that still holds the old styles forks `-2` twins — build on a
  fresh page, swap slugs at cutover, then delete the old page and remove its
  now-unused styles with `data_style_tool > remove_style`);
- re-run the gates against staging: `staging-verify.mjs`, `scrub-proof`,
  `root-proof` (see 08-qa).

Constants still pending from Brandklout (ride in the site-head bootstrap, one
edit patches every page): GHL webhook URL (placeholder — forms SAY they are
not connected), thank-you tracking number, ownership of the two vendor
tracking numbers.

## Version Control

Follows [SYSTEM_RULES.md — Section 4](../../../../../../SYSTEM_RULES.md).
Regenerate via `gen_component_docs.mjs`; do not hand-edit.
