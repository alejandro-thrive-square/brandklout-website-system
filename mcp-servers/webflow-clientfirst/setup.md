# MCP Server: webflow-clientfirst

Local, dependency-free MCP server that makes **Client-First class reuse the default**
when building Webflow pages from coded sections — and blocks broken payloads before
they reach Webflow. It serves the Webflow sites ([Scenario 6 · Webflow Sites](../../deliver/process/scenario-6-webflow-sites/README.md)).

Built 2026-07-30 after a diagnosis of the Dr. Nahlah Webflow conversion found three defects the
existing toolchain could not see (the diagnosis lived on that client branch's old
`workflows/07-webflow-build/.tmp/`; the findings are the table below).

## Why it exists

| Problem | What this server does |
| :--- | :--- |
| **Font sizes read `0px` in the Designer style panel** while the canvas looks correct. Cause: `clamp()`/`calc()`/`min()` survive into `styleLess`; the browser parses them, the style panel cannot. | `resolve_fluid` rewrites them to concrete px per Webflow breakpoint |
| **Bare tag-name classes** (`div`, `h2`, `span`) collide site-wide — Webflow merges pasted classes by name and the existing definition wins | `validate_payload` fails the payload |
| **Nothing reuses the style guide** — the converter emits a new style for every element | `harvest_style_guide` + `suggest_reuse` map elements onto existing Client-First classes |
| **Large responses blow up agent context** | Every tool writes full data to disk and returns only a compact summary |

## Configuration

Registered in the repo's `.mcp.json`:

```json
"webflow-clientfirst": {
  "type": "stdio",
  "command": "node",
  "args": ["mcp-servers/webflow-clientfirst/server.mjs"]
}
```

No authentication, no network access, no secrets. It reads repo files and writes only
into its own `.tmp/` (gitignored). Node 18+; no `npm install` required.

## Tools

| Tool | Purpose |
| :--- | :--- |
| `harvest_style_guide` | Compiled Webflow CSS → vocabulary of classes + variables. Run once per design system. |
| `analyze_structure` | Class counts per Client-First family; which base components are available to reuse. Pass `family` to list one family in full. |
| `validate_payload` | Flags CSS functions, bare tag names, and (with a vocabulary) reuse vs. fork percentage. Returns `pass: true/false`. |
| `suggest_reuse` | Proposes the closest style-guide class for each emitted style, scored 0–1. |
| `resolve_fluid` | Rewrites `clamp()/min()/max()/calc()` to concrete px per breakpoint; writes a per-breakpoint override map. |
| `eval_length` | Spot-check one CSS length expression across all breakpoints. |

**Breakpoints**: desktop 1440 · tablet 991 · mobile-landscape 767 · mobile-portrait 478.

## CLI passthrough

Every capability runs without an MCP client attached, which is what makes it testable:

```bash
node server.mjs eval_length '{"expr":"clamp(1.9rem,3.6vw,3.75rem)"}'
node server.mjs harvest_style_guide '{"css_path":"deliver/process/tools/client-first-style-guide/assets/webzite-relume.webflow.shared.62ada462d.css","out":"mcp-servers/webflow-clientfirst/.tmp/vocab-relume.json"}'
node server.mjs validate_payload '{"payload":"<step>/output/<page>.json","vocab":"mcp-servers/webflow-clientfirst/.tmp/vocab-relume.json"}'
```

Paths are resolved relative to the repo root.

## Verified behaviour (2026-07-30)

Harvested from the Webzite Relume style guide: **217 classes, 43 variables**.

| Family | Count | Sample |
| :--- | ---: | :--- |
| padding | 22 | `padding-global`, `padding-section-large`, `padding-0` |
| icon | 21 | `icon-1x1-medium`, `icon-height-large` |
| margin | 19 | `margin-huge`, `margin-bottom`, `margin-0` |
| form | 14 | `form_field-label`, `form_checkbox` |
| max-width | 11 | `max-width-full`, `max-width-full-tablet` |
| spacer | 11 | `spacer-large`, `spacer-huge` |
| text-style | 8 | `text-style-allcaps`, `text-style-muted` |
| text-weight | 6 | `text-weight-bold`, `text-weight-medium` |
| heading-style | 6 | `heading-style-h1` … `h6` |
| text-size | 5 | `text-size-large`, `text-size-regular` |

Against the Dr. Nahlah v2 page (9 chapters, 258 styles):

- **186 CSS functions** found in `styleLess` — 47 of them `font-size`
- **126 bare tag-name classes**
- **0% reuse** of style-guide classes
- `resolve_fluid` converts **174 of 186** to concrete per-breakpoint px; the remaining 12
  are `calc(100% - …)` forms that genuinely need container context and are reported as
  unresolved rather than guessed

Sanity check: `clamp(1.9rem,3.6vw,3.75rem)` → desktop **51.84px**, tablet **35.68px**,
mobile **30.4px**.

## Scope

This server does **not** talk to Webflow. Platform reads and writes go through the
per-principal OAuth instance — `webflow-<client>` where the client owns the account, or
`webflow-<partner>` where a white-label partner owns one workspace holding all its clients
(`webflow-brandklout`) — governed by the working folder's `docs/mcp-access.md`. Keeping the
two separate means the analysis half needs no credentials and runs in CI.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- `.tmp/` holds generated vocabularies and resolved payloads; it is gitignored — regenerate with `harvest_style_guide`.
