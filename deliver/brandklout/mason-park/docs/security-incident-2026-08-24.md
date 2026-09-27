# Mason Park Dental — Website Security Incident

Date prepared: 2026-08-24
Site affected: bestdentistinkatytx.com (the practice's existing WordPress site on SiteGround)
Audience: Brandklout team — written to be readable by non-technical stakeholders

The full technical record — malware indicators, the decoded payload, and the evidence behind every
claim here — is in `.claude/RUNBOOK.md` in the `bk-mason-park` worktree.

## Summary

### Problem

The practice's website was broken into and is actively attacking its own visitors right now. A fake
plugin installed on the site secretly adds a hidden full-screen overlay to the homepage,
impersonating a Cloudflare "verify you are human" check. It tries to trick patients into pasting a
command into their own Windows PC, which installs a password stealer on their machine.

Separately, the attacker left back-door files that give them ongoing access. SiteGround found those,
disabled them, and will suspend the site around 26 August. They did not find the fake plugin, which
is why the attack is still running.

### Solution

Take the site offline today. Restore from a backup made before the break-in — files and database.
Then update everything and change all passwords before it goes back up.

We now know exactly which plugin is doing it, so we can also stop the attack within a minute if we
don't want to wait for the restore.

## Details

### How it happened

Someone installed a plugin called "Advanced Content Toolkit." It's fake. Everything about it is
disguise:

- Its folder name ends in random characters — advanced-content-toolkit-d163-3d94 — which real
  plugins never do
- It lists its author as "Core Team" and links to the official WordPress developer site,
  impersonating WordPress itself
- Its description is meaningless filler: "Streamlined monitoring and analytics dashboard and tools"
- It doesn't exist in the official WordPress plugin directory at all

That plugin injects a hidden script into the homepage. The script pulls its instructions from a
cryptocurrency blockchain, which is a deliberate choice — that address can't be taken down or
blocked, so the attacker can redirect every infected site whenever they like.

The attacker also installed four back-door files in a hidden system folder, plus a scheduled task in
the site's database that runs every fifteen minutes.

### Why it happened

We still don't know how they first got in, and I don't want to guess in front of the client.

The most likely explanation remains out-of-date add-ons. The site is running 35 active plugins with
12 pending updates, several of which have had serious publicly known security holes. That's the
leading theory, not a proven finding.

What I can now explain is why nobody caught it for so long. This was built specifically to hide from
the people who would look:

- It switches itself off for anyone logged into WordPress. I proved this — requesting the homepage
  as a normal visitor returns the attack code; requesting the exact same page while logged in as an
  admin returns a clean page. Staff literally cannot see it.
- It only shows once per visitor per 90 days, using a cookie disguised to look like a WordPress
  performance setting.
- It detects developer tools and shuts down if anyone tries to inspect the page.

It also faked its own file dates — one back-door file claims to be from February 2022, copying the
date of a legitimate file next to it so it wouldn't stand out.

That's the honest reason our first checks came back clean, and why a free security scanner reported
the site as healthy while all of this was running.

### How to solve it

Step 1 — Stop the attack today. Deactivating that fake plugin should halt the visitor attack
immediately. I can verify within seconds whether it worked, using the same anonymous test that found
it. Screenshot the plugin first so we keep the evidence.

Better still, take the whole site offline. Every hour it's up, patients are exposed.

Step 2 — Tell SiteGround the four file names and the plugin name, and that the attack continued
after they disabled the files. Their system currently believes this is handled.

Step 3 — Restore from backup, files and database together.

On the date — one check settles it. In File Manager, open wp-content/plugins/ and look at the date
on the advanced-content-toolkit-d163-3d94 folder. That's when they installed it. Please grab that
before we choose.

Be aware the dates may be faked — they already faked them on the back-door files. So treat it as a
clue, not proof.

Failing that, my recommendation from what we know:

- The site's error log shows normal activity through 19 August
- Both practice domains were completely offline 20–23 August, unexplained
- SiteGround's warning arrived on the 23rd

I'd restore to early August at the latest — well before that window, with real margin. SiteGround
keeps 30 daily backups, so we can go back further if needed.

We won't lose content by going back: I've already taken a complete copy of the site — all 252 pages
and their images — so anything published since can be restored from our copy.

Step 4 — Verify properly. This one matters. You cannot check the fix by loading the site and looking
at it. A clean-looking page is exactly what the malware is designed to show you. Verification has to
be an anonymous request from a fresh browser with no cookies — I can run that check directly.

Step 5 — Updates and passwords before it goes public again.

### How to prevent it

- Install the 12 pending updates, and keep them current. Highest-value single change.
- Cut the plugin count. 35 active plugins on a dental practice site is far more than it needs, and
  each one is a way in. Remove anything unused — including the file-manager plugin, which shouldn't
  live on a site permanently.
- Review the plugin list against the official directory. Anything that isn't listed there, or has a
  vague author like "Core Team," gets investigated. That single habit would have caught this.
- Change every password and enable two-factor authentication on admin accounts.
- Disconnect the old remote-management tool nobody has used since 2022.
- Check the second site, pediatricdentistkatytx.com — it may share the hosting account and went
  offline in the same window.
- Put someone on ongoing maintenance. This is what an ageing, unattended site eventually looks like.

## Our own work is unaffected

The Webflow landing pages we are building for Mason Park sit on entirely separate infrastructure
(mason-park-dental.webflow.io, staging only, no custom domain). Nothing we have built touches the
practice's hosting, and a suspension would not affect it.

We hold no SiteGround, DNS, or FTP credentials for this client, so the cleanup itself has to run
through whoever owns the SiteGround account.

## Version Control

This document follows the root-level version control rules in
[SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). It is a point-in-time incident record for
2026-08-24 — update it in place as the incident progresses rather than creating dated copies, and
keep the technical detail in the `bk-mason-park` worktree runbook rather than duplicating it here.
