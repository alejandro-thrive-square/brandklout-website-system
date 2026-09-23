# Google Drive — where each client's assets are

Client photos, videos, brand guides and site exports often live in Google Drive. Every Brandklout
client has a **shared drive**. Agents read them with `scripts/drive.mjs`, which is read-only and
signed in as alejandro@thrivesquare.com. **Check Drive before asking anyone to re-send files.**

## Use

```bash
node scripts/drive.mjs roots                        # every shared drive + items shared directly
node scripts/drive.mjs ls <drive id|folder id|url>  # one level; shortcuts are marked
node scripts/drive.mjs search <text> [--folders]    # file/folder NAMES only, not drive names
node scripts/drive.mjs get <file id|url> <dir>
node scripts/drive.mjs pull <folder id|url> <dir>   # whole tree; re-running resumes
```

- **Where downloads go:** into the `output/` of the workflow that uses them, e.g.
  `deliver/brandklout/<client>/<scenario>/<step>/output/assets/drive/<folder name>/`
  ([DELIVER_SYSTEM_RULES.md](../../DELIVER_SYSTEM_RULES.md)). **Never commit images, video or
  zips.**
- **List before you pull.** Some folders hold multi-GB video and zip files. Pull the subfolder you
  need, not the whole drive.
- **Most client drives hold shortcuts.** The script follows them. If a shortcut's target was never
  shared with the account, the script says so. Report it and move on; do not guess.
- **`invalid_grant` means the sign-in expired.** The Google app is in Testing, so this happens every
  7 days. Stop and ask Alejandro to run `node scripts/drive.mjs auth`, which needs a browser. Do not
  work around it with an API key: a key cannot list anything.
- Google Docs/Sheets/Slides download as `.docx` / `.xlsx` / `.pdf`.

## Map (checked 2026-09-16)

| Client folder | Shared drive | Drive id | What is at the top |
| :--- | :--- | :--- | :--- |
| `arvada-dental-center` | Arvada | `0AAJs1hDfPufZUk9PVA` | shortcut "Ready" — **target not shared** |
| `dr-nahlah` | Dr. Nahlah | `0ACTKZqHCxqmeUk9PVA` | `site-archive-drnahlah-live-…` folder; shortcut "Dr. Esam Nahlah" — **target not shared** |
| `grand-mission-dentistry` | Grand Mission | `0AAyk9B3cn8VwUk9PVA` | shortcut "Photos for brandklout" — **target not shared** |
| `institute-for-advanced-dentistry` | Institute for Advanced Dentistry | `0AMP7hKbo3dnnUk9PVA` | shortcuts: Photos & Videos, Smile Gallery (case photos by treatment), Website Content (Branding, Photoshoot, Videos) |
| `legacy-dental-pasadena` | Legacy Dental | `0AIyt2pOOdbwiUk9PVA` | shortcuts: "Legacy Dental Pasadena" (66 items), "Dr. Sean Sunyoto FINALS", five patient-story videos |
| `livewell-dental` | Livewell | `0AEJPqRIRPMmDUk9PVA` | shortcut "ORGANIZED ASSET" (CASES, CK Lifestyle, CK teaching, Instagram, …) |
| `marvel-dental` | Marvel Dental | `0AKhXvLRHzVBBUk9PVA` | Photos – Approved Patient Faces, Photos – no Patient Faces, Training – GHL |
| `mason-park` | Mason Park | `0AEGRwjQtecY9Uk9PVA` | loose photos (CTP_TamNguyen2026, PXL_2026…), `Mason Park_Brand Guide.pdf` |
| `stone-surgical-arts` | Stone | `0ANB4x07iExoiUk9PVA` | AOX Photos, LSA, Stock Images, Stone-iPad-Photos, `stonesurgicalarts-22-7-26` (SQL dump + `website-files.zip`), website-files, Legal Paper |
| `stone-dental-implant-center`, `stone-med-spa` | Stone (same drive) | `0ANB4x07iExoiUk9PVA` | nothing is labelled per project; check with the client runbook which files belong to which |
| `west-la-implants` | West LA Implants | `0ABHYkJN-NoK_Uk9PVA` | Invisalign, Single Implants, Veneers, three "New folder"s plus their zips (~1.3 GB) |
| `mason-park-kids` | — none | — | The Mason Park drive is the **adult** practice. Only front-of-house shots may be borrowed, captioned as shared. |
| `alki-house`, `brandklout-website` | — none | — | |

Shared drives with no client folder in this repo yet: Ason Oral Surgery, Elite, Hackensack Center
for Dental Implants, Markham, Oceanic Dental, Restore, South Bay. Run `roots` for their ids.

Blocked shortcuts (Arvada, Dr. Nahlah, Grand Mission) need the folder owner to share the target
with alejandro@thrivesquare.com. Remove the note here once one opens.

## Version Control

Tracked with the repo per [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Update the map when a drive
is added, or when a blocked shortcut opens.
