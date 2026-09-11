# 2026-09-11 — Email safety check before the Instatic migration

**Ask:** the client pays the outgoing agency a lot for WordPress hosting. The site moves to Instatic
(cloned first, then enhanced). The domain was added to Brandklout's Cloudflare. Check whether the
move can happen without breaking email.

## Done

- Read live DNS over HTTPS. Mail is **Google Workspace** (MX plus `google._domainkey`), and
  marketing mail is **Brevo** (`mail._domainkey`, `brevo-code`, DMARC rua). None of it is on the
  WordPress host. The host appears only as `a:bill.wordkeeper.net` in SPF.
- Found that the live nameservers `cullen`/`gracie` are **another Cloudflare account**, the agency's.
  Brandklout's new zone is `initializing` on `ajay`/`ruth`, and the registrar is Squarespace.
- Found that no subdomain other than `www` exists (crt.sh, certspotter, about 100 name probes, and a
  wildcard probe).
- Wrote [`../dns/DNS-CUTOVER.md`](../dns/DNS-CUTOVER.md) and generated
  [`../dns/ifadentistry.com-email.zone`](../dns/ifadentistry.com-email.zone), a BIND file of every
  email and verification record, ready for the Cloudflare dashboard import.

## Next

- Import the zone file into the new zone and confirm it in the dashboard. The API cannot do or
  verify this step; see Gotchas.
- Do not switch the nameservers at Squarespace until the web records point somewhere real: either
  the WordKeeper origin IP from the agency, or the finished Instatic site.
- Confirm who holds the Squarespace registrar login.

## Gotchas

- The shared `CLOUDFLAREAPI` token has **account** permissions only. `/zones` lists the zone, but
  `dns_records` and `email/routing` answer `10000 Authentication error`. To automate this, the
  token needs Zone → DNS → Edit.
- `nslookup` times out on UDP and on `-vc` TCP here, so use DoH from Node. You therefore cannot ask
  `ajay`/`ruth` directly what the pending zone holds.
- Cloudflare's import scan cannot read a zone on another Cloudflare account. The A records it finds
  are Cloudflare proxy IPs, not the origin, and it tends to miss DKIM selectors.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
