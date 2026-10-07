# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- GTM container **GTM-KBG9XX2** (an older ifadentistry.com container in the DriveRank account): Custom HTML tags `MS Clarity - Base Tag` (project `xarlv0sa1e`) and `MS Clarity - Button Clicks` deleted and **published as version 6**. Never live: no IFA page loads this container (IFA runs GTM-5XR78DN7, which has no Clarity); www and apex pages rendered with no `clarity.ms` request.
- Tags still in GTM-KBG9XX2: `G4 - Event - Get Directions`, `GA4`, `GA4 - Survey Slide Form`, `Google Analytics GA4 Configuration`, `Google Tag G-TR581MJF97`, `Slide_Observer`.

## Next

- Deleting the Clarity project(s) (which deletes the recordings, as the Additional Terms require) is
  the user's call and was not done.
- Never add Clarity back, in GTM, as a site script or as the Webflow app. `consent-kit.mjs check`
  fails on any `clarity.ms` request.

## Gotchas

- Deleting or disconnecting a Clarity project does not take the tag off the site; the tag lives in GTM.
  Clarity's own Disconnect button failed ("try again later").
- Verify from outside: `https://www.googletagmanager.com/gtm.js?id=<GTM-ID>` must not contain `"vtp_projectId"`.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
