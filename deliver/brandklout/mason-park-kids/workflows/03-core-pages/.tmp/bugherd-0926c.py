"""BugHerd round five, part three (2026-09-26): notes that needed outside material.

    python bugherd-0926c.py [--dry-run]

- #376 insurer logos: rendered from _logos/ by logos2png.mjs to uploads/ins-<slug>.png.
- #378-#381 apply links: no practice-specific CareCredit, Alphaeon or LendingClub link exists
  for the kids practice (checked 2026-09-26, see the run file), so each name links to the
  lender's own application page until the practice sends its accounts' links.
- #253 #257 #261 Silver Diamine Fluoride: written for this practice from Grand Mission's SDF
  page, without its price and without its doctor.
- #201 #206 all reviews on Google: the kids listing, maps.google.com/?cid=10994444486808824955.
Run after bugherd-0926.py and -0926b.py. Idempotent; LF.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))
GOOGLE = "https://maps.google.com/?cid=10994444486808824955"
CARECREDIT = "https://www.carecredit.com/apply/"
ALPHAEON = "https://goalphaeon.com/applydental"
LENDINGCLUB = "https://www.lendingclub.com/patientsolutions"


def page_path(p):
    return os.path.join(HOME, "index.html") if p == "index" else os.path.join(HOME, p, "index.html")


def a(href, text):
    return f'<a href="{href}" target="_blank" rel="noopener">{text}</a>'


def logo(slug, name, small=""):
    s = f"<small>{small}</small>" if small else ""
    return (f'<li><img src="../assets/uploads/ins-{slug}.png" alt="{name}" loading="lazy" decoding="async">'
            f'<span class="visually-hidden">{name}</span>{s}</li>')


NETWORK_OLD = """      <li>Delta Dental</li>
      <li>Guardian</li>
      <li>Principal</li>
      <li>Ameritas</li>
      <li>DNoA<small>BlueCross BlueShield</small></li>
      <li>Cigna</li>
      <li>Careington</li>
      <li>MetLife</li>
      <li>Sun Life Financial</li>
      <li>Aetna</li>
      <li>Humana</li>
      <li>Assurant / DHA</li>"""
NETWORK_NEW = "\n".join("      " + logo(*r) for r in [
    ("delta-dental", "Delta Dental"), ("guardian", "Guardian"), ("principal", "Principal"),
    ("ameritas", "Ameritas"), ("dnoa", "DNoA", "BlueCross BlueShield"), ("cigna", "Cigna"),
    ("careington", "Careington"), ("metlife", "MetLife"), ("sun-life", "Sun Life Financial"),
    ("aetna", "Aetna"), ("humana", "Humana"), ("assurant", "Assurant / DHA", "DHA"),
])

SDF_SECTION_OLD_HEAD = '<section class="ch ch-prevent" id="prevent" data-chapter="3" data-chapter-name="Afterwards" data-theme="sky">'
SDF_SECTION = """<section class="ch ch-prevent" id="prevent" data-chapter="3" data-chapter-name="Silver Diamine Fluoride" data-theme="sky">
  <div class="wrap ch-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Silver Diamine Fluoride</b></p>
      <h2 data-split>Silver Diamine Fluoride (SDF): stopping a cavity without the drill.</h2>
    </div>
    <p class="lede">Silver Diamine Fluoride is a liquid painted onto a cavity in a few minutes. It kills the bacteria causing the decay and hardens the tooth so the cavity stops growing, with no drilling, no needles and no numbing.</p>
  </div>
  <div class="wrap">
    <div class="sq-grid" data-stagger>
      <div class="sq-card"><h3>Who it helps</h3><p>Children with early cavities in baby teeth, children who are anxious about the chair, and teeth that are hard to reach. Several teeth can be treated in one visit.</p></div>
      <div class="sq-card is-sky"><h3>How it is done</h3><p>The tooth is checked, cleaned and dried, and a small amount of SDF is brushed on. It takes seconds per tooth.</p></div>
      <div class="sq-card is-sun"><h3>What to expect</h3><p>The treated spot turns dark, which shows the decay has stopped. It does not replace the tooth structure, so some teeth still need a filling later.</p></div>
      <div class="sq-card"><h3>Afterwards</h3><p>No eating or drinking for an hour. We check the treated teeth at regular visits and reapply when needed, usually every six to twelve months.</p></div>
    </div>
  </div>
</section>"""

EDITS = [
    (376, "financing", NETWORK_OLD, NETWORK_NEW),
    (378, "financing", "<tr><td>CareCredit</td>", f"<tr><td>{a(CARECREDIT, 'CareCredit')}</td>"),
    (380, "financing", "<tr><td>Alphaeon</td>", f"<tr><td>{a(ALPHAEON, 'Alphaeon')}</td>"),
    (381, "financing", "<tr><td>Lending Club</td>", f"<tr><td>{a(LENDINGCLUB, 'Lending Club')}</td>"),
    (379, "financing",
     "We also accept Alphaeon, Lending Club, Care Credit for those in need of a finance option.</p>",
     f"We also accept {a(ALPHAEON, 'Alphaeon')}, {a(LENDINGCLUB, 'Lending Club')} and {a(CARECREDIT, 'CareCredit')} for those in need of a finance option.</p>"),
    (253, "services/restorative-dentistry",
     "have a baby tooth extracted due to dental decay.</p></div>\n    </div>",
     'have a baby tooth extracted due to dental decay.</p></div>\n      <div class="sq-card is-sun"><span class="cf-glyph" aria-hidden="true">6</span><h3>Silver Diamine Fluoride (SDF)</h3><p>A liquid brushed onto an early cavity that stops the decay without drilling or needles.</p><a class="link-arrow" href="/services/composite-fillings/#prevent">Fillings and SDF <span aria-hidden="true">&rarr;</span></a></div>\n    </div>'),
    (253, "services/restorative-dentistry", "Five ways a tooth gets its job back.", "Six ways a tooth gets its job back."),
    (201, "our-doctors",
     '<p class="ch-foot"><a class="link-arrow" href="/patient-reviews/">All reviews <span aria-hidden="true">&rarr;</span></a></p>',
     f'<p class="ch-foot"><a class="link-arrow" href="/patient-reviews/">All reviews <span aria-hidden="true">&rarr;</span></a> &nbsp; <a class="link-arrow" href="{GOOGLE}" target="_blank" rel="noopener">Read them on Google <span aria-hidden="true">&rarr;</span></a></p>'),
    (206, "our-team",
     "Where a review names a member of the team, it sits beside them here.</p>",
     f'Where a review names a member of the team, it sits beside them here. <a href="{GOOGLE}" target="_blank" rel="noopener">See all our reviews on Google</a>.</p>'),
]


def main():
    dry = "--dry-run" in sys.argv
    pages, errors = {}, []
    for note, p, old, new in EDITS:
        s = pages.get(p) or open(page_path(p), encoding="utf-8", newline="").read()
        c = s.count(old)
        if c == 1:
            pages[p] = s.replace(old, new)
            print(f"#{note:<4} edited   {p}")
        elif c == 0 and new in s:
            pages[p] = s
            print(f"#{note:<4} already  {p}")
        else:
            errors.append(f"#{note} {p}: {c} matches for {old[:60]!r}")
    # #261: the fillings page's last chapter becomes the SDF chapter.
    p = "services/composite-fillings"
    s = pages.get(p) or open(page_path(p), encoding="utf-8", newline="").read()
    if SDF_SECTION_OLD_HEAD in s:
        i = s.index(SDF_SECTION_OLD_HEAD)
        j = s.index("</section>", i) + len("</section>")
        pages[p] = s[:i] + SDF_SECTION + s[j:]
        print(f"#261  replaced {p} #prevent")
    else:
        print("#261  already  " + p)
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
