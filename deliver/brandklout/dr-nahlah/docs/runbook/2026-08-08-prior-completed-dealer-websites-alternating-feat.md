## Prior completed: Dealer Websites alternating feature rows (2026-08-08)

Site `69c8c0f16c14c214b2451dcf`. `Section Feature Row` had one direction only, so the 8 industry
pages read as 7 identical rows. Split into `Section Feature Row - Image Right` (renamed original,
`7034366f-…671951`, 32 instances) and `Section Feature Row - Image Left` (duplicate,
`8e93bc64-…d27668`, 24 instances); rows now alternate R/L/R/L/R/L/R on every industry page. The
mirror is combo class `.layout1_image-wrapper.is-image-left` (`order:-1` base, `order:0` at
`small`) so both variants still stack copy-first on mobile. All 8 pages re-queried and verified.
**Changes are in the Designer only — NOT published.** Docs: `deliver/dealer-websites/docs/`.
Uncommitted at time of writing.

**Gotcha (new, cost the most time):** the Webflow MCP will not insert or move an element relative to
a **component instance** — `insert_component_instance` rejects it explicitly and `move_element`
fails with a bare "An internal error occurred". Append to the parent wrapper instead, then re-append
the following siblings in order to fix placement. Duplicated components keep the same prop IDs.
