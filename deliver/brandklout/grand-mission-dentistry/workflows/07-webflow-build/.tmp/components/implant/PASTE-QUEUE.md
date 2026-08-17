# PASTE QUEUE — Implant LP (`implant-ai`)

Site `698111847e9608eb30ee21c6` · page `6a724b6977f9b0019d2a03f8`. Components paste IN THIS ORDER;
each folder has its own README + PASTE.html. Prerequisites (fonts +
page-level head/footer code via the Data API) are in every README and
must be done BEFORE step 1.

The live page holds the superseded embed-based build. Step 0 clears it:

| # | Component | Paste into | Notes |
| :--- | :--- | :--- | :--- |
| 0 | — | — | Select Body, delete the old build's children. Ask the agent to clear the old PAGE-settings custom code over the MCP at the same time. |
| 1 | `00-page-shell` | **Body** | header + wrappers + empty `main#top` + footer + mobile bar + lightbox |
| 2 | `01-arrival` | `main#top` | #arrival · scripted |
| 3 | `02-loss` | `main#top` | #loss · scripted |
| 4 | `03-answer` | `main#top` | #answer · scripted |
| 5 | `04-options` | `main#top` | #options · scripted |
| 6 | `05-candidacy` | `main#top` | #candidacy |
| 7 | `06-specialist` | `main#top` | #specialist · scripted |
| 8 | `07-terms` | `main#top` | #terms · scripted |
| 9 | `08-invitation` | `main#top` | #invitation · scripted |

**One-paste alternative**: `../../implant/PASTE-full-page.html` holds the
whole page as a single-root payload — paste once into a cleared Body and
skip steps 1-9. Use the per-section queue when rebuilding or
moving individual chapters.

After the queue: publish to staging only, then run `parity.mjs` and
`deliver/brandklout/scripts/staging-verify.mjs` — same output or it is
not done.
