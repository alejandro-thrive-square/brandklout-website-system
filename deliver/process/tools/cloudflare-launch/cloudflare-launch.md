# Tools · Cloudflare Launch (domain cutover)

## Purpose

Move a client's domain onto its Instatic site through Cloudflare without losing email, search or
admin access: DNS and mail copied first, Railway domains with valid certificates, one canonical
host, the SSL baseline, a sitemap, the redirect map live at the same moment, and staging.<domain>
kept out of Google. Instatic serves no sitemap, no canonical and no redirects, so the edge does it.

## Inputs

- The production Railway project, environment and service ids (`railway list --json`); the site
  serves on `<business-name>.up.railway.app` until now.
- The domain, and who holds the registrar login (nameserver changes happen there, not in Cloudflare).
- The email DNS snapshot (`scenario-1-migration/01-old-site-capture/scripts/email-dns-audit.mjs`), taken before anything moves.
- For a migration: the built redirect map (`scenario-1-migration/02-redirect-map.md`, Part B).
- `deliver/process/tools/instatic-domain-origins/sites.json` and `check-origins.mjs`.

## Checklist

- [ ] Scoped token minted, and revoked at the end
- [ ] Zone on the Brandklout account; delegation and registry locks checked
- [ ] Every live mail/verification record in the zone, DNS-only, before the nameserver switch
- [ ] Nameservers switched; zone active; a test email in and out
- [ ] www and apex attached in Railway; certificates VALID; CNAMEs proxied
- [ ] PUBLIC_ORIGIN = canonical, twin, railway host; one real login works
- [ ] Canonical-host 301 (only after the target serves)
- [ ] SSL Full (strict), Always Use HTTPS, TLS 1.2 minimum; every host still 200
- [ ] Redirect map deployed and verified in the same session (migrations)
- [ ] sitemap.xml Worker live on both hosts; robots.txt is the edge's own file
- [ ] staging.<domain>: own Railway domain, service domain deleted, noindex header, staging siteUrl
- [ ] `verify-launch.mjs` ends `FAIL  none`; sitemap submitted to Search Console and Bing
- [ ] sites.json, `INSTATIC_BASE_URL` in `~/.webzite/.env`, env-sync, runbook updated

## Steps

`C=deliver/process/tools/cloudflare-launch`. Redirect Node output to a file (never pipe on Windows).
Every script is a dry run until `--apply`.

1. **Token.** `node $C/mint-token.mjs --zone <domain> --preset launch --hours 3 > <scratchpad>/cf-token.json`
   Export its `value` as `CLOUDFLARE_API_TOKEN` for this shell only. The shared `CLOUDFLAREAPI` is
   account-owned and has no zone rights; `/user/tokens/verify` calls it invalid when it is not
   (`node $C/cf-api.mjs whoami` checks the right endpoint). A fresh token answers 10000 for ~5 s.
2. **Zone.** Add the domain to the Brandklout Cloudflare account (Free plan) in the dashboard; it
   is pending with the account's two nameservers. Check delegation in RDAP at the registry, not with
   an NS lookup (NS records typed into the old host's zone editor are not delegation), and look for a
   registry `pendingTransfer` or lock status.
3. **Mail and every other record, before the switch.**
   `node $C/copy-dns-records.mjs --zone <domain> --snapshot <client>/docs/migration/email-dns-<domain>.json --hosts ftp,shop,booking > dns.log`
   then `--apply`. Or import `<domain>-email.zone` in the dashboard (DNS > Records > Import).
   Then fix what the import scan did: set `mail`, `ftp`, `ssh`, `autodiscover`, `autoconfig`,
   `_domainconnect` to DNS-only (the proxy only carries HTTP); delete imported `@`/`www` A/AAAA
   records that are another Cloudflare account's edge IPs (Error 1000); decide every "in the zone
   but not live" record with the client, above all an enforcing DMARC. Re-run until the first
   list is empty.
4. **Switch the nameservers** at the registrar. Wait for the zone to read active. Send a test email
   in and out of a real mailbox (and a marketing-platform test if they use one).
5. **Railway domains, www then apex, on production.**
   `node $C/railway-domain.mjs --project <p> --environment <prod> --service <s> --domain www.<domain> --zone <domain> --apply > rw-www.log`
   It creates the domain, writes the CNAME DNS-only plus the `_railway-verify` TXT (not listed in
   `dnsRecords`; without it a proxied domain never verifies), waits for the certificate, then proxies.
   Once VALID, ignore Railway's `DNS_RECORD_STATUS_REQUIRES_UPDATE` badge forever.
6. **PUBLIC_ORIGIN.** Attaching a domain never updates it: the new host shows a normal login page
   and answers the login with `403 invalid origin`.
   `railway variables --service "<S>" --set "PUBLIC_ORIGIN=https://<canonical>,https://<twin>,https://<railway host>"`
   canonical first (it sets the secure-cookie flag), railway host last, nothing dropped. Wait for a
   NEW deployment row, then `node ../instatic-domain-origins/check-origins.mjs --all` and exactly
   one real login (five failures lock the account). Update `sites.json`, `INSTATIC_BASE_URL` in
   `~/.webzite/.env`, then `node scripts/env-sync.mjs`.
7. **Canonical host.** `www` is the main address (owner decision 2026-09-23). On a migration keep the
   host the old site used only if the owner agrees, since Google's index has it; otherwise `www`. `node $C/canonical-host.mjs --zone <domain> --to https://www.<domain> --apply`
   It refuses while the target does not serve 200, keeps path and query, and exempts
   `/.well-known/acme-challenge/` so the other host's certificate still renews.
8. **SSL baseline.** `node $C/zone-hardening.mjs --zone <domain> --hosts <domain>,www.<domain> --apply`
   Full (strict), Always Use HTTPS, TLS 1.2. It re-checks every host and reverts SSL if one breaks.
   Flexible makes Railway loop.
9. **Redirects (migrations).** Deploy and verify the map now, in this session:
   scenario-1 `02-redirect-map.md` steps 7 to 9.
10. **Sitemap.**
    `node $C/build-sitemap-worker.mjs --canonical https://www.<domain> --out <client>/scenario-0-new-site/06-post-launch/output/cloudflare --crawl > sitemap.log`
    `node $C/deploy-worker.mjs --zone <domain> --script <client>-sitemap --file <out>/sitemap-worker.js --routes "<domain>/sitemap.xml*,www.<domain>/sitemap.xml*" --apply`
    The trailing `*` is required (a bare route misses `?query` and falls to Instatic's 404).
    Never bind `/robots.txt`: it is the edge's managed file, and a Worker on it replaced 1248 B with
    70 B on Dr. Nahlah. So robots.txt has no `Sitemap:` line: submit the sitemap in Search Console
    and Bing Webmaster Tools. Rebuild and redeploy the sitemap whenever a page is added or renamed.
11. **Staging, after production is live** (owner decision 2026-09-23).
    - Railway: the staging environment mirrors production with the same admin logins. Set its
      `PUBLIC_ORIGIN=https://staging.<domain>` with skipDeploys BEFORE anything that deploys.
    - `node $C/railway-domain.mjs --project <p> --environment <staging> --service <s> --domain staging.<domain> --zone <domain> --apply --delete-service-domain`
      (a `*.up.railway.app` staging host bypasses Cloudflare and its noindex rule).
    - `node $C/staging-noindex.mjs --zone <domain> --apply` adds `X-Robots-Tag: noindex, nofollow`
      on the staging host. Not robots.txt: that is account-wide, and a Disallow stops Google from
      ever seeing the noindex.
    - On staging set the Open Graph / AEO `siteUrl` to the staging host and `emitCanonical` off
      (og:url otherwise still points at production), and guard every tag script with
      `if (/^staging\./.test(location.hostname)) return` (a `client.com$` host test passes on
      staging and burns GHL pool numbers). Prove it rendered, not from raw HTML.
    - Move the BugHerd link to staging only after every pin is resolved (pins are lost on a URL switch).
12. **Verify from outside.**
    `node $C/verify-launch.mjs --canonical https://www.<domain> --sitemap <out>/sitemap.xml > verify.log`
    Must end `FAIL  none`. Then a real browser pass: forms submit, `tel:` links, embeds, the admin.
13. **Close.** `node $C/mint-token.mjs --revoke <token id>`, delete the scratchpad copy, write the
    run file with every id you touched (zone, rulesets, routes, Railway domains).

## Conditionals

- **If the zone is still pending**, then nothing answers at the edge (`--resolve` gets 409 or a
  TLS failure). Verify Workers through their workers.dev preview (`deploy-worker.mjs --preview`).
  A zone scan can be stale: compare it against DoH before the switch.
- **If a new subdomain answers NXDOMAIN on this workstation** (the VPN caches it; flushdns does not
  help), then `curl --resolve host:443:<ip from node $C/doh.mjs host A>` or run Node with
  `DOH_ZONES=<domain> node -r $C/doh-lookup.cjs script.mjs`. Start a new process after proxying.
  An unclaimed staging `/admin` setup is open to anyone: claim it through the custom host at once.
- **If the Redirect Rules phase answers 403** (brandklout.ai, every token minted from the
  account-owned one), then make the canonical rule in the dashboard with the expression the dry run
  prints. Stop after two tries. Page Rules refuse account-owned tokens outright (1011).
- **If a certificate reads ISSUE_FAILED**, then check the TXT and any WAF or geo rule: it must exempt
  `/.well-known/acme-challenge/`. `railway-domain.mjs` asks for one retry; it never retries alone.
- **If the old DNS lives on another Cloudflare account** (IFA's agency), then the import scan cannot
  read it and copies proxy IPs as origins. Build the zone from the DoH snapshot only.
- **If the client's new site is not ready and the old host is failing**, then serve the scanned,
  cleaned mirror: `node $C/pages-mirror.mjs --project <client>-wp --dir <mirror-clean> --domains <domain>,www.<domain> --zone <domain> --apply`
  (API project create; `wrangler pages project create` fails). Check it in a real browser.
- **If mailto links read `[email protected]`**, then that is Cloudflare Email Obfuscation. It is the
  client's call; `zone-hardening.mjs --email-obfuscation off` turns it off. Link checkers must skip `/cdn-cgi/`.
- **If `robots.txt` answers 404** (ifadentistry.com, 2026-09-23), then the zone's managed robots.txt
  is off: turn it on in the dashboard. Never serve robots.txt from a Worker.
- **If the site keeps a Bulk Redirect list** (Dr. Nahlah, `drnahlah_301`, 190 rows), then remember:
  the list does nothing without the account-level rule; the list needs Account Filter Lists and the
  rule Mass URL Redirects permission; `preserve_path_suffix` must be FALSE; the CSV has no header;
  a redirect list cannot appear in an expression (20127); Single Redirects run first (apex hits take
  two hops); quotas are per account (Free: 10,000 URLs, 5 lists, 15 rules). New sites use the Worker
  from scenario 1 instead; the Bulk scripts stay on branch `bk-dr-nahlah` under `cloudflare-launch/`.

## Do / Don't

- Do copy mail records before the nameserver switch, and keep them DNS-only.
- Do attach Railway domains DNS-only, proxy after VALID, and judge a host by its certificate and a
  real request, never by Railway's DNS badge.
- Do set PUBLIC_ORIGIN in the same session as the domain, and prove it with one real login.
- Do add a redirect TO a host only after that host serves.
- Do keep tokens in the scratchpad, scoped to one zone, and revoke them.
- Don't proxy mail, ftp or ssh records.
- Don't route robots.txt through a Worker, or bind a Worker to a live site's `host/*`.
- Don't block staging with robots.txt; use the header.
- Don't un-proxy a VALID custom domain to make Railway's badge green.
- Don't query the rulesets list with `per_page=100` (it returned empty); use 50.

## Tools

In `deliver/process/tools/cloudflare-launch/` (origins in [README.md](./README.md)):

- `cf-api.mjs`: shared REST client; `whoami` verifies a token the right way.
- `mint-token.mjs`: zone-scoped temporary token (presets launch, redirects, pages); `--revoke`.
- `doh.mjs`, `doh-lookup.cjs`: DNS over HTTPS lookups; Node preload for NXDOMAIN-cached names.
- `copy-dns-records.mjs`: live DNS vs zone diff; adds missing records DNS-only.
- `railway-domain.mjs`: Railway custom domain + CNAME/TXT + certificate wait + proxy; deletes staging service domains.
- `canonical-host.mjs`: apex/www 301 with the ACME exemption.
- `zone-hardening.mjs`: SSL strict, Always HTTPS, TLS 1.2, email obfuscation report.
- `build-sitemap-worker.mjs`, `deploy-worker.mjs`: sitemap Worker; any Worker deploy (routes, preview, catch-all, rollback).
- `staging-noindex.mjs`: X-Robots-Tag rule for staging, with proof.
- `pages-mirror.mjs`: Cloudflare Pages stand-in for a dying old site.
- `verify-launch.mjs`: outside-in proof of the whole launch.
- `../instatic-domain-origins/check-origins.mjs`: PUBLIC_ORIGIN gate.
- `../../scenario-1-migration/02-redirect-map/scripts/verify-redirects.mjs`: redirect map proof.

## Outputs

- `deliver/brandklout/<client>/scenario-0-new-site/06-post-launch/output/cloudflare/sitemap.xml`, `sitemap-worker.js` (committed)
- `deliver/brandklout/<client>/docs/dns/DNS-CUTOVER.md`: registrar, zone id, nameservers, records
  copied, decisions, date of the switch
- `deliver/process/tools/instatic-domain-origins/sites.json` entry updated
- A dated run file listing every Cloudflare and Railway object created, and the revoked token id

## Evidence

- bk-ifa-dentistry/2026-09-11-email-dns-check.md, 2026-09-11-cloudflare-conflicts.md, 2026-09-11-ghl-form-and-cutover.md
- bk-ifa-dentistry/2026-09-18-staging-environment.md, 2026-09-18-a2p-policies-gtm-ghl-pool.md
- bk-brandklout-website/2026-09-22-domain-cutover-brandklout-ai.md, 2026-09-22-staging-and-cloudflare.md
- bk-dr-nahlah/2026-08-25-session-13-sitemap-301-map-live-on-cloudflare.md, 2026-08-31-staging-drnahlah-com-a-full-clone-of-production.md
- bk-stone/2026-09-10-domain-cutover-admin-origin-and-sang.md, 2026-09-15-301-map-built-and-staging-created.md
- bk-stone-med-spa/2026-09-15-staging-and-sitemap.md
- bk-mason-park-kids/2026-08-31-later-cloudflare-zone-prepped-domain-cutover-blo.md, 2026-09-14-domain-masonparkpediatricdental-live.md
- bk-mason-park/2026-09-17-legacy-redirects-for-bestdentistinkatytx.md

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). Promoted from the unmerged
`cloudflare-launch` module on branch `bk-dr-nahlah` and rewritten 2026-09-23.
