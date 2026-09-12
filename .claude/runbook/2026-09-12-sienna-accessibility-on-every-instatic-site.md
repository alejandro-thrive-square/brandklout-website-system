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

- **Dr. Nahlah and Stone Med Spa are NOT published.** Both have the setting, but their drafts
  differ from what is live. Dr. Nahlah has unpublished edits across its 38 pages; Stone Med Spa
  has an 11th page that has never gone live. When those are ready (or once someone decides they
  can ship), run
  `node rollout-site-scripts.mjs publish --apply --only dr-nahlah,stone-med-spa --allow-drift`,
  then `verify --url <sienna> --only …`.
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
