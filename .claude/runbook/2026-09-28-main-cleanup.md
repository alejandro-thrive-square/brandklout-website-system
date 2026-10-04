# 2026-09-28 — main cleaned: duplicates, dead scripts and stale docs out; Webflow gets Scenario 6

Repo-level. Alejandro asked to clean main so every document has a purpose and nothing contradicts
another (his example: `tools/instatic-embeds` beside `tools/instatic-plugins`, and a leftover
`18-instatic-embeds/`). Three read-only audits (Instatic tools, other tools, scenarios and root docs)
produced the list; he decided the open calls: delete `SYSTEM_ARCHITECTURE.md`; move Dr. Nahlah's
one-off scripts to her branch; the design standard and journey audit live inside the scenario that
uses them; Webflow keeps its own scenario.

## Done

- **Phase 1, `31a447e4`** (143 files, about 27k lines out):
  - `instatic-plugins` is the one home for plugin source, pack, install, tests and rollout;
    `instatic-embeds` shrank to the Embed-block guide. One admin client,
    `instatic-api-sync/insta-api.mjs`, which now refuses to run without `INSTATIC_BASE_URL` (it fell
    back to the retired `encorercm.com`).
  - Embed gates use the `brandklout.*` ids again (they could not pass since the 2026-09-10 rename);
    `verify-embed-module` folded into `verify-embed-scripts`; the editor gate, probes and four `.py`
    wrappers deleted. `rollout-site-scripts` no longer installs plugins.
  - One `check-ghl-form` and one `dni-proof`, in `tools/termly-ghl-consent/gates/` (were three and two
    copies that disagreed). `specialty-sitemaps` lost its scrape data and Relume placeholders (the 49
    page-type flows kept as `section-flows.md`); `client-first-style-guide` lost the Webflow runtime.
  - Root docs: `SYSTEM_ARCHITECTURE.md` deleted; `SYSTEM_RULES` rewritten for the scenario layout, R2
    media and `main` + `bk-*`; INSTALL, DEPLOYMENT, HERMES, ORCA, ORCHESTRATION, ASANA-DISPATCH and the
    MCP docs brought current; Figma MCP, the legacy `webflow` server, four profiles and
    `deploy.sh` / `notify*.py` / `sync-assets.sh` removed.
- **Dr. Nahlah one-offs, `e99bff6e` on `bk-dr-nahlah`**: eight scripts from `instatic-api-sync` to
  `workflows/22-instatic-api-sync/one-offs/` with a README; deleted from main in phase 1.
- **Phase 2 (this commit)**:
  - `DESIGN-STANDARD.md` and `journey-audit.mjs` moved into `scenario-0-new-site/03-design-build/`
    (the audit's `--all` now walks `git worktree list` instead of a hard-coded path and three August
    clients); 04-qa runs it. `gsap-animations` and `scroll-film-studio` deleted; their two still-true
    rules (self-host GSAP, pointer-only cursor effects) are in the standard.
  - **Scenario 6 · Webflow Sites** (`scenario-6-webflow-sites/`, 01 intake, 02 build A to K, 03 QA and
    publish) holds the Webflow path moved out of Scenario 2 (git mv, history kept) and Scenario 3's
    Webflow build (section K, whtml only; the paste converter contradiction is gone).
    `staging-verify.mjs` moved into its step 03. Scenario 2 is now the Instatic path.
  - `scenario.mjs` copies toolkit dependencies: each toolkit's `toolkit.json` `"requires"` lists the
    toolkits its scripts import or run, copied transitively. Without it, client copies of
    Scenarios 2, 3 and 5 would have missed `instatic-api-sync` / `instatic-plugins` / `ads-combo`.
  - PROCESS_INDEX: Scenario 6, and a Tools table whose "Used by" is derived from the `tools.json` files.

## Next

1. **FigJam *Deliver SOP's* needs a Scenario 6 lane** (01 intake, 02 build, 03 QA and publish), and
   Scenario 2's lane should read Instatic only. The API is read-only for FigJam; a human draws it.
2. **embed-origins server comment** still says "23-termly-ghl-consent"
   (`instatic-plugins/embed-origins/server/index.js:604`). It is released 1.8.0 code: change it with
   the next version bump through Scenario 4, not in place.
3. **`.env.example` has no `R2_TOKEN` / `R2_BUCKET`**; INSTALL notes the `CLOUDFLARETESTING` fallback.
4. **`rollout-site-scripts.mjs` still reads `~/.webzite/.env` sections**, not `instatic-domain-origins/sites.json`
   like `plugins.mjs`, so "every site" means production only there.

## Gotchas

- **A cross-scenario link breaks in a client copy** unless the client started both scenarios.
  Scenario 6 step 01 links to Scenario 2 step 01 for the platform-neutral intake; read it on main.
- **Working copies are CRLF** (`core.autocrlf=true`) while the index is LF: a Node string replace on a
  freshly checked-out file misses every multi-line match. Normalise `\r\n` first.
- **Shell-quoted Node one-liners eat backticks.** Edit Markdown tables with the Edit tool.

## Version Control

Tracked in `.claude/runbook/`; follows [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
