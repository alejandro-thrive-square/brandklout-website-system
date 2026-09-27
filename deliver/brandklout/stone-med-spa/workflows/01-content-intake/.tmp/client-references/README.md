# Client references — the menu split

## What is here

Two screenshots the client sent on **2026-09-03**, of the practice's own two category images:

| File | What it shows |
| :--- | :--- |
| `menu-surgical.png` | The surgical menu, over a portrait — twelve procedures |
| `menu-med-spa.png` | The med spa menu, over a portrait — seven treatments |

> [!IMPORTANT]
> **The two PNGs are not in git.** `.gitignore:31` excludes `*.png` repo-wide and `CLAUDE.md`
> forbids committing binary or media assets, so they exist only in this worktree on the machine
> that received them. That is why the lists below are transcribed in full: **this file, not the
> images, is what survives a fresh clone.** If the images matter to a later decision, ask the
> client to resend them.

## Why they matter

They are the answer to the blocker that had gated this entire pillar since 2026-08-05 — *which
brand owns the med spa menu*, recorded in
[`docs/project-overview.md`](../../../../docs/project-overview.md). The client did not answer it in
prose; they answered it by sending the two category images, which partition the menu with no
ambiguity.

The answer is the **modality split** — outcome 2 of the three, and the pattern the competitive
research had recommended as the default after finding NassifMD running exactly it.

## The transcription

**Surgical — stays on Stone Surgical Arts (12):**

1. MyEllevate® Facelift
2. Neck Lift
3. Facelift | Easy Lift
4. FaceTite
5. Facial Implants
6. Chin Sculpting & Reshaping
7. Buccal Fat Removal
8. Blepharoplasty
9. Neck Liposuction
10. Skin Lesion Removal
11. Male Facial Enhancement
12. Facial Fat Transfer

**Med spa — this site (7):**

1. Dermal Fillers
2. Botox | Xeomin
3. Morpheus8
4. Hair Restoration
5. PRP Treatment
6. Chemical Peels
7. Dysport & Jeuveau

Both images end with a "See All →" link, so **both lists may be partial** — they are the promoted
subset each category image chose to show, not necessarily the complete menu. See the caution below.

## The line the client drew

**At the incision, not at the price.** FaceTite is minimally invasive but still requires an
incision under local anaesthetic, so the client put it on the surgical side; Morpheus8 delivers
radiofrequency through microneedles and does not, so it is on the med spa side. That is a
consistent clinical rule, not an arbitrary split, and it is the rule
[`treatments-data.mjs`](../../../04-design/.tmp/med-spa/site-src/treatments-data.mjs) records.

> [!CAUTION]
> **Six treatments Stone Surgical Arts currently sells appear on NEITHER list:** Sculptra, CO2
> laser resurfacing, HydraFacial MD, microneedling, SkinPen and Cosmelan. All six are non-surgical,
> so by the stated rule they belong on the med spa side — but the client did not name them, and the
> "See All" links mean we cannot tell whether they were omitted deliberately or just not promoted.
>
> **They are not in the build.** Ask before adding them. Do not infer a menu the client did not
> write.

> [!WARNING]
> **Stone Surgical Arts still publishes all seven med spa treatments** with a fee schedule, on a
> staging link the client has already reviewed. Acting on this split means that page loses them and
> a **301 map** is needed from those URLs to these before either domain goes live. That work is on
> the `bk-stone` worktree, not this one.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
