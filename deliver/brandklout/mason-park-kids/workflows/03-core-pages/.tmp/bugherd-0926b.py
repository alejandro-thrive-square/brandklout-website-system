"""BugHerd round five, part two (2026-09-26): the structural notes.

    python bugherd-0926b.py [--dry-run]

Exact replacements, like bugherd-0926.py's COPY, for the notes that change markup rather
than words: lists reordered, buttons relabelled, a logo, a card, a body class. Run after
bugherd-0926.py. Idempotent; LF; every page computed before any is written.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))
FLEX = "https://www.flexbook.me/masonpark/1"


def page_path(p):
    return os.path.join(HOME, "index.html") if p == "index" else os.path.join(HOME, p, "index.html")


EDITS = [
    # #266: the sedation line moves to the bottom and says what the reviewer wrote.
    (266, "services/dental-crowns",
     "<ul><li>Nitrous oxide, oral and IV sedation, and general anesthesia, where they help.</li><li>Longer appointments booked deliberately, so nothing has to be rushed.</li><li>Everything explained on the screen in the room before it happens.</li><li>Parents are always welcome to accompany their child.</li></ul>",
     "<ul><li>Longer appointments booked deliberately, so nothing has to be rushed.</li><li>Everything explained on the screen in the room before it happens.</li><li>Parents are always welcome to accompany their child.</li><li>Sedation is an option if needed. A conversation about what is best for your child and their personalized treatment comes first.</li></ul>"),
    # #281: the reviewer's three lines, in their order.
    (281, "services/extractions",
     "<ul><li>Nitrous oxide, oral and IV sedation, and general anesthesia.</li><li>A desensitization visit first, if this is not a day for a first impression of the practice.</li><li>Parents are always welcome to accompany their child.</li><li>The plan and the price explained before anything is done.</li></ul>",
     "<ul><li>The plan and the price explained before anything is done.</li><li>Sedation is discussed beforehand and personalized for your child&rsquo;s needs.</li><li>Parents are always welcome to accompany their child.</li></ul>"),
    # #188: the Parks Youth Ranch logo above its name.
    (188, "about-us",
     '<div class="ab-ribbon_aside">\n        <b>Parks Youth Ranch</b>',
     '<div class="ab-ribbon_aside">\n        <img class="ab-ribbon_logo" src="../assets/uploads/parks-youth-ranch-logo.png" alt="Parks Youth Ranch" width="480" height="769" loading="lazy" decoding="async">\n        <b>Parks Youth Ranch</b>'),
    # #426: no chapter readout on the blog overview.
    (426, "blog", '<body class="has-journey">', '<body class="has-journey is-blog-index">'),
    # #226 #371: two captions that were not "Suite 104B" ones, so the site-wide pass left them.
    (226, "services/comprehensive-pediatric-dentistry", "\n        <figcaption>A knee-to-knee exam in the practice.</figcaption>", ""),
    (371, "new-patients", "\n        <figcaption>The team, in the waiting room.</figcaption>", ""),
]

# #276: the invitation's filled button read "Call (281) 578-7100" but opened the booking
# page, so the chapter showed the number twice. It says "Book now" wherever that happened.
MISLABELLED = f'<a class="button is-sun is-lg" href="{FLEX}" target="_blank" rel="noopener">Call (281) 578-7100</a>'
FIXED = f'<a class="button is-sun is-lg" href="{FLEX}" target="_blank" rel="noopener">Book now</a>'
for p in ("services/pulp-therapy", "accessibility-statement", "emergency-pediatric-dentistry", "refer-a-patient",
          "services/special-needs-patient-care", "virtual-consultation"):
    EDITS.append((276, p, MISLABELLED, FIXED))


def main():
    dry = "--dry-run" in sys.argv
    pages, errors = {}, []
    for note, p, old, new in EDITS:
        s = pages.get(p) or open(page_path(p), encoding="utf-8", newline="").read()
        c = s.count(old)
        if c == 1 or (c > 1 and note == 276):
            pages[p] = s.replace(old, new)
            print(f"#{note:<4} edited   {p}")
        elif c == 0 and (new in s or new == ""):
            pages[p] = s
            print(f"#{note:<4} already  {p}")
        else:
            errors.append(f"#{note} {p}: {c} matches for {old[:60]!r}")
    if errors:
        raise SystemExit("\n".join(errors))
    if dry:
        print("dry run, nothing written")
        return
    for p, s in pages.items():
        with open(page_path(p), "w", encoding="utf-8", newline="") as f:
            f.write(s)
    print(f"{len(pages)} pages written")


main()
