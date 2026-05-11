# Offer: Migration to Webflow (WordPress / Shopify)

## 1. Overview
This offer applies when a client has an existing website on WordPress or Shopify and wants to migrate it to Webflow. The scope includes rebuilding the site in Webflow, migrating all CMS content (blog posts, products, portfolio items, etc.), and ensuring nothing is lost in the transition. The deliverable is a fully functional Webflow site with all existing content migrated.

## 2. Client Profile
- Currently on WordPress (self-hosted or WordPress.com) or Shopify.
- Wants to move to Webflow for easier management, better design control, or reduced maintenance overhead.
- Has existing content: blog posts, CMS collections, product pages, or portfolio entries that must be preserved.
- May or may not want a visual redesign as part of the migration.
- Typical Upwork keywords: "WordPress to Webflow", "Shopify to Webflow migration", "migrate my website to Webflow", "rebuild WordPress site in Webflow".

## 3. Scope of Work

### Phase 1: Audit & Migration Plan
- Full audit of the existing site: pages, CMS content types, plugins/apps, integrations, and custom functionality.
- Content inventory: count of blog posts, CMS items, media assets, and any structured data.
- Identify functionality that needs to be replicated, replaced, or dropped in Webflow.
- Define URL structure and 301 redirect map to preserve SEO equity.
- Agree on scope: is this a 1:1 rebuild or a redesign on top of the migration?

### Phase 2: Webflow Build
- **If 1:1 rebuild**: Recreate the current design in Webflow as closely as possible.
- **If redesign**: Follow the "Development from Scratch" design process (moodboard, Figma, approval) before building.
- CMS architecture: define collections, reference fields, and template pages in Webflow.
- Responsive implementation across all breakpoints.
- Rebuild or replace key functionality (contact forms, newsletter signups, search, filtering).

### Phase 3: Content Migration
- Export all CMS content from WordPress/Shopify (posts, pages, products, categories, tags, authors).
- Clean and format content for Webflow CMS import (CSV preparation, rich text formatting).
- Migrate all blog posts / articles with their metadata (title, slug, date, author, category, featured image, body content).
- Migrate media assets (images, documents) and re-link them in Webflow.
- Handle content relationships (categories, tags, related posts) using Webflow reference and multi-reference fields.
- For Shopify: migrate product data, collections, and variants. Integrate Webflow with Shopify or set up Webflow Ecommerce if applicable.

### Phase 4: SEO & Redirects
- Implement 301 redirects for every existing URL that changes.
- Preserve meta titles, descriptions, and Open Graph data.
- Submit updated sitemap to Google Search Console.
- Verify no broken links using a crawl tool.

### Phase 5: QA & Launch
- Cross-browser testing (Chrome, Safari, Firefox, Edge).
- Content accuracy check: verify migrated content matches the original.
- Performance optimization.
- Client walkthrough of Webflow Editor and CMS management.
- Domain DNS switch and launch.
- Post-launch monitoring for 48 hours to catch any redirect or indexing issues.

## 4. What the Client Needs to Provide
- Admin access to the existing WordPress or Shopify site (or a full export of all content).
- Access to domain registrar for DNS configuration.
- List of any plugins, apps, or integrations that must be replicated.
- Clarification on whether this is a 1:1 rebuild or includes a redesign.
- Approval on the redirect map before launch.

## 5. Pricing Model
- **Rebuild portion**: $200 / page development per [PRICING_TIMELINE_RULES.md](../../../PRICING_TIMELINE_RULES.md).
- **If redesign is included**: add $200 / page design (full $400 / page formula applies to the redesigned pages).
- **Migration-specific work** is quoted separately (not covered by the per-page rate):
  - Audit & migration plan
  - Content export, cleanup, and import
  - 301 redirect map and SEO preservation
- Content migration is included in the migration-specific quote, not the per-page rate.

## 6. Timeline Estimate
- **Rebuild duration = pages × 1 day** (dev only) or **× 2 days** (if redesign is in scope).
- **Migration-specific work** (audit, content export/import, redirects) is scheduled separately based on content volume.
- See [PRICING_TIMELINE_RULES.md](../../../PRICING_TIMELINE_RULES.md) for the canonical per-page rule.

## 7. Differentiators
- No content left behind. Every blog post, every CMS item, every media asset is accounted for.
- SEO-first migration: 301 redirects and metadata preservation are non-negotiable, not an afterthought.
- Clean Webflow CMS architecture designed for long-term scalability.
- Post-launch monitoring included to catch issues early.
- Experience with both WordPress and Shopify ecosystems, understanding what translates to Webflow and what needs a different solution.

## 8. Risks & Mitigations
| Risk | Mitigation |
| :--- | :--- |
| SEO traffic drop after migration | Comprehensive redirect map and metadata preservation. Post-launch Search Console monitoring. |
| Content formatting issues in rich text fields | Manual QA pass on migrated content. Use Webflow's rich text import tools and clean up edge cases. |
| Plugin functionality has no Webflow equivalent | Identify during the audit phase. Propose alternatives (native Webflow, third-party integrations, or custom code). |
| Large content volume delays the timeline | Automate CSV-based imports where possible. Set realistic timelines upfront based on content inventory. |
| Client discovers new requirements mid-migration | Scope is locked after the audit phase. New requirements are handled as change orders. |

## Version Control
- All changes to this offer must follow the version control rules in [SYSTEM_RULES.md -- Section 4](../../../../SYSTEM_RULES.md).

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
