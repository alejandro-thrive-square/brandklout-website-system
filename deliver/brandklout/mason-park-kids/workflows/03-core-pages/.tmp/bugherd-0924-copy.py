"""BugHerd round three (2026-09-24): the copy notes, as exact replacements.

    python bugherd-0924-copy.py [--dry-run]

Each row must match exactly once on its page (or already be applied). Every page is
computed in memory before any file is opened for write; LF is kept (newline='').
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.abspath(os.path.join(HERE, "..", "home"))

EDITS = [
    # 42: the thank-you page kept the old Tue/Thu 8-5 split; round two's six places missed it.
    (42, "thank-you", "<li><span>Monday</span><b>9am to 6pm</b></li>\n        <li><span>Tuesday</span><b>8am to 5pm</b></li>\n        <li><span>Wednesday</span><b>9am to 6pm</b></li>\n        <li><span>Thursday</span><b>8am to 5pm</b></li>",
     "<li><span>Monday</span><b>9am to 6pm</b></li>\n        <li><span>Tuesday</span><b>9am to 6pm</b></li>\n        <li><span>Wednesday</span><b>9am to 6pm</b></li>\n        <li><span>Thursday</span><b>9am to 6pm</b></li>"),
    (43, "special-offers", "Four offers, and <em>the small print</em>", "Five offers, and <em>the small print</em>"),
    (58, "our-services", '<p class="chapter-tag"><i></i><b>The Map</b></p>', '<p class="chapter-tag"><i></i><b>Explore our services</b></p>'),
    (98, "our-services", 'data-chapter-name="The Map"', 'data-chapter-name="Explore our services"'),
    (99, "our-services", '<p class="chapter-tag"><i></i><b>The Finder</b></p>', '<p class="chapter-tag"><i></i><b>Find the right care</b></p>'),
    (99, "our-services", 'data-chapter-name="The Finder"', 'data-chapter-name="Find the right care"'),
    # 67 and 100 are two drafts for the same lede; 100 is the later one.
    (100, "our-services", "The practice groups its treatments the way its menu does. Every treatment named below has its own page, written for this practice and for a child.",
     "At our clinic, we organize every care detail with your child&rsquo;s comfort in mind. Here you will find a dedicated space for each treatment, explained simply and lovingly so you and your little one can learn how we keep their smile bright."),
    (101, "our-services", "Most parents do not arrive with the name of a treatment.", "Most parents do not know the name of a treatment."),
    (68, "index", "Your dental care experience is fully personalized at Mason Park Dental For Kids. Your oral health needs, goals, and priorities are the focus of your customized treatment plan, and the plan changes as your child does.",
     "Your child&rsquo;s care changes as they grow. We tailor each visit to their age, needs and comfort."),
    (69, "index", "Every review on this page was left by a parent under their own name, on the practice's own pages or its Google listing. Nothing is written by us and nothing is trimmed.",
     "Hear what families have shared about their visits."),
    (71, "our-doctors", "Both are real reviews left under the reviewer&rsquo;s own name, shown whole. Nothing is written by us and nothing is trimmed.",
     "Hear what families have shared about their visits."),
    # 73 is the sentence; 146 is the adult practice's doctor inside it.
    (73, "services/orthodontics", "The length of your orthodontic treatment will depend on their individual plan. During the consultation with Dr. William Sung, we will discuss their options. Once you select your child’s treatment, we will estimate its length.",
     "Your child&rsquo;s treatment timeline depends on their needs and the option chosen. At the consultation we will go through the options with you, and once you choose one we will estimate how long it will take."),
    (146, "blog/clear-orthodontic-braces-in-katy-tx-enhancing-smiles-with-clarity", "Professional dentists like Dr. William Sung offer modern orthodontic solutions",
     "Our team offers modern orthodontic solutions"),
    (107, "blog", "157 posts since 2021: first teeth, habits, cleanings, braces, and what actually happens at the visit. Newest first.",
     "Your go-to dental guide since 2021. Discover helpful insights on first teeth, habits, cleanings, braces, and how we make visits fun and stress-free. Browse our latest updates first."),
    (110, "blog", "<h2 data-split>Five shelves, by what a parent is <em>asking about.</em></h2>",
     "<h2 data-split>Five core topics, based on what parents <em>ask us most.</em></h2>"),
    (109, "blog", "Every post is on exactly one shelf. The archive below carries the shelf beside each title.",
     "Everything is organized by category to help you browse easily. You&rsquo;ll find the main topic listed right next to each article title below."),
    (112, "about-us", "We welcome new patients of all ages.", "We welcome new patients starting at six months of age."),
    (113, "about-us", "Pediatric dentist in Katy wholeheartedly believe in giving back to the community that serves us so well. That&rsquo;s why we&rsquo;re proud to offer our Pay It Forward program.",
     "As pediatric dentists in Katy, we wholeheartedly believe in giving back to the community that supports us. That&rsquo;s why we&rsquo;re proud to offer our Pay It Forward program."),
    (115, "our-doctors", "Board certification is a specialty residency beyond dental school. Dr. Nguyen holds it.",
     "Dr. Nguyen completed a pediatric dentistry residency after dental school and is board certified in pediatric dentistry."),
    (118, "our-doctors", '<a class="button is-ghost-light is-lg" href="#general">Dr. Cho</a>',
     '<a class="button is-ghost-light is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book with Dr. Cho</a>'),
    (119, "our-doctors", "Dr. Tam Nguyen is a board certified pediatric dentist. Dr. Dave Cho is a general dentist who sees the whole family. They met at dental school in Boston and practice in one building in Katy.",
     "Meet Dr. Tam Nguyen, our pediatric dentist, and Dr. Dave Cho, our family dentist. After meeting at dental school in Boston, they now practice together in Katy, providing complete family care under one roof."),
    (120, "our-doctors", "<h2 data-split>Where the two of them trained.</h2>", "<h2 data-split>Where our doctors <em>trained.</em></h2>"),
    (121, "our-doctors", "Every institution below is named in the doctors&rsquo; own published biographies. Nothing is added.",
     "A breakdown of the universities and certified programs that shaped our doctors&rsquo; expertise."),
    (124, "our-team", "<h1 class=\"ar-title\" data-split>The same nine faces, <em>every</em> visit.</h1>",
     "<h1 class=\"ar-title\" data-split>Familiar faces at <em>every</em> visit.</h1>"),
    (125, "our-team", "<h2 data-split>And the two people the team works with.</h2>", "<h2 data-split>And the two specialists who support our team.</h2>"),
    (128, "technology", "Impressions are necessary for the fabrication of dental restorations, such as crowns, bridges, and dental implants. Our hand-held intra-oral scanner takes 3-dimensional digital video impressions with proven accuracy. Even the most challenging cases can be accurately scanned with our intra-oral scanner.",
     "Our handheld intraoral scanner creates a 3D image of your child&rsquo;s teeth without a traditional impression tray. When appropriate, we can use this digital impression to help plan pediatric treatment, including clear aligners."),
    (149, "services/invisalign", "This device ultimately makes its more convenient for you to eat, brush and floss.",
     "Because the aligners are removable, your child can take them out to eat, brush, and floss."),
    (153, "services/sedation-dentistry", "<li>Generally have no lingering aftereffects</li>",
     "<li>Recovery varies by the type of sedation. We will explain what to expect and how to care for your child afterward.</li>"),
    (154, "services/sedation-dentistry", "<li>Are used in conjunction with local anesthetics to ensure your child’s total comfort</li>",
     "<li>May be used with local anesthesia, when appropriate, to help your child stay comfortable during treatment.</li>"),
]


def path(p):
    return os.path.join(HOME, "index.html") if p == "index" else os.path.join(HOME, p, "index.html")


dry = "--dry-run" in sys.argv
pages = {}
for n, p, old, new in EDITS:
    s = pages.get(p) or open(path(p), encoding="utf-8", newline="").read()
    c = s.count(old)
    if c == 1:
        s = s.replace(old, new)
        state = "edited"
    elif c == 0 and new in s:
        state = "already"
    else:
        raise SystemExit(f"#{n} {p}: {c} matches for {old[:60]!r}")
    pages[p] = s
    print(f"#{n:<4} {state:8s} {p}")
if not dry:
    for p, s in pages.items():
        with open(path(p), "w", encoding="utf-8", newline="") as f:
            f.write(s)
    print(f"{len(pages)} pages written")
