# Cloudflare Launch toolkit

Scripts for putting a client domain on an Instatic site through Cloudflare, and for the edge work
Instatic cannot do (sitemap, redirects, canonical host, staging noindex). The procedure is
[cloudflare-launch.md](./cloudflare-launch.md); scenario 1 uses `deploy-worker.mjs`,
`copy-dns-records.mjs` and `mint-token.mjs` for its redirect map.

Node 20+; no npm dependencies (`pages-mirror.mjs` calls `npx wrangler@4`). Tokens: `CLOUDFLARE_API_TOKEN`
in the shell (minted, scoped) or `CLOUDFLAREAPI` from the generated `.env`; Railway: the CLI's
`~/.railway/config.json` `user.accessToken`. No script prints a token. Redirect output to a file.

| Script | Purpose | Usage | Origin |
| :--- | :--- | :--- | :--- |
| `cf-api.mjs` | Shared REST client (retry on fresh-token 10000, exact zone match, ruleset helpers); `whoami` verifies via `/accounts/{id}/tokens/verify` | `node cf-api.mjs whoami` | bk-dr-nahlah `cloudflare-launch/cf-api.mjs`, generalized |
| `mint-token.mjs` | Mint a zone-scoped temporary token from the account token; revoke it | `node mint-token.mjs --zone d.com --preset launch --hours 3 > <scratch>/t.json`; `--revoke <id>`; `--list-groups` | manual runs on IFA, Stone, Stone Med Spa, Mason Park, brandklout.ai |
| `doh.mjs` | DNS-over-HTTPS lookup (module + CLI) | `node doh.mjs d.com MX` | DoH pattern from IFA and Mason Park runs |
| `doh-lookup.cjs` | Node preload: resolve chosen zones over DoH (VPN NXDOMAIN cache) | `DOH_ZONES=d.com node -r ./doh-lookup.cjs x.mjs` | bk-stone-med-spa scratch preload (2026-09-15) |
| `copy-dns-records.mjs` | Diff live DNS (DoH + email snapshot) against the zone; add missing records DNS-only | `node copy-dns-records.mjs --zone d.com --snapshot email-dns-d.com.json [--apply]` | manual zone-vs-live checks, Mason Park and IFA |
| `railway-domain.mjs` | Railway custom domain, CNAME + `_railway-verify` TXT, wait for VALID, proxy; delete staging service domains | `node railway-domain.mjs --project … --environment … --service … --domain www.d.com --zone d.com --apply` | 21-instatic-staging-clone procedure + IFA / brandklout.ai runs |
| `canonical-host.mjs` | apex/www 301, path + query kept, ACME exempt, refuses a dead target | `node canonical-host.mjs --zone d.com --to https://www.d.com --apply` | bk-dr-nahlah `deploy-canonical-host.mjs` + bk-ifa-dentistry `docs/dns/set-redirect-rules.mjs` |
| `zone-hardening.mjs` | SSL Full (strict), Always HTTPS, TLS 1.2; email obfuscation report/off; reverts on breakage | `node zone-hardening.mjs --zone d.com --hosts d.com,www.d.com --apply` | manual settings on IFA, Mason Park Kids, brandklout.ai |
| `build-sitemap-worker.mjs` | sitemap.xml from the Instatic pages API (+ crawl for collection entries), every URL 200, and its Worker | `node build-sitemap-worker.mjs --canonical https://www.d.com --out out --crawl` | bk-stone-med-spa `06-cloudflare-sitemap/build-sitemap.mjs` (from 19's `build_cloudflare.mjs`) |
| `deploy-worker.mjs` | Upload any Worker; routes (`--routes` or `--routes-from`), no-Worker exclusions, DNS records, workers.dev preview, catch-all backup/removal, rollback | `node deploy-worker.mjs --zone d.com --script n --file w.js --routes "d.com/sitemap.xml*" --apply` | bk-stone-med-spa `deploy-sitemap.mjs` + bk-stone and bk-mason-park `deploy-redirects.mjs` |
| `staging-noindex.mjs` | `X-Robots-Tag: noindex, nofollow` on staging.<domain>, proves production untouched | `node staging-noindex.mjs --zone d.com --apply` | manual rule on Stone, Stone Med Spa, IFA, brandklout.ai |
| `pages-mirror.mjs` | Cloudflare Pages stand-in for a dying old site (API create, wrangler deploy, domains) | `node pages-mirror.mjs --project c-wp --dir mirror-clean --domains d.com,www.d.com --zone d.com --apply` | bk-mason-park-kids 2026-09-14 |
| `verify-launch.mjs` | Outside-in proof: canonical 301, https, sitemap on both hosts, every loc 200, robots.txt, admin, staging noindex and leaks | `node verify-launch.mjs --canonical https://www.d.com --sitemap out/sitemap.xml` | bk-stone-med-spa `verify-sitemap.mjs` + bk-dr-nahlah `verify-live.mjs` |

## Not carried over from cloudflare-launch

`build_cloudflare.mjs`, `verify_cloudflare.mjs`, `deploy-redirects.mjs`, `verify-live.mjs`,
`lib/config.mjs` and `cloudflare-launch.config.example.json` drive Dr. Nahlah's Bulk Redirect list
and read Dr. Nahlah's inventory files. They stay on branch `bk-dr-nahlah`
(`deliver/process/19-cloudflare-launch/`). New maps use scenario 1's Worker; the Bulk Redirect
gotchas are kept in the directive. The 19 `deploy-canonical-host.mjs` referenced an undefined
`CFG`; `canonical-host.mjs` replaces it. The 19 `deploy-worker.mjs` bound `/sitemap.xml` without a
trailing `*`; `deploy-worker.mjs` here warns on that.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
