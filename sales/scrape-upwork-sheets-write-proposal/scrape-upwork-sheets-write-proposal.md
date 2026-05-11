# Workflow: Scrape Upwork, Sync Google Sheets & Write Proposal

## 1. Overview
This workflow automates the discovery of high-quality Upwork jobs. It scrapes job posts matching specific criteria, logs them into a Google Sheet, and automatically drafts a personalized proposal for each qualified entry.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.


## 2. Technical Stack
- **Scheduler**: Cron job (every 2 hours)
- **Scraper**: Apify (Upwork Scraper Actor)
- **Database**: Google Sheets (via Google Sheets API)
- **Logic**: Python (Executor) + GPT-4o (Proposal Writer)
- **Notifications**: SendGrid / Gmail API

## 3. Execution Steps

### Step 1: Upwork Scraping
- Trigger the Apify actor to search for keywords (e.g., "Webflow", "Next.js", "AI Automation").
- Filter for jobs posted within the last 2 hours.
- Only include jobs with "Payment Verified" and a budget > $500 (unless specified otherwise in the daily prompt).

### Step 2: Google Sheets Sync
- Connect to the `Agency Leads` Google Sheet.
- Check for duplicates (using `Job ID`).
- Append new job entries: `Title`, `Description`, `Budget`, `Post Date`, `Link`.

### Step 3: Proposal Generation
- For each new entry, analyze the job description.
- Select the most relevant **Proposal Template** (e.g., *Fixed Price*, *Hourly*, *Maintenance*).
- Draft a personalized proposal referencing the client's specific requirements and our portfolio.
- Write the drafted proposal back into the `Proposal` column of the Google Sheet.

### Step 4: Notification
- Send an email summary to the admin with the top 5 job posts and their drafted proposals.

## 4. Error Handling
- **Scraper Blocked**: Rotate proxies or notify admin to update session cookies.
- **Sheets API Limit**: Implement exponential backoff for API calls.
- **Low Match Score**: If a job description is too vague, mark it as "Manual Review Needed" in the sheet.

## 5. Output Artifacts
- `sales/scrape-upwork-sheets-write-proposal/.tmp/last-scrape-[timestamp].json`
- `sales/scrape-upwork-sheets-write-proposal/.tmp/proposed-leads.csv`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md — Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/upwork-proposal-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS