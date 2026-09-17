## 2026-08-30 - `to-instatic.mjs` ported and verified (`9298a94`)

The build was already clean and staged; the missing piece was the `dist/` -> `instatic/` transform.
It is ported from the parent practice's workflow 09 and **verified against the real build on both
passes**. Nothing is uploaded - no Instatic instance credentials were used and none are in `.env`.

```bash
cd deliver/brandklout/mason-park-kids/workflows/02-static-rebuild/.tmp
node to-instatic.mjs            # pass 1: bundle with local /assets/ paths, all reported unmapped
node to-instatic.mjs --media <map>.json   # pass 2, after the upload
```

`instatic/` holds 54 page JSONs, `site.css`, `site.js`, `media-manifest.json`, `IMPORT.md`.
It is **gitignored** (new rule `**/.tmp/instatic/`) for the same reason `dist/` is. The script is
the artifact. Read the generated `IMPORT.md` for the run order, not the workflow README.

### Gotchas found while porting - all three are invisible once live

- **The harvest map MUST be keyed by full relative path, not basename.** Nine basenames here
  belong to two files each; `Dentist-in-Katy-Office*.webp` exists in `2023/11` AND `2024/09` at
  different byte sizes because the photo was re-uploaded. A basename-keyed map gives eight pages
  the wrong image, and the page still shows an office photo, so it never gets caught. The script
  now **exits 1** rather than resolve an ambiguous basename. Both behaviours are tested: a
  basename-keyed map exits 1, a path-keyed map exits 0.
- **Body-only export drops the `<head>`,** and with it the `Dentist` JSON-LD on all 54 pages. Now
  preserved as `jsonLd` on each page record; it has to be pasted back through Instatic's per-page
  head field (step 6 of `IMPORT.md`). Same for the favicon - it is a `<link rel="icon">`, so it
  reached neither the manifest nor the site. Now in the manifest's `headOnly`.
- **`--lean` matters more here than on the parent**: 30 files / 5.1 MB vs 138 / 13.9 MB, because
  111 of the referenced files exist only to fill a `srcset`. Use the SAME flag on both passes or
  the pages come back pointing at candidates that were never uploaded. Recommended for launch,
  re-run without it later to restore responsive images.

### Next - the upload itself

1. **`.env` still reads `INSTATIC_BASE_URL=https://mason-park.up.railway.app`** - the PARENT
   practice's live site, inherited from the split. The user is setting up the pediatric Railway
   instance on 2026-08-30/31. Correct `.env`, add an `instatic-mason-park-kids` entry to
   `.mcp.json`, and add the site to `deliver/process/20-instatic-domain-origins/sites.json`.
2. **The admin has to work BEFORE the import**, not after: Instatic's MCP edits a live workspace,
   so the Site editor must be open in a browser and signed in as the connector owner. The import
   cannot run headlessly.
3. Then: upload media -> harvest map (path-keyed!) -> `--media` pass -> code assets -> pages ->
   favicon + JSON-LD.
4. **Still unresolved and still worth settling before upload, not after**: the suite/phone conflict
   (#104B / (281) 578-7100 vs #104A / (281) 769-8878) and whether Dr. William Sung stays. Both
   change page copy, so resolving them after the import means hand-editing inside Instatic.
5. **Revoke `.secrets/sg_pediatric_recovery`** - still outstanding.
