# 2026-09-22 — GoHighLevel dynamic number insertion: already installed, proved it swaps

Asked to "add this DNI script to the site so it can swap the numbers for our GoHighLevel
workflow", against `docs/dni-number.html` (the two LeadConnector tags).

**Nothing needed adding.** Both tags have been on every page since 2026-09-17, in the Embed
Origins plugin's `siteScripts` (`22-instatic-api-sync/set-site-tags.mjs`). What had never been
done is proving the swap actually happens, which is a different question from whether the tag
loads — and the answer turned out to be yes.

## What was already there

Served on every production page, `async`, in the house order behind Sienna and Termly:

```
https://backend.leadconnectorhq.com/appengine/loc/2TREkW8S3atQcs063Pqq/pool/JwgT5kbiwBqLqoz0SpUl/number_pool.js
https://backend.leadconnectorhq.com/appengine/js/user_session.js
```

## Done

No site change. Two things added to the repository:

- **`22-instatic-api-sync/dni-proof.mjs`** — drives real Chrome over CDP, takes the baseline
  from the server's markup, lets the pool answer, and reports every number that changed plus
  the LeadConnector network calls and console. Run it after any change to the phone numbers or
  the site tags.
- **A gate in `04-design/.tmp/site-test.mjs`**: "every phone number is in a shape the GHL
  number pool can swap". **53 pages pass, 0 fail.**

Verified on production, one visitor walking four pages:

| page | swapped |
| :--- | :--- |
| `/` | `(571) 253-7790` -> `(571) 570-9404`, 3 text + 3 `tel:` |
| `/contact` | same number, 3 + 3 |
| `/ads-landing-pages/tysons-corner-dental-implants` | same number, 3 + 3 |
| `/dental-implants` | same number, 3 + 3 |
| `/ads-landing-pages/alexandria-all-on-4` (separate visitor) | 6 text + 7 `tel:` |

The number stays the same across the visit, which is correct sticky DNI.

## Gotchas

- **Clearing cookies between page views BURNS A POOL NUMBER EACH TIME.** The first version of
  `dni-proof.mjs` cleared per page, so the pool treated every view as a new visitor and handed
  out a new tracking number: three different numbers in three runs, and after that
  `assign-number` was refused at the network layer and every later page read as "swapped
  nothing". That is the harness exhausting the inventory, not a broken swap. The script now
  clears once per run and walks the site like a person. **Do not put the per-page clear back.**
- **`TypeError: Failed to fetch` on later pages is `user_session/update_session`, not the
  swap.** The swap on page 2+ comes from the pool's own `localStorage` cache and is unaffected.
  Attribution telemetry only.
- **A baseline taken from the live DOM lies.** On a cached page view the swap lands before any
  wait you can sensibly pick, so the "before" snapshot already holds the swapped number and the
  page reads as inert. Take the baseline from a separate `fetch` of the URL, which is what the
  script now does.
- **The swapper only recognises some formats.** In TEXT: `(NNN) NNN-NNNN`, `NNN-NNN-NNNN`,
  `NNN.NNN.NNNN`, `(NNN)NNN-NNNN`. It matches with `String.includes`, so `1-800-677-0718`
  works because it contains `800-677-0718`. It does **not** see `571 253 7790` (spaces), a
  non-breaking space after the area code, or bare digits in running text. In an `<a href>` a
  contiguous ten-digit run also matches, so `tel:+15712537790` is fine. Anything inside
  `class="noswap"` is skipped on purpose. This is why the site-test gate exists: write a number
  the wrong way and the page silently keeps the practice's own number with nothing failing.
- **Only ONE of the four published numbers is pooled.** `(571) 253-7790` swaps. `(571)
  702-9900`, `(703) 448-3312` and `(703) 940-5410` never do — nothing is wrong on the site,
  they are simply not forwarding numbers in this pool. Adding them is a GoHighLevel-side change
  and needs the client. **See "What is next".**
- **Staging is clean and must stay clean.** `staging.drnahlah.com` serves neither tag (its
  Embed Origins plugin is 1.4.0 and has no `siteScripts`). If staging's plugin is ever
  upgraded, the clone will start claiming real pool numbers. Guard host-conditionally; never
  just delete the tags.

## What is next

1. **In GoHighLevel**: decide whether the other three numbers should be tracked too. Each
   office/number wants its own pool, or the numbers added to this one as forwarding numbers.
   Until then only Tysons' `(571) 253-7790` is attributed.
2. Nothing else. The tags are live, the swap is proved, and the gate will catch a bad format.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
