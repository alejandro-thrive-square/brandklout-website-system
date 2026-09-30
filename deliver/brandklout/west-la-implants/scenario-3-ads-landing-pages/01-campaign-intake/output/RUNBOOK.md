# scenario-3-ads-landing-pages · 01-campaign-intake · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · intake for All-on-6 (ChatGPT Ads) and 3-on-6 (Google Search)

**Done** (`b9b96a5c`)
- Pulled both Asana tasks with `deliver/scripts/asana-context.mjs --task <gid>`: no attachments, no
  comments, one sentence of brief between them. Copies in `assets/asana-context/`.
- `combo.json` and `INTAKE.md` written: slugs, sourced claims, what is withheld, nine open questions.
- `assets/patient-film-transcripts.md`: the three patient films' transcripts, which the practice
  publishes as each film's YouTube description. They are the source of every quoted line.

**Next**
- Brandklout: the two GHL forms, the host the ads point at, the conversion tags, DNI (INTAKE.md 1 to 4).
- Then fill `formId` in `combo.json` and `formSnippet` in `templates/ads-landing-pages.mjs`.

**Gotchas**
- `tools/ads-combo/lib/combo.mjs` throws on an empty `formId`, so every gate dies before it starts.
  Both campaigns carry the placeholder `PENDING` until the real ids arrive; the form checks then
  fail honestly instead of crashing.
- The YouTube caption endpoints answer nothing to Node (`timedtext` returns 0 bytes, the player API
  400). The watch page's `shortDescription` holds the whole transcript for these three films.
- The `asana-ads/` pull under `workflows/00-client-delivery-initialization/.tmp/` is the 3-on-6 task
  only and predates the due-date change; the copies here are current.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
