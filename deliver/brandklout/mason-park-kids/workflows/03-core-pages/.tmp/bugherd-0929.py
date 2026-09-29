"""BugHerd round six (2026-09-29): notes #434-#506.

    python bugherd-0929.py [--dry-run]

Reuses round five's helpers (swap, path_insert, grid_insert) by loading bugherd-0926.py
without running its main(). New photos come from the practice Drive through
prep-images.py (`as-<id>`, `px-<date>-<time>`); `as-462171644-sharp` is a lossless frame
of the AdobeStock_462171644 clip at 1 s, cropped to the mirror (#473), and
`as-569098023-flip` is a MIRRORED key (#470).

Also, because the notes say so:
  - "Can I stay with my child?" goes from every FAQ that asks it (#436, "from the site");
  - departed staff leave the team page and every page that names them (#500 #501 #503 #505);
  - the limited emergency exam is $89 everywhere it is priced (#497).

Idempotent. Computes every page in memory before opening any file for write; writes LF.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "bugherd-0926.py"), encoding="utf-8").read()
_src = _src[: _src.rindex("\nmain()")]
r5 = {"__file__": os.path.join(HERE, "bugherd-0926.py"), "__name__": "r5"}
exec(compile(_src, r5["__file__"], "exec"), r5)
r3 = r5["r3"]
swap, page_path, HOME = r5["swap"], r5["page_path"], r5["HOME"]
path_insert, grid_insert, section_span, ent = r5["path_insert"], r5["grid_insert"], r5["section_span"], r5["ent"]

r3["ALT"].update({
    "as-417394782": "A smiling young woman brushing her teeth",
    "as-548586854": "A dentist checking a child's teeth with a mirror",
    "as-920561947": "A smiling boy in the dental chair",
    "as-431487749": "A curing light setting a filling, the patient in orange glasses",
    "as-198950188": "A smiling girl outdoors",
    "as-2151232518": "Silver diamine fluoride being brushed on a child's tooth",
    "as-707517594": "A smiling boy on a sofa at home",
    "as-479833706": "A smiling boy pointing at his cheeks",
    "as-586528082": "Children playing tug of war in the park",
    "as-2152521356": "A smiling boy outdoors",
    "as-548878838": "A smiling girl in glasses climbing outdoors",
    "as-579790612": "A teenager in the dental chair being shown her clear aligners",
    "as-1073294513": "A smiling teenager holding up her clear aligner",
    "as-1016853197": "A gloved hand holding a clear aligner beside its case",
    "as-1891104752": "A smiling boy resting his chin on his arms",
    "as-306767010": "A child holding a drawn smile in front of their face",
    "as-1051456099": "A father and his son talking on the sofa",
    "as-1627253751": "A dentist checking a little girl's teeth on her mother's lap",
    "as-433932780": "Parents walking their daughter in to meet the dentist",
    "as-668611737": "A piggy bank, a calculator, a tooth model and dental instruments",
    "as-169557997": "A family laughing together on the sofa",
    "px-20260714-212931964": "A dentist with a young patient, a show on the ceiling screen",
    "px-20250806-223336154": "A boy holding his prize at the product shelf",
    "px-20250428-153338778": "A smiling boy holding his prize at the product shelf",
    "as-462171644-sharp": "A child fitting a clear aligner, seen in a hand mirror",
    "as-569098023-flip": "A clear aligner resting in an open palm",
})

# (note, page, section id, image on screen or HERO, new key)
SWAP = [
    (456, "services/fluoride-treatment", "arrival", "HERO", "as-417394782"),
    (457, "services/composite-fillings", "path", "rv-chair-team", "as-548586854"),
    (458, "services/composite-fillings", "path", "operatory", "as-920561947"),
    (459, "services/composite-fillings", "path", "rv-mouth-exam", "as-431487749"),
    (460, "services/composite-fillings", "path", "rv-high-five", "as-198950188"),
    (462, "services/dental-crowns", "why", "knee-2", "as-707517594"),
    (463, "services/early-intervention", "arrival", "HERO", "as-479833706"),
    (464, "services/early-intervention", "why-seven", "rv-lap-exam", "as-586528082"),
    (465, "services/early-intervention", "gains", "smile", "as-2152521356"),
    (466, "services/early-intervention", "invitation", "gumball-2", "as-548878838"),
    (470, "services/invisalign", "why", "as-569098023", "as-569098023-flip"),
    (472, "services/invisalign", "invitation", "sofa", "as-1891104752"),
    (473, "invisalign-faqs-katy-tx", "band-1", "as-462171644", "as-462171644-sharp"),
    (476, "services/cosmetic-dentistry", "arrival", "HERO", "as-306767010"),
    (477, "services/cosmetic-dentistry", "how", "st-crayons", "as-1051456099"),
    (478, "services/cosmetic-dentistry", "why", "operatory", "as-1627253751"),
    (479, "services/cosmetic-dentistry", "invitation", "sofa", "as-433932780"),
    (482, "new-patients", "before", "sofa", "img-7695"),
    (484, "new-patients", "before", "rv-tv-chair", "px-20260714-212931964"),
    (486, "dental-saving-plan", "arrival", "HERO", "as-668611737"),
    (491, "patient-reviews", "word", "st-family", "as-169557997"),
    (495, "patient-reviews", "invitation", "gumball-2", "px-20250806-223336154"),
    (496, "contacts", "invitation", "sofa", "px-20250428-153338778"),
]

PATH_INSERTS = [
    (467, "services/invisalign", 1, "as-579790612", "is-p1"),
    (468, "services/invisalign", 3, "as-1073294513", "is-y30"),
    (469, "services/invisalign", 4, "as-1016853197", "is-y40"),
]
GRID_INSERTS = [
    (461, "services/composite-fillings", "prevent", "as-2151232518"),
]

# A class on the frame (figure / div) that holds a given image: (note, page, section, key, add, drop)
CROP = [
    (454, "our-services", "invitation", "px-20260325-164750457", "is-y20", None),
    (455, "services/comprehensive-pediatric-dentistry", "path", "img-7693", "is-y48", "is-p1"),
    (474, "invisalign-faqs-katy-tx", "candidacy", "as-473268491", "is-whole", None),
    (473, "invisalign-faqs-katy-tx", "band-1", "as-462171644-sharp", "is-whole", None),
    (480, "services/periodontics", "why", "as-325979483", "is-x100", None),
    (481, "emergency-pediatric-dentistry", "after", "rv-desk-phone", "is-y40", "is-top"),
    (484, "new-patients", "before", "px-20260714-212931964", "is-y45", None),
    (485, "financing", "invitation", "desk-form", "is-y12", None),
    (495, "patient-reviews", "invitation", "px-20250806-223336154", "is-y60", None),
    (496, "contacts", "invitation", "px-20250428-153338778", "is-y60", None),
    (498, "our-team", "arrival", "team", "is-top", None),
]

TEAM_OUT = ["Gia", "Kebra", "Lizzie", "Karen"]

FAQ_ADD = [
    ("What does a Platinum Invisalign provider mean?",
     "It means we have treated hundreds of smiles with Invisalign&reg;. We are deeply familiar with the nuances of aligner technology and with troubleshooting tricky movements."),
    ("Is Invisalign as effective as braces?",
     "For many cases, including crowding, gaps, overbites and underbites, yes, as long as the aligners are worn 20 to 22 hours a day. Some bites move more predictably with braces, and the consultation will tell you which suits your child."),
    ("Will Invisalign affect my speech?",
     "Some children notice a slight lisp for the first few days of a new set of aligners. It usually fades within a week or two as the tongue gets used to them."),
    ("How does Platinum status differ from other Invisalign tiers?",
     "Invisalign ranks its providers in tiers by how many patients they treat with aligners. Platinum is one of the higher tiers, so it reflects a large number of cases treated and the experience that comes with them."),
    ("What areas near Katy do you serve?",
     "We serve the Harris County and Fort Bend County area, including Cypress, Houston, Fulshear, Cinco Ranch, Sealy, and surrounding areas."),
]

MPD = '<a href="https://www.masonparkdental.com/" target="_blank" rel="noopener">Mason Park Dental of Katy</a>'
REVIEWS = '<a href="https://maps.google.com/?cid=10994444486808824955" target="_blank" rel="noopener">See all our reviews on Google</a>'

COPY = [
    # home
    (434, "index", "From the first tooth to the last day of high school, with you in the room the whole time.",
     "From the first tooth to the last day of high school."),
    (435, "index", "<b>Parents welcome</b><span>In the room</span>", "<b>Invisalign&reg;</b><span>Platinum provider</span>"),
    (435, "index", "sedation options and parents welcome in the room. Mason Park Dental for Kids.",
     "sedation options and Platinum Invisalign. Mason Park Dental for Kids."),
    (435, "index", "sedation options and parents welcome in the room.\">", "sedation options and Platinum Invisalign.\">"),
    # about-us
    (437, "about-us",
     "Mason Park Dental for Kids is the pediatric practice of Mason Park Dental of Katy. Same building, same front desk, and a board certified pediatric dentist on the children&rsquo;s side of the hall.",
     "Mason Park Dental for Kids shares the same building as our sister practice Mason Park Dental. A convenient way for adults and children to get the dental care they need."),
    (438, "about-us", "<figcaption>A dedicated team focused on providing the best experience for you and your child.</figcaption>",
     "<figcaption>Sit back and unwind in our reception area.</figcaption>"),
    (439, "about-us", "<figcaption>The screen in the ceiling, from the chair.</figcaption>",
     "<figcaption>Lay back, relax, and enjoy the show.</figcaption>"),
    (440, "about-us", "Our sister practice Mason Park Dental of Katy is a general", f"Our sister practice {MPD} is a general"),
    # our-team
    (442, "our-team", "<h2 data-split>Nine people, by name.</h2>", "<h2 data-split>Our dedicated team.</h2>"),
    (443, "our-team",
     "Each review is shown whole, under the reviewer&rsquo;s own name. Where a review names a member of the team, it sits beside them here. " + REVIEWS + ".",
     "Each review is shown whole, where the reviewer has given our team a personalized shoutout! " + REVIEWS + "."),
    (499, "our-team", "<figure class=\"tm-cell\"><img src=\"../assets/uploads/staff-anabel-300.webp\" alt=\"Anabel, front desk\" loading=\"lazy\" decoding=\"async\"><figcaption><b>Anabel</b><span>Front desk</span></figcaption></figure>",
     "<figure class=\"tm-cell\"><img src=\"../assets/uploads/staff-anabel-300.webp\" alt=\"Anabel, billing\" loading=\"lazy\" decoding=\"async\"><figcaption><b>Anabel</b><span>Billing</span></figcaption></figure>"),
    (500, "our-team", "<h3>Front desk</h3><span>The first three people you meet</span>", "<h3>Front desk</h3><span>The first people you meet</span>"),
    (500, "our-team", "Three at the front desk, three dental assistants, three dental hygienists. Our friendly",
     "The front desk, the dental assistants and the dental hygienists. Our friendly"),
    (500, "our-team", "<meta name=\"description\" content=\"The nine people at the front desk",
     "<meta name=\"description\" content=\"The people at the front desk"),
    (500, "our-team", "<meta property=\"og:description\" content=\"The nine people at the front desk",
     "<meta property=\"og:description\" content=\"The people at the front desk"),
    (500, "about-us", "<small>Two doctors and the nine people the practice names on its team page.</small>",
     "<small>Two doctors and the people the practice names on its team page.</small>"),
    (500, "dental-saving-plan", "or ask Anabel, Gia or Kebra at your next visit.", "or ask the front desk at your next visit."),
    (500, "thank-you", "Anabel, Gia or Kebra will call during office hours", "The front desk will call during office hours"),
    # our-services
    (445, "our-services", "<p>Clear aligners for the teenager who would rather nobody noticed.</p>",
     "<p>We are a Platinum Invisalign&reg; provider! These clear aligners are for teens and adults who&rsquo;d like to be discreet.</p>"),
    (446, "our-services", "lost crowns and soft tissue injuries", "lost crowns, and soft tissue injuries"),
    (449, "our-services",
     "The practice publishes its new patient specials. They are restated here exactly as published; the front desk confirms what applies on the day.",
     "Pricing is subject to change, please speak to the front desk for cost and a personalized treatment plan."),
    (450, "our-services", "<span>For the day something breaks.</span>",
     "<span>For a time when the unplanned and unexpected happen. This is a base cost for a limited visit; treatment cost will depend on the needs of the patient.</span>"),
    (451, "our-services",
     "<li><b>Invisalign</b><i>$1,000 off</i><span>A complimentary Invisalign consult is available.",
     "<li><b>Invisalign&reg;</b><i>$1,000 off</i><span>We are a Platinum Invisalign&reg; provider, meaning we have treated hundreds of smiles! We are deeply familiar with the nuances of aligner technology and troubleshooting tricky movements. A complimentary Invisalign&reg; consult is available."),
    (497, "our-services", "<b>Limited emergency exam</b><i>$85</i>", "<b>Limited emergency exam</b><i>$89</i>"),
    (497, "new-patients", "<span>Limited emergency exam</span><b>$85</b>", "<span>Limited emergency exam</span><b>$89</b>"),
    (497, "special-offers", "<td data-label=\"Price\">$85</td>", "<td data-label=\"Price\">$89</td>"),
    (497, "special-offers", "a limited emergency exam at $85, $1000 off Invisalign, and a free second opinion. Current offers at Mason Park Dental for Kids.\">\n<meta property",
     "a limited emergency exam at $89, $1000 off Invisalign, and a free second opinion. Current offers at Mason Park Dental for Kids.\">\n<meta property"),
    (497, "special-offers", "a limited emergency exam at $85, $1000 off Invisalign, and a free second opinion. Current offers at Mason Park Dental for Kids.\">",
     "a limited emergency exam at $89, $1000 off Invisalign, and a free second opinion. Current offers at Mason Park Dental for Kids.\">"),
    # dental saving plan
    (487, "dental-saving-plan", "including dental composite fillings, sealants, fluoride treatments, and veneers.",
     "including dental composite fillings, sealants, and fluoride treatments."),
    (488, "dental-saving-plan", "including fillings, sealants, fluoride and veneers", "including fillings, sealants, and fluoride treatments"),
    # special offers
    (489, "special-offers", "At Mason Park Dental, educating our patients is a top priority.",
     "At Mason Park Dental for Kids, educating our patients is a top priority."),
    # patient reviews
    (490, "patient-reviews",
     "Every review on this page was left by a parent under their own name, on the practice&rsquo;s own pages or its Google listing. Nothing is written by us, nothing is trimmed, and the spelling is theirs.",
     "Every review on this page was left by a parent or guardian on our review profiles."),
    (493, "patient-reviews", "<h3 data-split>Been in? Tell the next parent.</h3>", "<h3 data-split>Love us? Please share!</h3>"),
    (494, "patient-reviews", "<h2 data-split>All nine, unedited.</h2>", "<h2 data-split>A few reviews, all unedited.</h2>"),
]

REMOVE = [
    (436, "index", r'\s*<details class="faq_item"><summary class="faq_question">Can I stay with my child during the appointment\?</summary>.*?</details>'),
    (436, "faq-page", r'\s*<div class="np-qa_row"><h3>Can I stay in the room with my child\?</h3>.*?</div>'),
    (436, "new-patients", r'\s*<div class="np-qa_row"><h3>Can I stay with my child\?</h3>.*?</div>'),
    (436, "pediatric-dentistry-faqs-katy-tx", r'\s*<div class="np-qa_row"><h3>Can I stay in the room with my child\?</h3>.*?</div>'),
    (441, "our-team", r'\s*<p class="lede">Everyone below is named on the practice&rsquo;s own team page[^<]*</p>'),
    # #444: the statement was the whole chapter; without it only a kicker would be left.
    (444, "our-team", r'\n<section class="ch ch-reason" id="reason".*?</section>\n'),
    (447, "our-services", r'<figcaption>In the practice</figcaption>'),
    (448, "our-services", r'<figcaption>The front desk confirms the offer on the day</figcaption>'),
    (492, "patient-reviews", r'\n<section class="ch ch-count" id="count".*?</section>\n'),
]


def renumber(s):
    """data-chapter runs 0..n in page order again after a chapter is removed."""
    i = iter(range(1000))
    return re.sub(r'(<section class="ch[^"]*" id="[^"]+" data-chapter=")\d+(")', lambda m: m.group(1) + str(next(i)) + m.group(2), s)


def crop(s, note, sid, key, add, drop):
    a, b = section_span(s, sid)
    body = s[a:b]
    m = re.search(r'<img [^>]*uploads/' + re.escape(key) + r'-\d+\.webp', body)
    if not m:
        raise SystemExit(f"#{note}: no {key} in #{sid}")
    # The frame is the nearest opening <figure> or <div> before the image; a bare <figure> gets a class.
    k = max(body.rfind('<figure', 0, m.start()), body.rfind('<div', 0, m.start()))
    tag_end = body.index('>', k)
    if 'class="' not in body[k:tag_end]:
        body = body[:k + 7] + ' class=""' + body[k + 7:] if body.startswith('<figure', k) else body[:k + 4] + ' class=""' + body[k + 4:]
    start = k + body[k:].index('class="') + 7
    q = body.index('"', start)
    classes = body[start:q].split()
    if add in classes and (drop is None or drop not in classes):
        return s, "already"
    classes = [c for c in classes if c != drop]
    if add not in classes:
        classes.append(add)
    body = body[:start] + " ".join(classes) + body[q:]
    return s[:a] + body + s[b:], "classed"


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
    for note, p, step, key, cls in PATH_INSERTS:
        pages[p], what = path_insert(get(p), note, step, key, cls)
        print(f"#{note:<4} {what:8s} {p} #path step {step}: {key}")
    for note, p, sid, key in GRID_INSERTS:
        pages[p], what = grid_insert(get(p), note, sid, key)
        print(f"#{note:<4} {what:8s} {p} #{sid}: grid {key}")
    for note, p, sid, key, add, drop in CROP:
        if p == "our-team" and sid == "arrival":
            s = get(p)
            if '<div class="ar-bg is-top" data-drift>' in s:
                what = "already"
            else:
                s = s.replace('<div class="ar-bg" data-drift>', '<div class="ar-bg is-top" data-drift>', 1)
                what = "classed"
            pages[p] = s
        else:
            pages[p], what = crop(get(p), note, sid, key, add, drop)
        print(f"#{note:<4} {what:8s} {p} #{sid}: {key} +{add}")

    # #475: five new questions at the end of the Basics.
    p = "invisalign-faqs-katy-tx"
    s = get(p)
    a, b = section_span(s, "general")
    body = s[a:b]
    rows = "".join(f'\n      <div class="np-qa_row"><h3>{q}</h3><p>{t}</p></div>' for q, t in FAQ_ADD if q not in body)
    if rows:
        i = body.index('<div class="np-qa"')
        j = body.index("\n    </div>", i)
        body = body[:j] + rows + body[j:]
        pages[p] = s[:a] + body + s[b:]
        print(f"#475  added    {p} #general: {rows.count('np-qa_row')} questions")
    else:
        print(f"#475  already  {p}")

    for note, p, old, new in COPY:
        s = get(p)
        hit = [o for o in ent(old) if o in s]
        if len(hit) == 1 and s.count(hit[0]) == 1:
            pages[p] = s.replace(hit[0], new)
            print(f"#{note:<4} edited   {p}")
        elif not hit and (new in s or new == ""):
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

    # #500 #501 #503 #505: the cells and the ticker names of the four who have left.
    s = get("our-team")
    for name in TEAM_OUT:
        s, k1 = re.subn(r'\n\s*<figure class="tm-cell"><img [^>]*alt="' + name + r',[^"]*"[^>]*>.*?</figure>', "", s, flags=re.S)
        s, k2 = re.subn(r'<span>' + name + r'</span><i></i>', "", s)
        print(f"#50x  {'removed' if k1 or k2 else 'already'}  our-team {name}: {k1} cell, {k2} ticker")
    pages["our-team"] = s
    for p in ("our-team", "patient-reviews"):
        pages[p] = renumber(get(p))

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
