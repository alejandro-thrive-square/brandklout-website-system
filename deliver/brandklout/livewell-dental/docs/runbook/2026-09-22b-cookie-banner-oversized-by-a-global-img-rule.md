# 2026-09-22 — Cookie banner oversized by a global `img` rule

Follow-up to [`2026-09-22-termly-cookie-consent.md`](./2026-09-22-termly-cookie-consent.md), which put
the banner on this site in the first place. Nothing was wrong with the consent configuration — this
was the site's own stylesheet reaching into Termly's markup.

## State

**Fixed and verified live.** The banner is 1408x158 with a 76x20 Termly logo, and the Cookie
Preferences control still opens Termly's modal on click. Pinned at `BrandkloutConsentPreferences`
**1.3.0**.

## What the client saw

A **511px-tall white slab** sitting over the hero, with a giant grey "Termly" wordmark stretched
across it. They sent a screenshot. It looked like a broken banner; it was a broken image.

## Why it happened

Termly renders its banner into `#termly-code-snippet-support` **in the page DOM, not in an iframe**.
There is no boundary, so every global rule in the site's own stylesheet applies to Termly's elements.

Livewell's stylesheet (`livewelldentalva.shared.*.css`) carries:

```css
img { width: 100%; max-width: 100%; height: 100%; max-height: 100%; display: inline-block; }
```

Termly's logo is intrinsically 76x20 and Termly sets no width or height on it, so `width:100%` +
`height:100%` inflated it to **1348x355** and the banner grew around it.

Of the **15 live Brandklout sites, Livewell was the only one** carrying the `width`/`height` variant
of that rule. The others set `max-width` only, which is harmless — a 76px image is already under any
container width. That is why this surfaced on one site and nowhere else.

## The fix

`BrandkloutConsentPreferences` **1.3.0** — the registered **header** script, built from
`deliver/process/23-termly-ghl-consent/kit/consent-preferences.js` on the
`bk-termly-consent-rollout` branch of main. At parse time, before the banner exists, it injects:

```css
#termly-code-snippet-support :is(img,svg){width:auto;height:auto}
```

Two deliberate constraints:

- **Only `width` and `height`.** Those are the two properties sites set globally on images, and
  they are the two Termly never sets itself. Anything broader would start overriding Termly's own
  design.
- **No `!important`.** The id selector already outranks a bare `img` rule, so where Termly *does*
  set something, Termly still wins.

## Verified

- Live after publishing: banner **1408x158**, logo **76x20**.
- Cookie Preferences control still opens Termly's modal on click.
- A healthy site (one on the `max-width`-only variant) was checked too and is **byte-for-byte
  unaffected** by 1.3.0.

## Gotchas

- **Termly's banner is not sandboxed.** It lives in your DOM under
  `#termly-code-snippet-support`. Any global `img`, `svg`, `button`, `a` or `*` rule in the site's
  CSS reaches it. If a banner looks wrong on one site and right on the others, look at that site's
  global element rules before touching anything in Termly.
- **Do not "fix" this in the Termly account.** The configuration was correct throughout. The
  symptom is entirely CSS.
- **1.3.0 is the floor here.** Do not roll this site's preferences control back below 1.3.0 — the
  guard goes with it and the slab comes back.
- **Do not re-add a consent hold to the GoHighLevel number pool or `user_session.js`.** The
  client's instruction (2026-09-22) is that the pools run even when consent is not accepted.
  Ahrefs *does* wait for consent here; those two deliberately do not.
- **The Silktide trial block is gone** from this site's head. Termly replaced it. Do not expect to
  find it, and do not restore it.
- **The consent bridge here is 2.3.0, ahead of the kit's 2.2.0.** It was left alone on purpose.
  Do not "sync" it down to the kit version.

## Checks

```bash
node deliver/process/23-termly-ghl-consent/consent-kit.mjs check https://www.livewelldentalva.com --termly-proxy
```

Testing the banner from this workstation still needs the proxy flag — NordVPN answers
`app.termly.io` with a bare 204 in Chrome, so without it the banner never renders at all.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
