## Latest completed: Dr. Nahlah WP → Webflow 301 redirect map (2026-08-17)

Built the full redirect CSV for `drnahlah.com`. Deliverable:
`deliver/brandklout/dr-nahlah/workflows/14-migration-seo-redirects/.tmp/drnahlah-301-redirects.csv`
— **129 rules**, two columns + header, ready for Webflow's *Import 301 redirects* dialog.
Generator is `build_redirects.py` in the same folder; write-up is
`deliver/brandklout/dr-nahlah/docs/seo-redirect-plan.md`.

- **Coverage 78/78** of the URLs live on WordPress at migration: 8 slugs survived unchanged
  (no rule needed), 70 redirected. Plus 29 legacy URLs and 30 structural/wildcard rules.
- **Verified live**: all 11 new pages return 200 on `www.drnahlah.com`; all 112 literal old
  paths in the CSV return 404 today, so nothing in the CSV shadows a live page.
- The `webflow-brandklout` MCP **reaches the Dr. Nahlah site directly from the personal
  profile** (site `6a6b84cc7fe55ddeabc0b314`, workspace `63b4b7393e89b78575e9a9bb`). The old
  `webflow-dr-nahlah` server is gone from `claude mcp list`. No Orca handoff was needed.

### Gotchas (all now written into `deliver/process/14-migration-seo-redirects/`)

- **The domain is already on Webflow and has zero redirects installed** (published
  2026-08-14). Every old URL is a live 404. This is urgent, not preventive.
- **Webflow 301s `/foo/` → `/foo` natively**, before redirect matching. Never emit trailing-
  slash variants, and never emit self-redirects for surviving slugs (`/veneers → /veneers`
  is a loop). `build_redirects.py` keeps them in its tables and filters at write time.
- **Test against `www`, not the apex.** `drnahlah.com` 301s everything to `www`, so an apex
  test returns 301 for real pages *and* for 404s — it hides exactly what you are checking.
- **The content-intake scrape is not a complete URL inventory.** Wayback CDX found 29 URLs
  that were already dead before the 2026-07-30 scrape but still hold inbound links
  (`/all-on-four`, `/prosthodontics`, `/dental-crowns`, the `/dental-implants-in-dc-*`
  cluster). Always run the CDX query as a second source.
- **The site has no CMS collections**, so the 43 blog posts have no real destination — they
  are mapped to service pages by intent. Long-tail rankings will not survive that.
- **`/sitemap.xml` is 404 and `robots.txt` is empty** on the live site — Webflow's
  auto-sitemap is off. Separate defect, flagged to the user, not fixed here.

Not yet done: the CSV has not been uploaded — that is a Designer/site-settings action for
the user, and redirects only take effect on the next publish.
