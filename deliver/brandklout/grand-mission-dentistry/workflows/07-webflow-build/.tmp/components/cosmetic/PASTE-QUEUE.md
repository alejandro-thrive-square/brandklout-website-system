# PASTE QUEUE — Cosmetic LP (`cosmetic-ai`)

Site `698111847e9608eb30ee21c6` · page `6a723ad5534774f35f17d119`. Components paste IN THIS ORDER;
each folder has its own README + PASTE.html. Prerequisites (fonts +
page-level head/footer code via the Data API) are in every README and
must be done BEFORE step 1.

The live page holds the superseded embed-based build. Step 0 clears it:

| # | Component | Paste into | Notes |
| :--- | :--- | :--- | :--- |
| 0 | — | — | Select Body, delete the old build's children. Ask the agent to clear the old PAGE-settings custom code over the MCP at the same time. |
| 1 | `00-page-shell` | **Body** | header + wrappers + empty `main#top` + footer + mobile bar + lightbox |
| 2 | `01-arrival` | `main#top` | #arrival · scripted |
| 3 | `02-hands` | `main#top` | #hands · scripted |
| 4 | `03-work` | `main#top` | #work · scripted |
| 5 | `04-standard` | `main#top` | #standard · scripted |
| 6 | `05-proof` | `main#top` | #proof · scripted |
| 7 | `06-voices` | `main#top` | #voices |
| 8 | `07-invitation` | `main#top` | #invitation · scripted |

**One-paste alternative**: `../../cosmetic/PASTE-full-page.html` holds the
whole page as a single-root payload — paste once into a cleared Body and
skip steps 1-8. Use the per-section queue when rebuilding or
moving individual chapters.

After the queue: publish to staging only, then run `parity.mjs` and
`deliver/brandklout/scripts/staging-verify.mjs` — same output or it is
not done.
