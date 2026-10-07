# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- GTM container **GTM-KXWLKSK2**: tag `Microsoft Clarity - Official` (project `y8fksihyz0`) deleted and **published as version 3**. It never ran: the site does not load this container.
- Still open: grandmissiondentistry.com carries only a `<noscript>` iframe, and it names **Livewell's** container GTM-KL36RQV2. The `<script>` half of its own container is not installed, so GA4 (`GA4 - Global Tag`) does not run either.

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
