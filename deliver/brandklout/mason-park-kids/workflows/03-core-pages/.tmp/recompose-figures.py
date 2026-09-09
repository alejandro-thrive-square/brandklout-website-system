"""The 2026-09-09 evening pass: pictures that match the words, and no figure
left dangling.

    python recompose-figures.py --dry-run
    python recompose-figures.py

The client: "better image selections that match the content they are attached
to. There are a few sections throughout the site that are very unorganized and
look very strange."

WHAT WAS WRONG, seen on a full-page capture of all 57 pages:

  1. add-figures.mjs (2026-09-08) appended every chapter photograph as its own
     `<div class="wrap">` AFTER the chapter body. A `.is-band` under a body is
     fine; a `.is-plate` or `.is-inset` under a one-column body (the three
     promises, the price list) hung alone at the foot of the chapter with
     nothing beside it, and under a centred statement it sat off to one side.
     Sixteen chapters on nine core pages.
  2. `waiting` - a wall with an orchid, 290px at source - was the invitation
     photograph on 45 pages and the hero on five, captioned as the waiting
     room.
  3. Several stock searches landed on the wrong object: `st-case` (a food
     container) stood for aligners on four pages; `st-floss` and `st-tube`
     are both electric toothbrushes; `st-window` and `st-laptop` illustrated
     lasers and intra-oral scanners; a toddler in a chair opened the
     Invisalign page; and `highfive`, a stock frame of a dentist who does
     not work here, sat in the overlap panel of four treatment pages beside
     "Dr. Nguyen will...".

WHAT THIS DOES. One pass, one file, every change listed in PLAN below so it
can be read without running it. Four operations:

  swap      one `<img>` (found by its key) gets a new key and alt; srcset is
            rebuilt from the widths that exist in uploads/, `sizes` and the
            other attributes are kept.
  drop      a dangling `.ch-figure` wrap is removed.
  band      a dangling figure becomes a `.is-band` under the body (optionally
            `.is-top` for a portrait source, and a caption for the practice's
            OWN frames only).
  withfig   the body wrap becomes `.ch-withfig` with the figure as the second
            column - a plate BESIDE a column, which is where a plate belongs.
  invite    the `.iv-shot` in the invitation gets a new frame and caption.

The caption rule from get-stock.mjs holds: only the practice's own frames
(the recovered pool and the album's front of house) are ever captioned.

Idempotent: a page that already carries the result is left alone.
"""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))
UPLOADS = os.path.join(HOME, "assets", "uploads")
DRY = "--dry-run" in sys.argv

# Alt text per key, written to the FRAME. Own frames may carry a caption.
ALT = {
    "st-aligner": "A clear aligner in its case on a bathroom counter",
    "st-guard": "A sports mouth guard and its case",
    "st-gap": "A laughing boy with a front tooth missing",
    "st-asleep": "A young boy asleep in striped pyjamas",
    "st-phone": "A parent on the phone at the kitchen table, a child on her lap",
    "st-video": "A family waving at a laptop on a video call",
    "st-paste": "Toothpaste being squeezed onto a toothbrush",
    "st-flossbox": "A container of floss on a marble shelf",
    "st-crown": "A girl in a paper crown, sitting on the grass",
    "st-bottle": "A baby bottle and a teddy bear on a table",
    "st-piggy": "A girl dropping a coin into a piggy bank",
    "st-story": "A parent and child reading a book in bed",
    "st-wave": "A toddler waving through a doorway",
    "st-milk": "A toddler drinking from a cup in a high chair",
    "st-teen": "A smiling teenager outdoors",
    "st-brush": "A child brushing their teeth at a bathroom sink",
    "st-brushes": "Children's toothbrushes in a cup",
    "st-field": "A school sports field on a bright morning",
    "st-family": "A parent and a young child laughing together at home",
    "desk-1": "A patient at the front desk, with the receptionist",
    "desk-2": "The receptionist and a patient at the front desk",
    "desk-form": "A form handed across the front desk",
    "desk-phone": "The receptionist on the phone at the front desk",
    "gumball": "A toddler at the gumball machine by the front desk",
    "gumball-2": "A toddler reaching for the gumball machine by the front desk",
    "shelf-kid": "A boy holding a toothpaste box at the product shelf",
    "shelf-kid-2": "A boy at the product shelf by the front desk",
    "sofa": "Two parents on the waiting-room sofa with the check-in tablet",
    "smile": "Dr. Nguyen beside a smiling child in a treatment room",
    "chair": "A treatment room with a screen on the wall",
    "operatory": "The team at the screens in a treatment room",
    "knee-2": "A knee-to-knee exam: an infant on a parent's lap",
}
OWN = {"team", "knee", "knee-2", "operatory", "smile", "dr-nguyen", "dr-cho", "chair", "mother",
       "desk-1", "desk-2", "desk-form", "desk-phone", "gumball", "gumball-2", "shelf-kid", "shelf-kid-2", "sofa"}

# The invitation photograph and its caption, per frame. Every one is the
# practice's own front of house, so every one is captioned as the place.
INVITE = {
    "gumball": "The gumball machine by the front desk. Suite 104B, free parking at the door.",
    "gumball-2": "By the front desk. Suite 104B, behind the Ranch 99 complex.",
    "sofa": "The waiting room the two practices share. Suite 104B, behind the Ranch 99 complex.",
    "shelf-kid": "The product shelf by the front desk. Suite 104B, free parking at the door.",
    "desk-form": "The front desk, shared with the family practice. Suite 104B, behind the Ranch 99 complex.",
    "desk-phone": "The front desk, shared with the family practice. Suite 104B, free parking at the door.",
}

# page -> list of operations, in order.
#   ("swap", old_key, new_key[, nth])         nth: 0-based occurrence, default all
#   ("drop", section_id)
#   ("band", section_id, key[, caption[, top]])
#   ("withfig", section_id, key[, caption])
#   ("invite", key)
#   ("caption", key, text)                    set/replace the figcaption of an inset holding key
PLAN = {
    # ---- the eleven core pages --------------------------------------------
    "index.html": [("invite", "gumball"), ("swap", "waiting", "sofa")],   # the comfort mosaic too
    "about-us/index.html": [("drop", "forward"), ("drop", "word"), ("swap", "waiting", "sofa")],   # the building mosaic
    "our-doctors/index.html": [
        ("band", "measure", "knee-2", "A knee-to-knee exam"),
        ("band", "voices", "smile", "Dr. Nguyen, with a patient"),
        ("invite", "sofa"),
    ],
    "our-team/index.html": [("invite", "gumball-2")],
    "our-services/index.html": [
        ("drop", "finder"),
        ("withfig", "offers", "desk-1", "The front desk confirms the offer on the day"),
    ],
    "services/comprehensive-pediatric-dentistry/index.html": [("invite", "gumball-2")],
    "new-patients/index.html": [
        ("drop", "before"),
        ("band", "questions", "gumball", "The gumball machine by the front desk"),
        ("swap", "waiting", "gumball-2", 0),   # the hero
        ("swap", "waiting", "sofa", 0),        # the mosaic's first frame
    ],
    "financing/index.html": [
        ("withfig", "rule", "st-piggy"),
        ("band", "ways", "sofa", "The waiting room, and the check-in tablet"),
        ("invite", "desk-form"),
    ],
    "dental-saving-plan/index.html": [
        ("drop", "inside"),
        ("band", "join", "gumball-2", "By the front desk, where it takes a few minutes"),
        ("invite", "sofa"),
    ],
    "patient-reviews/index.html": [
        ("band", "word", "st-family"),
        ("drop", "write"),
        ("invite", "gumball-2"),
    ],
    "thank-you/index.html": [
        ("band", "next", "sofa", "The check-in tablet, in the waiting room"),
        ("drop", "meanwhile"),
        ("swap", "waiting", "st-wave", 0),     # the hero
    ],

    # ---- the migrated pages -----------------------------------------------
    "accessibility-statement/index.html": [("invite", "sofa")],
    "appointment/index.html": [("swap", "waiting", "desk-form")],   # its overlap shot; the page has no .iv-shot
    "before-after/index.html": [("swap", "highfive", "smile"), ("invite", "gumball-2")],
    "contacts/index.html": [("swap", "waiting", "desk-2", 0), ("invite", "sofa")],
    "dental-dictionary/index.html": [("invite", "shelf-kid")],
    "dental-library/index.html": [("swap", "st-books", "st-story"), ("invite", "sofa")],
    "emergency-pediatric-dentistry/index.html": [
        ("swap", "waiting", "desk-phone", 0),  # the hero: "call the office" - the desk that answers
        ("swap", "st-field", "st-phone"), ("caption", "st-phone", None),   # then: the parent making the call
        ("invite", "sofa"),
    ],
    "faq-page/index.html": [("swap", "waiting", "gumball", 0)],
    "invisalign-faqs-katy-tx/index.html": [("swap", "st-case", "st-aligner")],
    "knee-to-knee-pediatric-dental-exam/index.html": [("swap", "st-books", "st-bottle")],
    "privacy-policy/index.html": [("invite", "sofa")],
    "product-recommendations-2/index.html": [("invite", "shelf-kid")],
    "services/bonding/index.html": [("swap", "highfive", "chair"), ("invite", "gumball-2")],
    "services/composite-fillings/index.html": [("swap", "st-tube", "st-paste"), ("invite", "shelf-kid")],
    "services/cosmetic-dentistry/index.html": [("swap", "highfive", "operatory"), ("invite", "sofa")],
    "services/dental-crowns/index.html": [("swap", "st-blocks", "st-crown"), ("invite", "gumball")],
    "services/dental-hygiene-education/index.html": [("swap", "st-floss", "st-flossbox")],
    "services/early-intervention/index.html": [("swap", "st-backpack", "st-bottle"), ("invite", "gumball-2")],
    "services/extractions/index.html": [("swap", "st-blocks", "st-gap"), ("invite", "gumball")],
    "services/fluoride-treatment/index.html": [("swap", "st-water", "st-milk"), ("invite", "shelf-kid")],
    "services/frenectomy/index.html": [("invite", "sofa")],
    "services/invisalign/index.html": [
        ("swap", "smile", "st-teen", 0),        # the hero
        ("swap", "st-teen", "st-brush", 1),     # the overlap, so the teen is not twice on one page
        ("swap", "st-case", "st-aligner"),
        ("invite", "sofa"),
    ],
    "services/mouth-guards/index.html": [
        ("swap", "highfive", "st-guard"),      # the overlap: the object, not a stranger in a white coat
        ("invite", "gumball-2"),
    ],
    "services/night-guards/index.html": [("swap", "waiting", "st-asleep", 0), ("invite", "sofa")],
    "services/orthodontics/index.html": [("swap", "st-case", "st-aligner"), ("invite", "gumball")],
    "services/periodontics/index.html": [("swap", "st-floss", "st-flossbox"), ("invite", "shelf-kid")],
    "services/preventive-dentistry/index.html": [("swap", "st-floss", "st-flossbox"), ("invite", "gumball-2")],
    "services/pulp-therapy/index.html": [("invite", "sofa")],
    "services/restorative-dentistry/index.html": [("invite", "gumball")],
    "services/retainers/index.html": [("swap", "st-case", "st-aligner"), ("invite", "sofa")],
    "services/sealants/index.html": [("invite", "shelf-kid")],
    "services/sedation-dentistry/index.html": [("swap", "st-window", "st-asleep")],
    "services/space-maintainers/index.html": [("swap", "highfive", "chair"), ("invite", "gumball-2")],
    "services/special-needs-patient-care/index.html": [("invite", "sofa")],
    "sitemap/index.html": [("invite", "sofa")],
    "special-offers/index.html": [("swap", "st-brushes", "desk-1"), ("invite", "shelf-kid")],
    "technology/index.html": [
        ("swap", "st-laptop", "operatory"), ("caption", "operatory", "The screens, between patients"),
        ("swap", "st-window", "smile"), ("caption", "smile", "Dr. Nguyen, with a patient"),
        ("invite", "sofa"),
    ],
    "toothpaste-chart/index.html": [
        ("swap", "st-tube", "st-paste", 0),
        ("swap", "st-floss", "st-brushes"),
        ("invite", "shelf-kid"),
    ],
    "toothpaste-rda-table/index.html": [("swap", "st-tube", "st-paste"), ("swap", "st-floss", "st-brushes")],
    "virtual-consultation/index.html": [("swap", "st-laptop", "st-video", 0), ("invite", "desk-phone")],
}


def widths(key):
    ws = []
    for f in os.listdir(UPLOADS):
        m = re.match(r"^%s-(\d+)\.webp$" % re.escape(key), f)
        if m:
            ws.append(int(m.group(1)))
    if not ws:
        raise SystemExit(f"no uploads for key {key}")
    return sorted(ws)


IMG_RE = re.compile(r"<img\b[^>]*>")


def key_of(img):
    m = re.search(r'src="([^"]*?)uploads/([a-z0-9-]+?)-(\d+)\.webp"', img)
    return (m.group(1), m.group(2), int(m.group(3))) if m else (None, None, None)


def rebuild(img, new_key):
    prefix, old_key, old_w = key_of(img)
    ws = widths(new_key)
    src_w = min(ws, key=lambda w: abs(w - old_w))
    srcset = ", ".join(f"{prefix}uploads/{new_key}-{w}.webp {w}w" for w in ws)
    img = re.sub(r'src="[^"]*"', f'src="{prefix}uploads/{new_key}-{src_w}.webp"', img, count=1)
    if 'srcset="' in img:
        img = re.sub(r'srcset="[^"]*"', f'srcset="{srcset}"', img, count=1)
    else:
        img = img.replace(f'src="{prefix}uploads/{new_key}-{src_w}.webp"', f'src="{prefix}uploads/{new_key}-{src_w}.webp" srcset="{srcset}"', 1)
    alt = ALT[new_key]
    if 'alt="' in img:
        img = re.sub(r'alt="[^"]*"', f'alt="{alt}"', img, count=1)
    else:
        img = img.replace("<img ", f'<img alt="{alt}" ', 1)
    return img


def figure_html(prefix, key, shape, caption=None, top=False):
    ws = widths(key)
    src_w = 960 if 960 in ws else ws[-1]
    srcset = ", ".join(f"{prefix}uploads/{key}-{w}.webp {w}w" for w in ws)
    sizes = "(max-width: 899px) 100vw, 75vw" if shape == "is-band" else "(max-width: 899px) 100vw, 34rem"
    cls = "ch-figure " + shape + (" is-top" if top else "")
    cap = f"<figcaption>{caption}</figcaption>" if caption else ""
    if caption and key not in OWN:
        raise SystemExit(f"caption on a stock frame: {key}")
    return (f'<figure class="{cls}" data-wipe data-drift>'
            f'<img src="{prefix}uploads/{key}-{src_w}.webp" srcset="{srcset}" sizes="{sizes}" alt="{ALT[key]}" loading="lazy" decoding="async">'
            f'{cap}</figure>')


def section_span(html, sid):
    m = re.search(r'<section class="ch[^"]*" id="%s"[^>]*>.*?</section>' % re.escape(sid), html, re.S)
    if not m:
        raise SystemExit(f"no section #{sid}")
    return m.start(), m.end()


FIGWRAP_RE = re.compile(r'\n\s*<div class="wrap">\s*<figure class="ch-figure[^"]*"[^>]*>.*?</figure>\s*</div>', re.S)


def op_drop(html, sid):
    a, b = section_span(html, sid)
    sec = html[a:b]
    m = FIGWRAP_RE.search(sec)
    if not m:
        return html, "already"
    sec2 = sec[:m.start()] + sec[m.end():]
    return html[:a] + sec2 + html[b:], "dropped"


def op_band(html, sid, key, caption, top, prefix):
    a, b = section_span(html, sid)
    sec = html[a:b]
    m = FIGWRAP_RE.search(sec)
    if not m:
        return html, "already"
    fig = figure_html(prefix, key, "is-band", caption, top)
    sec2 = sec[:m.start()] + f'\n\n  <div class="wrap">\n    {fig}\n  </div>' + sec[m.end():]
    return html[:a] + sec2 + html[b:], "band"


def op_withfig(html, sid, key, caption, prefix):
    a, b = section_span(html, sid)
    sec = html[a:b]
    m = FIGWRAP_RE.search(sec)
    if not m:
        return html, "already"
    before = sec[:m.start()]
    # the body wrap is the last `<div class="wrap">` before the figure wrap,
    # and it closes at the last `</div>` before it.
    start = before.rfind('\n  <div class="wrap">\n')
    end = before.rfind('\n  </div>')
    if start < 0 or end < start:
        raise SystemExit(f"could not find the body wrap in #{sid}")
    body = before[start + len('\n  <div class="wrap">\n'):end]
    fig = figure_html(prefix, key, "is-plate", caption)
    new = f'\n  <div class="wrap ch-withfig">\n    <div>\n{body}\n    </div>\n    {fig}\n  </div>'
    sec2 = before[:start] + new + before[end + len('\n  </div>'):] + sec[m.end():]
    return html[:a] + sec2 + html[b:], "withfig"


def op_swap(html, old, new, nth):
    hits = [m for m in IMG_RE.finditer(html) if key_of(m.group(0))[1] == old]
    if nth is not None:
        hits = hits[nth:nth + 1]
    if not hits:
        return html, "already"
    out, last = [], 0
    for m in hits:
        out.append(html[last:m.start()])
        out.append(rebuild(m.group(0), new))
        last = m.end()
    out.append(html[last:])
    return "".join(out), f"swapped x{len(hits)}"


def op_invite(html, key):
    m = re.search(r'<figure class="iv-shot">\s*(<img\b[^>]*>)\s*<figcaption>[^<]*</figcaption>\s*</figure>', html)
    if not m:
        return html, "no invite"
    if key_of(m.group(1))[1] == key:
        return html, "already"
    img = rebuild(m.group(1), key)
    fig = f'<figure class="iv-shot">\n        {img}\n        <figcaption>{INVITE[key]}</figcaption>\n      </figure>'
    return html[:m.start()] + fig + html[m.end():], "invite"


def op_caption(html, key, text):
    # the inset figure inside a migrated prose chapter, or any figure holding the key
    m = None
    for fm in re.finditer(r'<figure\b[^>]*>(.*?)</figure>', html, re.S):
        if key_of(fm.group(1))[1] == key:
            m = fm
            break
    if not m:
        return html, "no figure"
    inner = m.group(1)
    inner2 = re.sub(r'\s*<figcaption>.*?</figcaption>', "", inner, flags=re.S)
    if text:
        if key not in OWN:
            raise SystemExit(f"caption on a stock frame: {key}")
        inner2 = inner2.rstrip() + f"<figcaption>{text}</figcaption>"
    if inner2 == inner:
        return html, "already"
    return html[:m.start(1)] + inner2 + html[m.end(1):], "caption"


changed = 0
for rel, ops in PLAN.items():
    path = os.path.join(HOME, rel)
    html = io.open(path, encoding="utf-8").read()
    depth = rel.count("/")
    prefix = "../" * depth + "assets/"
    orig = html
    notes = []
    for op in ops:
        kind = op[0]
        if kind == "swap":
            html, n = op_swap(html, op[1], op[2], op[3] if len(op) > 3 else None)
        elif kind == "drop":
            html, n = op_drop(html, op[1])
        elif kind == "band":
            html, n = op_band(html, op[1], op[2], op[3] if len(op) > 3 else None, op[4] if len(op) > 4 else False, prefix)
        elif kind == "withfig":
            html, n = op_withfig(html, op[1], op[2], op[3] if len(op) > 3 else None, prefix)
        elif kind == "invite":
            html, n = op_invite(html, op[1])
        elif kind == "caption":
            html, n = op_caption(html, op[1], op[2])
        notes.append(f"{kind}:{op[1]}={n}")
    if html != orig:
        changed += 1
        if not DRY:
            io.open(path, "w", encoding="utf-8", newline="\n").write(html)
    print(f"{rel:58s} {'  '.join(notes)}")
print(f"\n{changed} pages {'would change' if DRY else 'written'}")
