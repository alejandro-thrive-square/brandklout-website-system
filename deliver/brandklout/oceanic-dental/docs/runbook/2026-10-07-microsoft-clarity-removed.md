# 2026-10-07 — Microsoft Clarity removed from this site

Fleet-wide removal of Microsoft Clarity from every Brandklout client site (no BAA; Clarity's terms and
the Additional Terms accepted for a Health & Wellness project forbid health data). Whole story,
every site and the rule: `.claude/runbook/2026-10-07-microsoft-clarity-removed.md` on main.

## Done

- GTM container **GTM-TRLRFSTH**: tag `Microsoft Clarity - Official` (project `ytk9gemvci`) deleted and **published as version 5**. Tag still there: `Full Site`.
- Second copy: the **Microsoft Clarity Webflow app** (project `r28in9vt9l`, `clarity_script-7.9.5.js`). Uninstalled in Webflow Site settings > Apps & Integrations > Connected Apps (Codex), then the Webflow site was **republished** 2026-10-07 20:32 UTC to both domains.
- **That publish also shipped an unpublished Designer edit from 2026-10-06** (site `lastUpdated` 18:06 UTC) that nobody here could see. The user approved publishing anyway. If something changed on the live site that day, that edit is why.
- Custom code left on the site: Termly resource blocker, font-smoothing CSS, Sienna widget, Google Ads tag `AW-16451602888`, BrandkloutConsentBridge 2.2.0, OceanicDNI 2.0.0, the GTM noscript.

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
