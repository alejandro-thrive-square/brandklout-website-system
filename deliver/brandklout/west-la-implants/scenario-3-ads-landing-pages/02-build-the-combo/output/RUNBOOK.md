# scenario-3-ads-landing-pages · 02-build-the-combo · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · six pages built and published (seq 24)

**Done** (`b9b96a5c`)
- The build lives where the site's build lives, not in this step's `output/code/`:
  `workflows/04-design/.tmp/site-src/` gained `lib/lp.mjs` (the set's blocks and assembly),
  `templates/ads-landing-pages.mjs` (both campaigns' copy), `css/60-lp.css`, `sections/lp.js`.
  `node build.mjs --strict` writes `dist/ads-landing-pages/*.html` with the other 80 pages.
- Landing page: all eleven Livewell beats in order. Own shapes for the hero with the form, the
  journey, the reasons, the close and the foot; the site's own `stories`, `strip`, `compare`,
  `steps`, `gallery`, `rail` and `faq` blocks for the rest, so three chapters pin and scrub.
  Eight of the beats are numbered chapters; the films, the rooms and the questions are not.
- Consultation: form first, the three films, reviews and credentials. Thank you: phone first, no form.
- Header is logo, phone and one button; no menu, no drawer. Everything is named `lp-*`.
- Pushed with the client's own chain (`workflows/21-instatic-upload/`), full replace, after a
  three-layer backup: tag `wla-pre-ads-2026-09-30`, an API snapshot that was byte-identical to the
  2026-09-24 one (so nobody had edited in the admin), and
  `/app/storage/backups/cms-2026-09-30-seq23-pre-ads.db`. 86 pages written, 0 deleted, published.

**Next**
- When the GHL snippets arrive: paste each into `formSnippet`, add `place-embeds.mjs` to the chain
  (see `21-instatic-upload.md`, "The ads set"), push, then run `verify-form.mjs` on the deployed host.
- Tags: GTM and a number pool are not on this instance. They go in the Embed Origins `siteScripts`.

**Gotchas**
- The form is a PROTOTYPE. It stores nothing and forwards to the thank-you page. No traffic yet.
- `21-instatic-upload/*.mjs` imported `insta-api.mjs` from `deliver/process/22-instatic-api-sync/`,
  which no worktree has had since 2026-09-27. They now import the client's `tools/instatic-api-sync/` copy.
- The media list returns the newest 100 assets only (upload trap 43). The first upload run
  re-uploaded 144 files; they were removed and the script fixed. Main's promoted
  `tools/instatic-site/push/upload-media.mjs` has the same bug and needs the same fix there.
- On one column the hero copy is `display: contents`, so the form sits under the three checks and
  above the review. The two hero buttons are hidden there because the mobile bar carries both.
- A page's `<body class>` does not survive the import. Nothing may key on `body.is-lp`.
- Instatic turns the prototype into a `base.form` in custom mode; `sections/lp.js` prevents the
  submit and navigates. Checked on the published pages (`lp-click.mjs`).
- The site's approved direction is dark, so the set is dark. The agency's light-only rule was not applied.
- Never write a `.mjs` or a multi-file chain of runbooks through a bash heredoc: backslashes are
  halved, and one apostrophe in the prose ends the whole command. Use the Write tool.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
