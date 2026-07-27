---
name: excellent-facets-fr-update
description: Excellent Facets Webflow site — French (/fr) v1 update project, site ID, structure quirks, and staging status
metadata:
  type: project
---

Excellent Facets is a returning Webflow client. Site ID `667ba12b8def17ce19a9419b`, domains `excellentfacets.com`/`www`, MCP instance `webflow-excellent-facets`. Access file: `deliver/excellent-facets/docs/mcp-access.md`.

**Structural quirk:** the site does NOT use Webflow Localization. French pages are static duplicates inside a `/fr` page folder (folder ID `669522a57de2e7a5053e4e4b`), each with its own Navbar Fr / Footer Fr / Section Synthetic Fr / Cookie Consent Fr / Section Logos component instances. Never use `data_localization_tool` locale IDs here — edit the `/fr` pages directly.

**2026-07 project:** applied the "/fr v1" update spec (`deliver/excellent-facets/EXCELLENT FACETS — Website Update Spec, páginas francesas (_fr) · v1.md`). Detailed element-ID progress log in `deliver/excellent-facets/workflows/01-fr-update-v1/.tmp/page-inventory.md`. All 17 sections applied to STAGING only — **nothing published yet** pending client confirmation.

**Reusable Webflow-MCP technique learned:** to clone Webflow-native elements the element_builder can't create (SliderSlide, DropdownLink, timeline items, HtmlEmbeds), `transform_element_to_component` (replace:false) on an existing instance → `insert_component_instance` → `unlink_component_instance` → `unregister_component`. The builder pollutes new elements with stray combo classes — always re-run `set_style` after building. `set_text` works on String child nodes, not on plain div Blocks.

**Manual/client items still open:** (1) 301 redirect `/fr/fancy-color-diamonds`→`/fr/fancy-color-melee-diamonds` (old page drafted); (2) Vendor Code of Conduct file swap on /fr/human-rights; (3) team photos for Nathan Bensoussan & Nathalie Bonvin on /fr/about (placeholders); (4) 2024 Sustainability Report PDF download on /fr/sustainability.

## Version Control

This memory note follows the root-level version control rules in [SYSTEM_RULES.md](../SYSTEM_RULES.md). It contains project continuity context only and must not include secrets or credentials.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
