# 2026-09-24 — Strict image pass: every photo shows its copy, published seq 23

Follows [the content-fit QA run](./2026-09-24-pre-review-content-fit-qa.md) the same day. Backed up
first at **seq 22**: API snapshot `21-instatic-upload/.tmp/backup-2026-09-24-pre-images/` and
`VACUUM INTO /app/storage/backups/cms-2026-09-24-seq22-pre-images.db` (193 MB).

## Done

Alejandro set the bar: every photo must be directly related to its copy and high resolution —
from the practice's library or licensed stock through the MAGNIFIC (Freepik) key. The first pass had
only removed contradictions.

- **Checklist items** from the first doc: Results story cards drop their before/after thumbnails
  (`stories` block `ba: false`; the gallery below carries them); Zirconia shows Michael, not Emily;
  statements end on two words (`&nbsp;` in `statement()`), three statements tightened.
- **Strict review** (5 subagents, relevance 3/2/1 + density): **167 of 370** placements failed —
  67 library fixes, 52 stock, 45 client-original (before/after at 300×225), 3 crops.
- **Library swaps** → new `lib/image-map.mjs`: `[page, section id, old, new, focal, alt?]`, applied
  in `build.mjs` after render; alt filled from the finished site (two passes) and a warning lists any
  photo carrying two different alts. Journal heroes: `HERO` in `templates/blog.mjs`, all 46 posts
  mapped explicitly.
- **Licensed stock**: 42 Freepik photos (`03-graphic-resources/.tmp/stock/`: `briefs.json` →
  `candidates.mjs` sheets → 5 picker subagents → `fetch.py` full-res → 2400px, ids in
  `stock-ledger.json`). Unsplash route (`unsplash.mjs`) tried for neighbourhoods.
- **Verification** (5 subagents on fresh sheets): 33 residual fails, all crops/alts/duplicates →
  fixed (plus a bone-graft render for the Bone Grafting hero). Final audit: 0 visible photos under
  1:1 except dark statement backgrounds; local gate FAIL none.
- Pushed (`upload-media` 43 new, `set-alt` 97, ship, `push-site --force`, publish).

## Next

- Client originals: before/after cases 10–12 (Leslie, Emily, Michael) and the gallery cases,
  ≥1300px wide — the only photos still soft. Drive (`scripts/drive.mjs`) needs `auth` again.
- No overdenture case exists; Implant-Supported Dentures proves with Michael's fixed case.
- Brentwood, Century City, Culver City strips show the practice's front desk — no verifiable photo
  of those neighbourhoods exists in Freepik or Unsplash. A client photo of the building would do.

## Gotchas

- **Freepik has almost no identifiable LA Westside neighbourhood photos**; titles lie ("Streets of
  Beverly Hills" was right, most "Los Angeles" were downtown or Hollywood). Pickers must check the
  title names the place. The Wilshire Blvd Temple is Koreatown — rejected for Brentwood.
- **A picker's first result for "ice pack after extraction" is white-backdrop grimacing stock**; ask
  for several phrasings per brief, and have pickers reject studio poses.
- **I introduced a contradiction myself**: a woman with a hot mug beside "no hot drinks" aftercare.
  Read the copy the photo sits next to, not just the section heading.
- **Alt fill must run after the swaps**: a first version read alts before the map and a photo inherited
  the caption of the card it had just been removed from.
- `fetch.py` crashed on a Freepik timeout and lost the ledger; it now retries and writes after every file.
- `still-doctor-xray-screen` / portrait heroes: a wide photo keeps ~34% of its width at 1440 — a
  doctor and his screen rarely both fit; choose which the copy is about.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
