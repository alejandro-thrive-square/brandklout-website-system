## 2026-08-28 - split out of `bk-mason-park` into this worktree (`28260df`)

The two sites shared the `bk-mason-park` worktree until today, deliberately, so one agent could
hold both. That did not work. The two builds are near-identical in shape (same ThemeREX
`tooth-fairy` theme, same practice, same doctors, the same fabricated awards) and differ in every
detail that decides an action: domain, SiteGround account, database, page set, which findings are
real on which site, which one is live. Sessions kept carrying one site's facts onto the other.

**The rule now: one worktree per site, not per client.** Same client, two worktrees, and that is
correct.

What moved, and what to know about it:

- The whole `deliver/brandklout/mason-park-kids/` folder was moved here from `bk-mason-park` as
  untracked working-tree files (it had never been committed) and committed on this branch.
- **This worktree is sparse** (SYSTEM_RULES 4.2.0). The cone is `deliver/process`,
  `deliver/brandklout/docs`, `deliver/brandklout/scripts`, `deliver/brandklout/mason-park-kids`,
  `scripts`, `mcp-servers`, `.claude` - 1,487 files instead of 6,985, and **no other client folder
  is on disk**, `mason-park/` included. That is the point. Sparse narrows the working tree only;
  the index still holds every path, so commits and merges from here are complete. Widen with
  `git sparse-checkout add <path>`, go full with `git sparse-checkout disable`.
- **The branch is based on `main`, not on `bk-mason-park`.** So `mason-park/workflows/09-static-rebuild/`
  - the Client-First component library this site is expected to reuse - **is not reachable from
  this branch at all**; it exists only on `bk-mason-park`, unmerged. Read it in place at
  `../bk-mason-park/deliver/brandklout/mason-park/workflows/09-static-rebuild/README.md` and copy
  what you need. Do not point a build script across worktrees.
- `.env` was copied from `bk-mason-park` (9 assignments). It will drift from the sibling copy -
  see the credential-search rule in SYSTEM_RULES 3 before concluding a key does not exist.
- **`.secrets/sg_pediatric_recovery` was MOVED here, not copied.** It is the passphrase-less
  SiteGround key for this site's recovery and it is gone from `bk-mason-park`. It is still
  outstanding for revocation - see the 2026-08-27 entry below.
- `.gitignore` on this branch had to be widened by hand, because `main` never got the rules that
  were added on `bk-mason-park`: `.secrets/`, `*.pem`, `id_ed25519*`, `id_rsa*`, `!*.pub`,
  `**/recovered/`, `**/01-site-recovery/.tmp/pages/**/rendered.html`, `php_errorlog`. **Without
  those the private key and the 101 MB of recovered DB dumps would have been committable.** The
  same rules exist on `bk-mason-park`, so expect a small `.gitignore` conflict when both branches
  reach `main`; keep one copy of each rule.
- 178 files / 1.0 MB were committed. The heavy artifacts stay on disk and ignored: `recovered/`
  101 MB, `screenshots/` 32 MB, `pages/` 18 MB.
- The kids preview server (`node serve.mjs --port 4310`) was killed to release the directory lock
  for the move. Restart it from the new path.

### Next

Unchanged from the entries below - client sign-off on the open items, hosting, and the key
revocation. Nothing about the build itself changed in this split.

## Objective

Mason Park Dental for Kids, the pediatric brand of Mason Park Dental of Katy (white-label for
Brandklout). Domain `pediatricdentistkatytx.com`, SiteGround `34.174.211.179`. No Asana task
exists; Brandklout has been asked to create one. The WordPress install is compromised and treated
as unrecoverable: the site is being rebuilt as static from content recovered over SSH. 54 pages
build locally and pass their own audit; nothing is hosted yet.

Full context: [`deliver/brandklout/mason-park-kids/docs/project-overview.md`](../deliver/brandklout/mason-park-kids/docs/project-overview.md).
