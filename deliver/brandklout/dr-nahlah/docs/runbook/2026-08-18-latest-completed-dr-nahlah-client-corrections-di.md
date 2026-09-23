## Latest completed: Dr. Nahlah client corrections + differentiators (2026-08-18)

Client review produced four content corrections and a "lean heavily on what differentiates us"
brief. All of it is applied to the **local package** (`deliver/brandklout/dr-nahlah/workflows/
04-design/.tmp/site-src/`, 28 pages) and gated. **The Instatic push is NOT done** (see Still open).

### What changed
- **Inova Fairfax hospital privileges removed everywhere**, not just the bio: it also sat in the
  home comparison table, the dental-implants next-nav, and three places on sedation-dentistry
  (hero meta, the "why it is safe here" paragraph, the source note). Leaving it on four pages while
  deleting it from one would have been worse than not touching it. On sedation the safety argument
  is now carried by the IV certificate, BLS/ACLS, and the medical anaesthesiologist.
- **Added**: adjunct faculty at VCU (Prosthodontics Postgraduate Program), Fellow of the American
  College of Prosthodontists, Virginia dental license, 18,000+ implants / 15,000+ arches.
- **Credential record 12 -> 14.** `meet-dr-nahlah` lists all fourteen; the home page shows eight.
- **The home "12 Board Credentials" counter is gone**, replaced by `18,000+ Implants Placed` and
  `15,000+ Arches Restored`. That also closes the 12-vs-8 contradiction flagged on 2026-08-10.
- **The home-page "typo"** the client reported (`D.D.S., M.S.Diplomate, Am. Board of Prosthodontics`)
  is not a typo in this package: `.ar-meta div` is `display:grid`, so the pair stacks locally. It
  runs together on any platform that loses that one declaration. Fixed at the source by making
  `.ar-meta b/span` and `.ph-meta b/span` `display:block` too, so the pair survives the grid being
  dropped. **Check it renders stacked on Instatic and Webflow, which is where it actually broke.**
- **Differentiators.** Home Chapter 06 rebuilt around the four the client named: in-house digital
  lab *in both practices* (wide card), computer-guided implant surgery, minimally invasive veneer
  preps, thin arch. The 3D-imaging card folded into computer-guided; the sedation card into the
  Chapter 02 comparison. Three new comparison rows. Marquee updated.
- **New shared component: the FP1/FP2/FP3 thin-arch explainer** (`css/40-thin-arch.css`, `.ta`).
  Renders inside home Chapter 06 (with the `.ta-inset` modifier for the top rule) and as its own
  `<section class="pk ta">` on all-on-4. Uses the client's own diagram, saved to
  `site-src/assets/fp1-fp3-comparison.png`.
- **"Both practices" made explicit** on about, our-facility, our-team, doctor-referral,
  crowns-and-bridges and veneers. It had only ever said "in the building".

### Em dashes: house rule, now written down
The user restated it as a system rule: **no em dash in any copy, anywhere.** 72 had crept back in
during the 28-page build. All removed, chosen per instance (comma / colon / semicolon / full stop);
a blanket substitute leaves half of them ungrammatical. Recorded in
[SYSTEM_RULES.md §3](../../../../../SYSTEM_RULES.md). Comments are not copy and were left alone. Verify on the
**built** output with comments and `<script>`/`<style>` stripped first, or the check reads its own
notes back: currently **0 across all 28 pages**.

### Gates (all green, server on :8902)
`css-vocab` 217 names OK | `site-test` **484/484** | `interaction-test-gsap` **64/64** |
`swap-proof` **6/6** | `fluid-qa` **390/390**

### Gotchas
- **The gate harnesses default to ports nothing is serving.** `site-test.mjs` wants **8902**,
  `interaction-test-gsap.mjs` wants **8901**, `serve.mjs` defaults to **8903**. Run
  `node serve.mjs final-site 8902` and pass the URL explicitly, or every check "fails" against a
  404 page: the first run reported the shell missing and a page title of `127.0.0.1`.
- **Two interaction assertions encoded the old copy** and had to be moved with it: the counter
  values (`23+|12|4.9|2`) and `comparison table renders 6 rows`. Both updated with a note saying
  why. A gate that asserts content is a spec; change it deliberately or not at all.
- **`css-vocab` enforces one class = one stylesheet.** Scoping a shared component from the owning
  chapter's sheet (`.ch-standard .ta`) fails it, and so does the reverse. Use a modifier class
  (`.ta-inset`) that lives in the component's own sheet.
- **`*.png` is gitignored repo-wide**, so `site-src/assets/fp1-fp3-comparison.png` will NOT be
  committed. Nothing in `site-src/assets/` is tracked (logo, hero poster, google mark all ignored).
  A fresh checkout rebuilds without it and the thin-arch figure 404s. It needs the VPS asset sync
  (SYSTEM_RULES §4.2), or the file re-supplied by hand.
- The card image for the thin-arch card was `full-arch-graphic.png`, a render **with a pink base**,
  under a headline reading "Teeth, not a slab of acrylic". Swapped for `case-ao4-double-1-after.jpg`,
  a real finished case from the practice. Worth checking image *content* against claims, not just
  that an image loads.

### Still open
- **Instatic is DONE and PUBLISHED** (26 pages, `https://encorercm.com`, 2026-08-18). Verified on the
  live site, not just in the editor.
  - Server `instatic-dr-nahlah` -> `https://encorercm.com/_instatic/mcp`, registered project-scoped
    in `.mcp.json` and re-authorised by the user; the live grant is on the **personal** profile. The
    driver `13-content-export-import/.tmp/instatic-mcp.mjs` finds whichever profile holds it.
  - **Em dashes 60 -> 0**, content parity reached on all 26 pages (each now sits at the 1-2 line
    artefact floor: the footer Terms link, which has no page on Instatic, and inline-element spacing).
  - **Home page import damage repaired**: the duplicate `ch-specialist` deleted, Chapter 07 (Proof)
    rebuilt from the local build (film block, Google reviews, six story cards), Standard/Proof put
    back in the local order. Chapters now read 0-8 exactly as local.
  - **Three latent CSS defects found and fixed in the code asset**, all pre-existing:
    `.rv-card` rules purged at some earlier publish; `.rv-grid` and `.ga-grid` had their
    `min-width:1080/1100` blocks emitted BEFORE `min-width:700`, so a 3-column grid rendered as 2;
    and `.rv-head h3` carried a baked `color:#0b0b0b` inside a `data-theme="dark"` section, i.e.
    black on black.
  - All added CSS lives in `src/styles/runtime-states.css` (4388 -> ~10.4k chars), which survives the
    publish-time purge. Confirmed present in the live `userStyles-*.css`.
  - **Known difference from local**: the Proof film uses `hero.mp4`, not `broll.mp4`. `media_upload`
    accepts images only, so the second b-roll could not be uploaded through the MCP. Both are the
    practice's own footage. Upload `broll.mp4` by hand if the exact local match matters.

- **Instatic remains TWO ARCHITECTURES BEHIND the local build**, by design of this session's scope.
  It carries the pre-2026-08-17 vocabulary (`pk alt` not `pk pk-alt`, `k` not `cr-key`,
  `stat`/`std`/`cap`/`row` unprefixed) and 212 per-page inline script assets. Every edit was
  therefore authored in INSTATIC's idiom; importing local markup verbatim lands correct copy in
  unstyled elements. It also has 26 pages against the local 28 — `thank-you` and `terms-conditions`
  have never been created there, which is why every footer still shows one missing link.
  **On the user's per-page-CSS question: do NOT reshape the local build.** One `site.css` plus one JS
  module per section is what makes sections portable and it is gated (`css-vocab`, `swap-proof`). The
  duplication is a DELIVERY problem: ship `site.css` as one shared stylesheet code asset the way
  `runtime-states.css` already is, instead of feeding the per-page style registry. One asset write
  per change instead of 26, and it survives the purge.

- **Webflow was deliberately not touched.** `www.drnahlah.com` still serves the old bio, the Inova
  claim and the 12-credential counter. Confirm whether the user wants it updated too.
- Nothing is committed yet. Working tree holds the 28 source pages, the built site, the new CSS,
  the updated interaction harness and SYSTEM_RULES.
