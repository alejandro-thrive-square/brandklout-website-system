# PASTE QUEUE — Thank-you LP (`thank-u-landing-ai`)

Site `698111847e9608eb30ee21c6` · page `6a7268a862a728c1cd4df73b`. Components paste IN THIS ORDER;
each folder has its own README + PASTE.html. Prerequisites (fonts +
page-level head/footer code via the Data API) are in every README and
must be done BEFORE step 1.

The live page holds the superseded embed-based build. Step 0 clears it:

| # | Component | Paste into | Notes |
| :--- | :--- | :--- | :--- |
| 0 | — | — | Select Body, delete the old build's children. Ask the agent to clear the old PAGE-settings custom code over the MCP at the same time. |
| 1 | `00-page-shell` | **Body** | header + wrappers + empty `main#top` + footer + mobile bar + lightbox |
| 2 | `01-arrival` | `main#top` | #arrival · scripted |
| 3 | `02-fast-track` | `main#top` | #fast-track · scripted |
| 4 | `03-path` | `main#top` | #path · scripted |
| 5 | `04-preparation` | `main#top` | #preparation · scripted |
| 6 | `05-team` | `main#top` | #team |
| 7 | `06-place` | `main#top` | #place · scripted |

**One-paste alternative**: `../../thank-you/PASTE-full-page.html` holds the
whole page as a single-root payload — paste once into a cleared Body and
skip steps 1-7. Use the per-section queue when rebuilding or
moving individual chapters.

After the queue: publish to staging only, then run `parity.mjs` and
`deliver/brandklout/scripts/staging-verify.mjs` — same output or it is
not done.
