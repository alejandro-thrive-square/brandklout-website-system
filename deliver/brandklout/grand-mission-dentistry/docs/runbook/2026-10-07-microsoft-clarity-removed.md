# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- GTM container **GTM-KXWLKSK2**: tag `Microsoft Clarity - Official` (project `y8fksihyz0`) deleted and **published as version 3**. It never ran: the site does not load this container.
- Found: grandmissiondentistry.com carried only a `<noscript>` iframe, and it named **Livewell's** container GTM-KL36RQV2. The `<script>` half of its own container was never installed, so GA4 (`GA4 - Global Tag`, `G-VP1WFFBLYF`) did not run.
- **Fixed the same day and published (user approved), 21:10 UTC:** site head custom code now has GTM-KXWLKSK2's script right below the Termly block (Marvel's layout); the footer `<noscript>` names GTM-KXWLKSK2. Verified on the live home and /about-us. GA4 now runs under Termly's Consent Mode: before a choice it sends cookieless pings (`gcs=G100`, no `_ga` cookie). GA4 follows the hardened rules in `termly-ghl-consent.md` on main.
- **The publish also shipped an unpublished Designer edit from 07:38 UTC** that nobody here saw. The home page diff shows only the GTM lines, so it is on another page.

## Next

- The user deletes the Clarity project `y8fksihyz0` (Settings > "Eliminar este proyecto"); the
  permission checks stopped an agent from doing it.
- Never add Clarity back, in GTM, as a site script or as the Webflow app. `consent-kit.mjs check`
  fails on any `clarity.ms` request.

## Gotchas

- Deleting or disconnecting a Clarity project does not take the tag off the site; the tag lives in GTM.
  Clarity's own Disconnect button failed ("try again later").
- Verify from outside: `https://www.googletagmanager.com/gtm.js?id=<GTM-ID>` must not contain `"vtp_projectId"`.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
