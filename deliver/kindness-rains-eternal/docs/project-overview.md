# Kindness RAINS Eternal — Project Overview

## Project Summary

**kindness RAINS eternal (kRe)** is a music collective founded by **Andrew P Lee** — songwriter, guitarist, keyboardist, vocalist and co-producer, born in England and based in Madrid, Spain. Production is with Jorge Gallego Diaz at MainTrack Studios.

Brand positioning line from the identity work:

> Move, uplift, connect. — Songs that stay with you.

The site currently runs on **Bandzoogle**, a musician-focused site builder, at `https://kindnessrainseternal.com`. A brand identity was recently delivered by **MUSED Design** and has not been applied to the site. The engagement under discussion is: apply the new identity, restructure the information architecture, and decide whether to stay on Bandzoogle or migrate to Webflow.

## Client Details

- **Client / project:** kindness RAINS eternal
- **Artist:** Andrew P Lee (father of the referring contact)
- **Website:** `https://kindnessrainseternal.com`
- **Current platform:** Bandzoogle
- **Brand identity by:** MUSED Design (`mused.design`) — "MUSED x KindnessRAINSEternal - Visual Identity.pdf", 13 pages
- **Distribution:** Spotify, Apple Music, YouTube Music, Facebook

## Source Documents

- Brand guide PDF (Google Drive): `https://drive.google.com/file/d/1E0ZThfmbIKwHEz0ofhVucZS4gQQmE-mA/view`
- Live site audit: pages crawled 2026-07-30 (Home, Bio, Music, Song List, Lyrics, Backstories, kRe:Atives, Contact)

## Brand Identity Summary (from the MUSED guide)

### Logo system
- **Wordmark**: `kindnessRAINSeternal` set in a serif that "follows the natural cadence of the name" — mixed weights, with `eternal` in italic.
- **Isotype**: three dancing figures built from raindrop circles — a silhouette of Andrew's three children dancing in unison. Concept: connection, movement, legacy, with rain as the unifying element.
- **Variants**: Main logo (stacked), Version 2 (horizontal), Isotype alone.

### Palette
| Hex | Role (as used in the guide) |
| :--- | :--- |
| `#232220` | Near-black — primary dark ground |
| `#414A51` | Slate — secondary dark |
| `#9BA9AC` | Cool grey-blue — logo on dark, accents |
| `#D5CDB6` | Warm sand |
| `#564334` | Brown |
| `#E7E7DD` | Off-white — light ground |

Described as "cool, elegant and understated," designed to sit behind lyrics and artist photography rather than compete with it. Derived from the colours of the original site.

### Type
| Level | Face |
| :--- | :--- |
| Header | Rubik Medium |
| Subheader | Fira Sans Regular |
| Body | IBM Plex Mono Regular / Medium / Semibold / Bold |

> [!IMPORTANT]
> The guide states the type hierarchy was **deliberately drawn from fonts available inside Bandzoogle**, "so Andrew can implement it directly, without purchasing or installing fonts or switching software." MUSED therefore scoped the identity assuming the site stays on Bandzoogle.
>
> This does **not** block a Webflow migration: Rubik, Fira Sans and IBM Plex Mono are all Google Fonts, natively available in Webflow at no cost. The constraint MUSED designed under simply stops applying — the type system ports over exactly, and more of the identity becomes buildable, not less.

### Visual system — the actual design language

Read from the rendered pages, not just the text. This is what has to be rebuilt, and all of it translates cleanly to web.

**Hairline-ruled editorial grid.** Every spread is divided by 1px rules into asymmetric panels, with a thin empty margin column on the left. Running head `MUSED DESIGN© 2026` top-left, page number top-right. Section titles are set enormous — uppercase geometric sans, tight, top-left, sitting on a full-width rule (`LOGO`, `COLOR`, `TYPE`). This is a straight editorial grid and it maps directly onto CSS grid with visible borders.

**50/50 split compositions.** The four application spreads are all half-and-half: dark half against light half, or photography against flat colour. This is the system's default section pattern and should drive the page layouts.

**Mono as the label voice.** The signature move of the whole identity: IBM Plex Mono is used not only for body copy but for *all metadata and labels* — `MOVE, UPLIFT, CONNECT`, `EST. 2026`, `30 TRACKS  10.10.26`, tracklists, `Hold on to wonder.` / `Let the music lead.` Uppercase, letter-spaced, small, pinned to corners. Rubik carries headers, Fira Sans carries subheads and lead paragraphs. **The serif appears only in the logo — never as running type.**

**Palette hierarchy (from the proportions on the COLOR page, not the hex list).** The swatch sizes encode a hierarchy the hex codes alone don't tell you:

| Weight | Colours | Use |
| :--- | :--- | :--- |
| Large fields | `#232220`, `#414A51`, `#9BA9AC` | Primary grounds |
| Light ground | `#E7E7DD` | Page background |
| **Narrow strips — accents only** | `#D5CDB6`, `#564334` | Never grounds |

Sand and brown are edge accents, not backgrounds. Easy to get wrong when working from a hex list.

**Photography.** Warm golden-hour and sunset, heavy film grain, silhouettes, blown highlights, analog feel — always set against the cool neutral grounds. The warm orange is effectively a seventh colour that only ever arrives *through imagery*, never as a fill. This warm/cool tension is the identity's main visual engine.

**Recurring lockups.** Corner stamp `MOVE, UPLIFT, CONNECT / EST. 2026`; the line `Songs that stay with you.`; a bullet-dot glyph (`● Songs That Stay With You`); and a credits block in Fira Sans as bold-label / regular-value pairs (`FOUNDED BY Andrew P Lee`, `WRITTEN BY`, `PRODUCED BY`, `MASTERED BY`).

**Physical-media motif.** Cassette (case + shell) and a vinyl centre label. Directly reusable on the site: a circular label treatment for a release, a cassette-card treatment for a song.

> [!NOTE]
> The vinyl mockup reads `30 TRACKS  10.10.26`. That is MUSED's placeholder copy for the mockup, not a real release — do not build a "30 tracks" claim into the site. Likewise the running heads alternate 2024 / 2025 / 2026 across pages; that's template residue.

### Gaps in the guide

The final page is signed **"Brand proposal"**, and the document behaves like one. It defines logo, palette, type and a visual mood, but it does **not** specify:

- Logo clearspace, minimum sizes, or misuse rules
- A spacing/sizing scale or grid definition in numbers
- Type scale (sizes, line-heights, letter-spacing values)
- Any icon set, button or form styling
- Motion or interaction guidance — despite the site publicly promising "video animations"

None of this blocks the build; it means the web design step has to *extend* the identity into a real interface system rather than just apply it. That work is already inside the per-page design rate, but it should be stated so nobody assumes a complete web-ready design system exists.

## Current Site Audit (2026-07-30)

### Navigation — 8 top-level items
`Home` · `Bio` · `Music` · `Song List` · `Contact` · `Lyrics` · `Backstories` · `kRe: Atives`

### Visual state
- Stock Bandzoogle full-bleed background-image template.
- **The old blue `kRe.` logo is still in place** — none of the new MUSED identity is applied anywhere.
- The homepage opens on a full-viewport background photo with no content, headline or CTA above the fold.
- Navigation renders as unstyled text inside a bordered box in the lower-left corner; low contrast against the photography, no hierarchy, no active-state design.
- Type is the template default, not Rubik / Fira Sans / IBM Plex Mono.

### Content inventory
- **Catalogue — "Out Of The D" (EP, 6 tracks + 1 instrumental)**
  1. Inner Space
  2. I Don't Want To Lose Her (Disorientating Signs)
  3. Blue Ocean; White Sail (feat. Bea and Miriam, Spanish vocals)
  4. Going Under
  5. Siguiendo El Sol (Spanish-language debut, summer 2026)
  6. Out of the "D" (title track, summer 2026)
  - Instrumental: BOWS; Sunset (free)
- **Lyrics page**: 5–6 songs, full lyric text, 600×600 artwork per song, © Andrew P Lee 2025–2026.
- **Backstories page**: ~1,450 words of long-form narrative on the "Out Of The D" arc, 2 photographs, signed by Andrew.
- **Bio page**: collective description + Andrew's biography + current projects + live-performance note.
- **kRe:Atives page**: community/mailing-list intent — but **no signup form is actually present**. Copy says community features are "forthcoming."
- Site footer carries a "Powered by Bandzoogle" credit.

### Structural problems identified
1. **The catalogue is sliced across four pages.** `Music`, `Song List`, `Lyrics` and `Backstories` are all views of the same underlying entity — a song. A visitor who wants to hear *Inner Space*, read its lyrics and read its story has to visit three separate pages and hunt for the same title in each. This is the core IA defect.
2. **No content model.** Every song is hand-placed on every page. Adding track 7 means editing four pages by hand, in four places, consistently. This does not scale with a catalogue that is explicitly planned to grow through 2026–2027.
3. **The primary conversion goal has no mechanism.** The site repeatedly asks visitors to join the mailing list and promises a free 2026 songbook to early members — and there is no form anywhere to do it. This is the highest-value fix on the site and it is currently a dead end.
4. **No above-the-fold proposition.** The homepage leads with a photograph and no statement of who kRe is or what to do next.
5. **Nav overload.** 8 items, with 4 of them semantically overlapping.
6. **The brand is unapplied.** The identity exists as a PDF and nowhere else.

### Site's own stated intent
The homepage already announces a redesign — "new logo, video animations, and potential migration to new platform." The client is pre-sold on the direction; the decision on the table is *which platform*, not *whether*.

## Proposed Information Architecture

| # | Page | Replaces | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Home | Home | Identity-led hero, latest release, featured songs, mailing-list capture |
| 2 | Music | Music + Song List | Releases and full catalogue, CMS-driven |
| 3 | Song (CMS template) | Song List + Lyrics + Backstories | One entry per song: player, lyrics, backstory, artwork, credits |
| 4 | Bio | Bio | Collective + Andrew + projects |
| 5 | kRe:Atives | kRe:Atives | Community, mailing-list signup, songbook offer — with a working form |
| 6 | Contact | Contact | Enquiries, collaboration, booking |

8 pages become 5 pages plus 1 CMS template. Four fragmented song pages collapse into a single Song collection, so publishing a new track becomes one CMS entry instead of four manual page edits.

## Open Questions / Access Required

Tracked in [platform-recommendation.md](./platform-recommendation.md) § "What I need from you."

## Version Control

- All changes to this document follow the version control rules in [SYSTEM_RULES.md — Section 4](../../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/kre-<description>`.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
