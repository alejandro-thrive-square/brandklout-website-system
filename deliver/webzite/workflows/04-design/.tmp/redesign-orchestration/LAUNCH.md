# Orca Launch Recipe — Homepage Redesign Race

## Setup (in Orca, local worktrees on Windows)
1. Create **three worktrees** off the same base ref (the branch that contains `BRIEF.md`).
2. Assign a different agent to each: **Sonnet 5**, **Codex 5.5**, **Opus 4.8**.
3. Paste the identical prompt below into each. Do **not** let them see each other's work.
4. Split-pane the tabs and let all three run.

## Paste this into each executor (identical for all three)

```
You are ONE of three executors in a design race — build INDEPENDENTLY, do not
collaborate. Read the full brief first:

  deliver/webzite/workflows/04-design/.tmp/redesign-orchestration/BRIEF.md

Then build a complete, award-caliber redesign of the Webzite Studio homepage
that follows that brief EXACTLY. Study the current design and the Isadora
reference at the paths listed in the brief's §9 before you start.

Hard rules you must not break: Inter + JetBrains Mono ONLY (no serif); dark
Webzite brand palette only (yellow/blue accents, NOT Isadora's cream/purple);
keep the studio-of-one copy, the "Strategy + Experience + Function = Profit"
thesis, the proof stats, testimonials, and the $400/page · 2 days/page pricing;
remove the initDust particle canvas and grain haze; honor prefers-reduced-motion.

Output your package to `deliver/webzite/workflows/04-design/.tmp/redesign/` in
THIS worktree: index.html + css/ + js/ + assets/ (reuse existing assets), plus
tokens-delta.md and NOTES.md as specified in the brief §7. index.html must open
offline and run cleanly under reduced-motion.

Optimize for the judging criteria in the brief §8: award-caliber art direction
within the brand constraints, high-quality art-directed motion, strict fidelity
to the hard constraints, and a clear improvement over the current design.
```

## After all three finish
Tell the advisor (Fable). The advisor will review the three `deliver/webzite/workflows/04-design/.tmp/redesign/` outputs (one per worktree/branch) against §8, verify the hard constraints, and recommend a winner — grafting the best ideas from the runners-up.
