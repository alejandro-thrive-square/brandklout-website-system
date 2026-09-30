# Task 2026-09-30 — place the Elfsight review widget on this site

Brief from the main-repo session (Google Reviews widget rollout). Do this task in this worktree only.

## The widget

- Client: **Mason Park Dental (adult)**
- Widget: `32926aff-7df5-4c6d-8f35-d4d3f5f46b4b` (All-in-One Reviews (in the OTHER Elfsight account, not Trong's))
- Connected listing: Mason Park Dental of Katy, 21830 Kingsland Blvd #104A, Katy, TX 77450 (the ADULT listing, never #104B)
- Instances: staging: staging.masonparkdental.com; production: masonparkdental.com

Snippet to place (Elfsight's install code **with `data-elfsight-app-lazy` removed**: with it the
widget loads platform.js and never boots on Instatic, 0px, no error):

```html
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-32926aff-7df5-4c6d-8f35-d4d3f5f46b4b"></div>
```

## Site-specific

This is the practice's existing reviews widget from the old site; reuse it, do not create a new one (no duplicates). Mason Park production is live: your runbook says push every change to both instances and never reset/replace production. Dr. Cho leads rules and full doctor names still apply to any copy you touch. Another session in this worktree (Elfsight API connection) may be running; coordinate by not touching its files.

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
