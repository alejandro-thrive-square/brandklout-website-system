# Design packages — Grand Mission Dentistry landing pages

Three self-contained coded packages, built locally for review before any platform work.
Source: Asana workspace `1210572425689866`, parent task **`1217040406855578`**.

| Package | Asana task GID | Sections | Conversion element |
| :--- | :--- | :--- | :--- |
| `implant-landing-page/` | **`1217133289235653`** | 7, per spec | Multi-step qualification quiz (5 steps) |
| `cosmetic-landing-page/` | **`1217072657902270`** | 7, per spec, incl. sticky mobile bar | Short form: name, email, phone, message, consent |
| `thank-you-landing-page/` | **`1217162605683014`** | 4, per spec | Fast-track call box + live open/closed status |

Each package is `index.html` + `styles.css` + `app.js` + `assets/`. Open `index.html` directly, or
serve the folder. Assets are gitignored (media), so a fresh clone needs them re-copied from
`../../01-content-intake/.tmp/assets/`.

## Verification

```bash
node verify.mjs              # all three
node verify.mjs implant      # one package
```

Drives the real pages in headless Chrome over CDP and asserts **behaviour**, not appearance:
quiz stepping and back-navigation, empty-submit blocking with field-level errors, valid submit
reaching the success state, honeypot suppression, stat counters reaching their real values, FAQ
accordion state, lightbox open/close on Escape, sticky mobile bar appearing on scroll, every image
resolving, no horizontal overflow at 390px, and zero console errors. Full-page screenshots land in
`verify-shots/`.

**40/40 checks pass.**

Two harness traps found while building this, worth remembering:

- The page sets `scroll-behavior: smooth`, so a scripted `window.scrollTo` **animates**. A stepped
  walk with short waits never actually arrives, and every scroll-reveal reads as "never fired". The
  harness forces `scrollBehavior = "auto"` for the walk and hands it back afterwards.
- A full-page screenshot does not fire `IntersectionObserver` for anything below the fold, so an
  un-walked capture shows every reveal section as blank — which looks like broken layout rather than
  un-triggered motion. The harness walks the page before capturing.

## Design direction

The references (`start.smartarchesdental.com`, `novismilerogers.com`, `go.voitdental.com`) and the
previous vendor's two attachments are **structure and content references, not designs to
reproduce** — per
[ASANA-DISPATCH.md](../../../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).
Section order and copy angles come from them. Everything visual is ours.

Brand system is the client's own, lifted from `grandmissiondentistry.shared.*.min.css` `:root` —
**not** the previous vendor's navy/gold:

| Token | Value |
| :--- | :--- |
| Brand blue | `#04669c` · deep `#002241` · light `#abd6ff` |
| Brand brown | `#403830` · `#8c6946` |
| Accent purple | `#6f4885` |
| Radii | 4 / 8 / 24 / 48px |
| Type | Montserrat (headings + body), Great Vibes (script accents) |

## Offer and phone tokens — one place to edit

Every price and phone number renders from an `OFFER` (or `PRACTICE`) object at the top of each
`app.js`. Nothing is hard-coded in the markup. Changing the implant price is a one-line edit that
updates the hero, the financing section, the FAQ answer and the final CTA together.

| Token | Current value | Why |
| :--- | :--- | :--- |
| `implantPrice` | `2,999` | The client's own currently published price. The vendor's page ran `$3,499` with `$500 off paid in full` — flip this one value if Brandklout confirms that offer is live. |
| `newPatient` / `invisalign` | `189` / `3,799` | Live-site specials, with the client's own fine print. |
| `phoneDisplay` / `phoneDial` | `(281) 789-8836` | The practice's **main line**. The vendor's pages used per-campaign tracking numbers — implant `(281) 747-5929`, cosmetic `(281) 729-4615`. Those may be switched off at handover, so the main line is the safe default. Swap once Brandklout confirms ownership. |

## GHL — what is still needed

Both lead tasks say *"Make sure lead form is created in GHL for this specific page"*. We hold no GHL
grant. Each `app.js` has two constants at the top:

```js
const LEAD_ENDPOINT = null;  // POST target, or an embed replaces the form entirely
const THANK_YOU_URL = null;  // redirect target — the thank-you page in this build
```

With both `null` the form validates, blocks bad input, traps bots and shows its success state, so
the pages review end-to-end without GHL existing. The submitted payload is logged to the console so
its shape can be checked. The payload already carries `page` and `asana_task_gid` for attribution.

**The three pages are one flow**: both lead pages redirect to the thank-you page on success, so
whoever wires GHL needs the thank-you URL at the same time.

## Content rules applied

Every factual claim on these pages traces to the client's own material — the two Asana attachments
on task `1217040406855578` or grandmissiondentistry.com. Inventory:
[`content-intake-summary.md`](../../01-content-intake/.tmp/content-intake-summary.md).

- **Five named reviews**, all real: EM M and Jason Kwan (implant page), Diane C., Cedaro and
  Tiffany T. (cosmetic page). Nothing invented.
- **Eight before/after cases**, actual patients, watermarked by the practice, with a results-vary
  disclaimer on both pages that use them.
- **Clinical statistics** are the ones the practice already publishes on its own implants page.
- **Doctor bios verbatim.** Dr. Tam Nguyen is pediatric and deliberately appears on neither lead
  page.
- One asset was **dropped**: the previous vendor labelled a stock photo of a woman holding a mirror
  as a "Restorative dentistry icon". Stock imagery is out per the partnership rules, so that slot
  uses an inline icon instead.

## Reconciliation pass — 2026-08-06

The implant page was first drafted with our own paraphrases of the client's copy. On instruction,
it was reconciled against the attachments so the real content is used verbatim wherever it exists.
What changed:

| Section | Before | After |
| :--- | :--- | :--- |
| Hero explainer | Our paraphrase of what an implant is | The client's own "titanium cylinders…" definition, verbatim |
| Hero offer bullets | Our mix of live-site claims | The client's own five: free consultation · free dental exam & X-ray worth $750 · same-day dental implant · easy financing options available · most PPO insurance accepted |
| Services | *(section did not exist)* | Added "Complete dental care in Richmond, TX" with the client's six real service names, their intro line, their own icons, and their "$750 available" note |
| Why implants | Our headline and card titles | Their heading "Why are dental implants the best solution?" and their five benefit names |
| Eligibility | Our compressed rewrite | Both of their paragraphs verbatim, including "Dr. Will Sung and his team" |
| Financing | Live-site routes only (Cherry, PPO, HSA/FSA, card) | Their four financing bullets verbatim, their full lender list (Cherry, Alphaeon, Lending Club, CareCredit), and their verbatim insurance paragraph |
| Doctor bio | Ours, with an invented characterisation | Their bio verbatim; the invented line removed |
| FAQ | Our rewrites | Their four answers verbatim, with the price rendered from the token |
| Final CTA | Our headline | Their "Are you ready to smile?" |

The cosmetic and thank-you packages were written against this rule from the start.

**Still ours, deliberately**: layout, colour, type, motion, the quiz architecture, the financing
matrix as a table, the before/after lightbox, and the thank-you page's live open/closed logic. The
vendor's design is not reproduced anywhere.

## Known copy question

The cosmetic services grid uses the client's own service names *and* their own taglines, and their
pairings are scrambled at source — "Preventive Dentistry / Transform your smile with a touch of
perfection", "Cosmetic Dentistry / A crown fit for your beautiful smile". They are reproduced
faithfully rather than silently rewritten. Worth raising with Sang Huynh at review.

## Version Control

Lightweight design artifacts. Media under `assets/` and `verify-shots/` is gitignored per
[SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
