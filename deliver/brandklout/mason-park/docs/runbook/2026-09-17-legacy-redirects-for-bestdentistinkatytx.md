# 2026-09-17 — 301s from bestdentistinkatytx.com to www.masonparkdental.com

**Zone:** `bestdentistinkatytx.com` (`da7c86df987d59a6ad14de6135de4c97`), Brandklout account. **Pending.**
**Workflow:** [`workflows/12-legacy-redirects/`](../../workflows/12-legacy-redirects/12-legacy-redirects.md)
**Commit:** see git log for this file.

## Done

- Built the map. The 343 old URLs from the 2026-08-05 crawl go to 73 destinations, and every
  destination answers 200 on www:
  - 71 old URLs are served at the same path.
  - 89 old URLs are mapped to a replacement page.
  - 161 articles are marked `article-pending`.
  - Anything unknown falls back to `/`.
- Deployed to the zone:
  - The Worker `mason-park-legacy-redirects`.
  - Its routes on the apex and on `www`.
  - A proxied `www` A record.
  - A DNS-only `mail` A record `35.208.39.228`. The live DNS has it and the zone scan missed it.
- Checked through the workers.dev preview with
  `verify-redirects.mjs --via https://mason-park-legacy-redirects.agency-45e.workers.dev`:
  687 checks, `FAIL  none`.
- The temporary scoped token was minted and then revoked in the same session.

## Next

- **Switch the nameservers.** At the registrar (Squarespace Domains, Tucows), change them from
  `nsc1–4.squarespacedns.com` to `ajay.ns.cloudflare.com` and `ruth.ns.cloudflare.com`. Until
  then nothing is live, and the old domain keeps answering SiteGround's 503. Once the zone is
  active and the certificate is issued, run `node verify-redirects.mjs`.
- **Decide on DMARC before the switch.** The zone has `_dmarc` `p=quarantine` and a
  `google._domainkey` record, and neither is in the live DNS today. Ask whoever runs the
  practice's email.
- **When the blog reaches production, rebuild and redeploy.** Production has no `/blog` today;
  staging does. The 161 old article URLs land on `/` until then.
- **Re-run the Wayback CDX sweep.** The Internet Archive was offline today.

## Gotchas

- **Production is not staging.** www serves Sang's package: 70 pages, old-site paths, and no
  blog. Destinations were checked against www, not staging.
- **A pending zone gives no edge answer** (409 with `--resolve`). The workers.dev preview is the
  only check before activation.
- **The Cloudflare zone's "original nameservers" field says SiteGround, but live DNS is
  Squarespace.** Compare the zone against DoH before trusting the scan.
