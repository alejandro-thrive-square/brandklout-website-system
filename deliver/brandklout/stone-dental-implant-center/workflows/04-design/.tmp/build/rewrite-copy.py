# -*- coding: utf-8 -*-
"""One-shot copy rewrite: removes every Livewell-derived phrase from content.py."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

path = "content.py"
src = open(path, encoding="utf-8").read()

R = []

def rep(old, new):
    R.append((old, new))

# ---- LANDING HERO ----
rep("All-on-X full-arch implants planned, placed, and restored by one board-certified oral &amp; maxillofacial surgeon — Dr. Mona Stone.<br/><br/>One surgeon. One plan. Nothing rushed.",
    "Full-arch All-on-X restoration handled entirely in-house by Dr. Mona Stone, a board-certified oral &amp; maxillofacial surgeon in Westlake, TX.<br/><br/>Surgery, design, and the final smile — all under one roof.")
rep("<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>Complimentary consultation with a 3D scan</li>",
    "<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>Complimentary first visit with a 3D scan</li>")
rep("<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>Same-day temporary teeth for qualifying cases</li>",
    "<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>A fixed temporary arch the same day in most cases</li>")
rep("<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>Complex cases and bone loss welcome</li>",
    "<li class=\"axon-bullet\"><span class=\"axon-check\">✓</span>Solutions for bone loss and complex cases</li>")
rep("<p class=\"axon-form_title\">Start Your All-on-X Consultation</p>\n<p class=\"axon-form_sub\">Tell us a little about your situation and our team will reach out to schedule your visit.</p>",
    "<p class=\"axon-form_title\">Request Your All-on-X Consultation</p>\n<p class=\"axon-form_sub\">Send us your details and our team will call you to set up your visit.</p>")

# ---- TRANSFORMATION ----
rep("Every arch is designed around the patient's face — proportion, lip support, and the line of the smile — then built to last. These are actual Stone Dental Implant Center patients.",
    "Every arch is planned around the patient's face — proportion, lip support, the line of the smile — and engineered to last. The patients below were treated at Stone Dental Implant Center.")
rep("Individual results vary. Every case shown is a real Stone Dental Implant Center patient.",
    "Individual results vary. All photos show actual patients of Stone Dental Implant Center.")

# ---- JOURNEY ----
rep("<h2 class=\"axon-h2\">You Don't Have to Live Around Your Teeth</h2>",
    "<h2 class=\"axon-h2\">Before, During, and Long After</h2>")
rep("<p class=\"axon-story_quote\">\"I stopped ordering what I actually wanted.\"</p><p class=\"axon-feature_p\">It starts small — chewing on one side, skipping the steak, covering your mouth when you laugh. Then one day you realize you've been living around your teeth for years.</p>",
    "<p class=\"axon-story_quote\">\"I caught myself hiding my smile in photos.\"</p><p class=\"axon-feature_p\">Soft foods. Chewing on one side. A hand across the mouth. The workarounds accumulate so slowly that years can pass before you notice how much of life has rearranged itself around your teeth.</p>")
rep("<p class=\"axon-story_quote\">\"For the first time, someone showed me why.\"</p><p class=\"axon-feature_p\">3D imaging, a full photo protocol, and a face-first smile design — you see your final result digitally planned before surgery ever begins.</p>",
    "<p class=\"axon-story_quote\">\"Someone finally showed me the whole picture.\"</p><p class=\"axon-feature_p\">Your jaw is scanned in 3D, your bite is photographed and mapped, and your future smile is designed around your face — so the finish line is visible before treatment even starts.</p>")
rep("<p class=\"axon-story_quote\">\"It was easier than I expected.\"</p><p class=\"axon-feature_p\">Guided placement, sedation if you want it, and a careful, minimally invasive approach. Qualifying patients walk out with a fixed temporary arch the same day — you are never sent home without teeth.</p>",
    "<p class=\"axon-story_quote\">\"By that afternoon, it was behind me.\"</p><p class=\"axon-feature_p\">Dr. Stone places your implants with guided, minimally invasive surgery, and sedation is available. Most patients head home the same day with a fixed temporary arch already in place.</p>")
rep("<p class=\"axon-story_quote\">\"I forgot which teeth were the implants.\"</p><p class=\"axon-feature_p\">A custom final arch so natural it disappears into your smile. Bite restored, confidence back — and teeth designed to age with your face for decades.</p>",
    "<p class=\"axon-story_quote\">\"They feel like they were always mine.\"</p><p class=\"axon-feature_p\">The final arch is built to your bite, your smile, and the way your face moves. The hardest part, patients tell us, is remembering there was ever anything else.</p>")

# ---- WHY ----
rep("<p class=\"axon-feature_p\">The surgeon who plans your case places your implants and fits your final arch. No referrals out, no being passed between providers.</p>",
    "<p class=\"axon-feature_p\">Your case stays in one pair of hands from the first scan to the final arch — no repeating your story to a new provider, no referrals out.</p>")
rep("<h3 class=\"axon-h3\">Comfort at every stage</h3><p class=\"axon-feature_p\">Sedation options, gentle technique, and a minimally invasive approach focused on stability and protecting your natural tissue.</p>",
    "<h3 class=\"axon-h3\">Comfort at every stage</h3><p class=\"axon-feature_p\">Sedation is available and every case is planned for gentle, minimally invasive treatment — from your first visit through healing.</p>")
rep("<p class=\"axon-feature_p\">Bone loss other clinics turn away is often workable here. A 3D scan at your consultation shows exactly what is possible in your case.</p>",
    "<p class=\"axon-feature_p\">Complex and atrophic cases are welcome here, including bone loss that other clinics turn away. A 3D scan shows what is possible for you.</p>")

# ---- OPTIONS ----
rep("<p class=\"axon-p\">Your consultation determines which path fits your bone, bite, timeline, and goals. Here's the landscape before you walk in.</p>",
    "<p class=\"axon-p\">Your consultation maps your bone, bite, timeline, and goals — then points to the path that fits. A quick orientation before your visit.</p>")
rep("<p class=\"axon-option_p\">A single dental implant replaces one missing tooth without using the neighboring teeth for support. A custom porcelain crown completes the result.</p>",
    "<p class=\"axon-option_p\">An implant rebuilds a single missing tooth — root and crown — without grinding down the healthy teeth beside it.</p>")
rep("<p class=\"axon-option_p\">Four to six implants, placed in one procedure, supporting a complete set of fixed teeth. Not removable. Not a denture.</p>",
    "<p class=\"axon-option_p\">A complete row of fixed teeth carried by four to six precisely placed implants. It stays in around the clock — nothing removable, nothing to take out at night.</p>")

# ---- PROCESS ----
rep("<p class=\"axon-step_p\">A complimentary full evaluation of your bone, bite, and goals with 3D imaging — plus a clear treatment plan and an exact, itemized fee before anything begins.</p>",
    "<p class=\"axon-step_p\">A complimentary exam of your bone, bite, and goals, including a 3D scan — plus a clear treatment plan and a full itemized quote before anything begins.</p>")
rep("<p class=\"axon-step_p\">Your implants are placed using guided, minimally invasive surgery, with sedation available. Qualifying patients leave with a fixed temporary arch the same day.</p>",
    "<p class=\"axon-step_p\">Dr. Stone performs the placement with guided, minimally invasive technique; sedation is available. Most patients head home the same day with a fixed temporary arch in place.</p>")
rep("<p class=\"axon-step_p\">Once the implants integrate — typically 4 to 6 months — your custom final arch is placed, designed before day one to match your face and last for decades.</p>",
    "<p class=\"axon-step_p\">Once the implants have fused with the jaw — generally 4 to 6 months — your custom final arch goes in, shaped to your face and made to last.</p>")

# ---- OFFICE ----
rep("<h2 class=\"axon-h2\">From the Moment You Walk In, Stone Feels Different</h2>\n<p class=\"axon-p\">Calm, modern, and built with patients in mind — because your experience starts before you sit in the chair. Our team speaks English and Spanish, and someone is available 24/7 to help schedule your appointment.</p>",
    "<h2 class=\"axon-h2\">Comfortable, Modern, and Built Around You</h2>\n<p class=\"axon-p\">The experience starts the moment you arrive. Our team speaks English and Spanish, and someone is available 24/7 to help you schedule.</p>")

# ---- FAQ ----
rep("<h2 class=\"axon-h2\">Everything Patients Ask Before Booking</h2>",
    "<h2 class=\"axon-h2\">Questions We Hear Most</h2>")

# ---- FINAL CTA ----
rep("<span class=\"axon-eyebrow axon-eyebrow_light\">— Every Month You Wait</span>",
    "<span class=\"axon-eyebrow axon-eyebrow_light\">— Time Matters</span>")
rep("<h2 class=\"axon-h2 axon-h2_light\">Bone Loss Doesn't Pause.<br/><span class=\"axon-h1_accent\">Find Out Exactly Where You Stand.</span></h2>",
    "<h2 class=\"axon-h2 axon-h2_light\">Bone Loss Doesn't Wait.<br/><span class=\"axon-h1_accent\">See Where You Stand Today.</span></h2>")
rep("<p class=\"axon-p axon-p_light axon-p_lead\">A complimentary evaluation with a 3D scan shows exactly what is possible in your case — before anything begins.</p>",
    "<p class=\"axon-p axon-p_light axon-p_lead\">The 3D scan at your complimentary consultation maps exactly what your case needs — before anything begins.</p>")

# ---- CONSULT ----
rep("<span class=\"axon-chip\"><span class=\"axon-chip_dot\"></span>Reviewed by Dr. Mona Stone</span>",
    "<span class=\"axon-chip\"><span class=\"axon-chip_dot\"></span>Every plan approved by Dr. Stone</span>")
rep("<p class=\"axon-p\">Real stories. Real relief. Real life. Hear how Dr. Stone's care, precision, and results make a difference — don't just take our word for it.</p>",
    "<p class=\"axon-p\">The people best qualified to describe this practice are the patients who have been through it. Here is what DFW patients say about care with Dr. Stone.</p>")
rep("Individual results vary. Read more patient stories on",
    "Individual results vary. See more patient stories on")

# ---- FORM SUBS (both pages) ----
src.count("Tell us a little about your situation")
rep("<p class=\"axon-form_sub\">Tell us a little about your situation and our team will reach out to schedule your visit.</p>",
    "<p class=\"axon-form_sub\">Send us your details and our team will call you to set up your visit.</p>")

# ---- THANKYOU HERO ----
rep("<p class=\"axon-p axon-p_light axon-p_lead\">Give us a call and a member of the Stone team will walk you through your options and get your complimentary consultation with Dr. Stone on the calendar.</p>",
    "<p class=\"axon-p axon-p_light axon-p_lead\">Our team has your request and will reach out shortly. Prefer to move now? Call us and we will put your complimentary consultation with Dr. Stone on the calendar.</p>")
rep("<p class=\"axon-note axon-note_light\">A quick two-minute call to talk through your options.</p>",
    "<p class=\"axon-note axon-note_light\">The call takes about two minutes.</p>")
rep("<p class=\"axon-p\">A short conversation — no pressure, no obligation. Here is what we will go over, and why acting now matters.</p>",
    "<p class=\"axon-p\">No pressure and no obligation — here is what we will cover when we talk.</p>")

# ---- THANKYOU STEPS ----
rep("<p class=\"axon-feature_p\">We take down your situation and Dr. Stone reviews which path fits — from a single implant through to a full arch.</p>",
    "<p class=\"axon-feature_p\">We note your situation and which options fit it — from replacing one tooth to restoring a full arch.</p>")
rep("<p class=\"axon-feature_p\">What insurance is likely to cover, what it does not, and the financing options available — explained plainly before you commit to anything.</p>",
    "<p class=\"axon-feature_p\">An overview of what insurance may contribute, what it usually does not, and the financing plans that can cover the rest.</p>")
rep("<p class=\"axon-feature_p\">A no-cost assessment with a 3D scan at our Westlake practice, so you can see exactly what is possible in your case.</p>",
    "<p class=\"axon-feature_p\">We book your no-cost visit at our Westlake office, 3D scan included.</p>")

# ---- THANKYOU RISKS ----
rep("<h2 class=\"axon-h2\">Why Waiting Usually Costs More</h2>\n<p class=\"axon-p\">Missing teeth don't stay still, and neither does the bone beneath them. The earlier you evaluate, the more of your options stay open.</p>",
    "<h2 class=\"axon-h2\">Why the Calendar Matters</h2>\n<p class=\"axon-p\">Tooth loss is not static, and neither is the bone beneath it. The sooner you evaluate, the more doors stay open.</p>")
rep("<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Bone loss in the jaw, which can narrow the implant options open to you later</p>",
    "<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Jawbone recedes where teeth are missing, which can shrink your options later</p>")
rep("<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Neighbouring teeth shifting, leading to bite issues and more complex treatment</p>",
    "<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Adjacent teeth drift into the space, disturbing your bite and complicating care</p>")
rep("<p class=\"axon-story_quote\" style=\"font-size: 20px;\">A higher risk of gum disease or infection over time</p>",
    "<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Gum disease and infection become harder to hold off over time</p>")
rep("<p class=\"axon-story_quote\" style=\"font-size: 20px;\">More extensive — and more costly — procedures further down the line</p>",
    "<p class=\"axon-story_quote\" style=\"font-size: 20px;\">Treatment tends to grow longer, more involved, and more expensive with every year</p>")

# ---- THANKYOU WHY CARDS ----
rep("<p class=\"axon-feature_p\">Dr. Mona Stone is a board-certified oral &amp; maxillofacial surgeon — trained across three Level 1 trauma centers and an attending surgeon at Baylor and Methodist — who plans, places, and restores your case start to finish.</p>",
    "<p class=\"axon-feature_p\">Dr. Mona Stone is a board-certified oral &amp; maxillofacial surgeon — trained across three Level 1 trauma centers and an attending surgeon at Baylor and Methodist — who designs, places, and restores every arch herself.</p>")
rep("<h3 class=\"axon-h3\">Face-first design</h3><p class=\"axon-feature_p\">3D guided planning with digital smile design, sedation options for anxious patients, and an arch built around your features — not a standard mold.</p>",
    "<h3 class=\"axon-h3\">Face-first design</h3><p class=\"axon-feature_p\">Your arch is mapped to your features with 3D planning and digital smile design — never a one-size-fits-all template. Sedation is available if you want it.</p>")
rep("<p class=\"axon-feature_p\">New teeth are a significant investment. We verify your benefits, quote any grafting or extractions upfront, and put your itemized figure in front of you before you commit to anything.</p>",
    "<p class=\"axon-feature_p\">Full-arch treatment is a major investment. We confirm your benefits, price any grafting or extractions upfront, and hand you an itemized figure before you decide anything.</p>")

# ---- THANKYOU FAQ ----
rep("<p class=\"axon-faq_a\">The procedure is done under anesthesia and sedation options are available, so you should not feel it. Some soreness and swelling during early healing is normal and manageable. Most patients tell us it was far easier than they expected.</p>",
    "<p class=\"axon-faq_a\">Surgery is performed under anesthesia with sedation available. Mild soreness and swelling in the first days is normal and manageable — and most patients describe recovery as easier than they had braced for.</p>")
rep("<p class=\"axon-faq_a\">No. In most cases you leave with a fixed temporary arch the same day as surgery. Your 3D scan at the consultation is what tells us whether your case qualifies.</p>",
    "<p class=\"axon-faq_a\">No — in most cases a fixed temporary arch goes in the same day as surgery. Your 3D scan at the consultation tells us whether your case qualifies.</p>")
rep("<p class=\"axon-faq_a\">Do not rule yourself out. Bone grafting, sinus lifts, and alternative implant approaches make treatment possible for many patients who were told no elsewhere. A 3D scan shows exactly what is possible in your case.</p>",
    "<p class=\"axon-faq_a\">Usually, yes. Dr. Stone can often angle implants around areas of bone loss, or rebuild bone with grafting and sinus lifts when needed. The 3D scan at your consultation settles what your case needs.</p>")

# ---- THANKYOU CTA ----
rep("Get your complimentary consultation with Dr. Stone scheduled — we'll walk through your options in about two minutes.",
    "Get your complimentary consultation with Dr. Stone on the calendar — the call takes about two minutes.")

applied = 0
for old, new in R:
    if old in src:
        src = src.replace(old, new)
        applied += 1
    else:
        print("NOT FOUND:", old[:100].replace("\n", "\\n"))

open(path, "w", encoding="utf-8").write(src)
print(f"applied {applied}/{len(R)} replacements")
