# Round-radius audit — BugHerd #11

237 distinct images render across the 37 pages. Every PNG was decoded and its
four inset corner pixels read; every JPEG/WebP was screened through the CMS's own
`blurHash`. **No file was judged by its name.**

## Confirmed from the pixels — 10

| file | why | corner lum | centre lum | pages |
|---|---|---:|---:|---|
| `allon4.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 242 | all-on-4 |
| `veneers-procedure.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 167 | veneers, index |
| `smile_makeover.png` | transparent corners, opaque edge midpoints, 79% covered | 107 | 53 | smile-makeover |
| `sedation-nitrous.png` | transparent corners, opaque edge midpoints, 79% covered | 101 | 41 | sedation-dentistry |
| `sedation-oral.png` | transparent corners, opaque edge midpoints, 79% covered | 138 | 149 | sedation-dentistry |
| `team-hana.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 115 | our-team |
| `dentures-model.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 114 | implant-supported-dentures |
| `implant-supported-denture.png` | transparent corners, opaque edge midpoints, 79% covered | 101 | 127 | implant-supported-dentures, dental-implants |
| `full-arch-dental-implants.png` | transparent corners, opaque edge midpoints, 79% covered | 101 | 104 | implant-supported-dentures, dental-implants |
| `cost-calculating.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 174 | implant-supported-dentures, financing, crowns-and-bridges |

## Suspects — 5

A screen, not a verdict: `blurHash` is a 4x3 DCT and will flag a photograph with
a bright sky or a white ceiling. Each of these is looked at before anything moves.

| file | method | why | corner lum | centre lum | pages |
|---|---|---|---:|---:|---|
| `1-1.jpeg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 250 | 160 | smile-gallery |
| `1-3-1024x684-1.jpeg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 252 | 173 | smile-gallery |
| `4-1-1024x684-1.jpeg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 250 | 201 | smile-gallery |
| `Jennifer-Before-Fix-1.jpeg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 252 | 78 | smile-gallery |
| `Michael-Before-1.jpeg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 251 | 127 | smile-gallery |

## Legitimate cut-outs, deliberately NOT flagged — 12

Transparent corners alone are just a PNG cut-out — the tooth models, the partner
logos, the header `logo.png`. Flagging those would have flagged 22 of the 23
PNGs on the site, which is the same as flagging nothing. They are listed so the
line between the two can be checked.

- `logo.png` — cut-out on transparency (20% covered) — not a rounded crop (post, contact-alexandria, contact-maclean, video-library, terms-of-service-maclean, terms-of-service-alexandria, privacy-policy-maclean, privacy-policy-alexandria, posts, thank-you, terms-conditions, emergency-dentistry, cosmetic-dentistry, contact, all-on-4, about, veneers, teeth-whitening, smile-makeover, smile-gallery, sedation-dentistry, privacy-policy, patient-stories, patient-center, our-team, our-facility, oral-surgery, meet-dr-nahlah, index, implant-supported-dentures, implant-cost, financing, doctor-referral, dental-implants, dental-implant-faq, dental-conditions, crowns-and-bridges)
- `dr-nahlah.png` — cut-out on transparency (54% covered) — not a rounded crop (post)
- `smile-makeover-patient.png` — cut-out on transparency (30% covered) — not a rounded crop (cosmetic-dentistry, smile-makeover)
- `fp1-fp3-comparison.png` — cut-out on transparency (34% covered) — not a rounded crop (all-on-4, index)
- `dr-headshot.png` — cut-out on transparency (54% covered) — not a rounded crop (about, meet-dr-nahlah)
- `whitening-graphic.png` — cut-out on transparency (87% covered) — not a rounded crop (teeth-whitening)
- `dental-implant-model-3.png` — cut-out on transparency (47% covered) — not a rounded crop (smile-makeover, dental-implants, dental-implant-faq)
- `multiple-dental-implant-model.png` — cut-out on transparency (52% covered) — not a rounded crop (implant-cost, dental-implants)
- `logo-carecredit.png` — cut-out on transparency (30% covered) — not a rounded crop (implant-cost, financing)
- `logo-proceed.png` — cut-out on transparency (24% covered) — not a rounded crop (implant-cost, financing)
- `multi-implant-model.png` — cut-out on transparency (52% covered) — not a rounded crop (dental-implants, dental-implant-faq)
- `tooth-model.png` — cut-out on transparency (71% covered) — not a rounded crop (dental-conditions)

## Not decoded — 14

- `https://img.youtube.com/vi/8DH9ZdyBcp4/maxresdefault.jpg` (video-library)
- `https://img.youtube.com/vi/fiWLQROMvcg/maxresdefault.jpg` (video-library)
- `https://img.youtube.com/vi/glyfx-NFHHM/maxresdefault.jpg` (video-library)
- `https://img.youtube.com/vi/lU62bTDjV64/maxresdefault.jpg` (video-library)
- `https://img.youtube.com/vi/BnB_W6F_P1g/maxresdefault.jpg` (video-library)
- `https://img.youtube.com/vi/A9wuNvIfFEw/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/yo1gLUGnRbM/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/938agcztJjs/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/fx6eztXBVqQ/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/zjvRSifApBs/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/btCwe4wry5o/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/um69fjRjTHs/hqdefault.jpg` (video-library)
- `https://img.youtube.com/vi/xgOBrrKQjeU/hqdefault.jpg` (video-library)
- `google.svg` (index)
