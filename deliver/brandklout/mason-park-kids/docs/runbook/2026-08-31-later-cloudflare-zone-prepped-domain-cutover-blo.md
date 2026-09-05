## 2026-08-31 (later) - CLOUDFLARE ZONE PREPPED. Domain cutover BLOCKED on a registrar transfer.

Goal: `pediatricdentistkatytx.com` -> Cloudflare -> Railway. The Cloudflare zone is now correct and
staged, but **nothing can flip yet** - see the blocker below.

### THE BLOCKER: the domain is in `pendingTransfer` at the .com registry

Verisign RDAP (`https://rdap.verisign.com/com/v1/domain/pediatricdentistkatytx.com`) reports
status `pending transfer`, last changed **2026-08-31 05:42 UTC**, registrar Tucows (SiteGround's
backend), expiry 2026-11-04. **The registry refuses nameserver changes while this is set.**
It auto-completes ~**2026-09-05 05:42 UTC** if nobody acts. The user did not knowingly start it;
it began ~16h BEFORE the Cloudflare zone was created (21:59 UTC), so it was NOT the Cloudflare
add-site upsell. Treat as a possible account-security issue. Action sits with the user in the
SiteGround Client Area / Tucows transfer-away email.

### Gotcha that cost the most time: NS records in the zone file are NOT delegation

The nameservers had been changed in **Site Tools -> DNS Zone Editor**, which writes `NS` records
*inside* SiteGround's zone. Delegation lives at the **registrar** (Client Area -> Domains ->
Name Servers). Symptom: `dig NS` returns the Cloudflare NS (resolvers echo the in-zone records)
while SOA still says `ns1.siteground.net` and the site still resolves to SiteGround's
`34.174.211.179`. Never trust an NS lookup alone - **check RDAP for the registry delegation.**
Those two bogus in-zone NS rows (`ajay`/`ruth.ns.cloudflare.com`) are still in the SiteGround zone
and should be deleted; they create an inconsistent delegation that can intermittently hand
resolvers over to a Cloudflare zone that is not active yet.

### What was fixed in Cloudflare today (via API, zone `05ca6d0daa47593ec9f16404e3b6690d`)

Cloudflare's scan imported 14 of SiteGround's 15 records and proxied everything it could. Both
defaults were wrong and both would have caused damage at cutover:

1. **DKIM was silently dropped.** `CNAME default._domainkey ->
   pediatricdentistkatytx.com.default.dkim.auto.dnssmarthost.net` was missing. Recreated, DNS only.
   Missing DKIM does not bounce mail - it just quietly degrades deliverability, so it would not
   have been noticed until reputation dropped.
2. **Seven A records were Proxied that must be DNS only**: `mail`, `ssh`, `ftp`, `autoconfig`,
   `autodiscover`, apex, `www`. **Cloudflare's proxy carries HTTP/HTTPS only** - proxying `mail`
   kills IMAP/SMTP, proxying `ssh` kills the SSH access this repo's own `.env` key uses. All set
   to DNS only. Apex/`www` may go back to Proxied AFTER Railway issues its cert, and only with
   **SSL/TLS = Full (strict)**; Flexible causes an infinite redirect loop.

Verified, not assumed: all 8 A records, 3 MX (with priorities), 3 TXT (SPF/DMARC/ahrefs) and the
new DKIM CNAME now byte-match SiteGround's live zone. DNSSEC is off at the registry (no DS), so
the usual "disable DNSSEC first" step is already satisfied.

Backups before the change: `cf-backup-before.json` + `cf-backup-before.bind.txt` in this session's
scratchpad. Token `MASONPARKIDSCLOUDFLARE` in `.env` has Edit-zone-DNS on this zone
(`CLOUDFLAREAPI` is read-only and cannot touch dns_records).

### The cutover plan from here - two phases, no downtime window

Cloudflare holds the SiteGround A records, so activating the zone changes nothing visible. That
is deliberate:
1. Clear the transfer, then set NS at the **registrar** to `ajay`/`ruth.ns.cloudflare.com`.
   Site keeps serving from SiteGround; mail unaffected. Confirm zone goes `pending` -> `active`.
2. **Only then** add the domain in Railway (project **Mason Park Kids**), point apex + `www` at
   Railway's CNAME target, and set `PUBLIC_ORIGIN` per `deliver/process/20-instatic-domain-origins`
   - skipping that is what 403s the `/admin` login.

Mail stays on SiteGround permanently. Only web traffic moves.

### Gotchas

- **Windows Python cannot open Git Bash `/c/...` paths.** `ls` succeeds and `json.load` throws
  FileNotFoundError on the same string. Pass `C:/Users/...` to Python, `/c/Users/...` to the shell.
- **`/user/tokens/verify` returns "Invalid API Token" for account-owned (`cfat_`) tokens** even
  when they work fine. Verify a token by hitting the zone endpoint instead, not the user endpoint.
- Comparing MX between the CF API and a DoH resolver gives a false mismatch: CF returns
  `priority` as a separate field, DoH inlines it into the answer. Join them before diffing.
