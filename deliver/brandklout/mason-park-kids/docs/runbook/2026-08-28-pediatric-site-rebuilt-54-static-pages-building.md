## 2026-08-28 — pediatric site REBUILT. 54 static pages, building locally.

`deliver/brandklout/mason-park-kids/workflows/02-static-rebuild/` — **read its README before
touching anything**; three of its decisions are not obvious from the code.

```bash
cd deliver/brandklout/mason-park-kids/workflows/02-static-rebuild/.tmp
node db-pages.mjs && node extract.mjs && node build.mjs && node audit.mjs
node serve.mjs --port 4310     # 4300 is usually taken by the parent site's server
```

`audit.mjs`: **0 blockers, 0 errors, 0 warnings.** Median page 47 KB on load. `dist/` gitignored.

### The finding that shaped the build

The live install (`wp_` prefix) publishes **40 pages and not one service page**, while its own main
menu links to **24 URLs under `/services/`** — all 404s on the live site. Those pages exist in a
**second, abandoned WordPress install in the same database** under the prefix `hni_` (blogname
"Mason Park Dental for kids", admin `social@identitydental.com` — the previous agency), 69
published pages of clean paragraph HTML. 24 are carried forward; the rest are an adult
general-dentistry set that does not belong on a pediatric site. `db-pages.mjs` reads them, pinning
rows **by id, not slug** — several slugs appear twice and the longest is usually the adult one.

### Gotchas that cost real time here

- **Never run `build.mjs` while `responsive.mjs` is running.** The build deletes and rewrites
  `dist/` under the gate's own static server, and the gate then hangs forever waiting on pages that
  stopped existing. It presents as a Chrome/CDP problem and is not. Two full 10-minute runs were
  lost to this.
- **Do not write `.mjs` files through a bash heredoc.** `cat > x.mjs <<'EOF'` silently collapsed
  `\n` to `
` inside regex literals, so `/\n/g` became `/
/g` and the SQL unescaper did
  nothing — the symptom was literal `
` in the page copy, three steps downstream. Use Write.
- **`/services/invisalign/` deliberately does NOT use the longest matching row.** `hni_posts#264`
  is a "$1000 OFF / lowest price $3,610" promo from the abandoned install. 528 is used instead.
- **`our-team-copy` is not a copy of the team page** — it is a parent guide to knee-to-knee infant
  exams, now published at `/knee-to-knee-pediatric-dental-exam/`.
- The theme's page-title band is repeatedly the WRONG title (`/new-patients/` opened with a heading
  reading "Dental Savings Plan"). `renderBlocks` matches that band by its shape — a section holding
  exactly an h2 and an h4 — rather than by text.

### Next

1. **Client sign-off on the open items** in the workflow README — the suite number and phone are
   the blocker: the site publishes #104B / (281) 578-7100 in its own chrome and #104A /
   (281) 769-8878 in a footer copied from the parent site.
2. Hosting. The parent site went to Instatic; nothing is configured for this one and `.mcp.json`
   still carries only `instatic-dr-nahlah`. A `to-instatic.mjs` has NOT been ported yet.
3. **Revoke `.secrets/sg_pediatric_recovery`** in SiteGround Site Tools — still outstanding from
   the recovery session.
