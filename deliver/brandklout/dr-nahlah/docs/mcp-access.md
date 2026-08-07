# MCP Access — Dr. Nahlah

Governs MCP use anywhere under `deliver/dr-nahlah/`. Read this and the referenced
profile before calling any MCP tool in this folder.

- **Profile**: [client-delivery](../../../../mcp-servers/profiles/client-delivery.md)
- **Access level**: `client`
- **Access model**: [ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md)
- **Project overview**: [project-overview.md](./project-overview.md)

## Active MCP Servers

| Server | Type | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `webflow-brandklout` | Webflow platform (HTTP) | All Webflow reads and writes for this client, via the shared Brandklout instance | OAuth — **registered 2026-08-07, awaiting authentication** on the `team` profile |
| `webflow-clientfirst` | Local stdio (this repo) | Client-First conversion: harvest style guides, validate payloads, resolve fluid values, suggest class reuse | None — no network, no secrets |

> [!IMPORTANT]
> **Use `webflow-brandklout`, and pass the site ID on every write.** This folder's dedicated
> instance (`webflow-dr-nahlah`) was retired on 2026-08-07 in favour of one shared instance
> covering all Brandklout clients — they sit in a single workspace Brandklout owns, so a
> per-client instance authorized against that same workspace and isolated nothing. See
> [ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).
>
> The consequence: the tool prefix is now identical for every Brandklout client, so it can no
> longer tell you which site you are acting on. **Site `6a6b84cc7fe55ddeabc0b314` is the only
> one this folder authorizes** — pass it explicitly, and never act on a site the tool
> defaulted to or listed first. Never use `webflow` or `webflow-webzite` here.

## Target Resources

| Resource | Value |
| :--- | :--- |
| Webflow site | **Dr. Nahlah** (`dr-nahlah`) — confirmed 2026-07-30 |
| Site ID | `6a6b84cc7fe55ddeabc0b314` |
| Workspace ID | `63b4b7393e89b78575e9a9bb` |
| Custom domains | none yet (Webflow subdomain only) |
| Style Guide page | `6a6b84cf7fe55ddeabc0b3c3` — **Relume Style Guide v3.0**, draft |
| Home page | `6a6b84cf7fe55ddeabc0b3bf` |
| Spike page | `6a6bae6862ebb32ff9d61d74` — "Spike — Transformation", `/spike-transformation`, **draft**, created 2026-07-30 as the isolated paste target |
| Live style vocabulary | **296 classes** harvested → `mcp-servers/webflow-clientfirst/.tmp/vocab-live-nahlah.json` |
| Variable collections | Primitives · Color Schemes · Typography · UI Styles (4, base mode each) |

### Live style-guide inventory (harvested 2026-07-30)

| Family | Count | Examples |
| :--- | ---: | :--- |
| relume (`rl_*`) | 54 | component-level Relume classes |
| padding | 25 | `padding-global`, `padding-section-*`, `padding-0` |
| margin | 22 | `margin-huge`, `margin-0`, `margin-bottom` |
| icon | 21 | `icon-1x1-*`, `icon-height-*` |
| form | 15 | `form_field-label`, `form_checkbox` |
| max-width | 11 | `max-width-large`, `max-width-full-tablet` |
| spacer | 11 | `spacer-tiny` … `spacer-xhuge` |
| text-style | 10 | `text-style-allcaps`, `text-style-muted`, `text-style-2lines` |
| heading-style | 6 | `heading-style-h1` … `h6` |
| text-weight | 6 | `text-weight-light` … `xbold` |
| text-size | 5 | `text-size-tiny` … `large` |
| container | 3 | `container-small/medium/large` |
| layout | 2 | `page-wrapper`, `main-wrapper` |
| button | 2 | `button`, `button-group` |

**These classes are already bound to the four variable collections.** Reusing them is
what makes variable binding work — bindings cannot travel through the clipboard, so a
reused class inherits them and a forked class does not.

## Allowed Operations

**`webflow-brandklout`** (once authenticated), **scoped to site `6a6b84cc7fe55ddeabc0b314`**:
- Read: list sites, pages, styles, variables, components, assets; query elements.
- Write, after the site is confirmed: create/update pages, styles, variables, elements;
  upload assets; paste payloads.
- **Never** against another Brandklout client's site. The shared grant reaches all of them;
  this folder authorizes exactly one.

**`webflow-clientfirst`** (always allowed — local, read-only against the repo, writes
only into its own `.tmp/`):
- `harvest_style_guide`, `analyze_structure`, `validate_payload`, `suggest_reuse`,
  `resolve_fluid`, `eval_length`.

## Forbidden Without Explicit Confirmation

Publishing, deleting, overwriting existing pages or styles, bulk edits, custom-domain
publishing, DNS, billing, access transfer, and any production data edit.

**Additionally forbidden here**: pasting a payload that has not passed
`webflow-clientfirst > validate_payload` with `pass: true`. A payload carrying bare
tag-name classes (`div`, `h2`, `span`) will merge by name against the Relume style guide
and can corrupt it — the existing definition wins site-wide.

## Runtime Auth Notes

Authenticate `webflow-brandklout` in a **team-profile** terminal (`claude team`, then `/mcp`).
Grants live in `~/.claude-<profile>/.credentials.json` keyed `<server-name>|<url-hash>` — per
profile, global across worktrees. One authentication covers every Brandklout client worktree.

The retired `webflow-dr-nahlah` instance was documented as "authenticated 2026-07-30", but as of
2026-08-07 no Webflow instance holds a token in any profile's credential store — the record exists
with an empty `accessToken`, most likely cleared by the laptop migration. **Treat all Webflow
access as unauthenticated until `/mcp` proves otherwise.**

> [!CAUTION]
> This site's recorded workspace is `63b4b7393e89b78575e9a9bb`, which has **not** been verified to
> be Brandklout's — it may be a build site in Webzite's own workspace. If Dr. Nahlah does not
> appear in the site list when authenticating `webflow-brandklout`, that is the answer: leave it
> unticked and re-register a dedicated instance for this client alone.

The generic `webflow` instance currently returns 401 and must not be used for this client
even if it is later authenticated.

`webflow-clientfirst` needs no authentication and holds no credentials.

## Artifact Paths

| Output | Path |
| :--- | :--- |
| Conversion payloads and probes | `workflows/07-webflow-build/.tmp/` |
| Conversion diagnosis | `workflows/07-webflow-build/.tmp/CONVERSION-DIAGNOSIS.md` |
| Harvested vocabularies, resolved payloads | `mcp-servers/webflow-clientfirst/.tmp/` |

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- `.mcp.json` entries contain no secrets and are safe to commit. OAuth grants are
  per-machine runtime state and are never stored in the repo.
