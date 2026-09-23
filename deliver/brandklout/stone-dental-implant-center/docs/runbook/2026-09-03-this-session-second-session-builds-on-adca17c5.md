## Done this session (2026-09-03, second session — builds on `adca17c5`)

- Discovered the Webflow site via `list_sites` (was "unknown" in the docs): `6a07d5aac093f0e4521d29bc`.
  Registered it in both `docs/mcp-access.md` files with a two-domain caution.
- Cloned the Livewell reference trio (rendered HTML + CSS downloaded; element structure available
  via the same MCP from site `69d03fdbe999e9907724a69d` — the pages live in Brandklout's own
  workspace, which is a better source than scraping).
- Built the three pages headlessly through the Webflow MCP (`data_whtml_builder` inserts HTML+CSS
  that becomes real Webflow elements + styles). ~140 `axon-*` styles created; Client-First-style
  campaign namespace. GHL form iframe embeds added via `data_element_builder` + settings (whtml
  sanitizes iframes).
- Copy: all facts sourced from the client's own site (credentials, FAQ, pricing language, review
  counts). Enforced zero Livewell copy with a 6-gram overlap diff — found 343, rewrote to 3
  boundary artifacts (no whole sentences shared).
- Published twice (initial + copy-correction republish) — the user gave the go-ahead in-session;
  recorded in the client's `docs/mcp-access.md`. Single-page publishing is NOT available on this
  plan (`pageId` → `bad_request`); publish is always full-site to all four domains.
- QA: live screenshots of all sections (in `workflows/08-qa/.tmp/screens/`), Livewell-marker scan
  on the published HTML, title/form/image checks.
