## Status: All-on-X ad campaign trio LIVE (2026-09-03)

First campaign delivered. Three pages live under `/ads-landing-pages/` (folder
`6a9976fa58138b416a8de7ea`):

| Page | Path | Page ID |
| :--- | :--- | :--- |
| Landing | `/ads-landing-pages/all-on-x` | `6a99792d6642f8d8d2c99716` |
| Consultation | `/ads-landing-pages/all-on-x-consultation` | `6a9985eb38e229b39cdcd4d2` |
| Thank You | `/ads-landing-pages/thank-you-all-on-x` | `6a9985ec10482f3af4ffd9b4` |

Everything about the build — structure, brand, class system, copy rules, build scripts, publish
recipe — is documented in
[`workflows/04-design/ALL-ON-X-CAMPAIGN.md`](../../workflows/04-design/ALL-ON-X-CAMPAIGN.md).
Read it before touching these pages.

## Scope note — Stone is three brands, this worktree owns one

| Pillar | Brand | Worktree | Status |
| :--- | :--- | :--- | :--- |
| **Oral & maxillofacial surgery** | **Stone Dental Implant Center** | **here** | Live on Webflow. First ad campaign live. |
| Cosmetic facial surgery | Stone Surgical Arts | `bk-stone` | 12 pages published to Instatic 2026-09-02 |
| Non-surgical skin & aesthetics | Stone Med Spa | `bk-stone-med-spa` | Blocked on scope |

The sparse checkout hides the med spa folder. It does **not** hide Surgical Arts, because that build
lives inside *this* client folder on the `bk-stone` branch — see gotcha 2.
