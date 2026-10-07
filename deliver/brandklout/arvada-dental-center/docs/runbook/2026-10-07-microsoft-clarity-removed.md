# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- GTM container **GTM-P8ZNXG6K** (www.arvadadentalimplants.com): tag `Microsoft Clarity - Official` (project `y8fi4guaj6`) deleted and **published as version 5** "Remove Microsoft Clarity". The morning session had missed this site.
- www.arvadadentalcenter.com (GTM-5LLWM9C4) never carried Clarity.
- Tags still in the container: `GA4 - Global Tag`, `GA4 Event - appointment_click`.

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
