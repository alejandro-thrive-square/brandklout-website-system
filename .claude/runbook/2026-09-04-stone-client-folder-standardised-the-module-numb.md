## 2026-09-04 — Stone client folder standardised; the module-number registry was wrong

Audited `deliver/brandklout/stone-dental-implant-center/` against
[DELIVER_SYSTEM_RULES §3](../deliver/DELIVER_SYSTEM_RULES.md).

**The folder NAME is correct.** §3 says `deliver/[client-name]/`, and the client is the signed Asana
project "BK Activation — Stone Dental Implant Center", whose scope is **two full websites**. Surgical
Arts belongs inside it. The confusion was the worktree names, fixed separately.

**Site output under `04-design/.tmp/` is also correct** — §3 says design outputs live in the `.tmp/`
of the workflow that produces them. `bk-mason-park` putting its build *outside* `.tmp/` is the
deviation, not this.

### Fixed

- `05-instatic-upload` → **`21-instatic-upload`** (`a7c3eda6`). It collided with the canonical
  `05-design-revisions`. Directive renamed with it, five prose cross-references updated, git
  recorded it as a rename.
- `docs/project-overview.md` gained the **§3.2 block it never had**: `process_baseline_commit`, the
  routed module list, the two-sites-one-folder layout, and three deviations written down — the
  client-local module, the `.tmp/` placement, and modules 00/01/04 having no `.md` directive.
- `PROCESS_INDEX.md` corrected (`d7a3211d`, `e9a44393`).

### Gotchas

- **The index's own warning was out of date.** It said `19-cloudflare-launch` "lives untracked in
  `bk-dr-nahlah`" and "should be promoted here". It is *already* promoted into `deliver/process/` on
  that branch — just unmerged, so invisible from `main`. Reading `main` alone gives a wrong answer
  about which numbers are free.
- **The collisions are a pattern, not one mistake.** A scan of all thirteen worktrees found **27**
  distinct numbered modules against the 21 the index lists:

  | canonical | collides with | in |
  | :--- | :--- | :--- |
  | 01/02/03 | `01-site-recovery`, `02-static-rebuild`, `03-core-pages` | bk-mason-park-kids |
  | 05 | `05-instatic-upload` | bk-stone (fixed), **bk-stone-med-spa (still 05)** |
  | 09/10/11 | `09-static-rebuild`, `10-lp-instatic`, `11-instatic-404` | bk-mason-park |
  | 15/16/17/18 | the four Instatic modules | bk-dr-nahlah |

  ```bash
  ls ~/orca/workspaces/*/*/deliver/*/*/workflows/ | grep -E '^[0-9][0-9]-' | sort -u
  ```
  **Next free number is 22.** Run that before claiming one.
- **Promotion is the real fix.** A module two clients use should live in `deliver/process/`, which
  settles its number once instead of per worktree. Due: `19-cloudflare-launch`,
  `21-instatic-upload`, and Dr. Nahlah's four.
