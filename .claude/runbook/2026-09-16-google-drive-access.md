# 2026-09-16 — Google Drive access for agents (`scripts/drive.mjs`)

Repo-level. No client files changed.

## Done

- Alejandro set up a new Cloud project, `agentic-508813` ("Agentic Drive Acces"), signed in as
  alejandro@thrivesquare.com. The Drive API is enabled there. The project has an API key and an
  OAuth **Desktop app** client, `397716934480-8ihh…`.
- `~/.webzite/.env` `[shared]`: the old "NOT WORKING" Drive block is gone. It now holds
  `GOOGLEDRIVE` (the API key, moved there from a hand-added `GOOGLEDRIVEV2` in the repo `.env`),
  `GOOGLEDRIVEOAUTHID`, `GOOGLEDRIVEOAUTH` and `GOOGLEDRIVEREFRESH`. The backup of the previous
  master is `~/.webzite/.env.bak-2026-09-16-drive`.
- The client JSON had been downloaded into the repo root, untracked and not git-ignored. It was
  moved to `~/.webzite/google-drive-oauth-client.json`, and `client_secret_*.json` is now in
  `.gitignore`.
- New `scripts/drive.mjs` with the commands auth, whoami, search, ls, get and pull. Shared drives
  are included, and Google-native files are exported. `auth` completed. Verified: `whoami`,
  `search stone --folders` (it found `stonesurgicalarts-22-7-26`, which holds the SQL dump and
  `website-files.zip`), and `ls`.
- Documented in `SYSTEM_RULES.md` §4.2.2.

## Gotchas

- **An API key cannot list anything.** `files.list` with a valid key returns 403
  `insufficientFilePermissions`. This was the original "not working".
- **The refresh token must live in the master.** The old `drive-oauth.mjs` wrote it to the worktree
  `.env`, which env-sync rewrites.
- **The consent screen is stuck in Testing.** Publish is greyed out until Branding (home page,
  privacy policy, domain) is filled. "Make internal" is greyed out because the project is under no
  organization. In Testing the refresh token expires after **7 days**, so `invalid_grant` means run
  `node scripts/drive.mjs auth` again.
- **Every client has a shared drive, and `search` does not match drive names.** Use `roots`. The map
  is in `deliver/brandklout/docs/GOOGLE_DRIVE.md`, linked from CLAUDE/AGENTS/GEMINI.md and
  DELIVER_SYSTEM_RULES.
- **Most client drives hold shortcuts.** Listing a shortcut whose target was never shared returns an
  empty page, not an error, so the script now checks the target and says so. Blocked on
  2026-09-16: Arvada "Ready", Dr. Nahlah "Dr. Esam Nahlah", Grand Mission "Photos for brandklout".
- A backslash-u NUL escape written into a regex landed as a raw NUL byte, and git and grep then
  called the file binary. `safeName` now uses an `\x00-\x1f` range, written through a
  fromCharCode script.

## Worktrees

`main` would not merge cleanly into 14 of the 15 `bk-*` branches. The conflicts pre-date this work:
`embed-origins/plugin.json`, runbooks, and `set-origins.mjs` on brandklout-website. So each branch
instead got one commit that checks out `scripts/drive.mjs` and `deliver/brandklout/docs/GOOGLE_DRIVE.md`
from `main` and adds the same entry-point line. These are identical changes, so they add no new
conflicts. 13 branches are done and verified from `bk-livewell`. **`bk-mason-park` and
`bk-mason-park-kids` were skipped** because their "BugHerd comments" sessions were live; give them the
same commit once those sessions finish.

## Next

- Apply the Drive commit to `bk-mason-park` and `bk-mason-park-kids`.
- A real `main` sync pass across the worktrees, starting with the `embed-origins/plugin.json` conflict.
- Ask the owners to share the three blocked shortcut targets with alejandro@thrivesquare.com.

- Optional: fill in Branding and publish the app (or recreate the project inside the thrivesquare.com
  organization and make it Internal) to stop the weekly re-sign-in.
- Stone Surgical Arts: the Drive export (`stonesurgicalarts-22-7-26`) is reachable again, and so are
  its lost `google-drive-images`.

## Version Control

Tracked with the repo per [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
