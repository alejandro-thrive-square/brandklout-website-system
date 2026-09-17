# 2026-09-16 — Footer component on every page (seq 47)

## Asked

Alejandro: "same for the footer. Convert it into a component and apply it to all of the pages.
Just the footer".

## Found

- 29 pages had an identical `<footer>` (32 nodes, `body[3]`). **Home's had one more node: the
  office address** ("15911 Pomona Rincon Rd, Suite 120B, Chino Hills, CA 91709, (949) 620-6929").
  The component was built from home's footer, so every page now shows the address.
- Component shape (from `site_snapshots.visualComponents`): `{id, name, tree:{nodes, rootNodeId},
  params:[], classIds:[], createdAt}`. The root is a `base.body` node whose child is the element. It's created
  through `site-document` `changedComponents`, and reads back as a `components` row
  (`cells: name, slug, body, params, classIds`).
- Draft ≠ published before the run. The only difference was the NavBar component's "Menu" button, unhidden
  in the editor at 00:57 UTC (the fix proposed in the navbar run). It went out with this publish.
  Pages compared equal once `parentId` and key order were ignored (snapshots omit `parentId`).

## Done

- Backup: `.tmp/backup-2026-09-16-pre-footer-component/` (site + all 30 full rows).
- Commit `e5cd7b67`. `.tmp/footer-component.mjs --apply`: component `Footer` / `footer` (`XLiDD0IUiRS2tpQhNA8wg`,
  34 nodes with the root) saved at seq 46 and read back. Then all 30 pages: the footer subtree was
  removed and a component ref put at the same index (seq 47). SEO cells were read-merge-written,
  and the legal template stayed a template. `--publish`.
- Live: 29 routes plus `/legal/privacy` and `/legal/terms` return 200 with exactly one footer, the
  address, the HIPAA link and "Reduce motion". The Menu button is now on all 29 pages.
- Nothing else pushed.

## Next

- Edit the footer only in the component.
- "Stories" is still hidden in the NavBar component.
- Still open: the code asset scoped to no pages (restore run).

## Gotchas

- A new component needs its own save and read-back before pages reference it. The script does
  this in two `site-document` saves.
- Snapshot pages have no `parentId`. Normalize before comparing draft with published, or every node looks changed.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
