# 2026-10-04 — Codex computer use faster: bootstrap inlined, speed rule, `--effort`

## Done
- `deliver/process/tools/codex-computer-use/codex_cu.mjs`:
  - The prompt carries the Chrome plugin's Bootstrap as one ready-to-run `js` call (setup, select
    Chrome, read its docs, list open tabs). Codex no longer spends turns reading `SKILL.md` first. If
    the call fails, it falls back to the skill's troubleshooting.
  - Speed rule: batch calls, read through the DOM/AX tree rather than screenshots, go straight to a URL.
  - Tab rules: close a tab you opened in the same call as the last read. If a fitting tab can't be
    claimed, open a new one instead of stopping.
  - `--effort low|medium|high`, default `medium`, passed as `-c model_reasoning_effort=…`. The
    report line shows it.
- Measured on the same read-only task (lobste.rs top 3, gpt-6-luna, medium): old **58s / 5 calls**,
  new **38s / 2 calls**, and both closed their tab. README has a *Speed* section.

## Next
- Close the stray Hacker News tab in the user's Chrome by hand. The old wrapper's baseline run left
  it open (see Gotchas); it is locked to a dead session.

## Gotchas
- **`low` effort skips rules.** Twice it stopped at a tab "already claimed by another browser
  session" instead of opening its own (30s, no answer). The same prompt at `medium` recovered,
  read the page and closed its tab. So the default stays `medium`.
- **The old prompt didn't always close its tab.** The HN baseline run (pre-change wrapper) opened a
  tab, read it and reported without `close()`. That tab then blocked every later run on the site.
  The close is now required in the same call as the last read.
- **"Stop there." in an instruction** made Codex treat a blocked tab as the stopping point ("I
  stopped there as instructed"). Put the stopping point after the deliverable, not as a bare phrase.
