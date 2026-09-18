## 2026-09-18: A2P policies rewritten, Google Tag Manager and the GoHighLevel number pool live

### Done

- **`/privacy-policy` and `/terms-of-service` now carry the client's own A2P 10DLC copy.** The
  source documents arrived as
  `workflows/00-client-delivery-initialization/.tmp/IFA-Dentistry-{Privacy-Policy,Terms-of-Service}.md`
  and are committed there as provenance. They are transcribed, not rewritten, into
  `workflows/21-instatic-upload/legal/*.md`: Word-style `# N Heading` became `## `, `## ` became
  `### `, `•  ` became `- `, the two one-row tables became a paragraph and two address blocks, and
  the phone / email / website lines became links. No wording changed.
- `legal/push-legal.mjs` regenerates the copy container's children from the Markdown, drops the
  orphaned nodes and leaves header, footer and script placeholders alone. Dry run writes
  `legal/.tmp/<slug>.preview.html` so the copy can be proofread before anything is written.
  Privacy 313 nodes → 186, Terms 86 → 140.
- **The Terms page was titled "Our Commitment To Your Privacy Policy"** — the privacy page's title,
  cloned onto it by WordPress. Both `title` and `seoTitle`/`seoDescription` are now correct
  (`Privacy Policy | Institute for Advanced Dentistry`, `Terms of Service | …`).
- **"Terms of Service" added to the footer legal nav on all 59 pages**, between Privacy Policy and
  Accessibility Statement. There is no shared footer component here — every page carries its own —
  so the script finds the `ul` that holds both existing legal links and inserts into it.
- **Google Tag Manager `GTM-5XR78DN7` and the GoHighLevel number pool are live on every page**, as
  the code asset `src/scripts/000-brandklout-tags.js` (source: `tags/site-tags.js`, written by
  `tags/push-tags.mjs`). It carries the vendor's own GTM bootstrap, the `<noscript>` iframe, and
  `number_pool.js` + `user_session.js` in that order with `async = false`.
- Gated to `*.ifadentistry.com`, exactly like the WordPress Google tag in `runtime.js`: the Railway
  review link must not report into the practice's analytics or burn pool numbers.
- Gate: `node tags/verify-tags.mjs https://www.ifadentistry.com` — **all checks passed**, asset on
  59/59 routes, `gtm.start` in `dataLayer`, gtm.js 200, both GHL scripts 200, `<noscript>` first in
  `<body>`, no CSP refusals. The pool is swapping: the header CTA served `(520) 462-8014` and
  `(520) 462-6742` on two runs against a page whose HTML says `tel:+16022422256`.
- Published at 2026-09-18T17:20:14Z. `draftMatchesPublished` was true before the run, so nothing
  unrelated shipped.

### Open

- **There are now two GTM containers on every page.** `GTM-K8N3JK3Q` (the outgoing agency's) and
  Google Site Kit's `GT-NBJ3HCBV` / `G-STF00595` are replayed from the WordPress clone by
  `site.js`; `GTM-5XR78DN7` is ours. If both containers hold the same GA4 tag, sessions are counted
  twice. Decide which container owns measurement and blank the other the way UserWay was blanked.
- **The number pool swaps on every visit, not only on paid traffic**, so organic visitors see a
  520 (Tucson) number on a Peoria/Phoenix practice. That is how the pool is configured in
  GoHighLevel, not something the site controls — confirm it is intended.
- **Cloudflare email obfuscation hides `info@ifadentistry.com` from anything without JavaScript.**
  It decodes correctly in a browser (checked), but a scripted A2P vetting crawler sees
  `[email protected]`. Turning off Scrape Shield → Email Address Obfuscation for the zone is the fix
  if vetting complains; it is a spam trade-off, so it is the client's call.
- ~~The legal entity is not named in the policies.~~ **Done the same day, on request.** Both pages
  now open "Institute for Advanced Dentistry PLLC, also referred to as Institute for Advanced
  Dentistry or IFA Dentistry", the Contact Us line names the PLLC, and the PLLC heads both address
  blocks. The name came from the live GoHighLevel form's consent line, which is the only place it
  is written down here — A2P vetting compares the registered legal name against the policy pages.
  Republished 2026-09-18T17:49:41Z.
- **The SMS consent wording on the GHL form contradicts itself and is the biggest A2P risk here.**
  It reads: "I consent to receive **non-marketing** text messages from Institute for Advanced
  Dentistry PLLC, such as **special offers, discounts, newsletters**, and updates about services."
  Special offers and discounts are marketing. Carriers reject campaigns whose opt-in language does
  not match the campaign type. It lives in GoHighLevel (form `cxtQ5q29TfUr3cYlMmDB`), not on this
  site, so it is fixed there — either drop "non-marketing" or drop the promotional examples.
- The form's own footer already links Privacy Policy and Terms of Service, and the consent
  checkbox exists — both checked live on `/contact-us`.

### Gotchas

- **`mode: 'incremental'` needs `baseSeqs`, one entry per changed page.** An empty map means "based
  on seq 0" and the whole write comes back `409 Another admin saved a newer version` listing every
  page as a conflict — which reads like someone else is editing, and is not. `push-wp.mjs` gets
  away with `baseSeqs: {}` only because it writes in `replace` mode.
- **A new code asset is served as a MODULE, not a classic script.** `brandklout-consent-bridge.js`
  lands in `/classic/`, `000-brandklout-tags.js` in `/entries/` with `type="module"`, so it runs
  deferred rather than at the top of `<head>`. GTM still boots and reports; it just starts after the
  document parses. Do not assume a path prefix buys head position.
- **googletagmanager.com is filtered inside Chrome on this workstation.** Every response — gtm.js,
  gtag/js, even `ns.html` — comes back 200 with exactly 9327 bytes, and `window.google_tag_manager`
  stays empty; Node fetches the real 352 KB container from the same machine. That is NordVPN Threat
  Protection, not the site. `verify-tags.mjs` detects the stub by body size and proves the container
  through Node instead of failing.
- **An `<li>` whose text carries a link or bold needs a `<span>` wrapper, not a `<div>`.** A block
  wrapper inside `li` kills the marker and the list spacing. `site.css` re-enables bullets over
  Instatic's reset, and they render `disc` — checked.
- **A GHL form iframe can be read under puppeteer on the deployed domain.** Turnstile hides it from
  automation on localhost and from previews, but `https://www.ifadentistry.com/contact-us` renders
  it fully in headless Chrome after ~6s — which is how the consent wording above was found. Do this
  check on any client whose A2P registration is pending; the opt-in text is the thing carriers read.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
