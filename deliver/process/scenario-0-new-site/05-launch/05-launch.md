# Scenario 0 · 05 Launch

## Purpose

Finish the integrations, promote staging to production, connect the client's domain, then give
staging its own subdomain. The admin must work on every host before anyone gets a link.

## Inputs

- QA passed (step 04), no open critical or high issue.
- Domain registrar and DNS access, GHL forms and number pools, GTM and Clarity ids, Termly website ID.
- For a migration: the redirect Worker from Scenario 1.

## Checklist

- [ ] Favicon
- [ ] AEO schema, SEO meta, Open Graph on every page
- [ ] 404 page
- [ ] Reviews, GHL forms, number pool (DNI), analytics, Termly, accessibility widget
- [ ] Images optimized
- [ ] Production backed up
- [ ] Staging pushed to production
- [ ] Email records copied into Cloudflare
- [ ] Domain connected on Cloudflare
- [ ] Public origins updated, check-origins clean
- [ ] Staging subdomain with noindex
- [ ] Redirects live (if there was an old site)
- [ ] Smoke test

## Steps

1. **Favicon** if the client has none. Instatic writes no icon link; set `favicon` (and
   `appleTouchIcon`) in the `open-graph` plugin, 1.2.0 or later.
2. **SEO.** Schema and Open Graph come from the `aeo-schema` and `open-graph` plugins; SEO fields per
   page. Set the site URL or no canonical tag is printed. Check the rendered head with
   `gates/seo-head-check.mjs`, never the raw HTML. Build each page's schema from its
   visible sections, not its meta description, and repeat the visible breadcrumb
   ([aeo-schema README](../../tools/instatic-plugins/aeo-schema/README.md), "Blocks built from
   the page's content"). Serve `/llms.txt` and 301 each page's trailing-slash twin.
3. **404.** An Instatic `notFound` template target; reapply the flag after any page import.
4. **Embeds and scripts.** Reviews: the client's Google Reviews widget from the Elfsight registry
   (`tools/elfsight-reviews/review-widgets.json`), set to the
   [in-section standard](../../tools/elfsight-reviews/README.md) and gated with `check-widget.mjs`.
   GHL forms on the [ghl-forms standard](../../tools/ghl-forms/README.md). Both as Embed blocks; any
   change inside GHL or Elfsight goes through Codex computer use, one small saved step per run. GTM, Microsoft
   Clarity and the number pool script go in through the embed-origins plugin (`siteScripts`). Allow
   `services.leadconnectorhq.com` and `services.msgsndr.com` in `connect-src`, or the number swap fails
   silently on pages without an embed. Prove the swap with `tools/termly-ghl-consent/gates/dni-proof.mjs` as one visitor.
5. **Consent.** Termly above GTM, auto blocking off, trackers tagged by hand, number pools exempt
   (client decision 2026-09-22). Grant Termly's origins. Check both directions: nothing fires before a
   choice, everything releases after Accept (`tools/termly-ghl-consent/consent-kit.mjs check`).
   Each site's Termly account and resource-blocker script is listed in
   [`termly-setup.html`](./termly-setup.html); add the new site there.
6. **Images.** Compress every image; test the result of every step before moving on.
7. **Promote.** Back up production (`ops/backup-site.mjs`), make sure nobody has pending drafts (a
   push publishes every draft site-wide), match plugin versions
   (`tools/instatic-plugins/plugins.mjs status --sites <client>`, no PARITY line), then push staging to production with
   `staging-clone` (`clone-site`, `diff-sites`, `clone-plugins`, `publish-rows`). Asana task for the
   developer's final review (confirm first).
8. **Email first.** Before the nameserver switch, copy MX, SPF, DKIM and DMARC into the Cloudflare zone
   and compare with a DoH lookup (`tools/cloudflare-launch/copy-dns-records.mjs`). Cloudflare's import
   drops DKIM.
9. **Connect the domain** ([`tools/cloudflare-launch/cloudflare-launch.md`](../../tools/cloudflare-launch/cloudflare-launch.md)):
   Railway CNAME and the `_railway-verify` TXT record, DNS only until the certificate is VALID, then
   proxy on. SSL Full (strict), Always HTTPS, TLS 1.2. `www` is the main address: redirect the bare domain to www
   only after www serves. Use a scoped temporary Cloudflare token and revoke it after.
10. **Public origins.** Set production's `PUBLIC_ORIGIN` to the domain, www and the
    `business-name.up.railway.app` link, redeploy, confirm a new deployment appeared, and run
    `check-origins.mjs --all`. Update `sites.json` and the env master. Send the admin link only after
    it is clean. Record each domain's own Railway target (apex and www differ) under `dns` in
    `sites.json` (`check-dns.mjs --record`) and run `check-dns.mjs`: zero `CHANGED`.
11. **Staging subdomain.** Create `staging.<domain>` for the staging environment, delete staging's
    railway link (it bypasses Cloudflare), add an `X-Robots-Tag: noindex` Transform Rule, set staging's
    site URL with canonical output off, update staging's `PUBLIC_ORIGIN` and run check-origins again.
    Guard every tag by host so staging never fires GTM or claims pool numbers.
12. **BugHerd** moves to the staging subdomain only after every pin is resolved (pins are lost on the
    switch).
13. **Smoke test** the priority pages, forms, CTAs, `sitemap.xml` and `robots.txt`
    (`tools/cloudflare-launch/verify-launch.mjs`).

## Conditionals

- **If there was an old site:** the redirect Worker from Scenario 1 goes live in the same change as
  the domain, not later.
- **If the practice has more than one office:** one number pool and one GHL form per office; only one
  pool script runs per page.
- **If the client is not ready to switch:** keep the old site as a cleaned static mirror on Cloudflare
  Pages (`tools/cloudflare-launch/pages-mirror.mjs`).

## Do / Don't

- Do keep the railway link in production's public origins as the fallback admin address.
- Don't turn on Termly auto blocking; it breaks the site and every embed.
- Don't put number pools behind consent.
- Don't send the admin link before check-origins is clean.
- Don't delete and re-add a custom domain in Railway to "fix" it: that mints a new target and
  orphans the DNS record. A redeploy never moves the target.
- Don't push to production without a backup.
- Don't request a URL on the new host before it exists; Cloudflare caches the 404 for hours.

## Tools

- `tools/instatic-site/gates/seo-head-check.mjs`, `facts-sweep.mjs`
- `tools/termly-ghl-consent/gates/dni-proof.mjs`
- `tools/instatic-site/staging-clone/`, `ops/backup-site.mjs`
- `tools/instatic-embeds/`, `tools/termly-ghl-consent/`
- `tools/cloudflare-launch/` — tokens, DNS copy, railway domain, zone hardening, staging noindex,
  canonical host, verify.
- `tools/instatic-domain-origins/check-origins.mjs`, `check-dns.mjs`

## Outputs

- `docs/project-overview.md` updated with the live hosts
- `scenario-0-new-site/05-launch/output/` smoke test and gate reports
- `tools/instatic-domain-origins/sites.json` entry updated

## Evidence

Runbooks: bk-stone 2026-09-10 domain cutover; bk-brandklout-website 2026-09-22 domain cutover and
staging; bk-ifa-dentistry 2026-09-11 email DNS and Cloudflare conflicts, 2026-09-18 staging
environment; bk-dr-nahlah 2026-08-17 redirects missing at launch, 2026-09-22e connect-src;
bk-stone-med-spa 2026-09-17 production push; repo 2026-09-22 Termly rollout.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
