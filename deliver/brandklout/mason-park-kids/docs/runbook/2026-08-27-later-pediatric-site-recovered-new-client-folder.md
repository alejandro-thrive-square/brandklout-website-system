## 2026-08-27 (later) — pediatric site RECOVERED. New client folder `mason-park-kids/`.

The practice's second brand, `pediatricdentistkatytx.com`, was recovered off SiteGround over SSH.
It now has **its own client folder in this worktree**, deliberately: same client, separate site.

- [`deliver/brandklout/mason-park-kids/docs/project-overview.md`](../deliver/brandklout/mason-park-kids/docs/project-overview.md)
- [`.../docs/security-incident-2026-08-27.md`](../deliver/brandklout/mason-park-kids/docs/security-incident-2026-08-27.md)
- [`.../workflows/01-site-recovery/README.md`](../deliver/brandklout/mason-park-kids/workflows/01-site-recovery/README.md) — **read this before re-running anything**

`mason-park/docs/project-overview.md` and `deliver/brandklout/docs/ASANA-DISPATCH.md` both
cross-link it now, so an agent landing on either site finds the other.

### What was recovered

40 pages, 157 posts, 580 attachments as WXR; full DB dump; a 767-file offline mirror of all 40
pages with their CSS/JS/fonts/images; **40 full-page screenshots, all with the full 95-item nav**.
`node verify-safe.mjs` passes 8/8. `recovered/` and `screenshots/` are gitignored.

**The theme is `tooth-fairy` — the same ThemeREX build as the main site**, so the workflow-09
Client-First component library should carry over almost unchanged.

### THE HOST IS ACTIVELY COMPROMISED — still being written to

Four fake plugins with obfuscated PHP planted 25–27 Aug (two active), plus a 174 KB backdoor at
`mu-plugins/transient-cleanup.php`, mtime backdated to 2022, perms `000`, which WordPress tries to
include on every request. New files landed on 27 Aug at 03:14, 05:11, 08:02, 13:56. **No PHP was
downloaded and none should be.** Brandklout should tell SiteGround the account is still being
written to, and treat the install as unrecoverable rather than cleanable.

### Credentials

`PRIVATEKEY` in `.env` **does not work** — 387 base64 chars where 388 are needed (the embedded
public key matches `PUBLICKEY`, so it is the right key, truncated on paste) AND passphrase-
protected with no passphrase recorded. The working credential is the passphrase-less key at
`.secrets/sg_pediatric_recovery`, whose public half the user installed in Site Tools on 2026-08-27.
**REVOKE IT** in Site Tools → Devs → SSH Keys Manager when the recovery is finished.
`.tmp/repair-key.py` can recover the original from its passphrase alone if that ever turns up.

`~/recovery-tmp` was deleted from the server afterwards — a DB dump full of credentials must not
sit on a compromised host. `wp-config.php` and `.htaccess` still carry their pre-session mtimes;
nothing on the site was modified.

### Gotchas that cost real time (full list in the workflow README)

- **The live site cannot be crawled**: past the bot wall every URL redirects to
  `mason-park.up.railway.app`. Not in `.htaccess`, not in the DB — it is SiteGround's domain-level
  redirect and we cannot lift it. **And it cannot be tunnelled**: SiteGround returns
  "administratively prohibited" for every `ssh -L` channel, and the account is jailed.
- **A stale `wp server` is invisible** — the jail restricts `ps`, so `pkill` finds nothing while
  the old process still holds the port and `curl` talks to it with the OLD config. Two identical,
  entirely misleading readings came from this. Use a fresh random port every run.
- **Do not rewrite URLs with a PHP `ob_start` filter.** It only fires while a page-cache drop-in is
  flushing the buffer chain; setting `WP_CACHE=false` silently killed it, and the symptom was 39 of
  40 pages screenshotting as blank 749px stubs (Chrome *blocks parsing* on a `<script src>` it
  cannot fetch). Rewrite locally instead.
- **`--host-resolver-rules` is first-match-wins** — `MAP * ~NOTFOUND` first black-holes your own
  host too.
- **`?` is a glob wildcard**: `tar --exclude='*?*'` excludes *every* file; use `*[?]*`.
- **MSYS tar chokes on absolute Windows paths** (`Cannot connect to C:`); run from `cwd` with a
  relative archive name. **`openssl -subj "/CN=…"` needs `MSYS_NO_PATHCONV=1`.**
- **web.archive.org is unreachable from this machine** (`ERR_CONNECTION_RESET`, egress IP
  `149.102.224.56` looks blocked); retry off the VPN if an archive fallback is ever needed.

### Next

1. Client ruling: **is the pediatric brand being kept?** The main site already has a
   `/services/pediatric-dental-care` page. Nothing should be rebuilt until that is answered.
2. ~12 of the 40 pages are ThemeREX demo pages; `our-team-copy` and `dental-saving-plan` look like
   stale duplicates. Same call as the main site's rebuild.
3. **Two different phone numbers on About Us** — header/footer `(281) 578-7100`, body copy
   `281-769-8878` (the main practice's). And **Dr. William Sung is still named** here though he was
   deliberately removed from the main site.
4. Blog posts (157) in or out of scope — they were out for the main site.
