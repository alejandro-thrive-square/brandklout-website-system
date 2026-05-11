# Workflow: Form Scrape & Redesign (Value-In-Advance)

## 1. Overview
This workflow automates the "Value-In-Advance" prospecting strategy. It triggers when a potential client submits a Webflow form, scrapes their existing site, generates a high-end redesign, and emails them a Vercel preview.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.


## 2. Technical Stack
- **Trigger**: Webflow Webhook (Form Submission)
- **Scraper**: Playwright / Puppeteer (via Apify or custom)
- **Design Logic**: GPT-4o Vision (Analysis) + Component Library
- **Deployment**: Vercel CLI / API
- **Email**: Postmark / Resend / Gmail API

## 3. Execution Steps

### Step 1: Data Extraction
- Extract `website_url`, `client_name`, and `client_email` from the Webflow webhook payload.
- Validate the URL and ensure it's reachable.

### Step 2: Site Analysis & Scraping
- Scrape the homepage of the provided URL.
- Capture high-resolution screenshots for comparison.
- Analyze the site against the `growth/reference-designs/` folder. Identify 3 key weaknesses (e.g., poor typography, lack of hierarchy, weak CTA).

### Step 3: Rapid Redesign
- Redesign the homepage using the approved **Component Library**.
- Ensure the redesign addresses the weaknesses identified in Step 2.
- Save all generated assets (HTML, CSS, Images) in the `.tmp/redesign-[client-name]/` folder.

### Step 4: Deployment
- Deploy the `.tmp/redesign-[client-name]/` folder to Vercel.
- Capture the live preview URL (e.g., `webzite-redesign-client.vercel.app`).

### Step 5: Outreach
- Populate the `Value-In-Advance` email template with the client name and the Vercel link.
- Send the email and log the activity in the CRM.

## 4. Error Handling
- **Invalid URL**: Notify admin if the provided link is broken.
- **Scrape Failure**: Retry once; if failed, use a generic high-end demo related to their industry.
- **Vercel Error**: If deployment fails, send the email with a Figma prototype link instead.

## 5. Output Artifacts
- `growth/form-scrape-redesign-vercel-email/.tmp/analysis-[id].json`
- `growth/form-scrape-redesign-vercel-email/.tmp/redesign-[id]/`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md — Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `growth/redesign-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS