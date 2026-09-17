## 2026-09-04 — Stone Surgical Arts: assets restored, naming untangled

Same failure as Mason Park: `surgical-arts/final-site` referenced 56 assets, **0 on disk**. Same
cause — `assets/` is gitignored and `core.hooksPath` is unset, so nothing mirrors.

### The three stone worktrees, which is which

The Stone engagement is **one client with two websites** (`docs/project-overview.md`: "Scope — 2 full
websites"), so Surgical Arts correctly lives *inside* the dental folder. That is what makes the
worktree names misleading, not the folder layout.

| Worktree | Builds | Client folder | Target |
| :--- | :--- | :--- | :--- |
| `bk-stone` | **Stone Surgical Arts** — 12 pages | `stone-dental-implant-center/.../surgical-arts/` | Instatic `stone-surgical-arts-production.up.railway.app` |
| `bk-stone-dental` | implant centre **ad landing pages** | `stone-dental-implant-center` | Webflow |
| `bk-stone-med-spa` | **Stone Med Spa** | `stone-med-spa` | Instatic |

Orca **display names** now carry this, in the same bare `bk-*` form every other worktree uses —
`bk-stone-surgical-arts`, `bk-stone-dental`, `bk-stone-med-spa`. Only the first differs from its
directory (`bk-stone`), which is the point: the name says which of the two sites it builds. Prose
display names were tried first and reverted — **keep the `bk-*` convention.** The master's
`[aliases]` carries the same note. **Directories and branches were NOT renamed**: Orca keys a
worktree by `<repo-id>::<path>`, so moving one orphans its Orca record.

### Restored

56 of 56, 4.0 MB, from the published Instatic instance — the only place holding exact bytes for the
`gen-*` Freepik Mystic images, which a re-run would not reproduce (same prompt, different picture).

### The gap that is NOT closed

**Every restored photograph is PRE-UPSCALE.** Instatic holds the 2026-09-01 publish; the refinement
pass (`9628637b`, 2026-09-04, Fable) re-emitted 16 photographs at 2x-4x through Magnific and was
never published, so those bytes are gone. Measured, not assumed:

| file | restored | upscale target |
| :--- | ---: | ---: |
| dr-stone-standing.webp | 988x1482 | 2000 |
| dr-stone-smile.webp | 550x550 | 1600 |
| dr-stone-desk.webp | 700x525 | 2000 |
| staff-*.webp (6) | 492x615 | 960 |

**Re-running `upscale-doctor.mjs` is blocked**, and not by the key: `MAGNIFIC` is present now, but 15
of the 16 jobs read their source from `img/...` under
`01-content-intake/.tmp/google-drive-images`, which is **empty** — the client Drive export is gone
too. Only `dr-stone-portrait.webp` has another source (`get-assets.mjs`, off the Webflow CDN).

> **Superseded 2026-09-16:** Drive now works through `scripts/drive.mjs` with new credentials. See
> [2026-09-16-google-drive-access](./2026-09-16-google-drive-access.md). The paragraph below
> describes the old keys only.

**The Google Drive API is not a way back.** Confirmed by Alejandro 2026-09-04: the `GOOGLEDRIVE`,
`GOOGLEDRIVEOAUTH` and `GOOGLEDRIVEOAUTHID` values were **never successfully used** — they are not
correct credentials, and `drive-oauth.mjs` additionally wants a `GOOGLEDRIVEREFRESH` that has never
existed. They are kept in the master only so nobody re-derives them from an old worktree and assumes
they work; the master says so beside them. **Ask for the client's export directly instead of
spending time on OAuth.**

### Gotchas

- **The design work itself was never at risk.** `9628637b` is committed with a clean tree. It is
  **not on any remote**, though — that whole branch is 34 commits ahead of `origin/main` and exists
  only on this machine. Push before anything else.
- **Restoring from a published site gives you the PUBLISHED version, which may be older than local
  work.** Check dimensions or bytes before assuming a restore is complete. It cost nothing here
  because the pre-upscale files are still the right pictures — just soft on a 2K screen.
- The doctor's chosen stock images are in
  `01-content-intake/.tmp/Stock Images-20260904T185452Z-1-001/Stock Images/` — 20 files, 134 MB,
  raw camera-size JPEGs plus one `.mov`. Botox/Xeomin, Dysport, fillers, Morpheus8, PRP, chemical
  peels, hair restoration. **Both** Stone brands sell these, so decide which site they serve before
  processing; they need resizing and webp conversion before any page uses them.
