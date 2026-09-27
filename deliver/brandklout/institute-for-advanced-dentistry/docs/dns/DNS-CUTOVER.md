# ifadentistry.com — DNS and email cutover

State as of **2026-09-11**, read from public DNS over HTTPS and from the Cloudflare API.

## Where the domain is today

| Item | Value |
| :--- | :--- |
| Registrar | Squarespace Domains. Nameserver changes are made there. Brandklout has access (confirmed 2026-09-11), so the agency is not needed |
| Nameservers | **Switched 2026-09-11 ~21:40Z** to `ajay.ns.cloudflare.com` / `ruth.ns.cloudflare.com` (Brandklout's account, zone `223386e4eda469fb038a4c716bd3f0fe`, active 21:44Z). They were `cullen`/`gracie` on the agency's Cloudflare account. The Squarespace DNS records are inactive now; leave them |
| Web host | **Instatic on Railway**. `www` is a CNAME to `wshw0478.up.railway.app` (proxied); the apex is a CNAME to `133e393p.up.railway.app` and 301s to `www`. Each has a `_railway-verify` TXT record. It was WordPress on WordKeeper (LiteSpeed) |
| Zone fixes after the import | The imported `www` A/AAAA records (agency edge IPs, Error 1000) were replaced. Always Use HTTPS is on. `_domainconnect` is DNS-only. The Google Workspace verification CNAME `52sz77enrdng` was restored from the Squarespace DNS. See `../runbook/2026-09-11-cloudflare-conflicts.md` |
| Subdomains | Only `www`. Certificate transparency and a probe of about 100 common names found nothing else, and there is no wildcard record |

## Email is not on the web host

Nothing email-related lives on the WordPress host, so moving the site does not move the mailboxes.

| Service | Records |
| :--- | :--- |
| **Google Workspace** (mailboxes) | 5 MX records (`aspmx.l.google.com` at 1; `alt1`, `alt2` at 5; `alt3`, `alt4` at 10), DKIM at `google._domainkey`, SPF `include:_spf.google.com` |
| **Brevo** (marketing email) | `brevo-code:` TXT on the apex, DKIM at `mail._domainkey`, and DMARC reports go to `rua@dmarc.brevo.com` |
| **Google Search Console** | `google-site-verification=` TXT on the apex |
| **WordPress host** | Only `a:bill.wordkeeper.net` in SPF, which lets the WP server send contact-form mail |

## The one way email breaks

Email only breaks if the nameservers are switched to `ajay`/`ruth` while the new zone is missing
these records. The agency's zone is on another Cloudflare account, so it cannot be copied across,
and the dashboard's import scan usually misses DKIM selectors. On 2026-09-11 the new zone answered
nothing.

**Fix:** import [`ifadentistry.com-email.zone`](./ifadentistry.com-email.zone) into the new zone
(DNS → Records → Import and Export → Import). The file holds every MX, TXT, DMARC and DKIM record
copied byte for byte from live DNS. Then compare the zone against the table above.

## Cutover order

1. Import the email zone file into the new zone and check it in the dashboard.
2. **Do not switch nameservers yet.** The web records the import scan picks up will be Cloudflare
   proxy IPs (`104.21.41.196`, `172.67.166.214`), which do not work as an origin. Either ask
   WordKeeper or the agency for the real origin IP, or wait until the Instatic site is ready and
   point `@` and `www` at Instatic.
3. At Squarespace, change the nameservers to `ajay` / `ruth`. Leave the agency's Cloudflare zone
   alone until propagation finishes.
4. Send a test email in and out of a Workspace mailbox, and send one Brevo test.
5. After the WordPress site is retired, drop `a:bill.wordkeeper.net` from SPF, along with the
   `mx` and `a` mechanisms, which add nothing. Add the Instatic form sender if it signs as this
   domain.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). The zone file holds only public DNS
data.
