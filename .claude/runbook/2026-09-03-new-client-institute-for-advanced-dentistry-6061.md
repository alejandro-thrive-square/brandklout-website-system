## 2026-09-03 — new client: Institute for Advanced Dentistry (`60610fe9`), worktree `bk-ifa-dentistry`

Client folder `deliver/brandklout/institute-for-advanced-dentistry/` initialized on `main` (modules
00-10 from `deliver/process/` at `21ae9682`), then the Orca worktree created from that commit:

```
orca worktree create --repo id:db55534c-1992-4094-b865-7eaecc3e5eab --name bk-ifa-dentistry --no-parent --base-branch main --json
git -C "<worktree>" branch -m alejandro-thrive-square/bk-ifa-dentistry bk-ifa-dentistry
```

Source of truth for the brief is Asana project `1215461031852894` (tasks `1217929763942271` Design
Home Page, due 2026-09-21; `1215476573810829` Complete Client Website). Pulled with
`asana-context.mjs institute-for-advanced-dentistry` into the client's `01-content-intake/.tmp/`.

### Gotchas

- **`ORCHESTRATION.md` carried the wrong Orca repo id** (`7b269532…` = the old
  `webzite-agentic-workflow` repo) in its worktree-create command. Fixed to `db55534c…`. Running the
  old command would have created the worktree in the other repository.
- A Webflow site for this client already exists (`6a946f89a8315fa7643642e3`, "Homepage Concepts",
  posted by Trong Huynh 2026-08-31) but **the shared grant does not include it** — `list_sites`
  returns 79 sites, none with that id. Re-authorize `webflow-brandklout` on the team profile with
  every active client ticked before any write there.
- `ifadentistry.com` exposes no XML sitemap (WordPress 7.1; every sitemap path returns the HTML
  404). The URL inventory has to come from a crawl.
- The two Asana tasks that were in the 2026-08-22 pull (`1215463474851806` "Build Home Page") are
  gone — `get_task` now returns "You do not have access". The project was re-planned; always
  re-run `asana-pull.mjs` before trusting a GID from an old artifact.
- Bash quoted heredocs with long markdown bodies failed with "unexpected EOF while looking for
  matching `'`" in this session; the Write tool worked. Not diagnosed.

### Still open (belong to Brandklout, recorded in the client overview)

Build target site, page count / site map, the blocking "Style Guide" task, the implant-count
contradiction, pricing and financing content, the survey asset, domain plan, photography originals.
