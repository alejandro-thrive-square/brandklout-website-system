# 2026-09-25 — The old domains redirect: bestdentistinkatytx.com and pediatricdentistkatytx.com

The client: "I just have access to the old domains that Mason Park had. We need to make sure the old
links redirect to the new ones please".

**Both domains redirect every old link to its page on the new sites.**

## bestdentistinkatytx.com → www.masonparkdental.com

- The nameservers were already on Cloudflare (`ajay`/`ruth`) and the zone was **active**. The
  redirect Worker from 2026-09-17 was live on apex and `www`.
- Its map was stale:
  - the 161 articles went to the home page (the blog was not on production when it was built);
  - `/mpd-*` went to the root ad pages, which are forwarders since today.
- The map was rebuilt (`build-redirects.mjs`, landing rows now `/ads-landing-pages/...`) and the
  Worker redeployed. DNS was untouched.
- `verify-redirects.mjs`: 1,373 old URL variants, one 301 each to the right page; 235 destinations
  all 200; `FAIL  none`.

## pediatricdentistkatytx.com → masonparkpediatricdental.com

- Already set up by the kids site's work (2026-09-24), in the same Cloudflare account:
  `pediatricdentistkatytx-redirect` sends each path as-is to the new domain, and
  `masonparkpediatricdental-edge` maps the old WordPress paths.
- Nothing needed changing. `12-legacy-redirects/verify-pediatric-redirects.mjs`: all 172 old paths,
  on both hosts, land on a live kids page (2 hops).

## Verified through

A Cloudflare token minted for 3 hours with `cf-token.mjs` and revoked at the end. Test traffic went
through `doh-preload.cjs`, because this workstation's DNS still returned the old SiteGround IP.

## Gotchas

- **"503, Server: nginx, X-Suspended-Vhost" from bestdentistinkatytx.com is this machine's stale DNS**
  (the VPN), not the redirects. Check with `curl --resolve host:443:<Cloudflare IP>` or the DoH preload.
- The redirect map is built from live 200 checks: re-run `build` and `deploy --apply` after any change
  to the new site's URLs.

## Open, for the client

- **Email on bestdentistinkatytx.com**: MX is still SiteGround, and the zone's DMARC `p=quarantine`
  (with reports to jill@bestdentistinkatytx.com) is now live. Any service that sends as
  `@bestdentistinkatytx.com` and is not in the SPF record may now land in spam.
- The kids chain is 2 hops. It could be 1 if `pediatricdentistkatytx-redirect` applied the edge map
  itself. That belongs to the kids worktree.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
