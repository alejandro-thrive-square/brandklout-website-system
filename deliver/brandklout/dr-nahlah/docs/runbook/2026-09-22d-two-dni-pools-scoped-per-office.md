# 2026-09-22d — Two GoHighLevel number pools, one per office. LIVE, swap proved

Client strategy, from `docs/dni-number.html`: **Alexandria's pool is the global script, on
every page except the Tysons landing pages; the Tysons pool runs on those.** No hand-made
number targeting. Each pool swaps its own number, in the link **and** in the visible text.

| pool | location / pool id | forwards (what it swaps) | pages |
| :--- | :--- | :--- | :--- |
| Alexandria | `2TREkW8S3atQcs063Pqq` / `JwgT5kbiwBqLqoz0SpUl` | (571) 617-7245 | everything except `ads-landing-pages/tysons-*` (88 URLs in the sweep, blog posts included) |
| Tysons Corner | `xJDu1mFoW5jFYTNqmuk7` / `YeoEOlrWx1ugHvOq8qoB` | (703) 448-3312 | the nine `ads-landing-pages/tysons-*` pages |

Both pools answered `isActive: true`, `trackingOption: "All Visitors"`, when called
directly. **This fixes the 22c blocker**: the Alexandria pool already forwards from
(571) 617-7245, the number that went onto the pages in 22c.

## Done

- **embed-origins `1.8.0`**, installed on this instance only
  (`deliver/process/18-instatic-embeds`). A site-script line can now end with
  `&pages=<glob>` / `&except=<glob>` beside `consent=`, matched against the publish context's
  `slug`. 85/85 in `test-embed-origins.mjs` (11 new). The directive documents it.
- **`22-instatic-api-sync/set-site-tags.mjs`** now writes the two scoped pool lines and drops
  every older `number_pool.js` / `user_session.js` line first. Applied, read back, published
  (the draft matched live beforehand, so the publish carried nothing else).
- **`22-instatic-api-sync/check-pool-scope.mjs`** (new): every sitemap URL plus all 18 ads
  pages carries exactly its pool once in `<head>` and never the other one.
  **97 URLs, 9 Tysons, 0 failing.**
- **`dni-proof.mjs --accept`** proves the swap end to end (see gotchas for why it needs the flag):
  - `/` (Alexandria): `(571) 617-7245` -> tracking number, **3 text + 3 `tel:`**; the same
    number held on `/contact` (sticky).
  - `/ads-landing-pages/tysons-dental-implants` (Tysons): `(703) 448-3312` -> tracking
    number, **7 text + 8 `tel:`**.
- Local build mirrors it: `partials/site-scripts.html` takes the pool from
  `build-site.mjs`'s `ghlPool(slug)`, and `ads-tysons-*` gets Tysons. Rebuilt 56/56.
- No per-number custom script existed on the site or in `site.js` to remove. The only earlier
  number work was the 22c retarget of the printed numbers, and that stays: it is what the
  pools swap.

## Gotchas

- **The plugin is ahead of `main` and of the other rollout.** `1.7.0` (consent tagging) is
  only on the unmerged `bk-termly-consent-rollout` branch. This branch took those files from
  it and built `1.8.0` on top. Dr. Nahlah is the only instance on `1.8.0`. **Merge that branch
  before this one, or take ours for the four `18-instatic-embeds` files.** `1.8.0` is a
  superset of `1.7.0`. A site that reinstalls `1.7.0` loses the scoping, and both pools then
  land on every page.
- **Both pools are still consent-held**, `type="text/plain" data-categories="advertising"`,
  as the Termly rollout left them. A visitor who has not accepted advertising cookies sees
  the practice's own numbers and no call is attributed. Left as found; whether call tracking
  should wait for consent is a compliance call for the client or agency, not something to
  quietly undo.
- **A plain `dni-proof.mjs` run now always says "swapped nothing"**, because the tags are
  held. Use `--accept`. On this workstation Termly never runs in Chrome (NordVPN Threat
  Protection), so no banner shows. `--accept` then releases the held tags by hand, as Termly
  does on Accept, and relays `services.leadconnectorhq.com` through Node, CORS preflight
  included. Without the relay every `assign-number` is `TypeError: Failed to fetch`. That is
  the VPN, not GoHighLevel. Direct Node calls to the pool return 201.
- **Each proof run burns one tracking number per pool.** Four runs today. The first run's
  first page sometimes missed the relay; the second page then read from the pool's cache.
  Don't loop it.
- **Ordinary pages swap only Alexandria's number.** Tysons' (703) 448-3312 is in every footer
  and stays static outside the Tysons landing pages, and on those pages Alexandria's printed
  number stays static. That follows the strategy as given. Adding the other pool to a page
  is one glob in `set-site-tags.mjs`.
- `ctx.slug` for the ads pages is `ads-landing-pages/tysons-<campaign>[-suffix]` (the URL
  path). It is not `tysons-corner-…`, which some earlier notes wrote loosely.

## What is next

1. Decide with the client whether call tracking should wait for cookie consent (see above).
2. `(703) 940-5410` (Alexandria, current patients) is in neither pool and never swaps.
   That is probably right for current patients. Confirm.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
