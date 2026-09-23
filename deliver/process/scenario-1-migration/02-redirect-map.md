# Website Migration · 02 Redirect Map

## Purpose

Send every URL the old site ever had to the right page of the new site, in one hop, from the moment
the domain moves. Old URLs carry links, bookmarks and rankings; a missing map turns all of them into
404s (Dr. Nahlah ran without one for days). Instatic has no URL redirects, so the map runs as a
Cloudflare Worker.

## Inputs

- `workflows/migration/capture/url-inventory.txt` and `.csv` (step 01: sitemap + crawl + Wayback).
- `workflows/migration/capture/posts/posts-redirects.csv` (step 01, blog).
- The new sitemap from scenario 0 step 02 (planned pages), and at launch the list of paths the new
  site actually serves.
- Old domain and new domain; who holds the old domain's registrar login.

## Checklist

- [ ] Mode decided: same domain or legacy domain (old domain differs)
- [ ] Every inventoried old URL classified (same page, merged, section, dropped)
- [ ] Every old page with links or traffic has a home in the new sitemap
- [ ] `redirect-map.config.json` written; build passes with no FAIL
- [ ] Legacy domain: its own Cloudflare zone, email records copied before the nameserver switch
- [ ] Worker verified on workers.dev (pending zone) or on a staging route
- [ ] Deployed AT the domain cutover, not before; verified the same hour, `FAIL  none`
- [ ] Audit CSV sent to the client; open decisions listed

## Steps

`S=deliver/process/scenario-1-migration/scripts`, `C=deliver/process/tools/cloudflare-launch`.
Work in `deliver/brandklout/<client>/workflows/migration/redirects/`.

**Part A, now (before the sitemap is final).**

1. **Pick the mode.**
   - `same-domain`: the new site replaces the old one on the same domain. Only mapped paths
     redirect; every other request goes to Instatic untouched.
   - `legacy-domain`: the old site lived on another domain (Stone: stonesurgicalarts.com to
     dfwsurgicalarts.com; Mason Park: bestdentistinkatytx.com to masonparkdental.com). Every
     request on the old domain redirects; unknown paths land on the fallback (home).
2. **Classify every URL in `url-inventory.csv`.** One category per row, the way Stone and Mason
   Park did: `same-path`, `article`, `procedure` or `service`, `practice`, `booking`, `results`,
   `landing`, `theme-demo`, `out-of-scope`, `no-equivalent`, `fallback`. Mark provisional rows
   (destination not decided) so they reach the client as questions.
3. **Feed the sitemap.** Every old page that had links, traffic (Search Console) or a ranking needs
   a destination that is the same topic. If none exists, flag it for scenario 0 step 02: add the
   page, merge it into a named page, or accept the home-page fallback in writing.
4. **Write the config.** Copy `$S/redirect-map.config.example.json` to `redirect-map.config.json`.
   Fill `target` (the canonical new host), `oldHosts`, `mode`, `workerName`
   (`<client>-legacy-redirects` or `<client>-redirects`), `inventory`, `pages`, and the rows:
   - `exact`: one old path to one new path. Paste `posts-redirects.csv` rows here.
   - `prefix`: a whole old section (`/category`, `/tag`, `/author`, `/dental-library`) to one page.
     The Worker picks the exact row first, then the LONGEST matching prefix, then the fallback.

**Part B, at launch (scenario 0 step 05, with `tools/cloudflare-launch/`).**

5. **Build and validate.** `node $S/build-redirect-worker.mjs --config redirect-map.config.json`
   Before cutover set `checkOrigin` to the new site's `*.up.railway.app` host so destinations are
   checked where the new site already serves. Fix every FAIL; the build refuses:
   - trailing-slash rows (the Worker ignores slashes; a slash row is a duplicate),
   - self-redirects (a slug that survived is dropped from the map, not redirected to itself),
   - destinations that are not in `pages` or do not answer 200,
   - same-domain rules that match a live page (that page would serve something else with a 200),
   - same-domain old URLs with no rule and no page (they would 404).
   Output: `out/<workerName>.js`, `out/redirect-map.json` (map, routes, audit rows) and
   `out/redirect-audit.csv` for the client.
6. **Legacy domain: prepare its zone** (skip for same-domain). The old domain needs its OWN
   Cloudflare zone on the Brandklout account. Before anyone changes nameservers:
   `node $C/copy-dns-records.mjs --zone <old> --snapshot ../../../docs/migration/email-dns-<old>.json`
   (import scans miss DKIM and `mail` records, and add records the live DNS does not have). Keep
   mail records DNS-only. The Worker needs a proxied record on each old host: pass it with
   `--records`.
7. **Deploy the Worker with a preview.** Mint a token first (`node $C/mint-token.mjs --zone <zone> --preset redirects`).
   `node $C/deploy-worker.mjs --zone <zone> --script <workerName> --file out/<workerName>.js --routes-from out/redirect-map.json --preview [--records records.json] [--remove-catch-all --backup out]`
   dry run, then `--apply`. Legacy routes are `old/*` and `www.old/*`; same-domain routes are one
   route per old path or section, never `host/*` (Workers Free allows 100,000 requests a day for the
   whole account).
8. **Verify before it matters.** Pending zone or not yet cut over:
   `node $S/verify-redirects.mjs --map out/redirect-map.json --via https://<workerName>.<account-subdomain>.workers.dev`
   It must end `FAIL  none`.
9. **Go live AT the domain cutover.** Same domain: the routes take effect when the domain points at
   Instatic; deploy them in the same session as the DNS change, never earlier (they would redirect
   the old site's live pages to pages that do not exist yet). Legacy domain: the map works the
   moment the old zone is active. Then, within the hour:
   `node $S/verify-redirects.mjs --map out/redirect-map.json` on the real hosts, apex and www,
   with and without the slash, query strings kept. `FAIL  none`, or roll back:
   `node $C/deploy-worker.mjs … --rollback --backup out --apply`.
10. **Hand over.** Send `redirect-audit.csv` to the client with the provisional rows as questions.
    Submit the sitemap in Search Console and Bing. Check Search Console's "Not found (404)" report
    weekly for four weeks and add rows for anything real.

## Conditionals

- **If the old zone already has a catch-all Single Redirect** (expression `true`, e.g. "everything
  to the new home page"), then deploy with `--remove-catch-all --backup out`: Single Redirects run
  before Workers, so the Worker never sees a request while the rule exists. The script binds the
  routes first, then saves and deletes the rule: no moment without a redirect.
- **If the old domain's zone is pending** (nameservers not switched), then it answers nothing at the
  edge (`--resolve` gets 409 or a TLS failure). Verify only through the workers.dev preview, and
  again on the real hosts after activation, once Universal SSL has issued (a few minutes; `http://`
  works before `https://` does).
- **If the new content is not on production yet** (Mason Park's blog was on staging only), then map
  those rows to `/` with category `pending`, and point them at their real pages (rebuild +
  redeploy) the day those pages go live. The build refuses any destination that does not answer
  200, which is what keeps this honest.
- **If the move is temporary** (old site parked on a mirror while the new one is finished, or a
  domain pointing at another host for a while), then use `"keepPath": true, "status": 302`: every
  path goes to the same path on `target`, and nothing is cached as permanent. A 301 to a host that
  404s cost Mason Park Kids 14 hours.
- **If the old redirect lives at the host, not in `.htaccess`** (SiteGround Site Tools does it at the
  nginx layer), then change it in the host panel; editing `.htaccess` does nothing.
- **If the old site must keep nested URLs verbatim** (a WordPress clone such as IFA), then prefer
  slash slugs saved through the site-document API (they serve nested). If a path still will not
  serve, use Cloudflare URL rewrites with an `ne "/section/"` guard, as in bk-ifa-dentistry
  `docs/dns/set-url-rules.mjs` (a wildcard `*` also matches the empty string).
- **If the new site is on Webflow** (scenario 3 clients), then do not use a Worker: import the map
  in Site settings > Publishing > 301 redirects. Webflow strips the trailing slash before matching
  and wildcard `(.*)` order is unpredictable, so point overlapping wildcards at one destination and
  test against the canonical host, not the apex.
- **If the map would need more than ~200 same-domain routes**, then collapse rows into section
  prefixes. Dr. Nahlah runs a Bulk Redirect list instead (190 rows); read its notes in
  `tools/cloudflare-launch/cloudflare-launch.md` before choosing that.
- **If the old domain is not on the Brandklout Cloudflare account and the client cannot move it**,
  then the redirects go at the old host or registrar. Record who owns that and get the map applied
  there; verify with `verify-redirects.mjs` all the same.

## Do / Don't

- Do map every URL in the inventory, including Wayback-only ones. A home-page fallback is a
  decision, not a default: list those rows for the client.
- Do keep the map in `redirect-map.config.json` only. Never edit the generated Worker.
- Do prove destinations 200 at build time and again after deploy.
- Do keep the query string (UTM tags) across the hop; the Worker does.
- Don't write trailing-slash rows or self-redirects.
- Don't bind a Worker to `/robots.txt` or to a live site's `host/*`.
- Don't deploy the map before the cutover, and don't wait days after it.
- Don't use a 301 for anything temporary; browsers cache it for good.

## Tools

- `$S/build-redirect-worker.mjs`: builds and validates the map, generates the Worker, the routes and the audit CSV.
- `$S/verify-redirects.mjs`: replays every row (both hosts, slash variants, query) against the edge or `--via` a preview.
- `$S/redirect-map.config.example.json`: config template.
- `$C/deploy-worker.mjs`: uploads the Worker, binds routes, DNS records, workers.dev preview, catch-all removal, rollback.
- `$C/mint-token.mjs`: short-lived zone-scoped token; revoke with `--revoke <id>`.
- `$C/copy-dns-records.mjs`: live DNS vs zone diff, copies missing records DNS-only.
- `$C/cloudflare-launch.md`: the cutover this step goes live with.

## Outputs

Under `deliver/brandklout/<client>/workflows/migration/redirects/`:

- `redirect-map.config.json` (the map; committed)
- `out/<workerName>.js`, `out/redirect-map.json`, `out/redirect-audit.csv` (committed: the record of what is deployed)
- `out/backup-dynamic-redirect.json` when a catch-all was removed
- `deliver/brandklout/<client>/docs/migration/redirect-decisions.md`: provisional rows and client answers

## Evidence

- bk-stone/2026-09-15-301-map-built-and-staging-created.md (185 URLs, Worker over Bulk, catch-all order)
- bk-mason-park/2026-09-17-legacy-redirects-for-bestdentistinkatytx.md (own zone pending, workers.dev `--via`, 687 checks, article-pending)
- bk-dr-nahlah/2026-08-17-latest-completed-dr-nahlah-wp-webflow-301-redire.md (no redirects at launch; Webflow rules; Wayback 29)
- bk-dr-nahlah/2026-08-25-session-13-sitemap-301-map-live-on-cloudflare.md (Bulk list, robots.txt trap, two hops)
- bk-ifa-dentistry/2026-09-11-wordpress-url-parity.md (nested URLs, rewrites with an `ne` guard)
- bk-mason-park-kids/2026-09-01-the-live-domain-is-a-site-tools-redirect-not-hta.md (host-level redirect; 14-hour 301 outage; 302 keeps path)
- bk-west-la-implants docs/project-overview.md (88 URLs flagged, no map yet; Wayback adds 160 more)

## Next

Continue with scenario 0 from `02-research-sitemap`: the sitemap must give every classified old URL
its destination. Part B of this step runs inside scenario 0's launch step.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
