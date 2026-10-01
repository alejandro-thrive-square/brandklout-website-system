"""/patient-reviews rebuilt on the Marvel Dental "Patient Stories" order (Asana 1218885013466701, 2026-10-01).

    python reviews-page-1001.py [--dry-run]

Jessica: "I dont really like this page ... can we do a page more like this one?"
(marveldentaldds.com/patient-stories, without the video testimonials). Marvel's order, Mason Park's
own shapes (never another client's):

  0 Arrival      kept (the team photo); second button goes to #stories
  1 The Stories  five long reviews in a scroll-snap carousel, a photo that matches each story
  2 The Reasons  four reasons parents choose the practice
  3 Done Right   dark panel: checklist, a practice photo, a one-line review as the pull quote
  4 The Wall     kept: the static wall that add-elfsight-reviews.mjs swaps for the Google widget
  5 Write One    kept
  6 A Question   the GHL contact form (add-ghl-contact-form.mjs fills .ms-slot) beside the front desk
  7 The Invitation kept

Reviews are quoted verbatim. Photos illustrate a story; none is captioned as the reviewer's child.
Idempotent: chapters 1-3 and 6 are rebuilt from this file on every run. Writes LF.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "..", "home", "patient-reviews", "index.html")
UP = os.path.join(HERE, "..", "home", "assets", "uploads")
BOOK = "https://www.flexbook.me/masonpark/1"


def img(key, alt, sizes, cls=""):
    ws = sorted(int(m.group(1)) for f in os.listdir(UP) if (m := re.fullmatch(re.escape(key) + r"-(\d+)\.webp", f)))
    if not ws:
        raise SystemExit(f"no files for {key}")
    src = f"../assets/uploads/{key}-{960 if 960 in ws else ws[-1]}.webp"
    srcset = ", ".join(f"../assets/uploads/{key}-{w}.webp {w}w" for w in ws)
    c = f' class="{cls}"' if cls else ""
    return f'<img{c} src="{src}" srcset="{srcset}" sizes="{sizes}" alt="{alt}" loading="lazy" decoding="async">'


# (photo key, alt, review verbatim, reviewer, source)
STORIES = [
    ("as-1627253751", "A dentist checking a little girl's teeth on her mother's lap",
     "My 3 year old daughter recently saw Dr. Nguyen and I was so concerned my daughter would not do well. I was wrong!! Dr. Nguyen was so kind, calm, and patient that my daughter was put at ease. Dr. Nguyen explained what she would be doing beforehand and my daughter enjoyed her appointment so much that has been asking to go to the dentist. Thank you Dr. Nguyen!",
     "M L", "Patient review"),
    ("rv-chair-team", "Two clinicians working with a child in the chair",
     "Tiffany was a dream with my 5 year old son! She was a natural with my son and he was so good with her. She has a great personality and makes the experience more of a fun time rather than am actual appointment! Dr Cho the main Dr was soooo good with my son engaged and made him feel safe as they both did I wouldn&rsquo;t take my son anywhere else. Thank you for amazing customer service and bed side mannor.. you help make a scary experience really fun for kids thanks for that!!",
     "Crystal Hope", "Google review"),
    ("rv-high-five", "A girl in the dental chair giving the dentist a high five",
     "I recently had a wonderful experience at Dr. Nguyen at the dental office. Dr. Nguyen and the hygienist Genevieve were both amazing! They provided outstanding care, demonstrating great professionalism and expertise. Dr. Nguyen was thorough, gentle, and made sure I and my kids felt comfortable throughout the procedure. Genevieve was equally fantastic, friendly, and very attentive, making the cleaning process smooth and pleasant. Their kindness and dedication truly made a difference. I highly recommend Dr. Nguyen and Genevieve to anyone looking for exceptional dental care. Thank you both for your amazing work and warm, caring attitude!",
     "erica marrero", "Google review"),
    ("as-1745347474", "A dentist showing a family an x-ray on the screen",
     "My son had his cleaning and X-rays this week. The staff was incredibly efficient and really detailed about the whole process. Even though my son had a huge fit since it was his first time getting X-rays, I feel like the staff genuinely cared about how he felt and tried their best to comfort him throughout the process.",
     "A Dose of Domi", "Google review"),
    ("px-20240131-214955160", "Two boys holding up their prizes at the product shelf",
     "Dr. Nguyen was fantastic with my twin boys. She was very patient and put them at ease. The location was also easy to find and so was scheduling their appointments.",
     "Laraine Nebrida", "Patient review"),
]

REASONS = [
    ("A practice just for children", "Every room, routine and conversation is planned around a child, with a pediatric dentist at the chair."),
    ("Six months to high school", "From the first tooth to the last day of high school, one practice keeps every check-up, x-ray and plan in one place."),
    ("Sensory-friendly, on purpose", "Routine-based visits, quiet low-light rooms and tools like headphones or weighted blankets for the children who need them."),
    ("A Platinum Invisalign&reg; provider", "Clear aligners for teens, from a practice that has treated hundreds of smiles with them."),
]

CHECKS = [
    "Gentle explanations before every step",
    "Longer appointments and desensitization visits",
    "Nitrous oxide, oral conscious and IV sedation, closely monitored",
]


def stories():
    cards = []
    for i, (key, alt, quote, who, src) in enumerate(STORIES):
        n = f"{i + 1:02d}"
        cards.append(f"""      <figure class="st-card{' is-on' if i == 0 else ''}">
        <div class="st-shot">{img(key, alt, "(max-width: 767px) 86vw, 34vw")}</div>
        <div class="st-body">
          <span class="st-num" aria-hidden="true">{n}</span>
          <blockquote>{quote}</blockquote>
          <figcaption>{who} <span>{src}</span></figcaption>
        </div>
      </figure>""")
    return f"""<!-- THE STORIES. Five reviews, whole, in a carousel. Each photo shows the kind of visit the
     review describes; none is the reviewer's own child. site.js wires the buttons. -->
<section class="ch ch-stories" id="stories" data-chapter="1" data-chapter-name="The Stories">
  <div class="wrap ch-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>The Stories</b></p>
      <h2 data-split>Real stories from Katy parents.</h2>
    </div>
    <p class="lede">How a first visit, a nervous toddler or a first set of x-rays went, in the words of the parent who was there.</p>
  </div>
  <div class="wrap st-carousel">
    <div class="st-track" tabindex="0">
{chr(10).join(cards)}
    </div>
    <div class="st-controls">
      <p class="st-count"><b>01</b> / {len(STORIES):02d}</p>
      <div class="st-bar" aria-hidden="true"><i></i></div>
      <button class="st-btn st-prev" type="button"><span class="visually-hidden">Previous story</span><span aria-hidden="true">&larr;</span></button>
      <button class="st-btn st-next" type="button"><span class="visually-hidden">Next story</span><span aria-hidden="true">&rarr;</span></button>
    </div>
  </div>
</section>"""


def reasons():
    items = "\n".join(f"""      <div class="rs-item">
        <span class="rs-mark" aria-hidden="true">{i + 1:02d}</span>
        <h3>{h}</h3>
        <p>{p}</p>
      </div>""" for i, (h, p) in enumerate(REASONS))
    return f"""<!-- THE REASONS. Why parents choose the practice, in four. -->
<section class="ch ch-reasons" id="reasons" data-chapter="2" data-chapter-name="The Reasons" data-theme="warm">
  <div class="wrap ch-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>The Reasons</b></p>
      <h2 data-split>There&rsquo;s a reason parents choose us.</h2>
    </div>
  </div>
  <div class="wrap">
    <div class="rs-grid" data-stagger>
{items}
    </div>
  </div>
</section>"""


def done_right():
    checks = "\n".join(f"          <li>{c}</li>" for c in CHECKS)
    return f"""<!-- DONE RIGHT. How a visit is run, and one parent's verdict on it. -->
<section class="ch ch-right" id="right" data-chapter="3" data-chapter-name="Done Right" data-theme="dark">
  <div class="wrap">
  <div class="dr-panel">
    <div class="dr-copy">
      <p class="chapter-tag"><i></i><b>Done Right</b></p>
      <h2 data-split>Kids&rsquo; dentistry, done right.</h2>
      <p>Our kid-friendly environment, gentle explanations, and calming techniques help children feel relaxed and safe throughout their visit.</p>
      <ul class="dr-checks">
{checks}
      </ul>
      <blockquote class="dr-quote">&ldquo;This is the best Children&rsquo;s Dentist office I have ever been to.&rdquo;<cite>Amber Choate, Google review</cite></blockquote>
    </div>
    <figure class="dr-shot" data-wipe data-drift>{img("px-20260715-145353043", "A team member going over a plan on a tablet with a family", "(max-width: 991px) 100vw, 45vw")}</figure>
  </div>
  </div>
</section>"""


def question():
    return f"""<!-- A QUESTION. The practice's GoHighLevel contact form beside the front desk. The slot is a
     placeholder that add-ghl-contact-form.mjs swaps for the Embed after import. -->
<section class="ch ch-question" id="question" data-chapter="6" data-chapter-name="A Question" data-theme="sage">
  <div class="wrap ms-grid">
    <div class="ms-copy">
      <p class="chapter-tag"><i></i><b>A Question</b></p>
      <h2 data-split>Have a question, or ready to book?</h2>
      <p class="lede">The front desk can answer your questions, find an appointment that suits your family and walk you through the first visit.</p>
      <figure class="ms-shot" data-wipe>{img("rv-front-desk-team", "Families and the team at the front desk", "(max-width: 991px) 100vw, 40vw")}</figure>
    </div>
    <div class="ms-card">
      <div class="ms-slot"><p>Contact form</p></div>
    </div>
  </div>
</section>"""


def main():
    s = open(PAGE, encoding="utf-8", newline="").read()
    a = s.index('<!-- THE WORD.') if '<!-- THE WORD.' in s else s.index('<!-- THE STORIES.')
    b = s.index('<!-- THE COUNT.') if '<!-- THE COUNT.' in s else s.index('<!-- THE WALL.')
    s = s[:a] + stories() + "\n\n" + reasons() + "\n\n" + done_right() + "\n\n" + s[b:]
    # The wall: no theme (white), its lede was written for the static wall (runbook 09-29, Next 3).
    s = s.replace('id="wall" data-chapter="3" data-chapter-name="The Wall" data-theme="warm"', 'id="wall" data-chapter="4" data-chapter-name="The Wall"')
    s = s.replace('\n    <p class="lede">The short ones first, then the longer stories, in full.</p>', "")
    s = s.replace('id="write" data-chapter="2"', 'id="write" data-chapter="5"')
    # Write One sits after the wall, where a parent who has just read the reviews is.
    w = re.search(r'<!-- THE WALL\..*?-->\n(<section class="ch ch-write".*?</section>\n)', s, re.S)
    if w:
        s = s.replace(w.group(1), "")
        s = s.replace("<!-- WRITE ONE. Where a review goes. -->\n", "<!-- WRITE ONE. Where a review goes. -->\n" + w.group(1))
    # Whitespace-agnostic, so a re-run removes and re-adds it whatever surrounds it.
    s = re.sub(r'\s*<!-- A QUESTION\..*?</section>\s*', "\n\n", s, flags=re.S)
    s = re.sub(r'\s*(<section class="ch ch-invitation" id="invitation")', lambda m: "\n\n" + question() + "\n\n" + m.group(1), s, count=1)
    s = s.replace('id="invitation" data-chapter="4"', 'id="invitation" data-chapter="7"')
    s = s.replace('<a class="button is-ghost-light is-lg" href="#wall">Read them all</a>', '<a class="button is-ghost-light is-lg" href="#stories">Read their stories</a>')
    s = s.replace('<!-- THE COUNT. What the reviews name, counted. -->\n', "")
    chapters = re.findall(r'<section class="ch[^"]*" id="([^"]+)" data-chapter="(\d+)"', s)
    print(" ".join(f"{n}:{i}" for i, n in chapters))
    if [int(n) for _, n in chapters] != list(range(len(chapters))):
        raise SystemExit("chapters out of order")
    if "--dry-run" in sys.argv:
        return
    with open(PAGE, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    print("written", PAGE)


main()
