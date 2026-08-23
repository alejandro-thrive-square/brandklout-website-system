# Discovery Findings — Stone Dental Implant Center

Public, unauthenticated research only. No client platform was touched, nothing was written to Asana.

| Field | Value |
| :--- | :--- |
| **Asana tasks** | `1217160668112180` (Build New Stone Med Spa), `1217160668112175` (Build New Stone Surgical Arts website) |
| **Asana project** | `1213901750672059` — BK Activation - Stone Dental Implant Center |
| **Researched** | 2026-08-05 |
| **Method** | Live site fetch, HTTP header inspection, `sitemap.xml`, Wayback CDX API |

## Headline: this is one practice, one surgeon, and a three-way brand split

The [project overview](../../../docs/project-overview.md) listed the relationship between the three
Stone names as a blocking unknown. It is now resolved from public sources.

**Dr. Mona Stone, DDS** — board-certified oral & maxillofacial surgeon, biomedical engineer, KLS
Martin IPS® certified — is the sole surgeon behind all three names, operating from a single address:

> 72 Andorra Dr #110A, Westlake, TX 76262 · (817) 383-8361

`Stone Surgical Arts` was the **original** practice site. It was a large WordPress build covering
three service pillars. That site has since been **consolidated into `Stone Dental Implant Center`**,
which today is live on Webflow and carries **only the oral-surgery pillar**. The cosmetic and skin
pillars were dropped in the move and are currently not represented anywhere online.

That makes the two Asana tasks legible. They are not two unrelated site builds. They are **pillars 2
and 3 of a brand split that is already one-third complete**:

| Pillar | Brand | Status |
| :--- | :--- | :--- |
| Oral & maxillofacial surgery | Stone Dental Implant Center | **Live on Webflow.** Done. |
| Cosmetic facial *surgery* | **Stone Surgical Arts** | Task `1217160668112175` — to build |
| Non-surgical skin & aesthetics | **Stone Med Spa** | Task `1217160668112180` — to build |

The `Stone Med Spa` name does not exist publicly yet in the Westlake/Southlake area. It is a **new
brand**, not a rebuild.

## Current state of each domain

| Domain | Behaviour | Notes |
| :--- | :--- | :--- |
| `www.stonedentalimplantcenter.com` | 200 | Live. Webflow (`x-wf-region: us-east-1`), Cloudflare in front. |
| `stonesurgicalarts.com` (apex) | 301 → implant center home | Brand is dark. |
| `www.stonesurgicalarts.com` | 301 → implant center home | Same. |
| `www.stonesurgicalarts.com/patient-resources/` | 301 → **404** | Deep links are broken, not redirected. |
| `shop.stonesurgicalarts.com` | NXDOMAIN | The old skincare-product shop is gone. |

> [!WARNING]
> **Every** old Surgical Arts deep link resolves to a 404 on the implant-center domain. Roughly 130
> archived URLs of accumulated SEO equity are decaying right now. Whoever handled the consolidation
> did a blanket apex redirect with no page-level redirect map. This is a live, ongoing loss and is
> worth raising with Brandklout independently of the two build tasks.

## What the live implant-center site contains

43 URLs in `sitemap.xml`:

- **17 static pages** — home, about-us, meet-dr-mona-stone, services (index), before-after,
  patient-testimonials, your-first-visit, virtual-appointment-request, insurance-financing,
  patient-forms, pre-op-post-op-instructions, contact, blog (index), privacy-policy,
  cookie-policy, terms-of-service, sms-terms-conditions
- **18 service detail pages** under `/services/` (CMS collection)
- **6 blog posts** + 2 blog-type category pages (CMS collections)

All 18 services are oral/maxillofacial. **There is no aesthetics, injectable, skin, or med-spa
content on the live site at all.**

## What the archived Surgical Arts site contained

~130 unique pages (WordPress; built by **NKP Medical Marketing** — their banner is in the source and
their staff are the post authors). Raw URL list saved to
[`archived-urls-raw.txt`](./archived-urls-raw.txt). Archived pages return HTTP 200 with full body
copy intact, so **this content is recoverable**.

### Pillar 2 — `/cosmetic-facial-surgery-southlake/` → feeds Stone Surgical Arts

blepharoplasty · botox-xeomin · buccal fat removal · chin sculpting & reshaping · eyelid lifting ·
facelift / easy lift · FaceTite · facial fat transfer · facial fillers · facial implants · fat
transfer · HydraFacial MD · male facial enhancement · Morpheus8 · MyEllevate facelift · neck lift ·
neck liposuction · skin lesion removal

*(18 pages — note this pillar mixes surgical and non-surgical; the split between brands is a
decision, not a given. See the scoping questions.)*

### Pillar 3 — `/skin-treatments-southlake/` → feeds Stone Med Spa

botox-xeomin · chemical peels · CO2 laser skin resurfacing · dermal fillers · Dysport & Jeuveau ·
facial fillers · hair restoration · Morpheus8 · PRP treatment · regenerative therapy

*(10 pages. Plus a `weight-loss-program` page and blog posts on "skinny shot" / GLP-1, which is med
spa revenue and is currently homeless.)*

### Pillar 1 — `/oral-surgery-procedures-southlake/` → already migrated

14 pages, all now present on the live implant-center site. This confirms the migration pattern and
tells us pillar 1 is the template for pillars 2 and 3.

### Supporting content that existed and is now gone

- **Before & after gallery** — 33 URLs, split `surgical/` (blepharoplasty, buccal fat, chin surgery,
  neck surgery, oral-maxillofacial) and `non-surgical/` (lip fillers ×5, hair restoration ×3,
  botox ×2, CO2 laser ×2). Real case photography of real patients.
- **Blog** — 12 clinical posts. **News** — 26 celebrity-angle SEO posts.
- **Treatment pricing page** — the old site published the practice's own patient-facing treatment
  prices. A content decision for the new sites, not a commercial one for us.
- **Integrations** — Crisalix (3D aesthetic simulation), Cherry financing, online referral form,
  virtual appointment request, patient forms.
- **Media/press** — `facial-surgery-media-articles-southlake`, 6 press images.

## Implications for scope and sequencing

> [!NOTE]
> Brandklout is a **partner engagement**, not a per-page client.
> PRICING_TIMELINE_RULES.md (in the `webzite-agentic-workflow` repository) does not apply to
> anything under `deliver/brandklout/`. Page counts below exist to drive **sequencing and capacity
> only**. No cost, rate, or quote belongs in this folder.

Two scenarios, both **pending confirmation** — this is the shape of the decision:

### Scenario A — mirror the archived architecture

| Site | Approx. pages |
| :--- | ---: |
| Stone Surgical Arts | ~23 |
| Stone Med Spa | ~19 |
| **Total** | **~42** |

### Scenario B — lean launch, hero procedures only

| Site | Approx. pages |
| :--- | ---: |
| Stone Surgical Arts | ~11 |
| Stone Med Spa | ~10 |
| **Total** | **~21** |

> [!IMPORTANT]
> **This is a capacity question before it is a scope question.** Scenario A is roughly double
> Scenario B, and both land on top of twelve landing pages already due this week. Whether the two
> pillars run sequentially or in parallel is a staffing decision that has to be made deliberately
> rather than assumed.

### Workstreams that sit outside the page count

None of these are optional here, and none of them are absorbed by a page-count estimate. They need
their own place in the sequence:

1. **Brand identity for Stone Med Spa** — the brand does not exist. No logo, no palette, no type
   system. A med spa and an oral-surgery practice cannot share one visual identity. This has to land
   *before* design starts, so it is a critical-path item, not a parallel one.
2. **Redirect map** for the ~130 dead Surgical Arts URLs.
3. **Content migration** from the Wayback archive — recoverable, but extraction is real work.
4. **Copywriting** for anything not recovered, and for the new Med Spa brand.
5. **Custom integrations** — Crisalix, Cherry financing, GHL lead routing.

## What is still genuinely unknown

Answered by this research: the brand relationship, whether these are greenfield or rebuilds, the
platform, the existing content inventory, and the rough page counts. Still open — and these are the
ones only Brandklout or the client can answer — are carried to
[`scoping-questions.md`](./scoping-questions.md).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only.
