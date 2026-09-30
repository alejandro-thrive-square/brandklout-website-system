# Task 2026-09-30 — place the Elfsight review widget on this site

Brief from the main-repo session (Google Reviews widget rollout). Do this task in this worktree only.

## The widget

- Client: **Stone Surgical Arts**
- Widget: `c92f78df-0615-4ab9-a204-4f7b385011c9` (Google Reviews)
- Connected listing: Stone Surgical Arts, 72 Andorra Dr #110, Westlake, TX 76262
- Instances: staging: staging.dfwsurgicalarts.com; production: dfwsurgicalarts.com

Snippet to place (Elfsight's install code **with `data-elfsight-app-lazy` removed**: with it the
widget loads platform.js and never boots on Instatic, 0px, no error):

```html
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-c92f78df-0615-4ab9-a204-4f7b385011c9"></div>
```

## Site-specific

This widget already exists (created Apr 2026) but is embedded on stonedentalimplantcenter.com instead of this site. Put it here; do not create another. The Stone Dental site is a different client and a different worktree: do not touch it.

## How

1. Read this client's `RUNBOOK.md` (standing state on top) and only the runs you need. Respect
   anything it says about staging vs production, backups and live rules.
2. Find every place this site shows reviews or testimonials. The widget goes there (replace the
   static review cards/rail, keep headings; if a heading claims a fixed count such as "All nine",
   fix the copy). If the site has no review section, add it where the runbook/design puts social
   proof (usually a reviews page and the homepage proof chapter), matching the site's design.
3. Place it as a **`brandklout.embed-origins.embed`** node in snippet mode (the plugin's
   compatible CSP then lets platform.js reach Elfsight's API hosts). Never paste a raw `<script>`
   into page HTML: Instatic strips it. Working reference, same job, done 2026-09-29:
   `C:\Users\ACER\orca\workspaces\Brandklout Website System\bk-mason-park-kids\deliver\brandklout\mason-park-kids\workflows\03-core-pages\.tmp\add-elfsight-reviews.mjs`
   (API write with a backup first, dry run by default, re-runnable, refreshes an existing
   snippet). Its runbook: `C:\Users\ACER\orca\workspaces\Brandklout Website System\bk-mason-park-kids\deliver\brandklout\mason-park-kids\docs\runbook\2026-09-29-elfsight-google-reviews-on-staging.md`.
   Check the embed-origins plugin is installed on this instance first.
4. Back up the instance before writing. Staging first, verify, then production (unless the
   site-specific note above says otherwise).
5. **Verify in a real browser on a fresh page load**: the widget renders (>0px) with the
   rating and reviews for the listing above. A green API read-back is not proof. If it renders
   0px: check that `data-elfsight-app-lazy` is gone before blaming CSP.
6. If this site is rebuilt from local HTML by an import chain, note in the runbook that a
   re-import drops the Embed and how to put it back.
7. Record: a dated run file + a row in the client `RUNBOOK.md` (Done with SHA, Next, Gotchas).
   Commit in this worktree. **Do not push, do not merge.**
8. Report back: pages changed, instances written, verification result, anything blocked.

Do not create, edit or delete any Elfsight widget. Registry of all widgets:
`C:/Users/ACER/Documents/Webzite Studio/Brandklout Website System/deliver/process/tools/elfsight-reviews/review-widgets.json`.

## Version Control

Task brief. Follows SYSTEM_RULES.md §4; commit it with your run.
