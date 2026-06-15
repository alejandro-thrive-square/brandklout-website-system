# Noam Nizrad (CENTRA) — Sitemap

> Derived from `docs/WEBSITE BREIFE.pdf` (40-slide bilingual brief). Source company: **CENTRA** — *"Israel's leading company for the repair and installation of electrical & electronic products"* (official installer for Samsung). Field-service sub-brand: **EFFECTIVE ROBOTICS** (nationwide expert repair labs).

## At a Glance
| Field | Value |
|---|---|
| Pages | **4** — Home + 3 inner pages |
| Direction | RTL (Hebrew) |
| Aesthetic | 3D-illustration style (hero ref: Webflow "sir-freelancelot" template) |
| Pricing | `4 × $400` per [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md) — confirm at proposal |
| Timeline | `4 × 2 days` per [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md) — confirm at proposal |

### Brief legend
- 🔴 **Red boxes** = section markers / page dividers (organizational, not design).
- 🟠 **Orange boxes** = the component *type* to build: `TEXT`, `TEXT & ICONS`, `GALLERY`, `LOGO GALLERY`, `TITLES & ICONS`, `CONTACT FORM`, `TEXT & STRONG IMAGE`.

### Global navigation (RTL)
מעבדות (Labs) · התקנות (Installations) · פרויקטים מיוחדים (Special Projects) · עבודות (Work)

---

## 🏠 Home — 5 sections
| # | Section | Component | Notes |
|---|---|---|---|
| 1 | Strong Header (hero) | Custom / animated | "CENTRA" wordmark + tagline. **Interactive exploded-device hero** — one chip pulled out, a hand "fixing" it (ties to company story). 3D object supplied by client **after approval**. |
| 2 | Logo Gallery | `LOGO GALLERY` | *"We specialize in 50+ of the electrical brands you love most."* Samsung, Dyson, Dreame, Ninja, PlayStation. **Moving/animated** marquee. |
| 3 | Text & Search Bar | Custom / functional | Warranty activation: *"Got a CENTRA warranty? Let's activate it."* **Serial-number input** — must wire to warranty form / catalog. |
| 4 | Quantity Counter | Animated counters | Dark *"CENTRA's numbers"* — **250** (avg. installs/day), **100+** (brands of deep expertise), **300,000** (warranty certificates serviced). Each with a small CTA. |
| 5 | Contact Form | `CONTACT FORM` | *"Need installation or repair? Talk to us."* Fields: Name · Product type · Mobile · Submit (blue styling). |

---

## 📄 Inner Page 1 — EFFECTIVE ROBOTICS (repair-lab brand)
*"Expert labs deployed nationwide for home electronics & electrical products."*

| # | Block | Component | Notes |
|---|---|---|---|
| 1 | Brand intro | `TEXT` | EFFECTIVE ROBOTICS overview. |
| 2 | Logo gallery | `LOGO GALLERY` | Depth across 100+ household brands. |
| 3 | Coverage | `TEXT & STRONG IMAGE` | **Map of Israel** = nationwide coverage (image supplied by client). |
| 4 | Service journey | `TEXT & ICONS` (3 cols) | *"We're with you until the fault is solved"* — Remote (video/phone diagnosis) → At your home (technician + pro equipment) → At our lab, then back to you. |
| 5 | Service standard | `TEXT & ICONS` (3 cols) | *"Excellence as a service standard"* — Parts availability · Max expertise per brand · Developing advanced tools. |
| 6 | Areas of expertise | `TITLES & ICONS` (5) | Gaming · Kitchen appliances · Computer monitors · TV screens · Robot vacuums. |

---

## 📄 Inner Page 2 — CENTRA Installations
*"At CENTRA we chose to redefine the world of installations."*

| # | Block | Component | Notes |
|---|---|---|---|
| 1 | Work gallery | `GALLERY` | *"You point where, we'll install"* — real job photos (crane/lift truck, team, in-home). |
| 2 | Samsung credential | `LOGO GALLERY` / award | *"The official installers of Samsung Israel"* (award-ribbon image). |
| 3 | Areas of expertise | `TITLES & ICONS` (5) | Washing-machine hookup · Ceiling installation · Wall-mounted TVs · **+2 placeholders (`X?`) — TBD**. |
| 4 | Contact form | `CONTACT FORM` | *"Looking for installation?"* Fields: Company name · Device you own · Mobile. |

---

## 📄 Inner Page 3 — Special / Government Projects
*"CENTRA's installation service, in service of the State."* — *"We can take a project from zero, recruit resources, and deliver a full operational solution."*

Presented as an **expandable list — each icon opens a text bar:**

| Project | Component | Notes |
|---|---|---|
| Ventilated patients / Ministry of Health | `TITLES & ICONS` → text bar | ~70,000 ventilated patients depend on power; post–Oct 7 the Ministry tasked CENTRA with deploying generators + a 24/7 emergency support center. |
| Leumit / HMO network | `TITLES & ICONS` → text bar | TV installations. **Copy still placeholder.** |
| Schools / Ministry of Education | `TITLES & ICONS` → text bar | All installations, projectors, TVs. **Copy still placeholder.** |
| Secret project | `TITLES & ICONS` → text bar | Shown **CENSORED** — *"Top secret! But if our relationship deepens… maybe we'll share."* |
| Contact form | `CONTACT FORM` | *"Got a big project on your desk?"* Fields: Company name · Few words about the project · Mobile. |

---

## ⚠️ Open Items / Risks
- **Client-supplied assets pending:** hero 3D device + animation, Israel coverage map, several icons.
- **Open placeholders:** 2 unnamed expertise cards on Inner Page 2 (`X?`); 2 Inner Page 3 project blurbs still rough.
- **Two non-standard components** beyond stock Webflow blocks: the **animated exploded-device hero** and the **warranty serial-number lookup** (needs backend/catalog connection — clarify).
- **RTL Hebrew**, **animated counters**, and a **moving logo gallery** — scope into per-page effort.

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `sales/noam-nizrad-<change>`
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
