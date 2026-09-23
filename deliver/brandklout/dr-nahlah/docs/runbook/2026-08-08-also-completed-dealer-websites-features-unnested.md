## Also completed: Dealer Websites Features — unnested (2026-08-08)

Page `69e2f58a29b1f423b4a583db`. **Published.** Third and last of the three CMS pages. User's scope,
stated explicitly: *"just unnesting nested collections and making sure they map right so the
functionality is the same and I can convert them into components"* — **no motion work**, and none was
added.

**This page is where the Themes structure came from** — identical element IDs (`e8cd7527`,
`f8ceb268`, `f3021762`, `8c63196b`). What was dead residue on Themes is load-bearing here. If you
recognise those IDs, check which page you are on before deleting anything.

It is **not a filter** — it is a grouping/distribution:

```
e8cd7527   header64 list -> anchor links  href="#page-builder" etc (jump links, not filters)
f8ceb268   main grid: list over Features CATEGORIES; each item renders a whole
           section_layout240 with a heading and an EMPTY .layout240_list
f3021762   .hide list over FEATURES (24 items)  -> LOAD-BEARING data source
  └ 8c63196b  nested category-name list  -> THE BLOCKER
```

The script moves each feature into the section matching its category, sorts by `.layout240_order`,
hides empty sections. It was **already inside `.section_features`** (`5a72bece`) along with
everything else, so nothing had to move out of Page Settings this time.

Cheapest possible fix, because the data already existed: Features items **already carry `section-id`**
(`803f8bd1…3a84`) populated on all 24, holding exactly the anchor ids (`page-builder`,
`graphics-tools`, `inventory-management`, `posting-tools`). **No CMS field was created and no item was
edited.** Added hidden hook `[data-feature-section]` (class `feature-section-hook`, `display:none`)
bound to it, changed **only** the script's category lookup into a `sectionIdFor()` helper that reads
the hook and falls back to the old name→id map, then deleted `8c63196b`. Steps 2 and 3 of the script
are byte-identical.

`.section_features` now holds **3 top-level lists, 0 nested**. Live page 47,742 → **46,060 bytes**,
24 hooks over 4 sections. Driven over CDP: **zero mismatches** against the CMS — every section has
the right features in the right `section-order` (`page-builder` 9, `inventory-management` 9,
`graphics-tools` 3, `posting-tools` 3 = 24 on screen), **0 left stranded** in the hidden list, all 4
anchor links intact, zero console errors, screenshot unchanged.

**All three CMS pages are now componentizable.** Themes and Integrations are converted; Features is
ready but **not yet converted** — the user does that in the Designer.
