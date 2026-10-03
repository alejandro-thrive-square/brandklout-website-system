# 2026-10-03 — GoHighLevel lead-form standard: guide, Codex template, `--standard` gate

## Done
- **Guide** `deliver/process/tools/ghl-forms/README.md`: the standard every Brandklout GHL lead form
  follows (service dropdown, optional two-box SMS consent with the legal name, real Privacy Policy /
  Terms of Service links, 11 hidden consent fields, save-and-exit off), the steps and the gotchas.
  Language dropdown is **not** standard (only on client request). Row in `PROCESS_INDEX.md`.
- **Codex template** `tools/ghl-forms/codex-instruction.txt`: fill the `{{…}}` and run with
  `codex_cu.mjs --allow-writes`.
- **Gate** `termly-ghl-consent/gates/check-ghl-form.mjs --standard [--origin <https://www.…>]`:
  fails on no service dropdown, no Terms & Conditions element, a required consent box, the
  `[BUSINESS NAME]` template text, and Privacy/Terms links missing, on `example.com` or off the origin.
  Without `--standard` it behaves as before.
- Proven both ways: Grand Mission `HHUjLT7QwNmfVq4yjxw5` passes; Mason Park `JuzM9SxuJMPDMwfO6cgj`
  failed 4 problems before the Codex run and passes after it (details in the Mason Park runbook).

## Next
- Bring the other clients' lead forms to the standard: run the gate over each form id in the
  client runbooks, then the template per failing form.

## Gotchas
- A dropdown's options live on the location's custom field, so editing a reused field changes
  every form that uses it.
- The gate reads the public `__NUXT_DATA__`; it needs no login and submits nothing.

## Update (later 2026-10-03): model spec, snapshot route, sweep
- README now has Grand Mission's form field by field (keys, placeholders, required flags), the
  snapshot route for copying custom fields between sub-accounts, the open questions for the owner,
  and a gate sweep of all 25 client contact forms (5 pass, 19 fail, Atwood's form id is gone).
- Codex read-only probe: agency user; **Account Snapshots** with selective asset load is the copy
  route; snapshot **GMD Copy** (Grand Mission, 124 assets) already exists and is linked to Mason Park.
  Custom Fields page has no import/export; form *Actions* has *Share* (untested), no copy-to-sub-account;
  Marketing > Ad Manager is ads only.
- **Next:** owner settles the open questions against the reference video; then one end-to-end test
  (snapshot load of the Consent fields + Treatment Type into Azusa or Elite, both 0/11) with approval.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
