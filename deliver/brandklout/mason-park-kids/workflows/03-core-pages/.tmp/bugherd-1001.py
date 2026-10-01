"""BugHerd round seven (2026-10-01): notes #507-#515.

    python bugherd-1001.py [--dry-run]

Reuses round five's helpers (swap, section_span, ent) by loading bugherd-0926.py
without running its main(). #515's photo is AdobeStock_1781157191 from the practice
Drive, encoded by prep-images.py as `as-1781157191`.

#514 (the team ticker leaves half the strip empty) is not markup: journey.js now repeats
the names until one run is wider than the strip.

Idempotent. Computes every page in memory before opening any file for write; writes LF.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "bugherd-0926.py"), encoding="utf-8").read()
_src = _src[: _src.rindex("\nmain()")]
r5 = {"__file__": os.path.join(HERE, "bugherd-0926.py"), "__name__": "r5"}
exec(compile(_src, r5["__file__"], "exec"), r5)
r3 = r5["r3"]
swap, page_path, ent = r5["swap"], r5["page_path"], r5["ent"]

r3["ALT"].update({
    "as-1781157191": "A smiling boy with braces brushing his teeth with an electric toothbrush",
})

# (note, page, section id, image on screen, new key)
SWAP = [
    (515, "services/dental-hygiene-education", "invitation", "st-brush", "as-1781157191"),
]

BOOK = '<a class="link-arrow" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment today <span aria-hidden="true">&rarr;</span></a>'

COPY = [
    # home, #comfort, the first card
    (507, "index", "<h3>You stay in the room.</h3>", "<h3>Designed for them.</h3>"),
    (509, "index",
     "<p>Parents are always welcome to accompany their child during the first visit and at checkups. Nobody is sent to the waiting room.</p>\n      </div>",
     "<p>Mason Park Dental for Kids is designed for your child in mind. From 6 months old through their last day in high school. We are here to keep their smiles healthy for their bright future.</p>\n        " + BOOK + "\n      </div>"),
]

REMOVE = [
    (511, "our-doctors", r'\n\s*<p class="ch-note">Every number is the practice&rsquo;s own, taken from its published pages\. Nothing here is rounded up\.</p>'),
    (512, "our-doctors", r'<figcaption>A knee-to-knee exam</figcaption>'),
    (513, "our-doctors", r'<figcaption>Dr\. Nguyen, with her patients</figcaption>'),
]


def main():
    dry = "--dry-run" in sys.argv
    pages, errors = {}, []

    def get(p):
        if p not in pages:
            pages[p] = open(page_path(p), encoding="utf-8", newline="").read()
        return pages[p]

    for note, p, sid, old, new in SWAP:
        pages[p], what = swap(get(p), note, sid, old, new)
        print(f"#{note:<4} {what:8s} {p} #{sid}: {old} -> {new}")
    for note, p, old, new in COPY:
        s = get(p)
        hit = [o for o in ent(old) if o in s]
        if len(hit) == 1 and s.count(hit[0]) == 1:
            pages[p] = s.replace(hit[0], new)
            print(f"#{note:<4} edited   {p}")
        elif not hit and new in s:
            print(f"#{note:<4} already  {p}")
        else:
            errors.append(f"#{note} {p}: {[s.count(h) for h in hit]} matches for {old[:70]!r}")
    for note, p, pat in REMOVE:
        s = get(p)
        ms = list(re.finditer(pat, s, re.S))
        if len(ms) == 1:
            pages[p] = s[: ms[0].start()] + s[ms[0].end():]
            print(f"#{note:<4} removed  {p}")
        elif not ms:
            print(f"#{note:<4} already? {p} (no match: {pat[:60]})")
        else:
            errors.append(f"#{note} {p}: {len(ms)} matches")

    if errors:
        raise SystemExit("\n".join(errors))
    if dry:
        print("dry run, nothing written")
        return
    n = 0
    for p, s in pages.items():
        with open(page_path(p), encoding="utf-8", newline="") as f:
            if f.read() == s:
                continue
        with open(page_path(p), "w", encoding="utf-8", newline="") as f:
            f.write(s)
        n += 1
    print(f"{n} pages written")


main()
