# Images — where they come from, what they show, how often they repeat

Every Brandklout build, update and ads page follows these rules. They come from the team's review
feedback on past builds (2026-09-25): photos that did not match their text, stock used while the
client's own photos sat unused, and the same photo repeated across the site.

## 1. Source: the client's own first, stock last

Look in this order, and move on only when the one before has nothing that fits the section:

1. **The client's Google Drive.** Every client has a shared drive
   ([GOOGLE_DRIVE.md](./GOOGLE_DRIVE.md)): `node scripts/drive.mjs roots`, `ls`, then
   `thumbs --size 2000` to look through a photoshoot before pulling originals.
2. **Other material the client sent.** Google Photos albums, Dropbox or WeTransfer links in the
   Asana brief or the handoff. A shared Google Photos album can be pulled with `curl`.
3. **The client's old site.** Pull its assets even when this is not a migration
   (`extract_assets.py` and `catalogue_assets.py` in
   [Scenario 1 step 01](../process/scenario-1-migration/01-old-site-capture/01-old-site-capture.md)). Old-site photos of the real
   office, team and doctors beat any stock photo.
4. **Licensed stock.** Freepik through the Magnific key; Unsplash only for named places. Keep the
   stock id and licence of every stock image in the image ledger (section 4).
5. **AI-generated images**, only with the client's approval and never of a real person.

Never stock or AI for: the doctors, the team, real patients, before and after results, the office
itself. If the client has none of these, leave the slot for a client photo and ask; don't fake it.

Write down where you looked. The ledger shows, per image, which source it came from; a stock image
on a page is a claim that sources 1 to 3 had nothing for that section.

## 2. Match: every photo shows what its text says

- The photo must show the specific subject of its heading and copy: the procedure, the device, the
  situation, the named person. A generic dental-office photo on a section about something specific
  fails. "Not contradictory" is not the bar.
- Score each placement: **3** shows the subject; **2** on topic but generic; **1** unrelated or
  contradicting. Only 3 ships. Look at the photo itself, not its filename.
- Named patients only on their own treatment. A doctor's photo only where the text is about that
  doctor.
- Sharp at display size: about 1000px tall for a 1440 portrait hero. An upscale below ~500px invents
  a new face; use the original. Every upscaled face goes on
  `tools/instatic-site/images/contact-sheet.py`.
- Alt text describes what the photo shows, not the page keyword.

## 3. Variety: don't overuse any photo

- **Once per page.** The same photo never appears twice on one page.
- **At most two pages** across the site. A photo that fits a third page means you need another
  photo, not the same one again.
- **Every page's hero is its own.** No two pages open on the same image.
- **Neighbouring pages differ.** Service pages in the same group (implant pages, location pages)
  don't share photos with each other.
- Allowed repeats: the logo, the site shell (header, footer, CTA band) and a doctor's headshot on
  their bio and the team page. List named exceptions in the gate's `allow.json`.
- When the client library is thin, vary the crop and the framing (a wide room shot and a close
  detail from it are two different photos), then add stock for the sections that are not people.

## 4. Record and check

- Keep an image ledger in the step's `output/images.csv`:
  `file, source (drive|album|old-site|freepik|unsplash|ai), source id or path, licence, pages, fit score`.
- Before every push, run the reuse gate on the build and after publishing on the staging site:
  `node tools/instatic-site/gates/image-reuse.mjs [--base <staging>] [--allow allow.json] > image-reuse.txt 2>&1`.
  It must end with `0 problem(s)`. It reads raw HTML, so images a script injects are checked by eye.
- Match (section 2) has no script: go through every page at 1440 and read each photo against its
  heading. Record the scores in the ledger.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
