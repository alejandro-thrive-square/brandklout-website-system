"""Turn the client's logo PNG into the four assets the site actually needs.

SOURCE. Asana task 1218408530306234 "Update logo" (assigned to us, 2026-09-11),
attachment gid 1218401388192948 "Westlake logo.png", 1254x1254. Re-fetch it with
`node deliver/brandklout/scripts/asana-context.mjs --task 1218408530306234`.
The file is gitignored like every other binary here; this script is the record.

WHY THE BACKGROUND COMES OFF THE WAY IT DOES. The supplied file is the artwork
composited onto pure black -- 90.9% of its pixels are #000 -- with an additive
glow around the monogram. Keying the black out chews that glow into a grey halo
and leaves a fringe on every letter. The exact inverse of "drawn over black" is
an unpremultiply:

    alpha  = max(R,G,B) / 255       how much ink is at this pixel
    colour = pixel / alpha          what that ink actually is

which returns white as white, lime as lime, and the glow as a soft alpha ramp.
Recompositing the result over black reproduces the original to within 1/255.

WHY FOUR FILES AND NOT ONE.

  * Two SHAPES. The supplied lockup is a square stack: monogram, WESTLAKE,
    MEDICAL AESTHETICS, then a leaf and SKIN - WELLNESS - IV BAR. In the 5.5rem
    navbar that stack can only be ~60px tall, which puts WESTLAKE at an 8px cap
    height -- unreadable. So the navbar and the drawer get a ROW lockup, the
    monogram set beside the name block, both lifted from the supplied art and
    not redrawn. The footer has room and gets the full STACK, strapline and all.
    The client's own second file (Asana 1218567330165026, Jessica, 2026-09-17)
    is already a reduced lockup with the strapline dropped, so trimming tiers
    off this one is a move the practice itself makes.

  * Two GROUNDS. The artwork is white type on black. The navbar is transparent
    over the hero photograph and solid ivory everywhere else, and the drawer is
    ivory, so a white wordmark disappears on two of the three. The light-ground
    variant remaps the two inks:

        white #fafafa -> --charcoal  #272727
        lime  #aaf011 -> --green-ink #55731F

    Charcoal because that is what the text wordmark it replaces was. Green-ink
    because 01-tokens.css already rules that brand green at text size goes dark
    enough to clear AA -- lime on ivory is 1.2:1. The remap runs off the blue
    channel, which separates the two inks cleanly (white B=250, lime B=17) and
    so carries every anti-aliased blend and the whole glow with it.

NOTE FOR WHOEVER GETS A BETTER FILE. This is a raster of a mark with a glow.
Ask the practice for the vector original and for their own horizontal lockup;
if either arrives, it replaces the output of this script and the ROW geometry
below stops being ours to justify.

Run: python make-logo.py   (needs Pillow and numpy)
"""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = HERE / "assets" / "_src" / "westlake-logo-asana.png"
OUT = HERE / "assets"
# The site uses three of the four. The fourth — the full stack on a light
# ground — is a variant the practice will want for anything that is not this
# site, so it is built but kept out of assets/, which ships whole: build-site
# skips a leading underscore, and audit.mjs would otherwise warn every run that
# an uploaded asset is referenced by nothing.
SPARE = HERE / "assets" / "_logo-variants"

CHARCOAL = np.array([0x27, 0x27, 0x27], dtype=float)
GREEN_INK = np.array([0x55, 0x73, 0x1F], dtype=float)
B_WHITE, B_LIME = 250.0, 17.0  # measured blue-channel endpoints of the two inks


def unpremultiply(path):
    """Lift the artwork off its black matte. Returns float RGB 0-1 and alpha 0-1."""
    src = np.asarray(Image.open(path).convert("RGB"), dtype=float)
    alpha = src.max(axis=2) / 255.0
    colour = np.clip(src / (np.maximum(alpha, 1e-6)[:, :, None] * 255.0), 0, 1)
    alpha[alpha < 1.5 / 255.0] = 0.0  # sub-1/255 dither, so the trims are honest
    return colour, alpha


def to_image(colour, alpha):
    rgba = np.concatenate([colour, alpha[:, :, None]], axis=2)
    out = (rgba * 255).round().astype(np.uint8)
    out[alpha == 0] = 0
    return Image.fromarray(out, "RGBA")


def darken(colour, alpha):
    """Remap the two inks for a light ground, carrying every blend between them."""
    blue = colour[:, :, 2] * 255.0
    t = np.clip((B_WHITE - blue) / (B_WHITE - B_LIME), 0, 1)[:, :, None]
    return np.clip(((1 - t) * CHARCOAL + t * GREEN_INK) / 255.0, 0, 1)


def bands(alpha, floor=0.012):
    """Horizontal ink bands, brightest-row-relative, used to find the tiers."""
    rows = alpha.sum(axis=1)
    cut = rows.max() * floor
    out, start = [], None
    for y, v in enumerate(rows):
        if v > cut and start is None:
            start = y
        elif v <= cut and start is not None:
            out.append((start, y - 1))
            start = None
    if start is not None:
        out.append((start, len(rows) - 1))
    return out


def save(im, name, where=None):
    # Lossless WebP, like every other image in assets/. Lossy fringes flat art
    # with hard edges, and on two inks lossless still beats PNG by ~4x. Each
    # file is exported at 3x its display height (navbar 56px, footer 130px) so
    # the type stays crisp on a retina screen without shipping a 1254px square.
    d = where or OUT
    d.mkdir(parents=True, exist_ok=True)
    im.save(d / name, format="WEBP", lossless=True, quality=100, method=6)
    tag = "" if d is OUT else f"   -> {d.name}/"
    print(f"  {name:28s} {im.width:4d} x {im.height:4d}  {(d / name).stat().st_size / 1024:6.1f} KB{tag}")


colour, alpha = unpremultiply(SRC)

# --- the STACK: everything, trimmed to its own ink ---------------------------
# Both variants share one bbox so the two files stay pixel-aligned with each other.
box = to_image(colour, alpha).getbbox()
stack_on_dark = to_image(colour, alpha).crop(box)
stack_on_light = to_image(darken(colour, alpha), alpha).crop(box)

STACK_H = 390          # footer shows it at 130px


def fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)

print("stack")
save(fit_h(stack_on_dark, STACK_H), "logo-stack-on-dark.webp")
save(fit_h(stack_on_light, STACK_H), "logo-stack-on-light.webp", SPARE)

# --- the ROW: monogram beside the name block ---------------------------------
# Tier boundaries are read off the art, not hardcoded, so a re-supplied file of
# the same lockup still cuts in the right places.
a = np.asarray(stack_on_dark)[:, :, 3].astype(float) / 255.0
bs = bands(a)
if len(bs) < 3:
    raise SystemExit(f"expected at least 3 ink bands (monogram, WESTLAKE, strapline), got {len(bs)}")
mono_end = (bs[0][1] + bs[1][0]) // 2          # between the monogram and WESTLAKE
name_end = (bs[2][1] + bs[3][0]) // 2 if len(bs) > 3 else stack_on_dark.height


def row_lockup(stack):
    mono = stack.crop((0, 0, stack.width, mono_end))
    mono = mono.crop(mono.getbbox())
    name = stack.crop((0, mono_end, stack.width, name_end))
    name = name.crop(name.getbbox())

    H = 168                                     # navbar shows the row at 56px
    name_h = round(H * 0.46)                    # the name block reads beside it, not under it
    gap = round(H * 0.17)
    mono = fit_h(mono, H)
    name = fit_h(name, name_h)

    out = Image.new("RGBA", (mono.width + gap + name.width, H), (0, 0, 0, 0))
    out.paste(mono, (0, 0), mono)
    out.paste(name, (mono.width + gap, (H - name_h) // 2), name)
    return out.crop(out.getbbox())


print("row")
save(row_lockup(stack_on_dark), "logo-row-on-dark.webp")
save(row_lockup(stack_on_light), "logo-row-on-light.webp")
