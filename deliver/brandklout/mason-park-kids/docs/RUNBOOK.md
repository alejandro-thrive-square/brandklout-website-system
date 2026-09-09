# RUNBOOK - `bk-mason-park-kids`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


**This worktree holds exactly one site: Mason Park Dental for Kids,
`pediatricdentistkatytx.com`, in `deliver/brandklout/mason-park-kids/`.** Nothing else. If a task
is about `bestdentistinkatytx.com` / `mason-park.up.railway.app`, it belongs one directory over in
`bk-mason-park` - stop and switch, do not do it here.

## Where the site is, as of 2026-09-09

**57 pages live and published at <https://mason-park-kids.up.railway.app>.** The public domain
still does not point here; that host is the review link.

| | State |
| :--- | :--- |
| The **eleven core pages** | Designed, and the design is now identical on disk and published. `workflows/03-core-pages/` is the source. |
| The **46 migrated pages** | **Repaired, not redesigned.** They render in the brand's type and palette, carry no text under 12px, and have the same head tags as the rest. Their layouts are still the 02 migration's, and most carry no photograph. **This is the next job.** |
| Head tags | Every page has a description, canonical, Open Graph and JSON-LD, written at publish by the two plugins in `deliver/process/19-instatic-seo`. |
| Type | Fraunces and Nunito, the VARIABLE files, self-hosted on both sides. The platform's static instances are still installed as the fallback. |

### The gates, and what each one is for

Run from `workflows/03-core-pages/.tmp/`. All of them are cheap; run them all.

| Command | Answers |
| :--- | :--- |
| `node check.mjs` | Do the assets resolve, the braces balance, the prose fit, the chrome match? |
| `node shot.mjs <page>` | What does it look like at four widths, and which font is really painted? |
| `node crop-all.mjs` / `--live` | Does any heading lose ink to a clipping ancestor? |
| `node diff-all.mjs` | Local against live, all eleven: head, structure, text, geometry. |
| `node audit-live.mjs` / `--width 390` | **All 57 routes**, not the eleven. |
| `node verify-live.mjs` / `--migrated` | The published pages, end to end. |
| `node probe-hooks.mjs <url>` | Do the scrubbed scenes actually do work? |

### Three traps that have each cost a session

1. **Look at every Magnific face before you ship it.** It will return a
   convincing photograph of somebody who is not the person. Two of this
   practice's named staff came back as different people; `contact-sheet.py`
   is what caught it.
2. **`import-styles.mjs` ships `instatic/site.css`,** which `to-instatic.mjs`
   writes. Edit the stylesheet without re-exporting and it publishes the
   previous one silently.
3. **`abspath` before you open anything under the recovery mirror.** Windows
   applies MAX_PATH to the unresolved string, so a valid path fails as "no such
   file" from this worktree's root.

