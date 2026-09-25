# 2026-09-24 — Dr. Cho leads; Dr. Sung only beside him, and off the ad pages

The client asked for three things:

> Dr Dave Cho needs to be more prominent.
> Dr Sung should be mentioned only beside Dr Cho.
> Dr Sung shouldn't be on the ads landing pages.

The user's clarification: on every page Dr. Cho leads (name, portrait and credentials first).
Wherever Dr. Sung was alone, Dr. Cho becomes the prominent one, with a smaller card for Dr. Sung.
Dr. Sung comes off the ad landing pages entirely, **both sets**: the rebuilt `/ads-landing-pages/`
and the old Webflow ports at the root slugs the live ads use.

**Done and live on staging and production.** A served-page check of all 50 doctor-naming pages
plus all 161 articles found **0 pages naming Dr. Sung without Dr. Cho**, and **0 mentions of
Dr. Sung on any of the 12 ad pages**.

## What changed

- **Provider band, 29 service pages** (`bugherd/swap-provider-2026-09-24.mjs`): Dr. Cho's portrait
  (`dr-cho-portrait`, the practice headshot), "Your dentist" and "Dr. Dave Cho, DMD". Dr. Sung sits
  in a smaller `.svc-provider_also` card inside the band ("Also on the team", Fellow of the AGD),
  linking to Our Doctors. The CSS is the "Dr. Cho leads" block at the foot of `site.css`.
- **Copy**: five agents worked from one brief (`bugherd/plan-2026-09-24/doctors/BRIEF.md`, with a fact
  sheet for each doctor):
  - Service pages (31) and core pages (12): generic work statements moved to Dr. Cho. Claims only true
    of Dr. Sung (AGD fellowship, 7%, ~100 CE hours, family of dentists) never moved to Dr. Cho. They
    were dropped, or kept as a clause about Dr. Sung after Dr. Cho. Experience the facts don't give
    Dr. Cho (newborn frenectomies, TMJ case volume, laser work, advanced gum disease) was reworded
    to "the practice".
  - Three reviews naming only Dr. Sung were swapped for real reviews naming Dr. Cho.
  - Meta descriptions and the FAQ JSON-LD were updated with the copy.
- **Core pages reordered** with Dr. Cho first: the Contact doctor cards, About's family pillars,
  Our Team's roster and off-duty asides, and the home `#people` cards. Our Doctors' dossier now
  uses Dr. Cho's portrait. "The Measure" opens with a Dr. Cho figure, and the "3 drs" figure went
  to make room.
- **Ad pages, rebuilt**: `build-ads-landing-pages.mjs`. Every dentist slot is now Dr. Cho's, and
  Sung-only claims, stats (7%, 100 hrs), the FAGD badge and the unused Sung review are gone. The
  generator also had two pre-existing problems:
  - It could not run: it referenced `dr-sung-standing`, which does not exist.
  - It would have reverted two hand edits (the proof and invitation photos). Both are now in it.
- **Ad pages, old ports on production**: only the two thank-you pages named Dr. Sung. Two paragraphs
  on each were edited in place on the live document (`bugherd/patch-old-thank-you-cho.mjs`).
- **Blog**: 49 articles, 423 hand-written replacements (`plan-2026-09-24/doctors/blog-cho.mjs`,
  original kept as `blog/cms-rows.before-cho.json`). Eight titles or seoTitles now name Dr. Cho
  first. Slugs are unchanged. Four Invisalign articles gained a short Dr. Cho bio, written from
  the facts.

## How it was pushed

Backups first: `backup-staging...2026-09-25T00-11-05.json` and `backup-www...2026-09-25T00-11-08.json`.
Production's draft had an unpublished shell save from 23:39 (every page and asset matched what had
been shipped, so it was editor state); this push published it along with the changes.

`bugherd/push-cho-2026-09-24.sh` with `TARGET=staging`, then `TARGET=production`. It is the full
chain with `place-ad-embeds`, both template steps, then `import-articles` and
`publish-articles --force`. The force republishes every article oldest-first, which keeps the
blog's order. Production: 94 pages published, 161/161 articles.

## Verified

- Local: `check.mjs` 0 errors on 229 pages. Sweep of the 45 changed pages at 1440 and 390: 0 problems.
- Staging: `check-cho-live.mjs` 211 URLs, 0 problems. Sweep of the 45 pages: clean (one favicon 404).
- Production: `check-cho-live.mjs` 211 URLs, 0 problems. All eight old root ad pages: 0 Sung.
  `type-diff.mjs --all`: 0 text styled differently. On the two thank-you pages, "2 not found" is the
  two rewritten paragraphs.

## Gotchas

- **Magnific changed Dr. Cho's face.** A 2x upscale of his 750px headshot came back narrower and
  longer, with different eyes. It was rejected, and the original 562×750 cut is used. On the ad
  pages' wide feature slot (~648px at 1440) it is stretched about 1.15×.
- **The ad page generator had drifted from the pages it writes**: a missing image key, and two hand
  edits it would have reverted. Diff its output against the live HTML before trusting a re-run.
- **Articles need `publish-articles --force`** after an update. A plain run skips rows that are
  already published, and the edits would stay in draft.

## Open, for the client

- **Home hero**: still the Dr. Nguyen and Dr. Sung family photo (the client's pick in BugHerd #1),
  and Dr. Cho is not in that section. The three-doctor photo (`n124-three-doctors`) exists, but it
  is 1448px wide and needs a crop and a CSS change to sit under the headline.
- **Equal-size cards**: on Our Doctors, About, home and Contact, Dr. Cho is first but Dr. Sung's
  card is the same size.
- **Claims to confirm with the practice**:
  - Dr. Cho as the Invisalign dentist: the consultation is with him, he plans "your case".
  - "Led by Dr. Dave Cho" on dentures and implant restorations.
  - Dr. Cho on bone grafting, sinus lifts and crown lengthening (from his oral surgery and implant
    experience).
  - The ad stats that replaced Dr. Sung's: $1,000 off, 0% APR, $189 first visit, same-day slots.
- The old Webflow thank-you pages show Dr. Nguyen as the hero photo, including on the adult
  Invisalign page.
- Our Doctors keeps one review per doctor, and Dr. Sung's review (Chiaka U) names only him. It sits
  beside Dr. Cho's, which is first.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
