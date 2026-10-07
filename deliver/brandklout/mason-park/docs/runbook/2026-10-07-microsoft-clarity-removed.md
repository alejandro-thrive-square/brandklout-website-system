# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- Started here: the client added Clarity to GTM and asked whether it ran and whether it is HIPAA-compliant. It was **not running** (www.masonparkdental.com loads no GTM container) and is **not compliant** (no BAA; Clarity's terms and the Additional Terms forbid health data).
- GTM container **GTM-MR4RPBP3**: tag `Microsoft Clarity - Official` (project `yto9x2cvdi`) deleted and **published as version 3**. The container now has no tags.
- The old site's container GTM-KWL239K7 has no Clarity; its Google Ads conversion and GA4 tags are not on the new site either (matters if Mason Park runs ads).

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
