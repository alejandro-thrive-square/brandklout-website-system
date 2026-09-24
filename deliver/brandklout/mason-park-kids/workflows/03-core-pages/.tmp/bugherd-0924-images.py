"""BugHerd round three (2026-09-24): every photograph swap and deletion, as one plan.

Each row names the page, the chapter (section id) and the image that was ON SCREEN when
the note was left - read from the note's own selector_info.html, which carries the live
src - so a slot is found by what it shows, not by a card index that can drift.

    python bugherd-0924-images.py --dry-run
    python bugherd-0924-images.py

Idempotent: a row whose old image is gone and whose new one is in place is reported as done.
Writes LF (newline=''), and computes every page in memory before opening any file for write.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))
UP = os.path.join(HOME, "assets", "uploads")

ALT = {
    "rv-tv-chair": "A hygienist beside a young patient in the chair, a show on the screen on the wall",
    "rv-piggy-bank": "A coin going into a pink piggy bank",
    "rv-clipboard": "A form being filled in on a clipboard",
    "rv-tooth-model": "A dentist showing a boy a large model tooth",
    "rv-girl-brushing": "A little girl brushing her teeth at the bathroom sink",
    "rv-tablet-consult": "A team member going over a plan on a tablet with a parent",
    "rv-tablet-consult-2": "A team member talking a parent through the visit on a tablet",
    "rv-chair-team": "Two clinicians working with a child in the chair",
    "rv-loupes": "A clinician in magnifying loupes treating a child",
    "rv-lap-exam": "A clinician examining a child who lies back across a parent's lap",
    "rv-shelf-girls": "Dr. Nguyen with two sisters and their prizes at the toy shelf",
    "rv-model-brushing": "A clinician showing a child how to brush on a model of teeth",
    "rv-building": "The practice building from the car park",
    "rv-boy-toy": "A boy holding up his new toothbrush kit and a toy",
    "rv-desk-tablet": "Two team members at the front desk with a tablet",
    "rv-tooth-question": "A model tooth held up beside a question mark",
    "rv-operatory": "Clinicians at work with patients in the treatment area",
    "rv-operatory-wide": "Clinicians at work with patients in the treatment area",
    "rv-front-desk-team": "Families and the team at the front desk",
    "rv-shelf-smile": "A girl and a team member with her prize at the toy shelf",
    "rv-ceiling-tv": "The view from the chair: the light and the screen on the ceiling",
    "rv-cap-exam": "A clinician in a patterned cap with a child in the chair",
    "rv-cap-model": "A clinician showing a child in the chair a model of teeth",
    "rv-anticavity-kids": "Two children holding their Anti-Cavity Club prizes",
    "rv-mom-toddler": "A mother holding her toddler at the prize shelf",
    "rv-baby-paste": "A baby holding a tube of toothpaste above her head",
    "rv-scanner": "A clinician taking a digital scan of a patient's teeth",
    "rv-emergency": "An emergency sign",
    "rv-desk-phone": "A team member answering the phone at the front desk",
    "rv-desk-phone-2": "A team member on the phone at the front desk",
    "toddler": "A smiling toddler",
    "smile-flip": None,  # keep the page's own alt
}

# (note, page, section id, image on screen or HERO, new key)
SWAP = [
    (44, "technology", "imaging", "chair", "rv-tv-chair"),
    (46, "new-patients", "before", "chair", "rv-tv-chair"),
    (47, "financing", "arrival", "HERO", "rv-piggy-bank"),
    (48, "dental-saving-plan", "arrival", "HERO", "rv-piggy-bank"),
    (49, "accessibility-statement", "arrival", "HERO", "rv-clipboard"),
    (50, "services/sealants", "how", "st-lunchbox", "rv-tooth-model"),
    (52, "services/comprehensive-pediatric-dentistry", "arrival", "HERO", "rv-girl-brushing"),
    (53, "services/comprehensive-pediatric-dentistry", "path", "chair", "rv-tv-chair"),
    (55, "services/dental-crowns", "arrival", "HERO", "rv-tv-chair"),
    (56, "services/dental-crowns", "what", "st-crown", "rv-chair-team"),
    (60, "our-services", "arrival", "HERO", "rv-tv-chair"),
    (62, "services/composite-fillings", "arrival", "HERO", "rv-loupes"),
    (63, "services/composite-fillings", "what", "st-paste", "rv-loupes"),
    (66, "services/early-intervention", "why-seven", "st-bottle", "rv-lap-exam"),
    (70, "our-doctors", "arrival", "HERO", "rv-shelf-girls"),
    (72, "services/orthodontics", "arrival", "HERO", "rv-model-brushing"),
    (74, "contacts", "arrival", "HERO", "rv-building"),
    (75, "services/periodontics", "signs", "st-flossbox", "rv-boy-toy"),
    (77, "services/bonding", "why", "chair", "rv-tv-chair"),
    (78, "services/bonding", "arrival", "HERO", "smile-flip"),
    (80, "about-us", "two", "st-nook", "rv-building"),
    (83, "index", "people", "shelf-kid-2", "rv-desk-tablet"),
    (84, "pediatric-dentistry-faqs-katy-tx", "arrival", "HERO", "rv-tooth-question"),
    (85, "pediatric-dentistry-faqs-katy-tx", "band-1", "operatory", "rv-operatory-wide"),
    # 86 and 167 are the same slot; 167 is the later note and wins.
    (167, "pediatric-dentistry-faqs-katy-tx", "invitation", "st-crayons", "rv-desk-phone-2"),
    (87, "about-us", "arrival", "HERO", "rv-building"),
    (89, "about-us", "building", "sofa", "rv-front-desk-team"),
    (90, "about-us", "building", "knee", "rv-lap-exam"),
    (91, "about-us", "building", "operatory", "rv-operatory"),
    (93, "sitemap", "arrival", "HERO", "rv-building"),
    (97, "our-services", "map", "operatory", "rv-front-desk-team"),
    (102, "our-services", "invitation", "operatory", "rv-operatory-wide"),
    (103, "new-patients", "arrival", "HERO", "rv-shelf-smile"),
    (108, "blog", "latest", "st-wave", "toddler"),
    (117, "our-doctors", "voices", "smile", "rv-shelf-girls"),
    (126, "technology", "arrival", "HERO", "rv-ceiling-tv"),
    (127, "technology", "chairside", "operatory", "rv-cap-exam"),
    (131, "knee-to-knee-pediatric-dental-exam", "what", "knee-2", "rv-lap-exam"),
    (134, "services/fluoride-treatment", "how", "st-milk", "rv-anticavity-kids"),
    (135, "services/fluoride-treatment", "arrival", "HERO", "rv-girl-brushing"),
    # 136 and 155 are both the special-needs hero; 155 is later and wins, and
    # 136's frame (the same file as 156's) goes where 156 asked for it.
    (155, "services/special-needs-patient-care", "arrival", "HERO", "rv-lap-exam"),
    (156, "services/special-needs-patient-care", "why", "smile", "rv-shelf-girls"),
    (137, "knee-to-knee-pediatric-dental-exam", "prepare", "st-bottle", "rv-mom-toddler"),
    (138, "services/preventive-dentistry", "arrival", "HERO", "rv-cap-model"),
    (139, "services/preventive-dentistry", "exam", "st-flossbox", "rv-boy-toy"),
    (142, "services/restorative-dentistry", "arrival", "HERO", "rv-baby-paste"),
    (143, "services/restorative-dentistry", "why-repair", "st-blocks", "toddler"),
    (147, "services/orthodontics", "why", "operatory", "rv-cap-model"),
    (148, "services/invisalign", "how", "st-aligner", "rv-scanner"),
    (150, "services/invisalign", "path", "operatory", "rv-scanner"),
    (152, "services/sedation-dentistry", "arrival", "HERO", "rv-tablet-consult-2"),
    (157, "emergency-pediatric-dentistry", "arrival", "HERO", "rv-emergency"),
    (158, "emergency-pediatric-dentistry", "after", "st-phone", "rv-desk-phone"),
    (162, "dental-saving-plan", "who", "team", "rv-mom-toddler"),
    (168, "services/dental-cleanings-and-exams", "why", "chair", "rv-tv-chair"),
]

# Band figures removed with their wrap: (note, page, section id).
# 141 says "for all pages": every chapter with id="questions" that ends on a band.
DROP = [
    (122, "our-doctors", "training"),
    (133, "our-services", "ages"),
    (160, "financing", "network"),
    (163, "patient-reviews", "wall"),
] + [(141, p, "questions") for p in (
    "financing", "new-patients", "services/comprehensive-pediatric-dentistry",
    "services/dental-cleanings-and-exams", "services/invisalign",
    "services/orthodontics", "services/preventive-dentistry",
)]


def widths(key):
    ws = []
    for f in os.listdir(UP):
        m = re.fullmatch(re.escape(key) + r"-(\d+)\.webp", f)
        if m:
            ws.append(int(m.group(1)))
    if not ws:
        raise SystemExit(f"no files for {key} in uploads/ - run prep-images.py")
    return sorted(ws)


def section_span(s, sid):
    m = re.search(r'<section class="ch[^"]*" id="' + re.escape(sid) + r'"', s)
    if not m:
        return None
    return m.start(), s.index("</section>", m.start())


def page_path(p):
    return os.path.join(HOME, "index.html") if p == "index" else os.path.join(HOME, p, "index.html")


def swap(s, note, sid, old, new):
    a, b = section_span(s, sid)
    body = s[a:b]
    imgs = list(re.finditer(r"<img [^>]*>", body))
    if old == "HERO":
        hits = imgs[:1]
    else:
        hits = [m for m in imgs if re.search(r'uploads/' + re.escape(old) + r'(-\d+)?\.webp"', m.group(0))]
    if not hits:
        if any(re.search(r'uploads/' + re.escape(new) + r'-', m.group(0)) for m in imgs):
            return s, "already"
        raise SystemExit(f"#{note}: no {old} image in #{sid}")
    tag = hits[0].group(0)
    prefix = re.search(r'src="([^"]*?)uploads/', tag).group(1) + "uploads/"
    ws = widths(new)
    src = f"{prefix}{new}-{960 if 960 in ws else ws[-1]}.webp"
    srcset = ", ".join(f"{prefix}{new}-{w}.webp {w}w" for w in ws)
    t = re.sub(r' src="[^"]*"', f' src="{src}"', tag, count=1)
    t = re.sub(r' srcset="[^"]*"', f' srcset="{srcset}"', t, count=1)
    if ALT.get(new):
        t = re.sub(r' alt="[^"]*"', f' alt="{ALT[new]}"', t, count=1)
    i = a + hits[0].start()
    return s[:i] + t + s[i + len(tag):], "swapped"


def drop(s, note, sid):
    a, b = section_span(s, sid)
    body = s[a:b]
    m = re.search(r'\n[ \t]*<div class="wrap">\s*<figure class="ch-figure is-band"[^>]*>.*?</figure>\s*</div>', body, re.S)
    if not m:
        return s, "already"
    return s[:a + m.start()] + s[a + m.end():], "dropped"


def main():
    dry = "--dry-run" in sys.argv
    pages = {}
    def get(p):
        if p not in pages:
            pages[p] = open(page_path(p), encoding="utf-8", newline="").read()
        return pages[p]
    for note, p, sid, old, new in SWAP:
        pages[p], what = swap(get(p), note, sid, old, new)
        print(f"#{note:<4} {what:8s} {p} #{sid}: {old} -> {new}")
    for note, p, sid in DROP:
        pages[p], what = drop(get(p), note, sid)
        print(f"#{note:<4} {what:8s} {p} #{sid}: band figure")
    if dry:
        print("dry run, nothing written")
        return
    for p, s in pages.items():
        with open(page_path(p), "w", encoding="utf-8", newline="") as f:
            f.write(s)
    print(f"{len(pages)} pages written")


main()
