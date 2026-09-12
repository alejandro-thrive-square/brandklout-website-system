## 2026-09-12: Sienna accessibility widget on every Instatic site

### Done

- `brandklout.embed-origins` **1.6.0** adds a `siteScripts` setting. Its `publish.html` filter
  puts `<script src="…" async data-wz-site-script>` before `</head>` on every page, then grants
  the host `script-src`, `connect-src`, `style-src` and `font-src`. A plain tag could never work:
  all eight instances publish a CSP, and five of them are `script-src 'self'`.
- Installed or upgraded on all eight instances in `~/.webzite/.env`, with `siteScripts` set to
  `https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js`.
  Stone Surgical Arts, Stone Med Spa and West LA Implants had no plugin at all. They now carry
  the Embed block too, and their pages without an embed keep the strict policy.
- **Published and verified on six:** Mason Park, Mason Park Kids, Stone Surgical Arts, Institute
  for Advanced Dentistry, West LA Implants, Brandklout. 412 pages each carry one tag and a CSP
  allowing jsdelivr. Headless Chrome renders `asw-container` on dfwsurgicalarts.com (strict CSP)
  and masonparkdental.com (compatible CSP).
- New `deliver/process/18-instatic-embeds/rollout-site-scripts.mjs`, which covers status, apply,
  publish and verify across every instance. Also: `set-origins.mjs` still targeted
  `webzite.embed-origins` and overwrote the other settings, and now merges;
  `test-embed-module.mjs` still expected the old module id. Both suites are green: 64 and 54.

### Next

- ~~Dr. Nahlah and Stone Med Spa held back.~~ **Published later the same day, on the user's
  go-ahead, drafts included** (`--allow-drift`). Dr. Nahlah's pending edits are now live, and so
  is Stone Med Spa's 11th page. All eight sites now carry the widget.
- New instances (Arvada, Grand Mission, Legacy, Livewell and Marvel have no `INSTATIC_BASE_URL`
  yet): once one is provisioned, run `apply` then `publish` against it.

### Gotchas

- The script URL is **unpinned**, as given. jsdelivr serves the latest `sienna-accessibility`,
  so a vendor release reaches every site without a publish. Pin `@2.2.333` in `siteScripts` if
  that becomes a problem.
- `widen()` created an absent directive without deduping, so the same origin could appear twice
  and a republish rewrote the CSP. This is fixed and covered by a test.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
