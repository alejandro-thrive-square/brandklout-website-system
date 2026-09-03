# Content intake captures (2026-09-03)

- `livewell/` — the three Livewell reference pages, split into 28 per-section HTML extracts
  (`sections/`, indexed by `manifest.json`) plus `classes.txt`. `livewell.css` is NOT committed;
  refetch from
  `https://cdn.prod.website-files.com/69d03fdbe999e9907724a69d/css/livewelldentalva.shared.1eda3dbac.min.css`.
- `stone/` — the live Stone All-on-X service page, used as the source of every factual claim on the
  campaign pages. `home.html` and `stone.css` are NOT committed; refetch from
  `https://www.stonedentalimplantcenter.com/` and
  `https://cdn.prod.website-files.com/6a07d5aac093f0e4521d29bc/css/stone-surgical-arts.shared.5ad7d7f8d.css`.
- `live/` — the three campaign pages as published BEFORE the em dash pass (57 em dashes).
- `live2/` — the same three AFTER the pass and republish (0 em dashes). Diff the two to verify no
  embed, script, iframe or link was disturbed.
