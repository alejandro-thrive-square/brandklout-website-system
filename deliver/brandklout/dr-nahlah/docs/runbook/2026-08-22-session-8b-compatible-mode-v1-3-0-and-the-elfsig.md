## DONE 2026-08-22 (session 8b): compatible mode — v1.3.0, and the Elfsight finding

**The client pasted two embeds onto the home page and one half-worked, which is exactly the failure v1.2.0 could not prevent.** Embed 1 (the LeadConnector review widget: vendor script + iframe) worked at 884px. Embed 2 (an Elfsight Google Reviews widget) loaded `elfsightcdn.com/platform.js`, then called `core.service.elfsight.com/p/boot/` and was refused — an API host that appears NOWHERE in the page markup, so no amount of deriving from the page could ever have found it. Rendered 0px, one console line, nothing else.

Their requirement, verbatim: *"I just want to have the ability to embed the iframe without any problem or blocking."*

**v1.3.0 adds `embedPolicy`, default `compatible`: a page that CONTAINS an Embed block may load anything over https.** Pages with no embed are byte-for-byte untouched — on this site that is 33 of 35.

| Directive | On a page with an embed |
|---|---|
| `script-src` | `'self' https: 'unsafe-inline' 'unsafe-eval'` |
| `frame-src` | `'self' https:` |
| `connect-src` | `'self' https: wss:` |
| `style-src` | `'self' https: 'unsafe-inline'` |
| `font-src` | `'self' https: data:` |
| `img-src` / `media-src` | `'self' https: data: blob:` |

**Hashes are dropped in this mode on purpose:** a browser ignores `'unsafe-inline'` if ANY hash is present in `script-src`, so keeping them would refuse the pasted inline scripts this mode exists to allow. The host's importmap then runs under `'unsafe-inline'` like everything else. `'unsafe-eval'` is granted because widget bundles use `new Function`.

`embedPolicy: strict` = v1.2.0 (derive from markup, hash inline scripts). `strict` + `autoTrust: false` = v1.1.0. Both still tested.

**Say the trade out loud when handing this over:** on the pages that carry an embed, the protection against a maliciously *injected* script is `default-src` and nothing more. The protection against a *pasted* one was always the person pasting. That is the same bargain Webflow makes, and it is what was asked for.

54/54 on `test-embed-origins.mjs` (19 new). Installed, `active`, `{"embedPolicy":"compatible","autoTrust":true,"frameOrigins":"https://reputationhub.site"}`. After publishing: **zero CSP refusals on the home page**, Elfsight 0px → 329px.

### The Elfsight widget is still empty, and it is NOT us

329px of empty root (`<div class="es-embed-root …"><span></span></div>`). Before blaming the platform again, `scratchpad/probe-elfsight-bare.mjs` serves the SAME snippet from localhost with **no CSP at all**: platform.js 200, boot 200, the google-reviews bundle 200, `service-reviews-ultimate.elfsight.com` sources and reviews 200, Google icons 200 — and it renders the same empty root. **Identical behaviour with no policy in the way, so CSP, Instatic and this plugin are all exonerated.**

Two things to tell the client:
1. **The app id belongs to another client.** The snippet's own comment reads `Elfsight Google Reviews | Marvel Dental Emegency` and the app is `5b4f0a1d-1329-4668-b2c8-2054900227c5`. Dr. Nahlah needs her own Elfsight app.
2. **Headless is not proof for a human visitor.** Both runs were headless Chrome, where Elfsight's own lazy/visibility logic may not complete (cf. the background-tab trap). Open the page in a normal browser before concluding the widget is broken.

### The home page's review section was replaced, and the cards are gone again

The embeds were placed where `.rv-wall` and `.rv-live` used to be. `.rv-live` is gone (so `site.js`'s own upgrade path no longer runs), the six `.rv-card` fallbacks are gone, and **home is back to 1385 words from 1741** — the same 356 words `restore-review-wall.mjs` put back earlier this session. Also note `reputationhub.site` now has script rights on that page, reversing the deliberate frame-src-only choice from `eee062a`; it is trusted because the pasted snippet included the vendor's `<script>` tag.

None of that is broken, but none of it was decided either. `node ../15-instatic-api-sync/restore-review-wall.mjs --apply` puts the cards back above whichever widget stays.
