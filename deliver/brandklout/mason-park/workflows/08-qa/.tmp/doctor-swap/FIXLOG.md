# Provider swap — Dr. William Sung → Dr. Tam Nguyen

Date: 2026-08-20
Requested by: Gauge Hill (Brandklout), Teams + Asana task `1217040406855582`, attachment
`1217691620333463-image.png`:

> "They are focused on Dr. William Sung instead of Dr. Nguyen who is the primary provider at the
> office. Use this as reference: [pediatricdentistkatytx.com]. She is the provider."
> "Invisalign also has this issue, its focused around dr. sung for all images and most text"

Applied to all six paid-traffic pages and two shared components. Published to **staging only**
(`https://mason-park-dental.webflow.io`); the site has **no custom domains attached**, so nothing
reached a live client domain.

---

## Who she is (every claim below is sourced)

**Dr. Tam Nguyen, DMD — Board Certified Pediatric Dentist.**

Primary source: `01-content-intake/.tmp/client-site/our-doctors/rendered.html` (the practice's own
Meet Our Doctors page, captured 2026-08-19). Verbatim:

- "DR. TAM NGUYEN — Board Certified Pediatric Dentist"
- "born and raised in southwest Houston, where she attended DeBakey High School for Health
  Professions and graduated with a Bachelor's degree from the University of Texas at Austin"
- "She obtained her dental degree from **Boston University** in Boston, MA where she also met her
  husband, William." (i.e. Dr. William Sung)
- "Following several years of work as a **general dentist in Richmond**, Dr. Nguyen realized her
  passion was to work with kids and she decided to go back to school to specialize in pediatric
  dentistry."
- "Dr. Nguyen returned to Boston University to serve her **pediatric residency and earn a specialty
  degree**. During the residency program, Dr. Nguyen gained insight and knowledge about treating
  **children as young as 6 months old as well as patients with special needs**."
- Philosophy, verbatim: "My philosophy focuses on promoting healthy lifestyles and oral habits from
  a young age."

Secondary source: `pediatricdentistkatytx.com` (Mason Park Dental for Kids, the site Gauge linked)
— she is a **certified Invisalign provider** who "will assess your dental needs" and "create a
customized treatment plan" during consultation; the practice markets *Invisalign for Kids, Teens
and Adults*. This is what makes fronting the Invisalign LP with her factually supportable.

> [!IMPORTANT]
> Her degree is **Boston University**, not Tufts. Tufts is **Dr. Cho's**. The pages previously
> credited Tufts to Dr. Sung, which the 2026-08-19 audit had already corrected once; do not
> reintroduce it for Dr. Nguyen.

### Claims deliberately NOT carried over from Dr. Sung

These were his, not hers, and were replaced rather than re-attributed:

| Dropped | Why |
| :--- | :--- |
| "DMD, Tufts University" | Hers is Boston University |
| "FAGD / Fellow of the Academy of General Dentistry / top 7% of Texas dentists" | Dr. Sung's fellowship. She is not an FAGD |
| "100+ CE hours a year / over eight times the yearly requirement" | Dr. Sung's CE figure |
| "Most dentists tell you what you need. I'd rather help you understand why." | Unattributed quote; replaced with her published philosophy line, verbatim |
| "Your cosmetic dental specialist" (eyebrow) | She is a pediatric specialist, not a cosmetic one |

## Scope decisions (confirmed with Alejandro before applying)

1. **New Patient Special framing** → *family practice, she leads*. The page keeps the $189 adult
   offer, address, phone and hours. Copy names her as leading the team rather than claiming she
   personally performs every adult exam, which their own site would not support.
2. **Dr. Sung and Dr. Cho** → *lead with Nguyen, keep the team*. The two thank-you cards that quote
   the practice's own roster copy now open with her credentials and retain Cho and Sung.

**Offers, pricing, address, phone and office hours were not touched.**

---

## Page-by-page changes

Page ids below are the CURRENT ones. The ids in the 2026-08-19 runbook were stale: the `-v2` pages
were merged back onto the original page records, so the v2 builds now live on the ORIGINAL ids.

| Page | id |
| :--- | :--- |
| New Patient Special | `6a75f468bfddad669aaf8321` |
| Invisalign | `6a75f467c7c9e1a0c133edd1` |
| New Patient Special Consultation | `6a7f1882b7aaf05bf6f69c5d` |
| Invisalign Consultation | `6a7f18cd26274c520455c672` |
| Thank You New Patient | `6a75f468c490cc1bb6fa6a8c` |
| Thank You Invisalign | `6a7a4f3d7d446f7564911a62` |

### New Patient Special (21 text edits + 3 images)

| Was | Now |
| :--- | :--- |
| "Your first visit is planned and reviewed by Dr. William Sung, so you leave…" | "…reviewed with you by Dr. Tam Nguyen and our team, so you leave…" |
| stat "Tufts / DMD, Tufts University" | "Boston U / DMD, Boston University" |
| stat "FAGD / top 7% of Texas dentists" | "Pediatric / board certified specialist" |
| stat "100+ / CE hours a year" | "All Ages / new patients welcome" |
| "One Doctor, Start To Finish" | "One Practice, Start To Finish" |
| "Dr. Sung reviews your examination… himself, without handing you off mid-visit." | "Dr. Nguyen and our dentists review your examination… with you, without handing you off mid-visit." |
| eyebrow "Your cosmetic dental specialist" | "Your family's dentist in Katy" |
| "Dr. William Sung sees every new patient… personally" | "Dr. Tam Nguyen leads the team at Mason Park Dental, where every new patient gets a full examination, a clear explanation of what was found, and a written treatment plan before anything is started." |
| cred 1 "DMD, Tufts University — where he earned…" | "DMD, Boston University — where she earned her dental degree and later returned for her pediatric residency and specialty degree" |
| cred 2 desc "evidence-based diagnosis, esthetics, comprehensive smile design" | "gentle, evidence-based care for families across Katy" |
| cred 3 "FAGD — Fellow of the Academy…" | "Board Certified Pediatric Dentist — a specialty degree earned through her residency at Boston University, where she trained to treat children from six months old as well as patients with special needs" |
| cred 4 "Continuing Education — almost 100 hours a year…" | "General Dentistry Background — several years in general practice in Richmond, Texas before she focused on pediatric dentistry" |
| pull quote | her verbatim philosophy line |
| bonding ", led by Dr. William Sung," | ", led by Dr. Tam Nguyen and our team," |
| Invisalign block "Dr. William Sung, DMD" | "Dr. Tam Nguyen, DMD" |

Images: `lp_doctor_image` → new tall portrait; `lp_team-image` slot 1 (was Sung headshot) → her with
a patient; `lp_process_image` → a consultation photo (its old alt claimed "a mother and child",
which was actually **the dentist**, so the alt was wrong as well as the framing).

### Invisalign (11 text edits + 2 images + SEO)

Same credential block treatment. Page-specific:

- "Every case is planned in-house by Dr. William Sung" → "…by Dr. Tam Nguyen"
- "Dr. Sung plans your case… makes the refinements himself" → "Dr. Nguyen… herself"
- "Dr. William Sung plans every Invisalign case… personally" → "Dr. Tam Nguyen plans every
  Invisalign case… personally" (sourced: she creates the customized plan at consultation)
- cred 2 desc → "she plans each case personally and tailors it to your teeth, your bite, and your goals"
- "One Doctor, Start To Finish" and eyebrow "Your Invisalign provider" **kept** — both accurate for her
- **SEO description** still said "with Dr. William Sung, DMD" → now "Dr. Tam Nguyen, DMD"

### Both consultation pages

Author card `Dr. William Sung, DMD / General Dentist` → `Dr. Tam Nguyen, DMD / Board Certified
Pediatric Dentist`, avatar swapped, alt rewritten.

### Both thank-you pages

`confirm_hero_avatar` was **Dr. Dave Cho** → Dr. Nguyen, alt rewritten.

### Shared components

- **`LP Stat Band`** `bedcc43c-dc48-2e2d-ab05-be9af3fd60f4` (Invisalign only): Boston U /
  Pediatric / Invisalign-certified-provider. Stat 3 is a per-page prop and was left alone.
  NPS carries an **inline copy** of this band, not the component, so it was edited separately.
- **`Confirm Why Band`** `996eb083-fef4-c13a-528f-3f0dd399f78c` (both thank-you pages):
  - *Experience* now opens "Dr. Nguyen earned her dental degree from Boston University and returned
    there for her pediatric residency and specialty degree." then keeps Cho and Sung.
  - *Personalized Care* reordered to "Dr. Nguyen, Dr. Cho and Dr. Sung…".

### New assets

| id | file | use |
| :--- | :--- | :--- |
| `6a8753a73eee477d9b1451c5` | `dr-tam-nguyen-portrait.jpg` (800×800) | square avatars: consultation + thank-you + Invisalign team strip |
| `6a8759b9f35a255da2781d84` | `dr-tam-nguyen-portrait-tall.jpg` (900×1200) | `lp_doctor_image` on both LPs |

Both are crops of `Action-13-scaled.jpg` (asset `6a7be01944e4e802bb806792`), which was **already in
the site's asset library** and is the exact frame Gauge sent captioned "She is the provider".

---

## Verification (against the PUBLISHED staging HTML, not the editor)

| Check | Result |
| :--- | :--- |
| "Sung" in copy | **0** on all four funnel pages; 2 remaining on each thank-you page, both intentional roster lines |
| Tufts / FAGD / UCSF / FICOI / "1,300" / "320+" | **0** everywhere |
| Sung or Cho image assets still rendered | **0** across all six pages |
| Empty alts | **0** |
| Em dashes | **0** (found and fixed 2 pre-existing ones hiding in NPS price-card **alt text**, which the 2026-08-19 sweep missed because it only checked visible copy) |
| Mobile overflow @390 | widest element **390** on both LPs, `scrollWidth` 390 |
| `lp_doctor_image` geometry | **547×730**, matching the 547×729 the previous portrait produced |

## Still open (unchanged by this pass)

1. `{{GHL_INBOUND_WEBHOOK_URL}}` is still a placeholder in the site head, so no form delivers a lead.
2. Form placeholders still show Webflow's "Example Text" on 4 pages (Designer-only fix).
3. `noindex` on the two consultation pages (Designer-only).
4. Terms of Service ships as text; client must supply a URL.
5. **A studio headshot of Dr. Nguyen would be better than a crop.** Her portrait
   `HS-8-1024x1536.jpg` exists at `bestdentistinkatytx.com/wp-content/uploads/2023/11/`, but BOTH
   client domains refused every connection for the whole session (see Gotchas). Worth pulling when
   they are reachable, or asking the practice for originals.

## Gotchas found this session

- **Both client domains were unreachable all session.** `bestdentistinkatytx.com` and
  `pediatricdentistkatytx.com` reset the connection after ~21s from this machine (curl, Node fetch
  and headless Chrome alike) **and** from Anthropic's server-side fetcher. DNS resolves fine
  (`34.174.211.179`). It is the origin, not the local network. The bio was recovered from the
  2026-08-19 local capture in `01-content-intake/.tmp/client-site/`; capture early, the site is not
  reliably there when you need it.
- **The runbook's page ids were stale.** Always re-derive from `data_pages_tool > list_pages`.
- **MCP argument shapes that cost time** (all discovered by reading Zod errors):
  - `data_element_tool` / `data_element_settings_tool` take **camelCase** `siteId`/`pageId` at the
    top level, but each action's own params are **snake_case**.
  - `actions` entries are `{ label, <action_name>: {...} }`, not `{ action: "...", ... }`.
  - `query_elements` `return_parent` is `'parent' | 'ancestor'`, never a boolean.
  - `set_image_asset` takes **`image_asset_id`**, and does NOT accept alt text.
  - Alt text goes through `data_element_settings_tool > set_settings` as
    `operations[].settings[] = { key: "altText", static_text: { value: "..." } }`.
    `static_text` must be an **object with `value`**; a bare string is rejected.
  - **Editing a component definition needs `scope_component_id` ON THE ACTION.** Passing a
    component-scoped `id` alone returns "Element not found" for every edit, which looks like a bad
    element id rather than a missing scope flag.
  - `data_pages_tool > list_pages` wants `site_id` **inside** the action, not at the top level.
  - `publish_site` needs **camelCase `publishToWebflowSubdomain: true`**. The snake_case spelling is
    silently dropped and the API then rejects the call with "must pass at least one valid domain id".
- **`data_assets_tool > list_assets` blows the token cap** at 100 assets. You rarely need it: a
  Webflow asset id is the 24-hex prefix of the CDN filename, so read ids straight off the page HTML.
- **Measure images after scrolling them into view.** Both `lp_doctor_image` elements reported
  `height: 0` on first measure because they are lazy-loaded below the fold. That reads exactly like
  a broken aspect ratio.
- **`lp_doctor_image` has no fixed aspect ratio**; it renders at the asset's intrinsic ratio. A
  square crop silently shortened the whole section from 730px to 547px. Match the outgoing asset's
  ratio when swapping into an unconstrained slot.

## Version Control

Artifacts here are lightweight and committed. Follows the root-level rules in
[SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
