# All-on-X "quiz" combo — local build

The new All-on-X ads test for Arvada Dental Center & Implants, built from the design attached to
Asana task `1218962992162869` ("Make new landing page - AOX"). The attachment is one page; the
campaign unit is three, so this folder holds the combo:

| Page | File | What it is |
| :--- | :--- | :--- |
| Landing | `all-on-x-quiz.html` | The attached design, photo slots filled. The quiz sits in the hero. |
| Consult | `all-on-x-quiz-consult.html` | The same quiz first, then what the free visit includes. |
| Thank-you | `all-on-x-quiz-thank-you.html` | Phone number first, no form, what happens next, patient videos. |

Shared: `assets/aox-quiz.css`, `assets/aox-quiz.js` (the quiz), `assets/aox-page.js` (click
tracking, video lightbox, thank-you greeting).

```
node build.mjs     # regenerate everything from the attachment + src/
node verify.mjs    # the gate: layout at six widths, then it clicks through the quiz, the videos and the CTAs
node clips.mjs <page.html> <width> [selector ...]   # readable review crops into shots/
node brand-probe.mjs <url> [url ...]               # re-measure the live site's colours and fonts into brand/
```

**Never hand-edit the three pages or `assets/`.** They are generated. Edit `build.mjs` or `src/`.
The source attachment is
`../../../01-content-intake/.tmp/asana-aox-sung-2026-09-30/attachments/1218929162756667-all-on-x-landing.html`.
Every patch in `build.mjs` asserts its anchor, so a newer attachment fails loudly rather than
building half-patched.

## What differs from the attachment, and why

The layout, copy, section order and quiz logic are the attachment's own. The changes:

0. **The brand is the site's, not the attachment's.** The attachment came in green and yellow,
   set in Atkinson Hyperlegible. `brand-probe.mjs` measured www.arvadadentalcenter.com as it
   renders (evidence in `brand/*.json`) and `build.mjs` swaps each design token for the site's
   value for the same role; `src/brand.css` carries the type and shape:

   | Role | Site value |
   | :--- | :--- |
   | Grounds | `#fdf8ef` body, `#ffffff`, `#f6f3ee` band, `#5f5f5d` dark (the live ad page's hero) |
   | Ink | `#222222`, secondary `#5f5f5d` |
   | Accent | gold `#c8b282` for fills and rules, `#8c6946` where gold is text on light |
   | Headings | `area extended` 700, capitalised, normal tracking, 3rem / 2rem at desktop |
   | Body | `Centurygothic` 400 and 700, 17px / 1.5 |
   | Eyebrow | uppercase bold with a 2px gold rule (the site's `tagline`) |
   | Buttons | uppercase, square; primary is the site's gold gradient with dark text |
   | Corners | square; 4px on form controls only |

   The site's most common button is a silver gradient with white text. It is not used for the
   primary action here: white on that silver is about 2:1. Gold with `#222` text is 7.7:1.
   `assets/brand-fonts.css` loads the site's own font files for the local pages only; on the
   Webflow site those families are already installed.

1. **Photo slots filled** with the practice's own photographs from the Webflow asset library and
   stills from its own YouTube uploads. `transformation-image-1.jpg` is the same photograph as
   `Chris-BEfore-and-After.jpg`, so the two square result slots take images 2 and 3 of that set.
2. **Logo** replaces the text brand, as the handoff notes ask.
3. **Videos open in a lightbox.** The player is created on click; nothing embeds on page load.
4. **A submitted lead goes to the thank-you page** instead of the inline "request received" state,
   so the conversion has a page to fire on. The first name travels in `sessionStorage`, never in
   the URL. `generate_lead` is still pushed to the dataLayer before the redirect.
5. **The automatic dark theme is removed.** The attachment turns the whole page dark on a phone in
   dark mode; Brandklout builds stay on light grounds. The dark hero band is kept, in the grey the live ad page already uses.
6. **Click tracking moved** out of the quiz script into `aox-page.js` so the thank-you page is
   tracked too and nothing fires twice.
7. **An empty webhook warns in the console** instead of pretending silently.

## Not decided here — blocks launch, not review

- **`LEAD_WEBHOOK_URL` is empty** (top of `assets/aox-quiz.js`, set in the attachment's script).
  Until the GoHighLevel inbound webhook is pasted in, the quiz collects nothing: it walks through
  to the thank-you page and sends the lead nowhere. Once set, test one real submission from a
  browser; the POST is `application/json` cross-origin, so the webhook has to answer the preflight.
- **The price.** The design says `$18,795` per arch (and `$235`/mo, `$37,590`, `$471`/mo). On
  2026-09-30 the practice's live cost page says **"Starting at $17,795"** and `$18,795` appears
  nowhere on the live site. One of the two is wrong. Neither monthly figure is published anywhere.
- **Claims the handoff notes ask to verify**, none of which the live site states: Google 4.8 /
  1,200+ reviews, Healthgrades 4.9, "more than $10,000 below the national implant chains", and the
  SMS consent wording. Also that the coordinator's outbound calls really show `(720) 419-3699`.
- **"Anna"** — the practice titles the video "Anna's story!", but its own lower-third names the
  patient Angela.
- **Slugs.** `all-on-x-quiz*` are working names. Whether this replaces the live
  `/ads-landing-pages/all-on-x-ads-landing` set or runs beside it is the ads team's call.
- **Landing CTAs scroll to the quiz**, as designed; they do not link to the consult page. The
  consult page is a direct destination (sitelinks, remarketing).

## Webflow

Not built yet: `docs/mcp-access.md` puts local review first. This design cannot take the v2
native route (`07-webflow-build/.tmp/v2-native`): the quiz is script, and the stylesheet uses
pseudo-elements, `clamp()` and masks, all of which `data_whtml_builder` refuses. It needs custom
code on the page, which is a different route from the 18 existing pages.

## Version Control

Tracked, under the root rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`shots/` is ignored; screenshots are regenerated by `verify.mjs` and `clips.mjs`.
