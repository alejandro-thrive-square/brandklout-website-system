## 2026-09-04 — Stone split into three projects (`604da383`)

One client, three projects. Asana wrote the engagement as "2 full websites" under one task pair, so
the repo had Surgical Arts inside `stone-dental-implant-center/` with the site buried at
`04-design/.tmp/surgical-arts/`. Now **a folder means a website**:

| Project | Folder | Worktree | Platform |
| :--- | :--- | :--- | :--- |
| Stone Surgical Arts | `stone-surgical-arts/` | `bk-stone` | Instatic |
| Stone Dental Implant Center | `stone-dental-implant-center/` | `bk-stone-dental` | Webflow ad LPs |
| Stone Med Spa | `stone-med-spa/` | `bk-stone-med-spa` | Instatic |

Git recorded 220 renames + 5 modifications. Verified after the move: 12 pages, 56 assets, 0 missing;
the 134 MB of client stock images came across too.

### Gotchas

- **Widen the sparse cone BEFORE `git mv`, narrow it after.** The destination path was outside the
  cone, so moving into it would have hidden the whole folder — including the untracked restored
  assets and stock images, which no commit would bring back.
- **Do not blind-replace a client slug.** 18 files matched `stone-dental-implant-center`, but several
  belong to the **dental** project and had to keep it: the `mcp-access.md` site registry, the
  `ASANA-DISPATCH.md` row, `webflow-stone-dental-implant-center` as an MCP profile name. Only the
  `.gitignore` path, `ORCHESTRATION.md`'s worktree map and the moved folder itself changed slug;
  the registries gained a **row per project** instead.
- **Both Stone Asana GIDs are still listed against both of the first two projects.**
  `asana-context.mjs` cannot tell which GID is which website, and the Asana reorganisation is the
  user's, in progress. Split them there once Asana is split — do not guess.
- The master credential file now has `[stone-surgical-arts]` (Instatic URL + per-instance password)
  and a separate `[stone-dental-implant-center]` (Webflow only, no Instatic). `bk-stone`'s alias
  points at the new slug; all three worktrees re-synced.
