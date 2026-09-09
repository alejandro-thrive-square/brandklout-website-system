# Round-radius audit — BugHerd #11 (AFTER)

270 distinct images render across the 37 pages. Every PNG was decoded and its
four inset corner pixels read; every JPEG/WebP was screened through the CMS's own
`blurHash`. **No file was judged by its name.**

## Confirmed from the pixels — 2

| file | why | corner lum | centre lum | pages |
|---|---|---:|---:|---|
| `allon4.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 242 | all-on-4 |
| `team-hana.png` | transparent corners, opaque edge midpoints, 79% covered | 0 | 115 | our-team |

## Suspects — 6

A screen, not a verdict: `blurHash` is a 4x3 DCT and will flag a photograph with
a bright sky or a white ceiling. Each of these is looked at before anything moves.

| file | method | why | corner lum | centre lum | pages |
|---|---|---|---:|---:|---|
| `7607.jpg` | blurhash-screen | blurHash: four flat bright corners around a darker centre | 253 | 123 | dental-implants, implant-supported-dentures |
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

- `logo.png` — cut-out on transparency (20% covered) — not a rounded crop (index, dental-implants, crowns-and-bridges, financing, doctor-referral, implant-supported-dentures, implant-cost, oral-surgery, meet-dr-nahlah, patient-center, our-facility, smile-makeover, sedation-dentistry, veneers, teeth-whitening, cosmetic-dentistry, about, emergency-dentistry, all-on-4, posts, post, contact-alexandria, contact-maclean, video-library, terms-of-service-maclean, terms-of-service-alexandria, privacy-policy-maclean, privacy-policy-alexandria, thank-you, terms-conditions, contact, smile-gallery, privacy-policy, patient-stories, our-team, dental-implant-faq, dental-conditions)
- `fp1-fp3-comparison.png` — cut-out on transparency (34% covered) — not a rounded crop (index, all-on-4)
- `dental-implant-model-3.png` — cut-out on transparency (47% covered) — not a rounded crop (dental-implants, smile-makeover, dental-implant-faq)
- `logo-carecredit.png` — cut-out on transparency (30% covered) — not a rounded crop (financing, implant-cost)
- `logo-proceed.png` — cut-out on transparency (24% covered) — not a rounded crop (financing, implant-cost)
- `multiple-dental-implant-model.png` — cut-out on transparency (52% covered) — not a rounded crop (implant-cost)
- `dr-headshot.png` — cut-out on transparency (54% covered) — not a rounded crop (meet-dr-nahlah, about)
- `smile-makeover-patient.png` — cut-out on transparency (30% covered) — not a rounded crop (smile-makeover, cosmetic-dentistry)
- `whitening-graphic.png` — cut-out on transparency (87% covered) — not a rounded crop (teeth-whitening)
- `dr-nahlah.png` — cut-out on transparency (54% covered) — not a rounded crop (post)
- `multi-implant-model.png` — cut-out on transparency (52% covered) — not a rounded crop (dental-implant-faq)
- `tooth-model.png` — cut-out on transparency (71% covered) — not a rounded crop (dental-conditions)

## Not decoded — 14

- `google.svg` (index)
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
