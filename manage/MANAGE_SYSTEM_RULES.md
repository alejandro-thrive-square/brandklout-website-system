# Manage Microsystem: Rules & Objectives

The Manage Microsystem handles the "back-office" operations of the agency, ensuring financial stability, legal compliance, and smooth internal workflows.

> [!IMPORTANT]
> **Microsystem Documentation Rule**: Whenever an update is made to the Manage logic, scripts, or operational structures, this markdown file and all relevant files within the `manage/` directory **MUST** be updated to reflect the changes.


## 1. Mission Statement
To provide a frictionless operational backbone for the agency, automating administrative overhead so the team can focus on sales and delivery.

## 2. Key Integrations
| Tool/API | Usage |
| :--- | :--- |
| **Upwork API** | Managing contracts, payroll, and milestones. |
| **QuickBooks / Xero** | Financial tracking and tax preparation. |
| **Stripe API** | Payment processing for direct clients. |
| **DocuSign / HelloSign** | Automated contract signing and storage. |
| **Slack API** | Internal notifications and team communication. |

### 2.1 MCP Access
Manage MCP usage is usually `agency` or `workflow` scoped and may involve sensitive operational, financial, legal, or internal systems. Before using any MCP in Manage, agents must read [../mcp-servers/ACCESS_MODEL.md](../mcp-servers/ACCESS_MODEL.md), the closest applicable `mcp-access.md` when one exists, and the referenced profile in `mcp-servers/profiles/`.

Any Manage workflow that uses MCPs for payments, contracts, finance, HR, internal communications, access control, or production operations must include a workflow-level `mcp-access.md`. Billing, refunds, contracts, payroll, access changes, public notifications, and production changes require explicit confirmation.

## 3. Core Responsibilities
- **Finance**: Tracking revenue, expenses, and profit margins.
- **Legal**: Managing client contracts and non-disclosure agreements (NDAs).
- **Human Resources**: Payroll processing and freelancer onboarding.
- **Knowledge Management**: Keeping system documentation (like these rules) up to date.
- **Asset Management**: Hosting the global hub for all agency brand assets.

## 4. Global Brand Assets
To ensure brand consistency across all pillars, all agency-related graphics, logos, and videos are stored in a centralized hub:
- `manage/brand-assets/`: The primary repository for all Webzite brand materials.
- **Usage**: Sales, Growth, and Deliver microsystems must extract assets from this folder for outreach, redesigns, and client delivery to maintain a unified brand identity.
- **Updates**: Any change to the brand identity (new logo, updated color palette) must be reflected here first.
- **Version Control**: All files in this directory are stored on the **VPS** (source of truth) and synced from local via `rclone` (SFTP). They are gitignored and never committed to the repository.

## 5. Global Management Constraints
- **Data Privacy**: All sensitive financial and legal data must be handled with strict confidentiality.
- **Compliance**: Ensure all tax and employment regulations are followed across different jurisdictions.
- **Audit Trail**: Every financial transaction must be documented and reconcilable.
- **Pricing Source of Truth**: Invoicing, revenue forecasting, and margin tracking must use the canonical per-page rates in [PRICING_TIMELINE_RULES.md](../sales/PRICING_TIMELINE_RULES.md). This keeps Manage consistent with what Sales quotes and Deliver schedules.

## 6. Active Workflows
- **Global Brand Assets Hub**: Central repository for all agency-related graphics and videos.

## Version Control
- This microsystem is part of a **GitHub repository**. All changes must follow the version control rules defined in [SYSTEM_RULES.md — Section 4](../SYSTEM_RULES.md).
- **Never commit**: `.env` files, secrets, or binary/media assets. Lightweight `.tmp/` artifacts may be committed when useful; heavy assets remain on the VPS.
- **Branch naming**: `manage/<description>` (e.g., `manage/brand-refresh`).
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.
- **Brand assets** (`manage/brand-assets/`): Stored on VPS, synced via `rclone`. See Section 4 above.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
