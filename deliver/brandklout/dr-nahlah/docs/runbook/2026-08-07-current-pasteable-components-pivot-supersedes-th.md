## CURRENT — Pasteable-components pivot (2026-08-07, supersedes the headless builds)

**User decision: pasteable section components are now the build standard.** The headless
GM embed build and MP element build showed local-vs-Webflow discrepancies and layout
regressions when patched; their custom code sits in page settings, which blocks moving
sections around. New model: sections ship as single-root clipboard components with their
behaviour embedded INSIDE them (`WZ.add` HtmlEmbeds — the Dr. Nahlah pattern), the **user
pastes manually** (Claude Chrome extension), agents patch content over the MCP afterwards.
Dr. Nahlah is the reference only — **the priority is Grand Mission + Mason Park**.

Done here (`588ea87`):
- `deliver/process/07-webflow-build/PASTEABLE-COMPONENTS.md` — the spec + 7-step pipeline
  (scrape → structure → design → review → components → extension paste → staging verify).
- `deliver/process/07-webflow-build/extract_section_components.mjs` — splits any XscpData
  whole-page payload into per-section single-root components (verbatim style closure so
  classes MERGE by name instead of forking; assets subset; EMIT_SHELL=1 emits a page
  shell). Proven on Dr. Nahlah: 103 components from the 11 page payloads, output in
  `deliver/brandklout/dr-nahlah/workflows/07-webflow-build/.tmp/components/` (untracked)
  with `manifest.json`; one paste page generated + verified (home/05-transformation).
- `make_paste_page.py` lifted into the process library (execCommand/application-json —
  the only clipboard mechanism Webflow reads).
- Transfer audit: all 11 Dr. Nahlah payload folders + assets survived the migration.
  Dr. Nahlah facts learned: interior pages share ONE identical footer kit (hash-equal
  across all 10); per-page heads differ only by runtime-state CSS; 41 unresolved review
  comments from Trong Huynh sit on the site (readable via `data_comments_tool`).

**Dispatch state: briefs ON DISK, sends HELD.** `.orca-components-brief.md` written into
`bk-grand-mission` and `bk-mason-park`. Both terminals (`term_596cd031…` GM,
`term_ee2d092b…` MP) had **unsent user text in their prompt boxes** ("yes extend it down
to 768 too" / "take screenshots of all three staging pages") — the user is driving both
agents live, so injecting a pointer would collide with their keystrokes (the known trap).
Next orchestrator action: once a pane's prompt box is empty, send exactly:
`Read .orca-components-brief.md in this worktree root and execute it.`
Also tell each agent to `git merge main` first (the brief says so too). GM caveat kept:
**no site-wide custom code on GM** — its shared layer goes page-level on the 3 LPs.

## Gotcha that cost real time this session — the vacuous baseline

**A dead baseline made every diff check pass.** Mason Park's runbook recorded `baseline 0 triggers`
and reported **17/17** rather than 20/20; the 3 missing checks were the scrub-fidelity ones, skipped
because the baseline had no pins to compare against. The three that *did* run passed for the wrong
reason — `missing` is empty against an empty set, and `staging >= 0 * 0.8` is trivially true. This
is the exact vacuous pass the script was written to prevent on the staging side, left open on the
baseline side. Fixed in `976f9bf`, which also asserts **`baseline is a usable reference`** so it
cannot regress silently. **Cause: these packages are not self-contained** — Mason Park's pages load
`shared/mpd.css` / `shared/mpd.js` from **one level above** the package dir, so serving the package
root 404s the runtime. The server now serves the parent and navigates in.

**A 200 on a client's domain is not proof you published there.** `masonparkdental.com/invisalign`
returned **200** and looked like a custom-domain publish. It is a **Squarespace** site that 302s
everything to `bestdentistinkatytx.com`, which answers with an nginx captcha stub — 169 bytes, none
of our pin ids, no Webflow markers. Grand Mission had the mirror image: `www.…com/implant-ai`
returns **301**, which reads like success until you follow it to a **404**. **Always follow
redirects and grep the body for a marker you control** before concluding anything about where a
build landed.

## Next

1. ~~Finish the `webflow-brandklout` OAuth~~ **DONE** — user completed it via `/mcp`.
   ~~Discover and record every site ID~~ **DONE** (`29a0ddf`). ~~Dispatch the build~~ **DONE** — both
   agents running.
2. **RECEIVE the two build reports, then verify from `main` — do not take them at face value.**
   Verifying from `main` has already caught things three self-reporting agents missed. Specifically:
   - **The tool for this now exists and is proven: `deliver/brandklout/scripts/staging-verify.mjs`
     (`9977798`).** Run it per page:
     ```bash
     node deliver/brandklout/scripts/staging-verify.mjs \
       --url https://<site>.webflow.io/<slug> \
       --baseline "C:/Users/ACER/orca/workspaces/Webzite Agentic Workflow/bk-<client>/…/04-design/.tmp/<package>"
     ```
     It discovers pins from the live ScrollTrigger registry rather than a selector list, proves each
     pin reads **3 distinct states at 25/50/75%**, checks GSAP registered + 404s + console errors,
     and diffs pin ids / trigger counts / section counts against the local design. Exits 1 on any
     failure. Both build agents were told to use it so their numbers and mine are comparable.
   - A page that converted perfectly and lost its JS will look right in every screenshot and be a
     dead band stack. This was measured, not assumed — see the Gotchas entry on what the stripped
     page reports.
   - Confirm nothing was published to a **custom domain**. Staging only was explicit.
   - Diff `scripts/` and `deliver/process/` in both worktrees before merging — client agents fix
     shared tooling in their own trees and it never reaches `main` through a client-pages commit.
3. Then merge `bk-grand-mission` and `bk-mason-park` into `main` and re-run the gates from here.
4. ~~Verify the three client packages~~ **DONE.** ~~Fix `mason-park/thank-you`~~ **DONE** (`a4cb52a`).
   ~~Commit Arvada~~ **DONE** (`6653b70`). ~~Merge all three client branches~~ **DONE** —
   `8e4068d`, `c60032a`, `f97e635`. All 12 pages are in `main` at 12/12.
5. **Dr. Nahlah: DONE, awaiting review + commit in `bk-dr-nahlah`.** All gates green —
   `fluid-root --check` exit 0 (11/11), `interaction-test-gsap` 63/63, `site-test` 137/137,
   `journey-audit` 1/1, and a new `fluid-qa.mjs` 165/165 (computed root vs `--verify` and zero
   horizontal overflow at 7 breakpoints x 11 pages, 42 captures in `.tmp/screenshots-fluid/`).
   **29** font-size clamps removed, not the 8 the brief predicted: 22 literal (the brief's scouting
   counted only the two partials and missed 14 in the page bodies) plus the 7 `--d1..--label` type
   tokens, which the static gate cannot see because `font-size:var(--d1)` is not a clamp match.
   Three follow-ups are listed in that worktree's runbook: `final-design/` and `final-design-gsap/`
   were left non-compliant on purpose (historical v1/v2 snapshots; `DESIGN-STANDARD.md` points at
   `site-src/`), and the Webflow style panel cannot parse the `calc()` form. The `fluid-root.md`
   correction it was waiting on is now **done** (`ed4d9b8`).
6. ~~User must authenticate `webflow-brandklout`~~ **DONE 2026-08-07.** Every site ID is recorded and
   the Dr. Nahlah workspace doubt is resolved. Two follow-ups survive from it:
   - **Stone Dental has no site in the workspace.** When Brandklout confirms that engagement, they
     must create the site, then the grant must be **re-authorized with every existing client ticked
     plus Stone** — re-authorization replaces the grant wholesale and a sibling left unticked is
     silently revoked.
   - **Ask Brandklout who built Grand Mission's `implant-ai` / `cosmetic-ai` / `thank-u-landing-ai`
     on 2026-08-04.** We are overwriting them on the user's instruction and they were unpublished, so
     this is not blocking — but nobody knows whose work it was.
7. **Rotate the Asana client secret** — it was exposed in a screenshot in conversation on
   2026-08-05. Flagged three times, still outstanding. Value deliberately not recorded here.
8. Send Brandklout the `bk-stone` scoping questions (2 full websites, no parent task, no brief).
9. **Nothing has been pushed.** All commits are local on `main`.

## Gotchas

- **`set_style` cannot apply a class that already exists on the site.** Applying `hide` or
  `layout520_category` — both confirmed present via `query_styles`, `.hide` is a global with
  `display:none` — failed with `One or more styles not found: hide`. A class **created in the same
  session** with `create_style` applied instantly. So to hide a new element, create your own class
  rather than reaching for the site's existing utility.
- **CMS attribute-value binding is not reachable over the Webflow MCP.** `set_settings` with
  `value_binding` returns `value must be a string or a binding`, and `get_bindable_sources` with
  `setting_key: "attributes"` answers `Setting "attributes" is not applicable to this element` — on
  a `DynamoItem` **and** on a plain Block inside one. Static attributes write fine. The working route
  for per-item CMS data is a hidden element with `set_settings` key **`text`** + a `cms` binding
  (that is the same key the Designer uses — read it back with `get_settings all_raw_settings`).
- **`data_element_builder` refuses CMS bindings at creation time** with `Element is not inside a CMS
  context`, even when the parent genuinely is inside a Collection List. Create the element bare, then
  bind it in a second `set_settings` call — that succeeds against the identical element.
- **`grep -o '\.someclass[^}]*}'` silently finds nothing in a published Webflow stylesheet.** The CSS
  is pretty-printed across lines, so a line-oriented regex misses the rule and reads as "the class
  was never published". Confirm with `python -c` and `re.finditer` before concluding a style is
  missing — I nearly reported a live visual regression that did not exist.
- **`Math.round()` of a perfectly held pin returns `-0`, and CDP cannot send it.** A pinned element
  sits a hair above the viewport top (measured: `top = -0.265625`). `Math.round` gives **negative
  zero**, and `Runtime.evaluate` with `returnByValue` cannot express `-0` in JSON — it sends
  `unserializableValue: "-0"` and **no `value` field**, so the reading arrives as `undefined` and
  `Math.abs(undefined)` is `NaN`. A "holds the viewport" check written the obvious way therefore
  **fails exactly when the pin is behaving perfectly**. Grand Mission's `verify.mjs` had this and
  passed only because its pins happened to round to `+0`; a fraction of a pixel of drift from the
  Webflow rebuild would have flipped it. Fix is `Math.round(x) + 0`. Both files are fixed in
  `9977798`. **Suspect this any time a CDP reading is inexplicably `undefined` but `typeof` says
  `number`.**
- **A dead page passes almost every check you would think to write.** The motion-stripped copy of
  `implant-landing-page` (all 9 `<script>` tags removed — what a paste-only build produces) reported
  **no 404s, no console errors, and a matching section count of 8/8**. Only pin count and trigger
  count exposed it: **0 pins against a baseline of 3, 0 triggers against 80**. Do not gate a Webflow
  build on screenshots, structure counts, or console cleanliness — none of them can see this.
- **Discover pins from `ScrollTrigger.getAll().filter(t => t.pin)`, never from a configured selector
  list.** A hard-coded list makes a page whose JS never ran report "0 of 0 pins scrubbed" and
  **pass**. Discovery makes the same page report 0 against a baseline of 3 and fail loudly.
- **Element IDs DO survive the converter** — they land as `data.attr.id` in the payload and Webflow
  honours them. Verified on the implant payload: `lossPin`, `answerPin`, `optionsPin`, `leadForm`,
  `chapterReadout`, `lightbox`, `arrivalImg` all present. This is what makes the pin selectors and
  the pages' own JS keep working after conversion — and it is not something the `--page-prefix`
  class renaming touches.
- **`main` holds these packages' source but NOT their media** — the images are untracked binaries
  that only exist in the `bk-*` worktrees. `implant-landing-page` in `main` is missing **19 of 23**
  referenced assets. Nothing is broken; but **always point `--baseline` at the worktree copy**, and
  do not read a wall of 404s from a `main`-served package as a defect in the design.
- **When an MCP OAuth will not complete, have the user run `/mcp` — that is what finally worked.**
  Fifteen `authenticate` calls produced fifteen empty-token records in
  `~/.claude-team/.credentials.json` (all sharing URL hash `d3c3adf35e21c0dc`), because a record is
  written at flow **start** and the token at **completion**, and the `localhost:<port>/callback`
  redirect never reached Claude Code. The previous session's prescribed escape was a manual callback
  hand-back (user pastes the full `callback?code=…&state=…` URL into `complete_authentication`).
  **It was never needed.** `/mcp` from a live session completed the grant directly. Try `/mcp`
  before the elaborate workaround.
- **Do not diagnose MCP auth from the credentials file alone — the tool list is faster and more
  honest.** When `webflow-brandklout` advertises only `authenticate` / `complete_authentication`, it
  is not authenticated; when those two vanish and `data_*` tools appear, it is. That flip is
  observable in one `ToolSearch` and needs no PowerShell.
- **A Webflow MCP response can blow the tool-result token limit in one call.** `list_pages` on Grand
  Mission (303 pages) returned 77KB and was spilled to a file instead of into context. Ask for what
  you need — `limit`, `detail: 'summary'` — and when a result does spill, parse the saved file with
  `node -e`/`jq` rather than reading it back in chunks.
- **`ToolSearch` is the authoritative test of MCP auth.** If `webflow-brandklout` returns only
  `authenticate` / `complete_authentication`, it is not authenticated — regardless of what anyone
  remembers doing. Do not start a build on the assumption it is live.
- **`python -m pip`, not `pip`.** Bare `pip` is not on PATH in Git Bash here (`command not found`).
  `beautifulsoup4` was missing and the converter fails with a bare one-line message that looks like
  a code bug rather than a missing dependency.
- **`require('/c/Users/...')` fails under Git Bash.** Node resolves that as `C:\c\...`. Use
  PowerShell for anything reading files under `$env:USERPROFILE`, or pass Windows paths.
- **An Orca tab's title is derived from the text TYPED into it, not from what it is running.** A tab
  renamed itself "Execute Orca thank you brief file" while that sentence was still sitting unsent in
  the prompt box. I read the title as proof the agent had picked the task up, and spawned a second
  agent on the same task in the same worktree — two Claudes about to edit the same files. Confirm
  with `orca terminal show` and read the **preview**, which shows the actual input line; a queued
  send reads `Press up to edit queued messages`.
- **`orca terminal read` can return a stale page.** It kept showing a half-typed PowerShell line long
  after the pane had moved on, and `--cursor N` paged into old scrollback rather than the live view.
  `orca terminal show` gave the true current state every time. Prefer `show` for "what is on screen
  now", and `read` only for history.
- **A `bk-*` terminal usually already has a live Claude TUI in it — check before sending a shell
  command.** Claude's footer (`⏵⏵ bypass permissions on … ← for agents`) looks enough like a shell
  prompt to fool you. I typed `claude team --permission-mode bypassPermissions "…"` into a running
  Claude's *prompt box*. Send the bare pointer sentence to a live TUI; use `--command` on
  `orca terminal create` only for a genuinely new pane.
- **A client's QA harness is not in a fixed directory.** Grand Mission keeps its in
  `04-design/.tmp/verify.mjs`; Arvada and Mason Park use `08-qa/.tmp/`. Listing only `08-qa/` made me
  report "Grand Mission has no scrub harness at all" when in fact it has the best one of the three.
  Search the whole client folder for `verify|proof|scrub` before concluding a gate was never run.
- **`ls -la` and `stat` disagreed on mtime by ~21 minutes on this machine** for the same files in the
  same minute. Do not build an "are the proofs newer than the sources?" argument on `ls` timestamps
  alone — use `stat -c '%y'` for both sides, or compare content.
- **Importing `scripts/fluid-root.mjs` used to print a `<style>` block into the importer's stdout**,
  silently corrupting any QA report that imported `rootPxAt`. Fixed in `eef9677` with a
  `RAN_DIRECTLY` guard. If you write a new `.mjs` in this repo that is both a CLI and a module, guard
  it the same way.
- **`noindex` does not identify scaffolding here.** Every page in the campaign is an unpublished
  draft carrying `noindex, nofollow`, so a "skip the noindex ones" rule skips all twelve. I shipped
  that rule and the audit found zero pages. The real convention is structural: deliverable pages are
  **subdirectories**, the package root `index.html` is the review index.
- **Verifying from `main` found things three self-reporting agents did not.** Two gate defects, one
  genuine page failure, and a doc correction stranded uncommitted in a client worktree. The agents
  were not dishonest — each was right about its own scope. Nobody but the orchestrator runs the
  cross-client pass.
- **A client agent may fix shared tooling in its own worktree.** Arvada wrote both the `fluid-root.mjs`
  import guard and a 48-line `fluid-root.md` correction, neither of which would ever have reached
  `main` through its client-pages commit. **Diff `scripts/` and `deliver/process/` in every `bk-*`
  worktree before merging** — that is where cross-cutting improvements hide.
- **`orca terminal create` steals the user's keystrokes.** Creating a tab in `main` while the user
  was typing in another `main` tab captured their sentence into the *new agent's* prompt, ahead of
  the brief pointer. The agent acted on the mixed prompt and had to be interrupted and re-briefed.
  Prefer spawning into a dedicated `bk-*` worktree; never pass `--focus`; and always read the prompt
  buffer back looking for **text you did not send** before pressing enter.
- **`/clear` swallows the next `orca terminal send` if it arrives too soon.** Sending `/clear --enter`
  then immediately the task text left all three agents at an empty prompt with the task lost. The
  reliable sequence is three separate calls: `/clear --enter`, then `--text '<task>'` **without**
  `--enter`, then read back to confirm the text is in the prompt buffer, then `--text '' --enter`.
- **`orca terminal read` can hang past 2 minutes on a large scrollback.** Wrap it in `timeout` and
  keep `--limit` small (`--limit 3`); a bare read of three terminals in a loop timed out the tool.
- **Quote Windows paths in every `for`/`find` loop in Git Bash.** `C:/Users/ACER/orca/workspaces/Webzite
  Agentic Workflow/...` splits on the spaces and silently greps the wrong files, reporting `0` for
  everything instead of erroring usefully.
- **`git add -A` in a worktree sweeps up `.orca-brief.md`.** It is meant to stay untracked; it got
  committed into two branches and had to be `rm --cached`ed back out.
- **`journey-audit.mjs` resolves linked CSS/JS before counting — a body-only grep lies.** I twice
  reported "zero motion" for Arvada/Mason Park and "5 gsap refs" for Grand Mission; the real numbers
  were 6–7 IntersectionObservers and **62–73** gsap refs, all living in shared external files
  (`_shared/brand.js`, `shared/mpd.js`). Never audit these pages by grepping `index.html` alone.
- **Fluid root: at 1440px the root resolves to exactly 16px**, so a design already sized in `rem`
  renders pixel-identical at 1440 after install. The risk is at the extremes — mobile shrinks ~14%
  at 390 (body copy left at `1rem` becomes 13.8px, too small), wide grows +25% at 2400.
- **"Low-risk retrofit" is only true for a design sized in FLAT rem. It is false for a `clamp()`
  type scale, and `fluid-root.md` is wrong about this.** Its "Replacing an existing `clamp()` type
  scale" section says to swap each clamp for the plain rem that preserves the 1440 rendering. That
  holds only if the clamp's `vw` term is inactive between 479 and 1440 — and the root is
  *deliberately flat at 16px* across exactly that band, so it supplies no fluidity there. Measured
  on Dr. Nahlah: the flat-rem swap inflates type **+40% to +142% across 480–991px**, and `--d1`
  goes **44px → 107px at a 480px viewport**. A scale spanning 3x cannot be carried by a root that
  is constant across the same range. **Fix: plain `rem` multiplied by a unitless step token,
  stepped in px media queries.** Dr. Nahlah uses five groups (`--t-disp/-lg/-mid/-sm/-text`) at
  Webflow's own breakpoints (1279/991/767/478) so the scale maps 1:1 onto Designer breakpoints.
  `fluid-root.md` was NOT edited — out of scope for that agent and another agent was in
  `deliver/process/`. **Correct it before dispatching this retrofit to any other clamp-based build.**
- **Do not put a `<=478` tier on display type.** Below 479 the root is already shrinking, which is
  the reduction display type wants. An explicit tier there fires at 478, where the root has *not*
  yet shrunk, producing a **+52% step at the breakpoint**. Only the text group needs that tier, to
  stop body copy following the root down.
- **The static gate cannot see a clamp inside a custom property.** `--d1:clamp(...)` consumed as
  `font-size:var(--d1)` passes `fluid-root.mjs --check` clean while still double-scaling. Grep for
  `--[a-z-]*:\s*clamp` as well as `font-size:\s*clamp`, or you will certify a build whose entire
  type scale still violates the standard.
- **`python -m http.server` manufactures false test failures.** It resets connections under the
  parallel image loads these pages fire; `interaction-test-gsap.mjs` reported `doctor portrait
  loaded`, `lab photo loaded` and `no broken images` FAILing, with `ERR_CONNECTION_RESET` in the
  ignored-transport note. The identical run against a concurrent Node static server was **63/63**.
  Suspect the server before the page. A 40-line Range-capable server is enough.
- **A nav "collision" in a headless capture may be a cross-fade caught mid-transition.** Dr. Nahlah
  stacks `.nav-chapter` on top of `.nav-links` by design and swaps them over 0.45s when `.solid`
  toggles; a shot taken <450ms after returning to the top shows both at half opacity and reads as
  overlapping text. Settle ~1100ms before capturing, and confirm before reporting a layout bug.
- **`git status` over-reports after copying files between worktrees on this machine.** The `bk-*`
  worktrees check out CRLF while `main` stores LF, so copied-but-unedited files show as ` M` with
  an "LF will be replaced by CRLF" warning. `git diff` on them is empty and `cmp` says
  byte-identical. Run `git update-index --refresh`, then trust `git diff --stat`, not `status`.
- **Before reverting anything in `main`, check whether the modification is actually yours.**
  `git status --short -- <path> | grep -v '^??'` listed exactly the six files this session edited,
  which is what made `git checkout --` safe. Had earlier uncommitted client work been sitting
  there, a blanket checkout would have destroyed it.
- **The failure mode is architectural, not decorative.** Sections class-named `band-base`,
  `section--light`, `section--paper` = a band stack. Adding animation to it does not produce the
  reference. `IntersectionObserver` + a class toggle is the tell: it is binary and cannot express
  progress, which is what every scrubbed moment needs. The Dr. Nahlah reference has **zero** of them.
- **Reference to read**: `deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/site-src/pages/home.body.html`
  — 9 chapters, 12 scrubs, 2 pins. Chapters 01 (pinned scrubbed statement), 04 (one pin driving
  three before/after wipes) and 05 (pinned horizontal path) are the ones worth copying the mechanics
  of. **For the journey architecture either copy will do, but read the `bk-dr-nahlah` copy for the
  type scale** — `main`'s copy was reverted to the old `clamp()` scale, so copying its `head.html`
  reintroduces exactly what the standard forbids.
- **Re-authorizing a Webflow instance replaces its grant wholesale.** Under the shared
  `webflow-brandklout` instance, adding a new client means ticking **every** active client site plus
  the new one. A sibling left unticked is silently revoked. This is why onboarding lives in the
  partner file, not in a client folder.
- **Per-client MCP instances buy nothing when the partner owns the workspace.** Each one authorizes
  against the same workspace and sees every sibling site anyway. Ask who owns the *platform
  account*, not who the invoice is for.
- **OAuth grants are per Claude profile, global across projects.** Keyed `<server>|<url-hash>` in
  `~/.claude-<profile>/.credentials.json`, which is a *real file per profile*, not junctioned. One
  authentication covers every worktree — but on the wrong profile it is invisible.
  `enabledMcpjsonServers` in `.claude/settings.local.json` **is** per worktree and gitignored, so a
  new worktree silently shows no MCPs until that file is created.
- **Git Bash `$PWD` is `/c/...`, which Node resolves as `C:\c\...`.** Testing hooks this way silently
  created a whole stray directory tree at `C:\c\`. Pass Windows paths to anything Node reads.
- **Worktree naming is now uniform: `bk-*` in path, branch, *and* Orca display name.** The old
  `Dr-Nahlah` worktree (branch `webzitestudio/Dr-Nahlah`) was renamed to `bk-dr-nahlah` on
  2026-08-07. A rename is three steps, not one: `git branch -m`, `git worktree move`, then
  `orca worktree set --display-name` — Orca keys a worktree by `<repo-id>::<path>`, so `set` alone
  only relabels and `--display-name` cannot move anything. Close any terminal sitting in the
  directory first or the move fails on a Windows directory lock.
- **Orca `worktree create` branches from `origin/main`, not local `main`** — new worktrees miss
  unpushed commits. Fix with `git -C <wt> reset --hard main`.
- `orca terminal read` takes `--limit`, not `--lines`.
- **Orca subcommands take the handle as a `--terminal` FLAG, not a positional argument.**
  `orca terminal show <handle>` fails with a misleading `Unknown command: terminal show <handle>`,
  which reads like the subcommand does not exist. It does; the handle is just in the wrong place.
  `orca terminal show --terminal <handle>`. **Do not guess Orca flags from memory** — run
  `orca skills get orca-cli` for the reference matched to the installed binary.
- **`orca terminal show --json` puts the screen in `preview`, and plain (non-`--json`) output is
  easier to read.** The JSON wraps everything one level deep under `result.terminal`, so naive
  field-plucking returns `?`. For "what is on screen now", the plain form is the better tool.
- **A page can exist in Webflow, be `draft: false`, and still 404 everywhere.** Grand Mission's three
  landing pages were all three of those. `draft: false` only means "would publish with the site" —
  if the site has not been published since the page was created, it is not live. Check the site's
  `lastPublished` against the page's `createdOn`, or just curl the staging and production URLs.
  Do **not** infer "this is live client work, do not touch" from `draft: false` alone.
- **Check whether the destination pages already exist before planning a build.** Grand Mission's did,
  under names that did not match the local package names (`implant-ai` vs `implant-landing-page`),
  and they held the superseded band-stack version. Planning a "create three pages" build would have
  produced duplicates on a 303-page production site. Match local packages to remote pages by
  *content*, not by name.
- **Do not send multi-line text to a Claude TUI** via `orca terminal send` — it submits on the first
  newline. Write a file into the worktree and send a one-line pointer instead.
- Agents parked at "Resume from summary" prompts need a bare Enter (`--text '' --enter`).

## Open questions

- **Per-client worktrees: keep or retire?** Undecided as of 2026-08-10. All six `bk-*` branches are
  merged, so retiring them is currently free. Argument against them: client folders are disjoint, so
  the merge ceremony buys little, and both conflicts in today's merge were in *shared* files
  (`deliver/process/`, `deliver/brandklout/scripts/`) that branching deferred rather than prevented.
  Argument for them (user's, and it is a real one): with several Orca tabs in one tree, an agent
  running `git add -A` sweeps up another agent's half-finished client folder. User floated "do not
  commit until the team approves, then commit listing client changes" — **note the risk**: that
  maximises the window where work exists only in an uncommitted working tree, which is precisely the
  failure mode behind the asset gap above. Likely better shape: commit often but always path-scoped
  (`git commit -- deliver/brandklout/<client>/`), which makes cross-client bleed structurally
  impossible regardless of who else is mid-edit, and put the approval gate at publish/merge rather
  than at commit. Shared surfaces (`deliver/process/`, `scripts/`, root docs) are the genuinely
  contested files and still need serialising. Not implemented — do not treat as decided.
- **Webflow grants**: instances are registered but Brandklout must still invite the agency Webflow
  account to each client's workspace. An empty site list during OAuth means that invitation, not a
  config error.
- **Stone Dental**: scope unconfirmed — two standalone Asana tasks, no brief, no attachments.
- **Grand Mission** still has open items from the client: GHL form endpoint, implant price
  confirmation, opening hours, per-page tracking numbers. All one-line edits when answered.
