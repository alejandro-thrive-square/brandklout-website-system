# 2026-09-24 — The number pool is not blocked by consent; its swap list is out of date

Asked: "The DNI pool number script seems to be blocked by the cookie consent on the Surgical Arts
and the Med Spa sites."

## Found (no site changes)

- **Surgical Arts production** (one headless Chrome visit, cookies fresh): Termly loads with
  `autoBlock=off`, the pool and `user_session.js` tags are untagged, and the CSP allows them.
  `number_pool.js` runs, `assign-number` returns **201** with `(817) 609-8231`, and the session is
  created. Consent is not in the way.
- The swap does not happen because the 201 body's `forwardingNumber` (the numbers the pool
  replaces) is `(817) 767-4188` and `(817) 918-3666`. The site displays **(817) 674-2061** since
  2026-09-23, which is not in that list.
- **Med spa** (westlaketxmedspa.com): no pool tag at all. It was removed on 2026-09-23 when the
  Surgical Arts pool had been put there by mistake. It needs its own pool URL from GHL.

## Next

- In GHL, add **+1 817-674-2061** to pool `1ULKyOcYiRRAikT9TnhK`'s numbers to swap, then check
  one visit: the `tel:` links should change to the assigned number.
- Med spa: get its own pool script from GHL before adding anything.

## Gotchas

- Each diagnostic visit claims a real pool number. This run used two.
- The Cloudflare Web Analytics beacon is refused by the CSP on every page. That is noise, not the pool.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
