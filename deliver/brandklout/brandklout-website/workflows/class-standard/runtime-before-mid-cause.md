# runtime before → mid: 10 "persistent" differences, cause found (not the Framework move)

`migration-gates.mjs diff before mid` (2026-10-06 ~05:05Z): css 0 real at 1440 / 390 / 1920;
runtime FAIL, 10 items on 8 pages. Two kinds:

1. `NEW ERROR console: %c%d font-size:0;color:transparent NaN` (8 pages).
   The message is logged by **Cloudflare Turnstile inside the GHL (LeadConnector) form iframe**
   (`challenges.cloudflare.com/cdn-cgi/challenge-platform/.../turnstile/...`, read from the console
   message's own source URL). It is intermittent on an unchanged site: `book @390` has it in `mid`
   and not in the re-capture, `book @1440` the reverse, and `index` and `ava-dental-launch @1440`
   already have it in `before`. The site's own scripts never log it.

2. `page height` on `customer-stories @390` (7897 → 8987) and
   `story/customer-story-oceanic-future-ready @390` (7595 → 8509), with 2 more visible elements.
   Five captures of the current state agree (mid, mid~r, probe1-3). The `before` capture of these
   two pages was taken with the **GHL form not booted** (three sessions were capturing; three Chrome
   launches had just failed for lack of memory). Proof, on the CURRENT site, same viewport, form
   requests blocked (`leadconnectorhq|msgsndr|challenges.cloudflare`) vs allowed:

   | Page @1440 | form allowed (= mid) | form blocked | `before` |
   | --- | --- | --- | --- |
   | story/customer-story-oceanic-future-ready | 211 visible, 5529px | 209 visible, 5467px | 209, 5467px |
   | customer-stories | 271 visible, 5006px | 269 visible, 4944px | 269, 4944px |

   Blocking the form reproduces the `before` numbers exactly. The 2 elements are the form embed's
   own `ep-wrapper` and the height is its iframe growing from the 150px placeholder to the form
   (700px at 1440, 1090px at 390). At 390 the blocked heights (7569 / 8047) are near, not equal to,
   `before` (7595 / 7897): the form was caught mid-boot there; the visible counts match (198 / 258).

So `before` is the noisy capture on these two pages, not `mid`, and the state `before` no longer
exists to re-capture. What stands for before → mid:
- css parity, scripts off, every element of 34 URLs at three widths: **0 real**;
- the published stylesheet differs from the pre-migration one ONLY by the 20 moved custom
  properties (text diff of `style-*.css`, `published-before/` vs `published-mid/`); `userStyles` is
  byte-identical;
- legal gate (4 legal pages, whole computed style, scripts off and on): **0 real**;
- no control went dead, no element stuck, no page error on any page.

`mid` (with its re-capture `mid~m`) is the sound runtime baseline for mid → after.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
