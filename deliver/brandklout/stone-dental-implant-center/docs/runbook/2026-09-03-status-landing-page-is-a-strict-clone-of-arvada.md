## Status: landing page is a STRICT CLONE of Arvada (2026-09-03, 4th session)

Brief tightened mid-session by a teammate: **same components, same layout, same item counts as
Arvada, different content**. No extra buttons, no extra labels. 13 extras were stripped out
(full list in ARVADA-PARITY-GAP.md section 5b) and parity is verified item for item: 6 CTAs,
8 videos, 3 option cards, 3 gallery images, 10 FAQs, a 2-paragraph footer with zero links.
Five of Stone's 13 videos are now unused because Arvada has only eight slots.


`/ads-landing-pages/all-on-x` was wiped and rebuilt block for block against the **Arvada Dental
Center** All-on-X ad page. It is published to the **Webflow subdomain only**:
`https://stone-surgical-arts.webflow.io/ads-landing-pages/all-on-x`. The four custom domains still
serve the previous version. **The live full-site publish is pending Alejandro's go-ahead.**

Read [`workflows/04-design/ARVADA-PARITY-GAP.md`](../../workflows/04-design/ARVADA-PARITY-GAP.md)
first: it holds the parity table, the asset and video inventory, the build recipe, the five bugs
found in QA, and the open items for the client. Source of truth for the page is
`workflows/04-design/.tmp/build/content_v2.py`, driven by `build_v2.py`.
