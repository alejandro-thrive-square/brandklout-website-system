"""The practice's Canva team portraits (2026-10-01): BugHerd #502 #504 #506, and every staff photo swapped.

    python team-canva-1001.py [--dry-run]

Source: workflows/Mason Park -Team/ (exported from Canva by the user; gitignored, backed up to R2
by assets.mjs). One studio set, 1000x1000 each. Encoded as `canva-<first>-{480,960}.webp`: new
basenames, because the Instatic media upload skips a basename it already has.

  /our-team  the three groups and the ticker, rebuilt from TEAM below
             #502 Priscilla, Amanda, Nicole at the front desk (the note groups Nicole there; Canva
                  titles her RDA, the reply asks)
             #504 Josh, Alison, Luis with the dental assistants
             #506 Lola, Canva says RDH: with the hygienists
             Anabel, Ivon, Caisy, Genevieve, Tiffany: same places, the Canva portrait
  Dr. Dave Cho: dr-cho -> canva-cho wherever it appears (/our-doctors, /our-team)

Anju Lekshmi (RDA) is in the Canva folder but in no note; she is not added (the reply asks).
Idempotent; writes LF.
"""
import os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, "..", "..", "Mason Park -Team"))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))
UP = os.path.join(HOME, "assets", "uploads")
WIDTHS = (480, 960)

FILES = {
    "priscilla": "Priscilla Compean, Treatment Coordinator.png",
    "amanda": "Amanda Ortega, Patient and Treatment Coordinator.png",
    "nicole": "Nicole Salgado, RDA.png",
    "anabel": "Anabel Paita, Billing Coordinator.png",
    "ivon": "Ivon Garcia, RDA.png",
    "caisy": "Caisy Bradley, RDA.png",
    "josh": "Josh Richardson, RDA.png",
    "alison": "Alison Chen, RDA.png",
    "luis": "Luis Trevino, RDA.png",
    "genevieve": "Genevieve Fabre, RDH.png",
    "tiffany": "Tiffany Cun, RDH.png",
    "lola": "Lola Oboh, RDH.png",
    "cho": "Dr. Dave Cho, General Dentist.png",
}

# (group heading, its line, [(key, first name, role)])
TEAM = [
    ("Front desk", "The first people you meet", [
        ("priscilla", "Priscilla", "Treatment coordinator"),
        ("amanda", "Amanda", "Patient and treatment coordinator"),
        ("nicole", "Nicole", "Front desk"),
        ("anabel", "Anabel", "Billing"),
    ]),
    ("Dental assistants", "Beside the chair for every visit", [
        ("ivon", "Ivon", "Dental assistant"),
        ("caisy", "Caisy", "Dental assistant"),
        ("josh", "Josh", "Dental assistant"),
        ("alison", "Alison", "Dental assistant"),
        ("luis", "Luis", "Dental assistant"),
    ]),
    ("Dental hygienists", "The cleanings, and the brushing lessons", [
        ("genevieve", "Genevieve", "Dental hygienist"),
        ("tiffany", "Tiffany", "Dental hygienist"),
        ("lola", "Lola", "Dental hygienist"),
    ]),
]


def encode(dry):
    n = 0
    for key, name in FILES.items():
        for w in WIDTHS:
            out = os.path.join(UP, f"canva-{key}-{w}.webp")
            if os.path.exists(out):
                continue
            n += 1
            if not dry:
                im = Image.open(os.path.join(SRC, name)).convert("RGB")
                im.resize((w, w), Image.LANCZOS).save(out, "WEBP", quality=86, method=6)
    print(f"encoded {n} file(s)")


def cell(key, first, role):
    return (f'        <figure class="tm-cell"><img src="../assets/uploads/canva-{key}-480.webp" '
            f'srcset="../assets/uploads/canva-{key}-480.webp 480w, ../assets/uploads/canva-{key}-960.webp 960w" sizes="13rem" '
            f'alt="{first}, {role.lower()}" loading="lazy" decoding="async">'
            f'<figcaption><b>{first}</b><span>{role}</span></figcaption></figure>')


def team_block():
    groups = []
    for head, line, people in TEAM:
        cells = "\n".join(cell(*p) for p in people)
        groups.append(f"""    <div class="tm-group">
      <div class="tm-group_head"><h3>{head}</h3><span>{line}</span></div>
      <div class="tm-wall" data-stagger>
{cells}
      </div>
    </div>""")
    return "\n".join(groups)


def main():
    dry = "--dry-run" in sys.argv
    encode(dry)
    pages = {}
    p = os.path.join(HOME, "our-team", "index.html")
    s = open(p, encoding="utf-8", newline="").read()
    a = s.index('    <div class="tm-group">')
    b = s.index("  </div>\n</section>", a)
    s = s[:a] + team_block() + "\n" + s[b:]
    names = [first for _, _, people in TEAM for _, first, _ in people]
    s = re.sub(r'(<div class="ticker_row" data-marquee>\s*)(.*?)(\s*</div>)',
               lambda m: m.group(1) + "".join(f"<span>{n}</span><i></i>" for n in names) + m.group(3), s, count=1, flags=re.S)
    pages[p] = s
    for page in ("our-doctors", "our-team"):
        q = os.path.join(HOME, page, "index.html")
        t = pages.get(q) or open(q, encoding="utf-8", newline="").read()
        k = t.count("uploads/dr-cho-")
        t = t.replace("uploads/dr-cho-480.webp 480w", "uploads/canva-cho-480.webp 480w").replace("uploads/dr-cho-960.webp 960w", "uploads/canva-cho-960.webp 960w")
        t = t.replace("uploads/dr-cho-480.webp", "uploads/canva-cho-480.webp").replace("uploads/dr-cho-960.webp", "uploads/canva-cho-960.webp")
        print(f"{page}: {k} dr-cho reference(s) -> canva-cho; left {t.count('uploads/dr-cho-')}")
        pages[q] = t
    print("ticker:", " ".join(names))
    if dry:
        print("dry run")
        return
    for q, t in pages.items():
        with open(q, "w", encoding="utf-8", newline="") as f:
            f.write(t)
    print(f"{len(pages)} page(s) written")


main()
