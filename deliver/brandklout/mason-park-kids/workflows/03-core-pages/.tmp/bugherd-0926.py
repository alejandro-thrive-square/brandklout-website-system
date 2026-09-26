"""BugHerd round five (2026-09-26): notes #176, #182, #188-#433.

    python bugherd-0926.py [--dry-run]

The reviewer named most new photos by their Drive filename (AdobeStock_<id>, PXL_*,
IMG_*); prep-images.py encodes them from _drive/ as `as-<id>`, `px-<date>-<time>` and
`img-<n>`. Swaps reuse round three's swap(): a slot is found by chapter and by the image
on screen when the note was left (the note's selector_info.html carries the live src).

Site-wide, because the notes say so or repeat on every page they visit:
  - the "Credentialed by" strip stays on the homepage only ("it only needs to be on the
    home page", #229 and 28 more);
  - every "... Suite 104B ..." figcaption goes (removed on each of the ~20 pages visited);
  - the Facebook link is the kids practice's own profile (#323).

Idempotent: a row already applied reports "already". Computes every page in memory
before opening any file for write; writes LF.
"""
import html as _html
import importlib.util, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("r3", os.path.join(HERE, "bugherd-0924-images.py"))
src = open(spec.origin, encoding="utf-8").read()
src = src[: src.index("\nmain()")]
r3 = {"__file__": spec.origin}
exec(compile(src, spec.origin, "exec"), r3)
swap, widths, page_path, HOME = r3["swap"], r3["widths"], r3["page_path"], r3["HOME"]

# Alt text is written to the frame. Stock is never captioned as this practice's patient.
ALT = {
    "as-1126345278": "A smiling girl in a green dental chair",
    "as-490594161": "A boy giving a peace sign beside a dental chair",
    "px-20260325-164750457": "A father and his two daughters at the prize shelf",
    "as-2035633519": "A mother and her daughter smiling together in a dental office",
    "as-1513353993": "A girl checking her smile in a hand mirror",
    "as-2165161779": "A girl in the dental chair smiling at a hand mirror",
    "as-769457155": "A smiling girl in the dental chair",
    "as-473241335": "A toddler in a dental office, an x-ray on the screen behind",
    "as-329920292": "A boy in the chair having his teeth checked",
    "as-865984007": "A smiling teenager",
    "as-438235598": "A boy having his teeth checked with a mirror",
    "as-555720018": "A toddler on her mother's lap holding a toothbrush",
    "as-513383020": "A boy smiling into a hand mirror",
    "px-20260415-193423265": "A girl holding up her prize at the product shelf",
    "as-132555773": "A boy fitting a sports mouth guard",
    "as-492954197": "A child smiling with a blue mouth guard in",
    "as-479547387": "A smiling girl in the dental chair",
    "as-1818816693": "A child with braces smiling behind heart-shaped hands",
    "as-307147558": "A toddler smiling through a magnifying glass",
    "px-20260819-210535117": "A girl holding up two toothpaste boxes at the product shelf",
    "as-1828722901": "A dental crown held in tweezers",
    "as-423603524": "A mother, father and daughter smiling together at home",
    "as-377376885": "Children holding up photos of smiles",
    "as-334122746": "A dentist checking a little girl's smile",
    "as-479768646": "A smiling girl pointing at her cheeks",
    "as-254741431": "A boy holding his cheek",
    "as-507459136": "A model of a baby tooth being pulled with small forceps",
    "as-2165153748": "A clinician giving a child a high five across the dental tray",
    "as-608941270": "A father and daughter brushing their teeth together",
    "as-577333284": "A space maintainer on a dental model beside two instruments",
    "as-435979599": "A child's smile with a gap where a tooth came out",
    "as-1538968823": "A boy smiling at the gap in his teeth in a hand mirror",
    "as-235685320": "A child's smile with a missing front tooth",
    "as-226194791": "A smiling girl with braces",
    "as-558496216": "A teenager putting in a clear aligner",
    "as-616975730": "A boy with braces smiling at the camera",
    "as-509550819": "A smile with braces, a toothbrush and an interdental brush",
    "as-496227870": "A smiling girl with braces",
    "as-513384257": "A girl holding up her clear aligners",
    "as-318792486": "Rinsing a retainer under the tap",
    "as-580572976": "A clear aligner lifted out of its case",
    "as-231491407": "A parent brushing a baby's first teeth with a finger brush",
    "as-569098023": "A clear aligner resting in an open palm",
    "as-131912341": "A smiling teenager outdoors",
    "as-462171644": "A boy fitting a clear aligner in front of a mirror",
    "as-540678770": "A smiling young woman holding a clear aligner",
    "as-2180201007": "Rinsing a clear aligner at the sink beside its case",
    "as-473268491": "A clear aligner held up in the shape of a heart",
    "as-630637757": "A consultation at a desk, with a model of teeth",
    "as-166558109": "A group of smiling teenagers",
    "as-410891764": "A boy resting his chin on his hands",
    "as-44223324": "A close-up of a chipped front tooth",
    "as-524918964": "A boy showing his gums",
    "as-325979483": "A boy having his teeth checked with a mirror",
    "as-143925159": "A smiling girl in a pink jacket",
    "as-597461700": "A smile with a gap between the front teeth",
    "as-481423800": "An illustration of a tongue tie and a lip tie",
    "as-526592389": "Parents laughing with their baby on the sofa",
    "as-88720748": "A smiling boy in the dental chair",
    "as-141181172": "A smiling girl in glasses in the dental chair",
    "as-129917761": "Two children hanging from a tree branch",
    "as-486954336": "A smiling girl in the dental chair holding a plush tooth",
    "as-757490938": "A clinician checking a smiling girl's teeth",
    "as-524786813": "A woman smiling in the dental chair during a check-up",
    "px-20260714-220731094": "A clinician with a young patient in a treatment room",
    "px-20260714-211519485": "A team member on the phone at the front desk",
    "px-20240131-214955160": "Two boys holding up their prizes at the product shelf",
    "px-20240228-164822333": "A girl with her prize at the Anti-Cavity Club shelf",
    "px-20260715-145353043": "A team member going over a plan on a tablet with a family",
    "as-268785677": "A parent brushing a baby's teeth",
    "px-20260121-234111670": "A girl with her prize at the product shelf",
    "as-1745347474": "A dentist showing a child an x-ray on the screen",
    "as-1259165112": "A boy checking his smile in a hand mirror",
    "as-1806344091": "A smiling girl holding an aligner case",
    "as-324760778": "A smiling boy in the chair holding a cup",
    "as-1406063303": "A teenager fitting a clear aligner",
    "as-889284871": "A clear aligner held beside its case",
    "px-20260909-173634816": "A boy holding his prize at the product shelf",
    "as-417786010": "A little girl having her teeth checked",
    "img-7693": "The front desk",
    "img-7695": "The waiting area with its armchairs",
    "as-1126345278": "A smiling girl in a green dental chair",
    "rv-chair-team": "Two clinicians working with a child in the chair",
    "rv-cap-exam": "A clinician in a patterned cap with a child in the chair",
    "rv-mouth-exam": "A dentist checking a boy's teeth with a mirror",
    "rv-high-five": "A girl in the dental chair giving the dentist a high five",
}
r3["ALT"].update(ALT)

# (note, page, section id, image on screen or HERO, new key)
SWAP = [
    (182, "about-us", "building", "rv-front-desk-team", "img-7695"),
    (190, "our-services", "map", "rv-front-desk-team", "as-1126345278"),
    (195, "our-services", "offers", "desk-1", "as-490594161"),
    (196, "our-services", "invitation", "rv-operatory-wide", "px-20260325-164750457"),
    (199, "our-doctors", "measure", "knee-2", "as-2035633519"),
    (202, "our-doctors", "voices", "rv-shelf-girls", "as-1513353993"),
    (203, "our-doctors", "invitation", "sofa", "as-2165161779"),
    (208, "our-team", "invitation", "gumball-2", "as-769457155"),
    (212, "technology", "imaging", "rv-tv-chair", "as-473241335"),
    (214, "technology", "lasers", "smile", "as-329920292"),
    (225, "services/comprehensive-pediatric-dentistry", "treatment", "knee", "as-865984007"),
    (235, "services/preventive-dentistry", "why", "smile", "as-438235598"),
    (236, "services/preventive-dentistry", "invitation", "gumball-2", "as-555720018"),
    (239, "services/dental-cleanings-and-exams", "why", "rv-tv-chair", "as-513383020"),
    (243, "services/sealants", "invitation", "shelf-kid", "px-20260415-193423265"),
    (245, "services/mouth-guards", "arrival", "HERO", "as-132555773"),
    (248, "services/mouth-guards", "invitation", "gumball-2", "as-492954197"),
    (250, "services/night-guards", "invitation", "sofa", "as-479547387"),
    (254, "services/restorative-dentistry", "why", "knee-2", "as-1818816693"),
    (255, "services/restorative-dentistry", "invitation", "gumball", "as-307147558"),
    (260, "services/composite-fillings", "path", "smile", "rv-high-five"),
    (262, "services/composite-fillings", "invitation", "shelf-kid", "px-20260819-210535117"),
    (265, "services/dental-crowns", "arrival", "HERO", "as-1828722901"),
    (268, "services/dental-crowns", "invitation", "gumball", "as-423603524"),
    (270, "services/pulp-therapy", "arrival", "HERO", "as-377376885"),
    (272, "services/pulp-therapy", "forms", "st-window", "as-334122746"),
    (273, "services/pulp-therapy", "after", "st-sleep", "as-479768646"),
    (275, "services/pulp-therapy", "invitation", "sofa", "as-254741431"),
    (277, "services/extractions", "arrival", "HERO", "as-507459136"),
    (280, "services/extractions", "comfort", "knee-2", "as-2165153748"),
    (284, "services/extractions", "invitation", "gumball", "as-608941270"),
    (286, "services/space-maintainers", "arrival", "HERO", "as-577333284"),
    (287, "services/space-maintainers", "what", "st-blocks", "as-435979599"),
    (288, "services/space-maintainers", "care", "chair", "as-1538968823"),
    (291, "services/space-maintainers", "invitation", "gumball-2", "as-235685320"),
    (294, "services/orthodontics", "arrival", "HERO", "as-226194791"),
    (295, "services/orthodontics", "duration", "st-aligner", "as-558496216"),
    (297, "services/orthodontics", "why", "rv-cap-model", "as-616975730"),
    (299, "services/orthodontics", "invitation", "gumball", "as-509550819"),
    (303, "services/retainers", "arrival", "HERO", "as-496227870"),
    (306, "services/retainers", "retention", "st-aligner", "as-513384257"),
    (309, "services/retainers", "care", "st-water", "as-318792486"),
    (310, "services/retainers", "invitation", "sofa", "as-580572976"),
    (313, "index", "first", "knee", "as-231491407"),
    (315, "services/invisalign", "why", "st-brush", "as-569098023"),
    (325, "invisalign-faqs-katy-tx", "arrival", "HERO", "as-131912341"),
    (327, "invisalign-faqs-katy-tx", "band-1", "smile", "as-462171644"),
    (335, "services/sedation-dentistry", "arrival", "HERO", "as-630637757"),
    (336, "services/bonding", "arrival", "HERO", "as-166558109"),
    (338, "services/bonding", "why", "rv-tv-chair", "as-410891764"),
    (339, "services/bonding", "invitation", "gumball-2", "as-44223324"),
    (342, "services/periodontics", "signs", "rv-boy-toy", "as-524918964"),
    (345, "services/periodontics", "why", "team", "as-325979483"),
    (346, "services/periodontics", "invitation", "shelf-kid", "as-143925159"),
    (349, "services/frenectomy", "arrival", "HERO", "as-597461700"),
    (350, "services/frenectomy", "invitation", "sofa", "as-481423800"),
    (352, "services/frenectomy", "why", "knee-2", "as-526592389"),
    (354, "services/special-needs-patient-care", "arrival", "HERO", "as-88720748"),
    (357, "services/special-needs-patient-care", "invitation", "sofa", "as-141181172"),
    (364, "emergency-pediatric-dentistry", "invitation", "sofa", "as-129917761"),
    (369, "new-patients", "visit", "st-brush", "as-486954336"),
    (373, "new-patients", "arrival", "HERO", "as-757490938"),
    (382, "financing", "ways", "sofa", "as-524786813"),
    (397, "dental-saving-plan", "who", "rv-mom-toddler", "px-20260714-220731094"),
    (399, "dental-saving-plan", "join", "gumball-2", "px-20260714-211519485"),
    (401, "dental-saving-plan", "invitation", "sofa", "px-20240131-214955160"),
    (404, "special-offers", "invitation", "shelf-kid", "px-20240228-164822333"),
    (411, "pediatric-dentistry-faqs-katy-tx", "band-1", "rv-operatory-wide", "px-20260715-145353043"),
    (417, "blog", "latest", "st-brush", "as-1806344091"),
    # 418 and 421 are both this post's hero; 421 is the later note and wins.
    (421, "blog/invisalign-or-braces-pros-cons-and-what-to-expect", "arrival", "HERO", "as-1406063303"),
    (419, "blog", "latest", "shelf-kid", "as-324760778"),
    (420, "blog/pediatric-dental-clinic-care-keeping-little-smiles-healthy", "arrival", "HERO", "as-324760778"),
    (422, "blog/how-invisalign-fits-seamlessly-into-your-daily-routine", "arrival", "HERO", "as-889284871"),
    (424, "blog", "invitation", "sofa", "px-20260909-173634816"),
]

# A photo into a path card that has none, by step number: (note, page, step, key, crop class)
PATH_INSERTS = [
    (176, "services/comprehensive-pediatric-dentistry", 1, "img-7693", "is-p1"),
    (259, "services/composite-fillings", 1, "rv-chair-team", "is-p1"),
    (259, "services/composite-fillings", 3, "rv-cap-exam", "is-p3"),
    (259, "services/composite-fillings", 4, "rv-mouth-exam", "is-p4"),
]

# A band photo at the foot of a chapter that has none: (note, page, section id, key)
BAND_INSERTS = [
    (328, "invisalign-faqs-katy-tx", "general", "as-540678770"),
    (329, "invisalign-faqs-katy-tx", "eating", "as-2180201007"),
    (331, "invisalign-faqs-katy-tx", "candidacy", "as-473268491"),
    (410, "pediatric-dentistry-faqs-katy-tx", "general", "as-268785677"),
    (413, "pediatric-dentistry-faqs-katy-tx", "fear", "px-20260121-234111670"),
    (416, "pediatric-dentistry-faqs-katy-tx", "emergency", "as-1259165112"),
    (415, "pediatric-dentistry-faqs-katy-tx", "money", "as-1745347474"),
]

# A photo that fills the empty cells at the end of a card grid: (note, page, section id, key)
GRID_INSERTS = [
    (218, "knee-to-knee-pediatric-dental-exam", "benefits", "as-417786010"),
]

TEL = '<a href="tel:+12815787100">(281) 578-7100</a>'

# Exact replacements: (note, page, old, new). Entities are tried both ways.
COPY = [
    (189, "about-us", "<figcaption>The team, in the waiting room they share.</figcaption>",
     "<figcaption>A dedicated team to make your smile beautiful and healthy.</figcaption>"),
    (428, "about-us", "A children&rsquo;s practice, <em>inside</em> a family one.",
     "A dedicated children&rsquo;s practice focused on the <em>specialized care</em> they need."),
    (429, "about-us", "<small>Children on one side of the hall, their parents on the other.</small>",
     "<small>A dedicated side of the office for children and their needs.</small>"),
    (429, "about-us", "<h3>Children on one side of the hall, their parents on the other.</h3>",
     "<h3>A dedicated side of the office for children and their needs.</h3>"),
    (430, "about-us", "<figcaption>The front desk, shared with the family practice.</figcaption>",
     "<figcaption>A dedicated team focused on providing the best experience for you and your child.</figcaption>"),
    (432, "about-us",
     "<p>Two practices share this address. Mason Park Dental of Katy is a general, cosmetic and restorative practice for adults. Mason Park Dental for Kids is led by a board certified pediatric dentist. Your six month old and their grandmother, the same afternoon, the same front desk.</p>",
     "<p>Mason Park Dental for Kids is led by a board certified pediatric dentist, Dr. Tam Nguyen. Our sister practice Mason Park Dental of Katy is a general, cosmetic, and restorative practice for adults. Both dedicated to treating you, your six month old, and their grandmother, the same afternoon.</p>"),
    # our-services
    (191, "our-services", "<h2 data-split>By what is wrong.</h2>", "<h2 data-split>A personalized experience.</h2>"),
    (219, "our-services", '<a class="button is-ghost-light is-lg" href="#finder">Start with the problem</a>',
     '<a class="button is-ghost-light is-lg" href="#finder">A personalized experience</a>'),
    (221, "our-services", "Twenty-five treatments. <em>All</em> of them for children.",
     "Services dedicated for your <em>growing</em> child."),
    (222, "our-services", "At our clinic, we organize every care detail", "At Mason Park Dental for Kids, we organize every care detail"),
    (193, "our-services", "from the first tooth to the last day of school, and the care changes as they do.",
     'from the first tooth to high school, and the care changes as they do. As they grow, they can also see our sister practice <a href="https://bestdentistinkatytx.com/" target="_blank" rel="noopener">Mason Park Dental</a> down the hall.'),
    (197, "our-services", "<figcaption>A treatment room, between patients.</figcaption>",
     "<figcaption>Making a positive impression and providing a comfortable experience is our goal, to keep your kids excited to come back.</figcaption>"),
    # our-doctors / our-team
    (200, "our-doctors", "<h2 data-split>One review for each of them.</h2>", "<h2 data-split>Testimonials from parents like you.</h2>"),
    # technology
    (210, "technology", "Most of this equipment exists to make the appointment <em>shorter</em>.",
     "Technology to make your experience <em>comfortable</em> and smooth."),
    (213, "technology", "<figcaption>The screen on the wall is part of the equipment.</figcaption>",
     "<figcaption>Rooms have TVs for patients to relax during treatment, and for our team to display information when we discuss treatment.</figcaption>"),
    (215, "technology", "<figcaption>Dr. Nguyen, with a patient</figcaption>",
     "<figcaption>Regular hygiene appointments are easy, and put your child at ease when coming in to see the dentist.</figcaption>"),
    # comprehensive
    (227, "services/comprehensive-pediatric-dentistry",
     "<li>Nitrous oxide, oral and IV sedation, and general anesthesia, when it is the kind thing to do.</li>",
     "<li>Sedation is available; a discussion about your child&rsquo;s personal needs is part of their personalized treatment.</li>"),
    # preventive
    (231, "services/preventive-dentistry", "What two visits a year actually buy.",
     "Twice a year to keep their smiles healthy and build positive habits for a lifetime."),
    (232, "services/preventive-dentistry", "At Mason Park Dental, our team consistently provides", "At Mason Park Dental for Kids, our team consistently provides"),
    # composite fillings -> fillings and SDF
    (257, "services/composite-fillings", "A filling is <em>the small version</em> of every other treatment on this list.",
     "Fillings and Silver Diamine Fluoride (SDF) <em>Treatment</em>."),
    # crowns
    # pulp therapy
    (271, "services/pulp-therapy", "restoration is complete.", "restoration is complete at Mason Park Dental for Kids."),
    # extractions
    (279, "services/extractions", "What is on offer for the appointment itself.", "What the treatment will look like."),
    (282, "services/extractions", "Ask what the alternatives are first.", "Healthy habits kept at home help prevent restorative treatments."),
    # space maintainers
    (289, "services/space-maintainers", "If a baby tooth came out early, ask about this.", "If a baby tooth came out early, let us know."),
    # orthodontics
    (296, "services/orthodontics", "What the age-seven screening watches for.", "Starting at the age of seven, these are things to look out for."),
    # retainers
    (305, "services/retainers", "The part of treatment families stop turning up for.", "Ensuring your investment of straight teeth stays long term."),
    (307, "services/retainers", "\n        <figcaption>When it is not in the mouth, it is in here.</figcaption>", ""),
    # invisalign
    (317, "services/invisalign", "accept Alphaeon, Lending Club, and CareCredit to help make treatment affordable.",
     'accept Alphaeon, Lending Club, and CareCredit to help make treatment affordable. See <a href="/financing/">insurance and financing</a>.'),
    (318, "services/invisalign", "Our team can review your policy for you.",
     'Our team can review your policy for you. See <a href="/financing/">insurance and financing</a>.'),
    (320, "services/invisalign", "Find out whether they are a candidate.", "Find out if your child is a candidate."),
    (321, "services/invisalign", "aligned smile with Invisalign at Mason Park", "aligned smile with Invisalign&reg; at Mason Park"),
    (322, "services/invisalign", "whether it is the right tool.", "whether it is the right solution for your child."),
    # invisalign faqs
    (326, "invisalign-faqs-katy-tx", "What it is, and whether it is safe.", "What it is, and is it safe?"),
    (330, "invisalign-faqs-katy-tx", "Whether it is right for your child.", "Is it right for your child?"),
    # sedation
    (332, "services/sedation-dentistry", "Four levels, and the point of all of them is that <em>the appointment happens</em>.",
     "Four levels, each child is unique and so is <em>the treatment</em>."),
    # periodontics
    (343, "services/periodontics", "<figcaption>Flossing once a day is most of the treatment.</figcaption>",
     "<figcaption>The primary red flags of gingivitis are bleeding gums, redness or swelling, tenderness, and persistent bad breath caused by plaque buildup.</figcaption>"),
    (344, "services/periodontics", "Common risk factors for gum disease include poor oral hygiene habits, diabetes, smoking, and hormonal changes. Some medications can also increase the likelihood.",
     "The primary risk factor for gingivitis in kids is dental plaque accumulation caused by inadequate daily brushing and flossing."),
    # new patients
    (366, "new-patients", "The practice publishes a new patient special. It is restated here exactly as published, and the front desk confirms what applies on the day.",
     'The practice publishes a new patient special, and the front desk confirms what applies on the day. Ask us about our in house <a href="/dental-saving-plan/">Dental Savings Plan</a>.'),
    (370, "new-patients", "Booking is easy! Call (281) 578-7100 to schedule", f"Booking is easy! Call {TEL} to schedule"),
    (372, "new-patients", "answer anything this page did not.", "answer your questions."),
    # financing
    (374, "financing", "At Mason Park Dental, we accept and process all insurances.", "At Mason Park Dental for Kids, we accept and process all insurances."),
    (375, "financing", "three finance options for families who need one.",
     'three finance options for families who need one. Plus we have an in house <a href="/dental-saving-plan/">Dental Savings Plan</a>!'),
    (377, "financing", "Call (281) 578-7100 with the name of your plan", f"Call {TEL} with the name of your plan"),
    # dental saving plan
    (385, "dental-saving-plan", "At Mason Park Dental, we understand that not everyone in Katy", "At Mason Park Dental for Kids, we understand that not everyone in Harris County"),
    (388, "dental-saving-plan", "from our team here at Mason Park Dental.", "from our team here at Mason Park Dental for Kids."),
    (389, "dental-saving-plan", "including dental composite fillings, sealants, and veneers.", "including dental composite fillings, sealants, fluoride treatments, and veneers."),
    (390, "dental-saving-plan", "including fillings, sealants and veneers", "including fillings, sealants, fluoride and veneers"),
    (395, "dental-saving-plan", "Everyone in Katy, regardless of their current financial or medical situation.",
     "Everyone in Harris County and the surrounding communities, regardless of their current financial or medical situation."),
    (396, "dental-saving-plan", "Here, with our team at Mason Park Dental.", "Here, with our team at Mason Park Dental for Kids."),
    (398, "dental-saving-plan", "<p>Call (281) 578-7100 or ask Anabel", f"<p>Call {TEL} or ask Anabel"),
    (400, "dental-saving-plan", "Call (281) 578-7100 and ask for the dental savings plan.", f"Call {TEL} and ask for the dental savings plan."),
    # pediatric faq
    (412, "pediatric-dentistry-faqs-katy-tx", "<figcaption>The practice&rsquo;s own treatment room.</figcaption>",
     "<figcaption>Transparent treatment plans and pricing, so you know your options before we start.</figcaption>"),
    (414, "pediatric-dentistry-faqs-katy-tx", "Call <b>(281) 578-7100</b> to", f"Call <b>{TEL}</b> to"),
]

# Regex removals: (note, page, pattern). Each must match exactly once (or be gone already).
REMOVE = [
    (220, "our-services", r'\n\s*<p class="ar-lede" data-anim="hide">Gentle, compassionate pediatric dentistry[^<]*</p>'),
    (216, "technology", r'\n<section class="ch ch-count" id="count".*?</section>\n'),
    (224, "services/comprehensive-pediatric-dentistry", r'\s*<p class="lede">Comprehensive pediatric dentistry is the exam, the cleaning and the conversation\.[^<]*</p>'),
    (233, "services/preventive-dentistry", r'\s*<p class="chapter-tag"><i></i><b>What Is Under This</b></p>'),
    (234, "services/preventive-dentistry", r'\s*<p class="lede">Every one of these has a page of its own\.[^<]*</p>'),
    (238, "services/dental-cleanings-and-exams", r'\s*<p class="ar-lede" data-anim="hide">The American Dental Association recommends[^<]*</p>'),
    (240, "services/dental-cleanings-and-exams", r'\s*<details class="faq_item"><summary class="faq_question">Can I stay in the room\?</summary>.*?</details>'),
    (246, "services/mouth-guards", r'\s*<p class="chapter-tag"><i></i><b>The Count</b></p>'),
    (304, "services/retainers", r'\s*<p class="chapter-tag"><i></i><b>The Phase</b></p>'),
    (308, "services/retainers", r'\s*<p class="chapter-tag"><i></i><b>The Kinds</b></p>'),
    (333, "services/sedation-dentistry", r'\s*<p class="ar-lede" data-anim="hide">Sedation dentistry is the use of medication[^<]*</p>'),
    (356, "services/special-needs-patient-care", r'\s*<details class="faq_item"><summary class="faq_question">Can I stay with my child\?</summary>.*?</details>'),
    (383, "financing", r'\s*<figcaption[^>]*>The waiting room, and the check-in tablet</figcaption>'),
    (408, "patient-reviews", r'\s*<p class="ch-note">Counted across the nine reviews on this page\.[^<]*</p>'),
    (423, "blog", r'\s*<p class="ch-note">A title without a link is a post that has not been brought across[^<]*</p>'),
    (431, "about-us", r'$^'),  # covered by #432's rewrite of the same paragraph
]

# The H1 is removed from sight (#217, #237) but kept for search engines and screen readers.
HIDE_H1 = [
    (217, "knee-to-knee-pediatric-dental-exam", "Knee-to-knee pediatric dental exam in Katy, TX"),
    (237, "services/dental-cleanings-and-exams", "Dental cleanings and exams for children in Katy, TX"),
]

SITE_FB_OLD = "https://www.facebook.com/p/Mason-Park-Dental-100083179359693/"
SITE_FB_NEW = "https://www.facebook.com/profile.php?id=100080674540904"


def srcset(prefix, key):
    ws = widths(key)
    return f"{prefix}{key}-{960 if 960 in ws else ws[-1]}.webp", ", ".join(f"{prefix}{key}-{w}.webp {w}w" for w in ws)


def section_span(s, sid):
    m = re.search(r'<section class="ch[^"]*" id="' + re.escape(sid) + r'"', s)
    if not m:
        raise SystemExit(f"no section #{sid}")
    return m.start(), s.index("</section>", m.start())


def path_insert(s, note, step, key, cls):
    a, b = section_span(s, "path")
    body = s[a:b]
    m = re.search(r'<article class="pa-card">(<span class="pa-no">' + str(step) + r"</span>)", body)
    if not m:
        if re.search(r'uploads/' + re.escape(key) + r'-', body):
            return s, "already"
        raise SystemExit(f"#{note}: no photo-less step {step}")
    pre = re.search(r'src="([^"]*?)assets/uploads/', s).group(1) + "assets/uploads/"
    src1, ss = srcset(pre, key)
    shot = (f'<div class="pa-shot {cls}"><img src="{src1}" srcset="{ss}" sizes="24rem" '
            f'alt="{r3["ALT"][key]}" loading="lazy" decoding="async"></div>')
    body = body[: m.start()] + '<article class="pa-card">' + shot + m.group(1) + body[m.end():]
    return s[:a] + body + s[b:], "inserted"


def band_insert(s, note, sid, key):
    a, b = section_span(s, sid)
    body = s[a:b]
    if re.search(r'uploads/' + re.escape(key) + r'-', body):
        return s, "already"
    pre = re.search(r'src="([^"]*?)assets/uploads/', s).group(1) + "assets/uploads/"
    src1, ss = srcset(pre, key)
    fig = (f'\n  <div class="wrap">\n    <figure class="ch-figure is-band" data-wipe data-drift><img src="{src1}" srcset="{ss}" '
           f'sizes="(max-width: 899px) 100vw, 75vw" alt="{r3["ALT"][key]}" loading="lazy" decoding="async"></figure>\n  </div>\n')
    body = body.rstrip() + fig
    return s[:a] + body + s[b:], "inserted"


def grid_insert(s, note, sid, key):
    a, b = section_span(s, sid)
    body = s[a:b]
    if re.search(r'uploads/' + re.escape(key) + r'-', body):
        return s, "already"
    i = body.index('<div class="sq-grid"')
    j = body.index("\n    </div>", i)
    pre = re.search(r'src="([^"]*?)assets/uploads/', s).group(1) + "assets/uploads/"
    src1, ss = srcset(pre, key)
    fig = (f'\n      <figure class="sq-shot"><img src="{src1}" srcset="{ss}" sizes="(max-width: 899px) 100vw, 60vw" '
           f'alt="{r3["ALT"][key]}" loading="lazy" decoding="async"></figure>')
    body = body[:j] + fig + body[j:]
    return s[:a] + body + s[b:], "inserted"


def ent(t):
    return {t, t.replace("’", "&rsquo;"), t.replace("&rsquo;", "’"), t.replace("’", "&#8217;")}


def main():
    dry = "--dry-run" in sys.argv
    pages = {}
    errors = []

    def get(p):
        if p not in pages:
            pages[p] = open(page_path(p), encoding="utf-8", newline="").read()
        return pages[p]

    # --- site-wide ---
    all_pages = []
    for root, _, files in os.walk(HOME):
        if "index.html" in files and os.sep + "assets" not in root:
            rel = os.path.relpath(root, HOME).replace(os.sep, "/")
            all_pages.append("index" if rel == "." else rel)
    n_badges = n_caps = n_fb = 0
    for p in all_pages:
        s = get(p)
        if p != "index":
            s, k = re.subn(r'\n<div class="badges">.*?\n</div>\n', "\n", s, flags=re.S)
            n_badges += k
        s, k = re.subn(r'\n\s*<figcaption>[^<]*Suite 104B[^<]*</figcaption>', "", s)
        n_caps += k
        k = s.count(SITE_FB_OLD)
        s = s.replace(SITE_FB_OLD, SITE_FB_NEW)
        n_fb += k
        pages[p] = s
    print(f"site-wide: badges removed on {n_badges} pages, {n_caps} Suite 104B captions, {n_fb} Facebook links")

    for note, p, sid, old, new in SWAP:
        pages[p], what = swap(get(p), note, sid, old, new)
        print(f"#{note:<4} {what:8s} {p} #{sid}: {old} -> {new}")
    for note, p, step, key, cls in PATH_INSERTS:
        pages[p], what = path_insert(get(p), note, step, key, cls)
        print(f"#{note:<4} {what:8s} {p} #path step {step}: {key}")
    for note, p, sid, key in BAND_INSERTS:
        pages[p], what = band_insert(get(p), note, sid, key)
        print(f"#{note:<4} {what:8s} {p} #{sid}: band {key}")
    for note, p, sid, key in GRID_INSERTS:
        pages[p], what = grid_insert(get(p), note, sid, key)
        print(f"#{note:<4} {what:8s} {p} #{sid}: grid {key}")
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
        if pat == r"$^":
            continue
        s = get(p)
        ms = list(re.finditer(pat, s, re.S))
        if len(ms) == 1:
            pages[p] = s[: ms[0].start()] + s[ms[0].end():]
            print(f"#{note:<4} removed  {p}")
        elif not ms:
            print(f"#{note:<4} already? {p} (no match: {pat[:60]})")
        else:
            raise SystemExit(f"#{note} {p}: {len(ms)} matches")
    for note, p, text in HIDE_H1:
        s = get(p)
        m = re.search(r'<h1 class="ar-title" data-split>.*?</h1>', s)
        if m:
            pages[p] = s[: m.start()] + f'<h1 class="visually-hidden">{text}</h1>' + s[m.end():]
            print(f"#{note:<4} h1 hidden {p}")
        else:
            print(f"#{note:<4} already  {p}")

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
