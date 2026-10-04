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

## Update (evening 2026-10-03): Mason Park test, landing rule, styling
- **Gate** `check-ghl-form.mjs --standard` now also takes `--landing` (no service dropdown, must
  redirect), `--legal` (both consent boxes name the legal name), `--location` (form lives in the
  practice's own sub-account), checks for two consent boxes and that a submit redirect answers 200.
- **Styling** is part of the standard: new `tools/ghl-forms/site-style.mjs` reads the site's fonts,
  colours, button and radius with headless Chrome (no deps) and `--compare <formId>` diffs a form.
- **Mason Park, every form gated** (`9tm8C3iReDUyrhdV01Kd`): contact `JuzM9…` ok (style off: Inter
  vs Nunito Sans); Invisalign `jRr3…` and New Patient Special `jEXt…` (live on `/ads-landing-pages/`)
  fail: no consent element, no links, redirect to 404 `/thank-you-*`; `/appointment` `9tzF…` has one
  consent box; the two old Google Ads forms `YbX9…` `AFu5…` live in **Grand Mission's** location and
  link to its privacy pages (off the site since 2026-09-25, still exist).
- **The write test did not complete.** Codex run 1 lost the tab ("Debugger unattached"), run 2 died
  in an internet outage, run 3 failed with "Unable to load browser request-header policy" /
  missing native-host registration in the ChatGPT Chrome plugin. Claude in Chrome then froze on the
  GHL builder. Nothing was saved: the gate shows both landing forms unchanged.

## Next
- Reinstall/reconnect the ChatGPT Chrome plugin, then rerun the three Codex instructions (Invisalign
  landing + styling, New Patient landing + styling, contact styling only); prompts are rebuilt from
  `codex-instruction.txt` with the values in the README's Styling section.
- Owner: settle the open questions against gauge@'s video.

## Update (night 2026-10-03): Mason Park write test done
- After the outage the ChatGPT Chrome plugin failed on its Statsig load (~5 MB in a 10 s limit at
  ~1 MB/s); it worked again once the line was back at ~4.4 MB/s.
- **Invisalign `jRr3…` and New Patient Special `jEXt…` now pass** `check-ghl-form --standard --landing
  --legal --location` and `site-style --compare` (Codex, fresh tabs, gpt-6.1-sol).
- **Contact `JuzM9…` styling half done:** the run died on "workspace is out of credits"; labels are
  Nunito Sans, inputs still Inter. Fields still pass the standard.
- **Next:** refill Codex credits; rerun the contact styling-only instruction; polish pass on all three
  (consent box sizes, stray `*`, link colour, spacing); add the run to Mason Park's runbook on
  `bk-mason-park` (client folders are not edited on main); close BugHerd #256.

## Update (late night 2026-10-03): polish pass, all three Mason Park forms pass
- Credits refilled. **Contact `JuzM9…`, Invisalign `jRr3…`, New Patient `jEXt…`** all pass the gate
  (`--landing` for the two ad forms) and `site-style --compare`; consent text 14px on both boxes,
  links `#545F62` underlined, 16px field spacing.
- **Incident:** a labels-off run on Invisalign exposed the 11 hidden consent fields on the live form;
  caught on a full-height render, reverted by the next run (~20 min live). Gate now fails labels-off.
- One Codex run failed with "no callable node_repl js tool" (it skipped tool discovery); a rerun with
  "load the Node REPL js tool via tool discovery" in the prompt worked.
- **Open:** stray `*` above Invisalign's Name (Name is required; optional in the model and on New
  Patient) — owner decision. On /contacts the captcha sits below the Submit button (GHL order).

## Update (2026-10-04, early): labels standard, captcha above Submit, cheapest model, auto resets
- Owner: **visible labels on every form** (like /contacts) and **captcha above Submit**; both consent
  boxes one size. Gate fails unlabeled fields and captcha-below-submit; `site-style --compare` measures
  the two boxes' rendered sizes.
- All three Mason Park forms pass gate + style (Invisalign/New Patient: Name, Phone, Email, Message
  labels; /contacts: captcha moved). Done on `gpt-6-luna`, the cheap default; it handled builder edits.
- **`codex-computer-use/codex-limits.mjs`** reads ChatGPT usage and spends reset credits via the app
  server's JSON-RPC; `codex_cu.mjs` now resets automatically on a usage limit and retries once.
  2 credits available, 5h window 78% used at the end.
- Gotcha: the wrapper prints `limit reached: false` on stderr, so a shell grep for "limit reached"
  in its output false-positives. Grep the session.log `error`/`turn.failed` lines instead.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
