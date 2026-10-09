# 2026-10-09 (evening) — card hover ground, cut-outs redone, WhatsApp sync options

Brief (Alejandro, 2026-10-09): the hover image on product cards needs a background (the two
images overlapped); a few products did not lose their background; list the ways to connect the
WhatsApp catalogue to the site.

## Done (commit `d7db6d45`)

- **Hover:** `.pcard-alt` now carries the card's own ground (`--card-ground` on `.pcard-media`,
  light theme too), so the second shot covers the first instead of two transparent cut-outs
  showing at once. The card's hover angle is the next **cut-out** when the product has one, else
  the next shot (40 cards hover to a cut-out, 11 to a whole photo, 22 have one shot). Checked by
  hovering real cards in headless Chrome: alt opacity 1, the lead hidden beneath.
- **Cut-outs:** `prepare-assets.py` now uses an **AI matte** (rembg `isnet-general-use`) for any
  shot on a plain light ground. The flood fill failed on light-grey grounds (both shots of the
  M42→EOS ring, the camera/adapter shot, the ZY bracket), white panels inside collages, the ground
  seen through cages, a big "14" graphic, and captions. Matte cleanup: alpha < 100 dropped (ghost
  captions), the top-14 % wordmark and pieces under 0.025 % of the frame dropped (this filter now
  applies to the flood fill too). A shot whose border is not mostly one light tone (lifestyle and
  graphic images) stays a whole photo, and so does a ribbon shot.
- **`data/photo-overrides.json` (new, tracked):** per-shot exceptions, chosen by looking at all 143
  shots on the card ground. `flood` for white products the matte hollows (Godox S65T diffuser,
  DC-550 box, Viltrox box, RGB bar 30 cm, the snoot's gobo panel); `photo` for infographics whose
  captions survive any cut-out (Weebill 3E packing list, two SmallRig spec sheets, the Super Clamp
  table shot); `ai` for the Triopo K3 softbox shot whose red edge banner fooled the border test; **`skip`
  for the two FX3/FX30 cage shots that print "80$ / 100$"** next to the site's Bs prices.
  Result: 100 ai, 5 flood, 36 photo, 2 skipped.
- **rembg install, outside the repo:** `python -m pip install --target
  %LOCALAPPDATA%/webzite/pydeps-rembg "rembg[cpu]"` (~0.5 GB); model in
  `%LOCALAPPDATA%/webzite/u2net`. The script finds both; without them it falls back to the flood
  fill and says so.
- **WhatsApp ↔ site options** researched and written into `docs/cms-schema.md` ("Connecting the
  WhatsApp catalogue").

## Gates

| Gate | Result |
| :--- | :--- |
| `journey-audit.mjs` | PASS |
| `fluid-root.mjs --check` | 77 / 77 |
| `shoot.mjs --motion` × 4 pages × 1440/390 | console clean, overflow 0, scrub proof unchanged |
| Cart end to end (scratch `cart-test.mjs`) | 38 / 38 |
| Hover (scratch `hover-shot.mjs`) | CL60, Cinepeer X100, Weebill 3E: second shot covers the first |
| Visual | every processed shot reviewed on the card ground; catalogue grid at 1440 |

## For the client (via Alejandro)

- The FX3/FX30 cage photos print **80$ / 100$**; WhatsApp says 73.200 / 91.500 Bs. The two shots
  are off the site until the photos match the prices.

## Next

1. Alejandro to choose the sync route (`cms-schema.md`): first check on the shop's phone that
   *Herramientas → Catálogo → ⋮ → Conectar catálogo* exists, and whether Commerce Manager takes Bs.
2. As before: the WhatsApp number, the client questions in the 2026-10-09 (later) run.

## Gotchas

- **rembg on this machine:** Python 3.14 + onnxruntime 1.31 works; `python -m venv` fails at
  ensurepip under the deep scratchpad path, and pymatting's numba cache cannot be written under a
  deep path (MAX_PATH) — the script sets `NUMBA_DISABLE_JIT=1` (rembg's `remove()` without alpha
  matting never needs it).
- **The matte hollows white products** (diffuser interiors, white boxes, a white LED tube) — look
  at every new shot on the card ground and add a `flood` override; filling holes would also refill
  the ground seen through a cage.
- **Edit `photo-overrides.json`, then `--force`** (or `--force --only <id>`): the freshness check
  looks at file times, not at the overrides.
- Headless hover captures can catch a card before ScrollTrigger's batch reveals it (a blank tile);
  that is the capture, not the card.
