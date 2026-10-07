# 2026-10-07 — Microsoft Clarity removed from every client site, and banned

A Mason Park session (bk-mason-park, same morning) checked whether a newly added Clarity tag ran and
whether Clarity is HIPAA-compliant. It is not: Microsoft signs no BAA for Clarity, its Terms of Use
bar "health care" content, and the Additional Terms accepted for a Health & Wellness project warrant
that no PHI or state-law health data is processed, with an indemnity. A Termly consent tag would hold
it back but not make it allowed. That session found Clarity recording, before consent, on five sites
and removed it from two (Legacy, Livewell) before a permission check stopped it. This run finished
the rest and swept the whole Webflow workspace for any it had missed.

## Done

All removals were in **Google Tag Manager** (account success@driverank.com, via Codex computer use).
Each container's Workspace Changes held only the Clarity deletion before it was published, as version
"Remove Microsoft Clarity" ("Clarity removed: HIPAA, no BAA").

| Site | GTM container | Clarity project | Result |
| --- | --- | --- | --- |
| Legacy Dental Pasadena | GTM-TTLFRPH2 | wr2l9djfgj | removed (morning session, v4) |
| Livewell Dental | GTM-KL36RQV2 | y8ffrssqd2 | removed (morning session, v5) |
| Marvel Dental | GTM-5SCTDG7V | y804rgzb7s | deleted in the morning, **published here** (v4) |
| Oceanic Dental | GTM-TRLRFSTH | ytk9gemvci | removed (v5) |
| Oceanic Dental (Webflow app) | — | r28in9vt9l | app uninstalled, Webflow site republished 20:32 UTC |
| Ortega Cottage Dentistry | GTM-5FRXDPVW | y8fmwn3wq5 | removed (v4) |
| Arvada Dental Implants | GTM-P8ZNXG6K | y8fi4guaj6 | removed (v5); **missed by the morning session** |
| Omnia Dental Chino Hills | GTM-WKCVS9K9 | y8fluiu9sd | removed (v4); **missed by the morning session** |
| Grand Mission | GTM-KXWLKSK2 | y8fksihyz0 | removed (v3); never ran, the site doesn't load it |
| Mason Park | GTM-MR4RPBP3 | yto9x2cvdi | removed (v3); never ran, the site loads no GTM |
| IFA (old container) | GTM-KBG9XX2 | xarlv0sa1e | two Custom HTML tags removed (v6); never ran, no IFA page loads it |

**Verified from outside**: every live custom domain in the Brandklout Webflow workspace plus the
Instatic sites (37 hosts) fetched, each GTM container's served `gtm.js` grepped for
`"vtp_projectId"`, and the raw HTML for `clarity.ms` / `clarity_script`: none left. Ortega Cottage
and Omnia are not in this repo; they were found through the Webflow workspace's site list. Codex also
read the Tags list of all 35 containers in the GTM account: only IFA's old GTM-KBG9XX2 (two Custom
HTML tags, `MS Clarity - Base Tag` and `MS Clarity - Button Clicks`) still had Clarity. No IFA page
loads that container (IFA runs GTM-5XR78DN7); rendered with `consent-kit.mjs check`, www and apex
IFA pages made no `clarity.ms` request.

**Oceanic's republish also shipped an unpublished Designer edit from 2026-10-06** (site
`lastUpdated` 18:06 UTC, last publish 2026-09-29). Nobody here could see what it was; the user chose
to uninstall and republish anyway.

**Rule on main** (process):
- `tools/termly-ghl-consent/consent-kit.mjs check` records `banned` and prints `FAIL banned tracker`,
  exit 1, on any `clarity.ms` request. Proved both ways: Omnia (still live) failed with exit 1;
  Marvel and Legacy passed.
- `termly-ghl-consent.md`: new section "Microsoft Clarity is banned, consent or not".
- Scenario 0 `05-launch.md`: Clarity out of the inputs and step 4; never Clarity, ask before any
  other session-replay or heatmap tool.
- Scenario 1 `01-old-site-capture.md` step 10 and `tracking-inventory.mjs`: Clarity is always "drop".
- `tools/instatic-site/README.md`: site scripts never include Clarity.
- Client runbooks: a run file + index row on bk-marvel-dental, bk-arvada, bk-grand-mission,
  bk-mason-park, bk-legacy-dental, bk-oceanic-dental, bk-livewell.

## Next

- **Delete the Clarity projects** (it deletes the recordings, which the Additional Terms require for
  any health data already collected). Irreversible; the user's call, not done.
- Grand Mission's site has only a `<noscript>` GTM tag, and it names Livewell's container
  (GTM-KL36RQV2); its own container's `<script>` is not installed, so its GA4 does not run.
- GA4 has the same BAA question as Clarity (Google signs none for Analytics). Not decided.

## Gotchas

- **Deleting or disconnecting a Clarity project does not take Clarity off a site.** The tag lives in
  GTM. Clarity's own "Disconnect" button failed twice ("Couldn't disconnect Google Tag Manager, try
  again later").
- **The Webflow Clarity app is invisible to our Webflow token**: registered scripts are scoped to the
  app that created them. Find it in the published HTML (`clarity_script-*.js`) and uninstall the app
  under Site settings > Apps & Integrations > Connected Apps; it needs a site publish to disappear.
- **Check the whole Webflow workspace, not just the repo's clients.** Two of the nine containers
  belonged to practices this repo does not track.
- Publishing a GTM container ships every pending workspace change; check Workspace Changes first.
- The Webflow CDN served the pre-publish Oceanic page for a few minutes; add a `?cb=` query to verify.

## Version Control

Tracked. Committed with the work it describes.
