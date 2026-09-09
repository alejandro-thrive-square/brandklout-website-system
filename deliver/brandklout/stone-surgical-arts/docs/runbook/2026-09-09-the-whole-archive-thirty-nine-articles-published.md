# 2026-09-09 — The whole archive: thirty-nine articles recovered and published

The client supplied a full file backup of the old site. It contained thirty-nine blog posts, not
the three the Wayback intake had found. All thirty-nine are now live, adapted to the journal's
editorial standard. Fifty-two routes published, up from sixteen.

## Done

- **`8f48df53`** — the recovery, the adaptation and the tooling.
- Published to Instatic: **52 pages**, both gates clean.
  - `verify-live.mjs` — 52 routes, 183 unique URLs, 601 asset references, 8 retired routes gone,
    52/52 distinct titles, `FAIL none`.
  - `compare-live.mjs` — **no differences**, all 52 routes at 1440 and 390.
  - Local: `blog-validate` clean, `audit` FAIL none WARN none, `check-copy` clean, `blog-test`
    243 passed 0 failed, `all-pages` 52 pages x 3 widths, 624 assertions clean.

## What was in the backup

`01-content-intake/.tmp/website-files`, three candidate trees:

| Tree | Posts | Words | Notes |
| :--- | ---: | :--- | :--- |
| `old-blog/` | 15 | 248–2,650, median 792 | Patient education. The three already built are here. |
| `news/` | 24 | 279–387, median 310 | Celebrity-angle SEO, uniformly thin. |
| `blog/` | — | — | A WordPress install. Posts are in a database the backup does not include. |

`extract-archive-posts.mjs` recovers the two static trees. Full provenance and the list of what was
stripped is in [`BLOG-CONTENT.md`](../../workflows/04-design/.tmp/surgical-arts/BLOG-CONTENT.md).

## Gotchas

**The scope decision was the client's, and it reversed a documented one.** The 2026-09-08 policy in
BLOG-CONTENT.md said dental, sleep-apnea, weight-loss and teen-acne articles "were not added to
this facial-surgery site". Asked, the client chose to publish all thirty-nine, adapted to the
existing editorial standard. Both halves of that answer matter: the scope widened, the standard
did not.

**The `news` tree could not be published as written, and that is not a style judgement.** Every one
of the twenty-four was built on speculation about named living people's procedures — "many
speculate", "experts claimed" — alongside references to individuals' cancer diagnoses and genetic
test results, with images hotlinked from gossip sites. Each keeps its subject and its URL and is
written as patient education instead. If someone asks why the celebrity content is gone, this is
the reason, and it is the same reason the standard existed.

**Do not regenerate the three Wayback files.** `extract-archive-posts.mjs` deliberately skips
`dermal-fillers-vs-botox-comparing-the-two-top-treatments`,
`what-are-the-top-types-of-plastic-surgery-in-the-world` and
`why-do-people-get-plastic-surgery-here-are-the-top-reasons`. BLOG-CONTENT.md cites their capture
timestamps; rewriting them from the backup would falsify that table. The first run of the script
did overwrite them, before the guard was added, and they were restored with `git checkout` because
those three — unlike the fonts — are tracked.

**Chrome does not survive thirty-nine 640KB pages in one process.** The first extraction run died
at page eight with `Target.createTarget: Session with given id not found`. The script now recycles
the browser every six pages, retries once on a fresh browser, and is resumable.

**Three things silently broke when the article count went from 3 to 39**, none of which any gate
would have caught as an error:

- *"Keep reading" listed every other article.* Two cards at three posts; thirty-eight at
  thirty-nine. Now two, preferring the same category, sorted so a rebuild is reproducible.
- *The SEO `<title>` override was an inline map of two slugs.* Seventeen articles now need a
  `seoTitle` to stay under the 65-character audit warning. `blog-validate` checks this so it
  cannot regress.
- *`blog-test` asserted the overview had exactly 2 cards, and that the first related link was
  `posts[1]`.* Both now derive from the data and from the exported `related()`.

**`blog-validate.mjs` is new and worth running first.** It caught a guarantee in the copy and would
have caught any of the eight candidate reference URLs that turned out to 404. All 31 URLs now cited
return 200; `--check-refs` re-checks them.

**Em dashes.** SYSTEM_RULES.md forbids them and `check-copy.mjs` fails the build on them. Thirteen
went into the first draft of the copy. `blog-validate` now catches them at the data level, where
the fix goes.

**`compare-live.mjs --shots` is fixed.** `capture()` closed its pages at the end of each width, but
not when a screenshot threw, so one slow capture leaked a pair and the timeouts compounded until
Chrome gave up. It is a `try/finally` now, and a failed shot is a finding rather than the end of
the run. This was the outstanding "Next" item from 2026-09-08.

**A full `compare-live` run now takes roughly twenty minutes** — 52 routes, two widths, plus the
runtime pass, against a remote host. Run it in the background rather than waiting on it.

## Next

- The journal has had no client review pass, and thirty-six of its articles have never been read by
  anyone at the practice. That review is the obvious next step, particularly for the twelve
  covering procedures the site does not otherwise present (dental implants, wisdom teeth, sleep
  apnoea, weight management, teen acne).
- Categories now number eight and were assigned during authoring; the journal overview has no
  filtering. Worth a look if the client wants the archive browsable.
- BugHerd is still installed sitewide and comes off at handoff.
