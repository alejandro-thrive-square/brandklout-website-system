# 2026-09-18, later — The logo promoted to PRODUCTION

The same-day staging run is [`2026-09-18-logo-on-staging.md`](./2026-09-18-logo-on-staging.md) and
carries all the reasoning: where the logo came from, how the black ground comes off, why there are
four files, and why the row lockup is 11.5rem. **Read that one first.** This run is the promotion
and the two things that came out of it.

## Done

**Live at <https://westlaketxmedspa.com> — seq 14, 13 pages, 76 media.** Production was seq 13 with
73 media before.

It is **not** a re-push of the staging payload, and that is the point worth remembering:

```bash
unset INSTATIC_BASE_URL                       # .env is production
node .tmp/snapshot-staging.mjs backup-prod-2026-09-18-pre-logo   # seq 13, 13 pages, 73 media
node check-link.mjs $S/link-prod              # "serves westlaketxmedspa.com"
node upload-media.mjs                         # the 3 logo files -> PRODUCTION, NEW urls
cp .tmp/media-map.json .tmp/media-map.production.json
node set-alt.mjs --apply                      # 17 images, 11 updated
node build-import-input.mjs                   # reads production's map
RAILWAY_LINK_DIR=$S/link-prod bash ship.sh    # 0 warnings, 82 autoCreatedClasses
node push-site.mjs --apply --force
node -e "import('../../../../process/22-instatic-api-sync/insta-api.mjs').then(m=>m.publish())"
```

The three assets got **different URLs from staging**, as the staging run predicted:

| File | staging | production |
| :--- | :--- | :--- |
| `logo-row-on-dark.webp` | `I1JyO8NMi2qqIeNsCFq0o-` | `BENKLMTHAaXJuuu-IjK7z-` |
| `logo-row-on-light.webp` | `cBG25eKOwSNx_A5nAEIA8-` | `FFYaeRcKq6k7nmHQJNJ_l-` |
| `logo-stack-on-dark.webp` | `TOKpgofaLlL1of-96AXzs-` | `Q8OxYF2VNJMotEVyzcqkr-` |

The payload was checked for staging ids before shipping — **0 present**, 52 production ones.

`.tmp/media-map.json` and `.tmp/media-map.production.json` are now both production at **76 files**;
`.tmp/media-map.staging.json` stays at staging's 76.

## The one code change: `form-test.mjs` was racing

`form-test.mjs` failed on production — *"the GHL frame never attached"* — **three runs out of
three**. It was not the push. The chain of checks that settled it:

1. The embed converted **byte-identically** to the 2026-09-17 run that passed:
   `ghl-form -> brandklout.embed-origins.embed (772 chars, fit auto from 565px)`, same line in
   `.tmp/push-prod3.log` and `.tmp/push-prod-logo.log`.
2. `curl` reached the vendor form: **200, 131KB**.
3. Headless Chrome loaded the vendor form **directly**: 200, **18 inputs**. So neither the VPN nor
   the vendor was blocking.
4. A probe of `/book` with `networkidle0` + 6s showed the frame **did** attach, alongside a
   `challenges.cloudflare.com/.../turnstile` frame, with `frame-src 'self' https:` in the meta CSP
   and every `privacy_*` consent param on the frame URL.

So the page was fine and the gate was reading too early. It waits for the `<iframe>` **element**
and then reads `pg.frames()` immediately — but puppeteer only lists a frame once the browser has
*navigated* it, and the vendor puts a Turnstile challenge in front of that. The element is in the
DOM the moment the page parses; the frame can be seconds behind.

`form-test.mjs` now polls `pg.frames()` for up to 45s. Three consecutive runs pass: **18 fields,
consent params present, typing sticks.**

> [!IMPORTANT]
> **A gate that answers differently on an unchanged page is worse than no gate.** This one said
> FAIL on a working booking form, and the only reason it did not cost an afternoon of rolling the
> logo back is that the embed's conversion output was identical to the run before it. Check the
> conversion line before believing an embed gate.

## Gates on production

| Gate | Result |
| :--- | :--- |
| `verify-live.mjs` | FAIL none — 13 routes, 99 URLs, 242 asset refs, **13/13 distinct titles** |
| `css-parity.mjs` | FAIL none — local 1184 rules, live 1211 |
| `compare-live.mjs` | **7 findings, identical to staging** — 4 trap-30 `container-large` margins on /treatments and /botox, 2 the GHL embed div on /book, 1 the `is-*` index shift that embed causes |
| `.tmp/logo-swap-check.mjs` | FAIL none — both logos loaded, both on the 640px variant, either side of the flip |
| `drag-test.mjs` | 3/3 — every rail's arrows still move it |
| `form-test.mjs` | FAIL none, after the fix above |

The three logo assets serve 200 at their exact byte sizes (29360 / 22352 / 56794), and the
published `/` carries all four `<img>` tags with their alt text from the media library.

## Gotchas

1. **`node -e` needs FOUR `../` from the workflow directory; a `.mjs` inside `.tmp/` needs FIVE.**
   The publish step silently did nothing the first time for this reason — `ERR_MODULE_NOT_FOUND`
   went to a log while `seq` had already advanced to 14 from the *push*, so the site looked
   published and the homepage had no logo in it. **`seq` advancing is the push, not the publish.
   Check the live HTML.**
2. **`form-test.mjs` was racing the Turnstile challenge** — see above. Do not read `pg.frames()`
   straight after `waitForFunction` on an iframe element.
3. **`drag-test.mjs` takes a local path, not a URL.** Giving it `https://…` makes it resolve a
   directory called `https:` and report "no index.html under …". It is a local gate; run it
   against `../final-site`.
4. **`.tmp/logo-swap-check.mjs` needs the base passed or exported.** `unset INSTATIC_BASE_URL` in
   the same command leaves it with nothing and it exits rather than guessing.
5. `set-alt.mjs` updated **11** images on production against staging's 2 — production's library had
   never had the newer alt text, only staging did. Harmless, but it means the two libraries had
   drifted before this run.

## Next

Unchanged from the staging run, minus the promotion:

1. **Ask the practice for the vector original** and their own horizontal lockup. This is a raster
   of a mark with a glow, and the row lockup is our arrangement of their art. Jessica's Asana task
   `1218567330165026` ("Details sent to Diana", due 2026-09-22) is where it would come from.
2. **The green.** The logo's lime is `#aaf011`; the site's brand green is `#8fbc46`, from a board
   that predates the rename to Westlake Medical Aesthetics. Genuinely different greens, and the
   palette was not changed. Worth asking whether it should follow the logo.
3. Everything still open from 2026-09-17: the legal pages' review, the legal entity name and a
   contact email, the Cherry link, the "Dr. Stone injects" contradiction, the two fixes the client
   must make inside GHL (the consent text names **Stone Surgical PLLC**, and the form's
   Privacy/Terms links point at `example.com`), and submitting the sitemap in Search Console.
