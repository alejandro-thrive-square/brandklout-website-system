"""BugHerd round four (2026-09-24, evening): notes #170-#187.

    python bugherd-0924b.py [--dry-run]

Swaps reuse bugherd-0924-images.py's swap(): a slot is found by chapter and by the image
on screen when the note was left. INSERTS put a photo into a path card that had none,
found by its step number. COPY rows are exact replacements. #176 (IMG_7693) and #182
(the play area) wait on their Drive originals; the attachments are viewer screenshots.
"""
import importlib.util, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("r3", os.path.join(HERE, "bugherd-0924-images.py"))
src = open(spec.origin, encoding="utf-8").read()
src = src[: src.index("\nmain()")]  # the helpers, without running round three again
r3 = {"__file__": spec.origin}
exec(compile(src, spec.origin, "exec"), r3)
r3["ALT"].update({
    "rv-model-girl": "A dentist showing a girl a model of teeth",
    "rv-mouth-exam": "A dentist checking a boy's teeth with a mirror",
    "rv-high-five": "A girl in the dental chair giving the dentist a high five",
    "rv-mirror-exam": "A girl in the chair having her teeth checked with a mirror",
    "rv-toddler-exam": "A dentist checking a toddler's teeth while she holds a toy",
    "rv-brushing-lesson": "A dentist showing a little girl how to brush on a model of teeth",
    "rv-tooth-calendar": "A model tooth and a dental mirror on a calendar",
    "rv-cap-model-2": "A clinician in a patterned cap showing a child a model of teeth",
    "rv-ceiling-tv-2": "The view from the chair: a show on the screen in the ceiling",
})
swap, widths, page_path = r3["swap"], r3["widths"], r3["page_path"]

SWAP = [
    (170, "index", "path", "smile", "rv-model-girl"),
    (171, "index", "path", "rv-tv-chair", "rv-mouth-exam"),
    (173, "services/comprehensive-pediatric-dentistry", "why", "smile", "rv-high-five"),
    (177, "services/comprehensive-pediatric-dentistry", "path", "knee-2", "rv-toddler-exam"),
    (178, "services/comprehensive-pediatric-dentistry", "path", "rv-tv-chair", "rv-brushing-lesson"),
    (180, "services/comprehensive-pediatric-dentistry", "invitation", "gumball-2", "rv-shelf-smile"),
    (183, "about-us", "building", "rv-operatory", "rv-cap-model-2"),
    (184, "about-us", "building", "smile", "rv-ceiling-tv-2"),
]
# (note, page, step number, key, crop class)
INSERTS = [
    (175, "services/comprehensive-pediatric-dentistry", 3, "rv-mirror-exam", "is-p3"),
    (179, "services/comprehensive-pediatric-dentistry", 5, "rv-tooth-calendar", "is-p5"),
]
COPY = [
    (181, "about-us",
     "Behind the Ranch 99 complex, suite 104B on the ground floor. Free parking at the door, a waiting room with a screen, and treatment rooms painted for the people who use them.",
     "Crafted with your whole family in mind. While little ones explore our dedicated play zone, older kids and adults can unwind in their own space. Every treatment room features ceiling-mounted TVs and modern technology to keep your visit completely comfortable and stress-free."),
    (185, "about-us", "<li>Parents welcome in the room</li>", "<li>Parents welcome</li>"),
    (186, "about-us", "<li>Nitrous oxide, oral and IV sedation, and general anesthesia</li>",
     "<li>Sedation is available if needed, and treatment is discussed to meet your child&rsquo;s personalized needs</li>"),
    (187, "about-us", "<li>The same address and the same phone call</li>", "<li>Amazing care under one roof</li>"),
    # the new frames change what the captions describe
    (183, "about-us", "<figcaption>The treatment area.</figcaption>", "<figcaption>A brushing lesson, mid visit.</figcaption>"),
    (184, "about-us", "<figcaption>A treatment room, mid visit.</figcaption>", "<figcaption>The screen in the ceiling, from the chair.</figcaption>"),
]


def insert(s, note, sid, step, key, cls):
    a = s.index(f'id="{sid}"')
    b = s.index("</section>", a)
    body = s[a:b]
    m = re.search(r'<article class="pa-card">(<span class="pa-no">' + str(step) + r"</span>)", body)
    if not m:
        if re.search(r'uploads/' + re.escape(key) + r'-', body):
            return s, "already"
        raise SystemExit(f"#{note}: no photo-less step {step} in #{sid}")
    ws = widths(key)
    pre = re.search(r'src="([^"]*?)assets/uploads/', body).group(1) + "assets/uploads/"  # same depth as the page's own images
    src = f"{pre}{key}-{960 if 960 in ws else ws[-1]}.webp"
    srcset = ", ".join(f"{pre}{key}-{w}.webp {w}w" for w in ws)
    shot = (f'<div class="pa-shot {cls}"><img src="{src}" srcset="{srcset}" sizes="24rem" '
            f'alt="{r3["ALT"][key]}" loading="lazy" decoding="async"></div>')
    body = body[: m.start()] + '<article class="pa-card">' + shot + m.group(1) + body[m.end():]
    return s[:a] + body + s[b:], "inserted"


def main():
    dry = "--dry-run" in sys.argv
    pages = {}
    get = lambda p: pages.get(p) or open(page_path(p), encoding="utf-8", newline="").read()
    for note, p, sid, old, new in SWAP:
        pages[p], what = swap(get(p), note, sid, old, new)
        print(f"#{note:<4} {what:8s} {p} #{sid}: {old} -> {new}")
    for note, p, step, key, cls in INSERTS:
        pages[p], what = insert(get(p), note, "path", step, key, cls)
        print(f"#{note:<4} {what:8s} {p} #path step {step}: {key}")
    for note, p, old, new in COPY:
        s = get(p)
        c = s.count(old)
        if c == 1:
            pages[p] = s.replace(old, new)
            print(f"#{note:<4} edited   {p}")
        elif c == 0 and new in s:
            pages[p] = s
            print(f"#{note:<4} already  {p}")
        else:
            raise SystemExit(f"#{note} {p}: {c} matches for {old[:50]!r}")
    if dry:
        print("dry run, nothing written")
        return
    for p, s in pages.items():
        with open(page_path(p), "w", encoding="utf-8", newline="") as f:
            f.write(s)
    print(f"{len(pages)} pages written")


main()
