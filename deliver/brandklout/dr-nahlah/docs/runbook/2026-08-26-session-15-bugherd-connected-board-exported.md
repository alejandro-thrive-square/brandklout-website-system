## DONE 2026-08-26 (session 15): BugHerd connected, board exported

The key the last session went looking for now exists (`BUGHERD` in the repo-root
`.env`). Project `537587` "Dr Nahlah", 6 pins, all `backlog`, nothing closed.

- `workflows/05-design-revisions/pull-bugherd.mjs` — enumerates tasks by status,
  fans out to the detail endpoint, pulls comments + attachments, downloads
  screenshots. Re-runnable; overwrites its `.tmp/bugherd/` output.
- Output: `.tmp/bugherd/feedback.md` (readable brief with page URL + pinned CSS
  selector per pin), `tasks.json` (full payload), `media/` (7 images).
- `.env.example` now documents `BUGHERD` and `CLOUDFLAREAPI`.

**Nothing from the board has been applied to the site yet.**

### Gotchas earned this session

- **The BugHerd task LIST endpoint is not the task.** `GET /tasks.json` returns
  description/status/tags and stops. `url`, `selector_info.path`,
  `screenshot_url` and `attachments` — everything that says *where* a pin sits —
  exist only on `GET /tasks/:id.json`. Always fan out to the detail call.
- **Auth is Basic with the key as the USERNAME** and a literal `x` as the
  password. Not a bearer token.
- **The default listing hides closed work.** Enumerate `backlog|todo|doing|done|
  closed` explicitly or a closed pin silently vanishes from the export.
- **"Comments" on this board are the pins themselves.** All 6 tasks have zero
  threaded comments; the content is in `description`. Do not read an empty
  `comments.json` as a failed pull.
- **Pins carry two different `site` values.** #2-#6 report `encorercm.com` (the
  Instatic host), #7 reports `www.drnahlah.com`. The `url` path is the reliable
  field; the host just records where the reporter happened to be.
- **The `.vimeo-video` rule flagged as a stranger's edit in session 14 is very
  likely ours.** Pin #2 (25th, 18:44Z) asks for a Vimeo embed under the portrait;
  pin #3 (26th, 02:50Z) is pinned *on that embed's iframe*, so it was added in
  between — which straddles the 22:15-22:45Z window session 14 flagged. Treat the
  "someone else is in the site" alarm as probably explained, not as confirmed.
