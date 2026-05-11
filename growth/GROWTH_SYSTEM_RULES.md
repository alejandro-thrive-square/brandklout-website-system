# Growth Microsystem: Rules & Objectives

The Growth Microsystem focuses on "top-of-funnel" activities: capturing attention, creating upfront value, and scaling the agency's presence through content and automated outreach.

> [!IMPORTANT]
> **Microsystem Documentation Rule**: Whenever an update is made to the Growth logic, scripts, or workflows, this markdown file and all relevant workflow files within the `growth/` directory **MUST** be updated to reflect the changes.


## 1. Mission Statement
To create a "magnet" effect for the agency by providing instant value (like free redesigns or audits) and maintaining a high-authority digital presence.

## 2. Key Integrations
| Tool/API | Usage |
| :--- | :--- |
| **Vercel** | Rapid deployment of "Value-In-Advance" demo sites. |
| **Screenshot APIs** | Capturing client sites for comparison and critique. |
| **Webflow API** | Managing the agency's primary site and landing pages. |
| **Instantly / Lemlist** | Scaling cold email campaigns. |
| **Canva / Adobe API** | Automating social media graphic generation. |

## 3. Core Strategies
- **Value-In-Advance**: Instead of a cold pitch, send a link to a personalized redesign.
- **Dynamic Content**: Auto-generating blog posts or social snippets based on trending industry topics.
- **Scrape & Critique**: Identifying poorly designed sites and automatically generating a "Design Audit" report.

## 4. Global Growth Constraints
- **Speed**: Growth workflows must be fast. A redesign demo should be ready within minutes of a lead being identified.
- **Design Excellence**: Every output must adhere to the "Webzite Premium" aesthetic (no generic templates).
- **Attribution**: Every growth activity must be tracked to a specific source (campaign, scraper, etc.).

## 5. Active Workflows
- [Form Scrape & Redesign (Vercel)](./form-scrape-redesign-vercel-email/form-scrape-redesign-vercel-email.md)

## Version Control
- This microsystem is part of a **GitHub repository**. All changes must follow the version control rules defined in [SYSTEM_RULES.md — Section 4](../SYSTEM_RULES.md).
- **Never commit**: `.env` files, secrets, or binary/media assets. Lightweight `.tmp/` artifacts may be committed when useful; heavy assets remain on the VPS.
- **Branch naming**: `growth/<description>` (e.g., `growth/redesign-pipeline`).
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS