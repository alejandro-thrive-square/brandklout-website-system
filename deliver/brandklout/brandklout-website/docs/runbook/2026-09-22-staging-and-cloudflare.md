## 2026-09-22: staging.brandklout.ai stood up, the zone hardened, and the site given an SEO layer

Second run of the day; the [domain cutover](./2026-09-22-domain-cutover-brandklout-ai.md) came
first and this builds on it. **Production's published pages did not change in this run.**

### Done

#### Staging — a second Instatic instance

Followed [`deliver/process/21-instatic-staging-clone`](../../../../process/21-instatic-staging-clone/21-instatic-staging-clone.md),
brought onto this branch from `bk-ifa-dentistry` (it is not on `main`). Fourth run of that module,
and the first **one-shot** one since Mason Park.

- **Environment** `staging` (`f28a1ce0-3f0f-4254-b019-bf878c74b7bf`) duplicated from `production`
  in project `Brandklout`, `skipInitialDeploys`.
- **`PUBLIC_ORIGIN` = `https://staging.brandklout.ai` alone**, upserted with `skipDeploys: true`
  *before* anything could deploy. A duplicate copies production's list verbatim, which is the
  403-on-login trap from module 20.
- **Volume** `ac20baa7-045b-4557-848e-cbe14720e0d9` at `/app/storage`. A duplicated environment
  gets none, and without one the whole instance is lost on the next deploy.
- **Custom domain** `staging.brandklout.ai` (`228c71cb-81e7-4d43-8b87-cc7f119e5915`). The
  Cloudflare CNAME was created **DNS-only** alongside the `_railway-verify.staging` TXT; the
  certificate was already `VALID` on the first poll, and the CNAME was then flipped to proxied.
- **The service domain Railway minted, `brandklout-staging.up.railway.app`, was DELETED.** It
  bypasses Cloudflare, so no edge rule could ever de-index it. It now answers 404. Staging has
  exactly one door.
- **Admin claimed immediately** (`POST /setup` 201) with the same `INSTATIC_EMAIL` /
  `INSTATIC_PASSWORD` as production, so one login works on both. Until it is claimed, `/setup` is
  open to anyone who finds the host.
- **Kept out of Google** — Cloudflare response-header transform rule
  (ruleset `1d696d05809041c386b3f328ab0265fb`), `(http.host eq "staging.brandklout.ai")` sets
  `X-Robots-Tag: noindex, nofollow`. `robots.txt` still allows the crawl on purpose: Google has to
  fetch the page to read `noindex`, and it is Cloudflare's **account-wide managed** file anyway —
  editing it would de-index every other client.
- **Seeded one-shot**, 34.6 MB with media (under the ~95 MB Railway edge wall, so no chunking):

  | Step | Result |
  | :--- | :--- |
  | `clone-site.mjs --strategy replace --media` | 5 tables, 36 rows, 42 media, 3.9 s |
  | `clone-plugins.mjs` | `brandklout.embed-origins` v1.5.1 + 5 settings — 1 of 1 |
  | `publish-rows.mjs --table 7MSc_TW0bEkr46Rntb9e_` | 3 of 3 (the Legal Pages collection) |
  | publish | 30 pages |

- **Registered** in [`20-instatic-domain-origins/sites.json`](../../../../process/20-instatic-domain-origins/sites.json)
  as `brandklout-website-staging`.

**Gates** — all green:

- `check-origins.mjs --all` — exit 0, every host `OK`, zero traps, across all four entries.
- `check-noindex.mjs` — exit 0: staging `noindex, nofollow`, production untouched.
- `verify-staging-clean.mjs --no-analytics` — exit 0 over `/`, `/solutions`, `/book`.
- `diff-sites.mjs` — 30 pages, **29 "differs: images", and every one of them is the same single
  file**. See below; it is not a clone defect.

#### The only page difference is an unpublished logo on PRODUCTION

`diff-sites.mjs` flagged 29 of 30 pages on `images`. Comparing by basename rather than by storage
path, every image matches **except one**: production serves
`IRnZUHyHfX3_bIIzkQF9q-BKFavIcon.jpg` and staging serves
`-2EmE9HA1dN45qHrggb4I-ChatGPT_Image_Sep_22__2026__11_35_41_AM.png`.

That is the **NavBar component logo**. Its row is `status: draft`, `updatedAt 2026-09-22T02:37Z`,
and production last published at `02:07Z` — thirty minutes earlier. So somebody swapped the logo in
the admin and has not published it. The clone moves the **draft**, staging published it, and
staging is therefore showing production's pending change. The clone is faithful; production is the
one holding unreleased work (`draftMatchesPublished: false`).

**This matters for the next production publish**: whoever presses it ships that logo too.

#### Cloudflare — the zone audit

| Setting | Was | Now |
| :--- | :--- | :--- |
| SSL/TLS mode | `full` | **`strict`** — `full` accepts any certificate from the origin, including a forged one |
| Always Use HTTPS | `off` | **`on`** — `http://brandklout.ai/` now 301s to https |
| Minimum TLS version | `1.0` | **`1.2`** |

Verified after each change that all three hosts still answer 200. The zone is Free plan, `active`,
account `BrandKlout` `45ec80048aabfb983a20f415546f62c7`, zone `d6a3d655d42a9726c91427ae1219ff81`.

DNS is now 6 records: three proxied CNAMEs (apex, `www`, `staging`) and their three
`_railway-verify` TXTs. No other records exist — see Next on what that means for email.

#### An SEO layer, for the first time

Production ran **one** plugin — `embed-origins`. No Open Graph, no AEO Schema. Every page therefore
emitted no canonical, no `og:*`, no `twitter:*` and no JSON-LD, and `/sitemap.xml` 404s. New
workflow [`16-instatic-plugins`](../../workflows/16-instatic-plugins/16-instatic-plugins.md)
vendors both plugins from `bk-dr-nahlah`, installs them, and carries the Brandklout facts
(address, telephone and YouTube channel read off the site's own footer).

- **Installed and configured on BOTH instances.** Staging is **published** and now emits 7 `og:*`,
  4 `twitter:*` and a JSON-LD `@graph`.
- **Production is configured but NOT published** — see Next. The settings are inert until a publish.

- **Commit** `1914236c` on `bk-brandklout-website` — process 21 brought onto this branch, the new
  `16-instatic-plugins` workflow, `sites.json`, `PROCESS_INDEX.md`, the module 21 directive and
  these runbooks. Railway and Cloudflare state is outside every repo, by design.

### Next

1. **Publish production to turn the SEO tags on** — and know that the same publish ships the
   pending NavBar logo above. That is a decision for Alejandro or Sang, not a gate.
2. **`www.brandklout.ai` does not redirect.** Both hosts serve the site. The canonical tag now
   points every page at the apex, which resolves it for search engines, but a 301 is better. The
   API refuses it (see Gotchas) — add it by hand: Cloudflare → Rules → Redirect Rules →
   `(http.host eq "www.brandklout.ai" and not starts_with(http.request.uri.path, "/.well-known/acme-challenge/"))`
   → dynamic `concat("https://brandklout.ai", http.request.uri.path)`, 301, preserve query.
   **Keep the ACME exemption** or `www`'s certificate renewal is redirected away from its challenge.
3. **Nothing measures this site.** No GTM, no GA4, no call tracking, on any page — which is why the
   leak gate needs `--no-analytics` here. An agency selling growth has no analytics on its own site.
4. **No `sitemap.xml`.** Instatic does not generate one. The other clients solve this with a
   Cloudflare Worker (`19-cloudflare-launch`, on `bk-dr-nahlah`, not merged to `main`).
5. **`brandklout.ai` has no MX, SPF or DMARC**, so anyone can spoof mail from it. Alejandro's call
   on 2026-09-22 was to leave DNS alone for now; this is the record that it is a known gap, not an
   oversight.
6. **`defaultImage` is the favicon.** Supply a real 1200x630 share card for the home page.
7. **`brandclout.ai`** — a second zone in the account, `active`, that resolves nowhere. Either point
   it at brandklout.ai or remove it; an active zone serving nothing is a loose end.
8. FormSubmit is still unactivated — unchanged from this morning's run.

### Gotchas

- **`og:url` is the leak that survives `emitCanonical: false`.** Turning the canonical off left
  every staging page emitting `og:url -> https://brandklout.ai/`, on a host served `noindex` —
  the one pairing Google can resolve against production. `check-noindex.mjs` said clean;
  `verify-staging-clean.mjs` failed all three paths. The fix is `siteUrl` = the staging host, which
  moves `og:url`, `og:image` and every AEO `@id` onto staging. The module doc said the opposite
  and has been corrected.
- **A site with no analytics FAILS the leak gate, correctly.** `production still loads its tags
  (NONE)` cannot be told apart from "someone deleted the tags out of a shared asset". The gate now
  takes `--no-analytics` as an explicit assertion — it prints `n/a`, says nothing is measuring the
  site, and fails loudly if production turns out to load tags after all. It is not a mute button.
- **`clone-plugins.mjs` reporting `1 of 1` does not mean the SEO layer is intact.** It means the
  source had one plugin. Plugin-count parity is not correctness — look at what production actually
  emits first.
- **Cloudflare refuses the `http_request_dynamic_redirect` phase to account-owned tokens.**
  `403 {"message":"request is not authorized"}` on GET *and* PUT, with the shared token, with a
  zone-scoped token carrying Zone Transform Rules Write + Config Settings Write + Page Rules Write,
  and with that token widened to account-level Transform Rules Write. Page Rules say it outright:
  `1011 Page Rules endpoint does not support account owned tokens`. Redirect rules are a dashboard
  job on this account. Response-header transforms are **not** affected — the noindex rule went in
  over the API fine.
- **GraphQL `customDomainCreate` takes `CustomDomainCreateInput`, not `CustomDomainCreate`.**
- **The verification TXT is not in `status.dnsRecords`** — that array holds only the traffic CNAME.
  Ask for `status { verificationDnsHost verificationToken }`.
- **`/zones/<id>/rulesets?per_page=100` returned an empty list** while `per_page=50` returned all
  four. Same family as the module's documented `10404 No route for that URI` gotcha: the rulesets
  API validates query parameters and fails in ways that read as "nothing is there". Use 50.
- **The Cloudflare token minted for this run was revoked** (`8fc6151be87350a050926da08611a613`) and
  its local copy deleted; the revocation was proven with a 401 from the token itself. The shared
  `CLOUDFLAREAPI` has no DNS or settings permissions — mint scoped, use, revoke.
- **A JSON splice by string offset corrupted `sites.json`** (`}    },`). Parse before writing; the
  origin checker's only symptom was a parse error that read like a bug in the checker.

### Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). IDs, hostnames and ruleset ids only.
No secrets.
