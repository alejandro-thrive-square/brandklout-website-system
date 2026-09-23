"""Section flows per page type, and the page -> flow mapping for the five specialty sitemaps.

The flows are the best combination of what the sampled client pages do (see outlines.txt
and README.md): every section here is either on at least half of the sampled pages of that
type, or is a strong pattern from one of them worth keeping. Section names follow Relume so
a flow can be rebuilt in Relume's sitemap tool.

    python section-flows.py   -> detailed-sitemaps.json (read by the FigJam builder)

Placeholders in descriptions: {S} the page subject, {City} the location.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

NAV, FOOT = ['Navbar', ''], ['Footer', '']
T = {}

# ---- home pages -----------------------------------------------------------------------
T['home_general'] = [NAV,
    ['Hero Header Section', 'Headline on the practice promise over office video or a smiling patient, Google rating badge, and two actions: book online and call'],
    ['About Section', 'Short introduction of the lead dentist with photo, credentials and professional affiliation logos'],
    ['Features List Section', 'Service categories as cards (general, cosmetic, implants, Invisalign, emergency, kids) linking to each hub'],
    ['Benefits Section', 'What sets the practice apart: same-day emergencies, sedation, in-house lab, most insurance accepted, financing'],
    ['How It Works Section', 'Your first visit in four steps: book, exam and 3D imaging, treatment plan with written quote, start treatment'],
    ['Gallery Section', 'Before and after slider of real patient smiles, sorted by treatment, linking to the full smile gallery'],
    ['Testimonial Section', 'Video patient stories with named patients plus the review widget score'],
    ['Locations Section', 'Every office as a card with address, map, hours and phone, linking to each location page'],
    ['FAQ Section', 'Top questions: insurance, first visit cost, emergencies, sedation, payment plans'],
    ['CTA Form Section', 'Appointment request form with name, phone, email, preferred office and time'], FOOT]
T['home_implant'] = [NAV,
    ['Hero Header Section', 'Full-arch transformation headline with a real patient result, review badge and a free consultation / 3D scan call to action'],
    ['Stats Section', 'Proof in numbers: implants placed, years of experience, 10-year implant survival rate, 5-star reviews'],
    ['About Section', 'The implant doctor: credentials, surgical and prosthetic training under one roof, affiliation logos (AAID, ICOI)'],
    ['Features List Section', 'Tooth replacement options: single implant, multiple implants, implant dentures, All-on-X full arch'],
    ['Comparison Section', 'Implants vs dentures vs bridges: look, chewing, bone health, lifetime cost'],
    ['How It Works Section', 'From consultation to new teeth: consult and 3D scan, surgery with same-day temporaries, healing, final teeth'],
    ['Gallery Section', 'Before and after full-arch and single-implant cases from real patients'],
    ['Testimonial Section', 'Video stories of implant patients describing eating and smiling again'],
    ['Pricing Section', 'Financing made simple: monthly payment examples and lending partners (CareCredit, Proceed, Cherry)'],
    ['Locations Section', 'Offices with map, hours and phone, linking to each location page'],
    ['FAQ Section', 'Candidacy, pain, recovery time, cost and warranty'],
    ['CTA Form Section', 'Free consultation form that asks about the current situation (missing teeth, dentures, failing teeth)'], FOOT]
T['home_oms'] = [NAV,
    ['Hero Header Section', 'Surgeon-led care headline, board-certified oral and maxillofacial surgeon, book a consultation and refer a patient buttons'],
    ['About Section', 'The surgeon: board certification, hospital training, anesthesia credentials, photo'],
    ['Features List Section', 'Procedures as cards: implants, wisdom teeth, bone grafting, jaw surgery, facial trauma, TMJ, sleep apnea'],
    ['Benefits Section', 'Why surgery here: in-office IV sedation, 3D imaging, same-day implants, one surgical team'],
    ['How It Works Section', 'Referral or self-referral, consultation with 3D scan, surgery day, recovery and follow-up'],
    ['Gallery Section', 'Before and after cases for implants and facial procedures'],
    ['Reviews Section', 'Patient reviews with star rating and procedure named'],
    ['CTA Section', 'For referring doctors: send a referral in one minute, link to the referral page'],
    ['Locations Section', 'Offices with map, hours and phone'],
    ['FAQ Section', 'Sedation, recovery, insurance and referrals'],
    ['CTA Form Section', 'Consultation request form with procedure and referring doctor fields'], FOOT]
T['home_pediatric'] = [NAV,
    ['Hero Header Section', 'Friendly headline for parents with a bright photo of a child in the chair, book a visit and call buttons'],
    ['About Section', 'The board-certified pediatric dentist, with a warm photo and a note to parents'],
    ['Features List Section', 'Care by age: babies and toddlers, kids, teens, special needs'],
    ['Benefits Section', 'Why kids like it here: gentle care, laughing gas, fun office, parents welcome in the room'],
    ['How It Works Section', "Your child's first visit in three steps, starting by age one"],
    ['Team Section', 'The smiling team that will greet your child'],
    ['Testimonial Section', 'Parent reviews and video stories'],
    ['Locations Section', 'Office with map, hours and parking'],
    ['FAQ Section', 'Questions parents ask: first visit age, insurance, sedation, emergencies'],
    ['CTA Form Section', 'Appointment request form with child name, age and parent contact'], FOOT]
T['home_medspa'] = [NAV,
    ['Hero Header Section', 'Care that starts with listening: headline over a calm treatment room photo, book a consultation'],
    ['About Section', 'The medical director and injectors, credentials and approach'],
    ['Features List Section', 'Treatment categories: injectables, skin and laser, body and weight loss, facial surgery'],
    ['How It Works Section', 'Consultation, personal plan, treatment, maintenance schedule'],
    ['Gallery Section', 'Before and after results by treatment'],
    ['Pricing Section', 'Membership plan with monthly price and what it includes'],
    ['Team Section', 'Injectors and aestheticians with photos'],
    ['Reviews Section', 'Client reviews with star rating'],
    ['Locations Section', 'Location with map and hours'],
    ['CTA Form Section', 'Consultation booking form'], FOOT]

# ---- about -------------------------------------------------------------------------
T['about'] = [NAV,
    ['Header Section', 'About the practice: one-line promise and a team photo'],
    ['About Section', 'The practice story, mission and the philosophy of care'],
    ['Team Section', 'The doctors as cards with photo and credentials, linking to each bio'],
    ['Benefits Section', 'Promises patients can hold you to: free second opinions, same-day emergencies, warranty, written quotes'],
    ['Feature Section', 'Technology and office highlights with links to the office tour and technology pages'],
    ['Stats Section', 'Years in practice, patients cared for, 5-star reviews'],
    ['Testimonial Section', 'Patient quotes about the experience'],
    ['CTA Form Section', 'Appointment request form'], FOOT]
T['doctor'] = [NAV,
    ['Header Section', '{S}: name, title and portrait'],
    ['About Section', "{S}'s bio: why they chose this field, approach to care and what patients can expect"],
    ['Timeline Section', 'Education, residencies, board certifications and continuing education'],
    ['Features List Section', 'Clinical focus and techniques (guided surgery, digital impressions, sedation)'],
    ['Logo List Section', 'Professional memberships and affiliations'],
    ['Video Section', 'Short introduction video from the doctor'],
    ['Content Section', 'Outside the office: family, community and interests'],
    ['Reviews Section', 'Patient reviews that mention the doctor by name'],
    ['CTA Form Section', 'Book a consultation with the doctor'], FOOT]
T['team'] = [NAV,
    ['Header Section', 'Meet the team that will care for you'],
    ['About Section', 'How the team works together and what patients notice'],
    ['Team Section', 'Team members grouped by role with photos and short bios'],
    ['Gallery Section', 'Candid photos of the team and office'],
    ['CTA Section', 'Come meet us: book a visit'], FOOT]
T['office'] = [NAV,
    ['Header Section', 'Take a tour of the office'],
    ['About Section', 'Welcome note: what it feels like to walk in'],
    ['Gallery Section', 'Office photos or a video walkthrough: reception, treatment rooms, lab'],
    ['Features List Section', 'Comfort amenities: warm blankets, headphones, TVs, refreshments'],
    ['Locations Section', 'Address, parking, accessibility and hours'],
    ['CTA Section', 'Book a visit and see it in person'], FOOT]
T['technology'] = [NAV,
    ['Header Section', 'The technology behind your care'],
    ['Features List Section', 'One card per technology (CBCT 3D imaging, intraoral scanner, laser, same-day crowns) and what it saves the patient'],
    ['Video Section', 'Short video of the technology in use'],
    ['Testimonial Section', 'A patient on how the technology changed their visit'],
    ['CTA Section', 'Book a visit'], FOOT]
T['careers'] = [NAV,
    ['Header Section', 'Join the team'],
    ['About Section', 'The culture and what it is like to work here'],
    ['Benefits Section', 'Perks: health insurance, paid time off, continuing education, bonuses'],
    ['Features List Section', 'Open roles with location and schedule'],
    ['Video Section', 'Team members on why they stay'],
    ['CTA Form Section', 'Application form with resume upload'], FOOT]

# ---- services ------------------------------------------------------------------------
T['services_hub'] = [NAV,
    ['Header Section', 'All {S} in one place: headline and a short intro'],
    ['Features List Section', 'Every service as a card grouped by category, each linking to its page'],
    ['Benefits Section', 'Why patients choose the practice for their treatment'],
    ['Testimonial Section', 'Patient quotes across treatments'],
    ['FAQ Section', 'Questions about choosing a treatment, cost and insurance'],
    ['CTA Form Section', 'Not sure what you need? Request a consultation'], FOOT]
T['category'] = [NAV,
    ['Hero Header Section', '{S}: headline on the result patients want, before and after image, book a consultation'],
    ['Content Section', 'The problem it solves and the cost of waiting'],
    ['Features List Section', 'What {S} can correct or treat'],
    ['Features List Section', 'The {S} treatments offered, each linking to its own page'],
    ['Gallery Section', 'Before and after cases in this category'],
    ['Benefits Section', 'Why choose the practice for {S}'],
    ['Testimonial Section', 'Patient stories for this category'],
    ['FAQ Section', 'Common questions about {S}'],
    ['CTA Form Section', 'Short evaluation form to start the plan'], FOOT]
T['service'] = [NAV,
    ['Hero Header Section', '{S}: headline on the outcome, a real result image and a book button'],
    ['Content Section', '{S} explained: what it is and who it is for'],
    ['Benefits Section', 'Key benefits of {S}'],
    ['How It Works Section', 'The {S} process step by step, from consultation to aftercare'],
    ['Gallery Section', 'Before and after results'],
    ['Pricing Section', 'What {S} costs, what insurance covers and financing options'],
    ['Testimonial Section', 'A patient who had {S}'],
    ['FAQ Section', 'Questions about {S}: comfort, duration, recovery, cost'],
    ['CTA Form Section', 'Book a {S} consultation'], FOOT]
T['cosmetic'] = [NAV,
    ['Hero Header Section', '{S}: headline on the smile result with a before and after, book a smile consultation'],
    ['Content Section', '{S} explained: what it is'],
    ['Features List Section', 'What it corrects: stains, chips, gaps, uneven or worn teeth'],
    ['Content Section', 'Are you a candidate for {S}'],
    ['How It Works Section', 'Consultation and smile preview, preparation, lab work, final result'],
    ['Comparison Section', '{S} compared with the alternatives'],
    ['Gallery Section', 'Before and after {S} cases'],
    ['Pricing Section', 'Cost of {S} and monthly payment options'],
    ['Testimonial Section', 'Video story from a {S} patient'],
    ['FAQ Section', 'How long it lasts, sensitivity, maintenance, cost'],
    ['CTA Form Section', 'Virtual smile preview or consultation request'], FOOT]
T['implants'] = [NAV,
    ['Hero Header Section', '{S}: headline on permanent teeth, real patient result, free consultation with 3D scan'],
    ['Content Section', 'What an implant is and why replacing a missing tooth matters for the jawbone'],
    ['Stats Section', 'Evidence: long-term survival rates, implants placed by the doctor'],
    ['Features List Section', 'Options: single tooth, multiple teeth, implant dentures, full arch, each linking to its page'],
    ['How It Works Section', 'Consultation and 3D scan, placement, healing, final teeth'],
    ['Comparison Section', 'Implants vs bridges vs dentures'],
    ['Gallery Section', 'Before and after implant cases'],
    ['Pricing Section', 'What drives the cost and the financing partners'],
    ['Testimonial Section', 'Video story from an implant patient'],
    ['FAQ Section', 'Candidacy, pain, recovery, bone grafting, warranty'],
    ['CTA Form Section', 'Find out if you are a candidate'], FOOT]
T['allonx'] = [NAV,
    ['Hero Header Section', '{S}: a full set of fixed teeth in one day, patient transformation photo, free consultation'],
    ['Content Section', 'What {S} is and who it helps (failing teeth, loose dentures)'],
    ['Comparison Section', '{S} vs dentures vs individual implants, and fixed bridge types'],
    ['Gallery Section', 'Before and after full-arch transformations'],
    ['How It Works Section', 'Consultation and 3D scan, surgery day with same-day temporary teeth, healing, final zirconia teeth'],
    ['Benefits Section', 'Commitments: immediate teeth, warranty, surgeon and lab under one roof'],
    ['Pricing Section', 'Cost per arch, what the fee includes and monthly financing'],
    ['Testimonial Section', 'Video stories from full-arch patients'],
    ['FAQ Section', 'Candidacy, bone loss, pain, longevity, cleaning'],
    ['CTA Form Section', 'Free full-arch consultation form'], FOOT]
T['emergency'] = [NAV,
    ['Hero Header Section', 'Same-day {S}: in pain now? headline with a call-now button and hours'],
    ['About Section', 'Reassurance: a calm, experienced team that sees emergencies today'],
    ['Features List Section', 'Emergencies we treat: toothache, knocked-out or broken tooth, abscess, lost crown, bleeding'],
    ['Content Section', 'What to do before you arrive, per emergency'],
    ['Benefits Section', 'Same-day appointments, sedation available, most insurance accepted'],
    ['Pricing Section', 'Emergency visit cost with and without insurance'],
    ['FAQ Section', 'Is it an emergency, what if it is after hours, cost'],
    ['CTA Section', 'Call now, with the phone number large'],
    ['Locations Section', 'Office hours and directions'], FOOT]
T['sedation'] = [NAV,
    ['Hero Header Section', '{S}: relaxed, comfortable care, headline for anxious patients, book button'],
    ['Content Section', 'Dental anxiety is common, and what avoiding care costs'],
    ['Features List Section', 'Sedation levels: nitrous oxide, oral, IV, general'],
    ['Benefits Section', 'Several treatments in one visit, no memory of the procedure, safe monitoring'],
    ['About Section', 'The doctor and sedation training'],
    ['Video Section', 'A word from the doctor about sedation'],
    ['FAQ Section', 'Safety, driving home, cost, who qualifies'],
    ['CTA Section', 'Book a sedation consultation'], FOOT]
T['surgery'] = [NAV,
    ['Hero Header Section', '{S}: headline on the result and recovery, book a consultation'],
    ['Content Section', '{S} explained: what it is and why it is needed'],
    ['Benefits Section', 'Benefits of treating it now'],
    ['How It Works Section', 'Consultation and 3D scan, choosing sedation, the procedure, recovery, back to normal'],
    ['Features List Section', 'Anesthesia and sedation options for {S}'],
    ['Benefits Section', 'Why have it done here: surgeon experience, in-office sedation, 3D planning'],
    ['Reviews Section', 'Reviews from {S} patients'],
    ['FAQ Section', 'Pain, recovery time, cost, insurance'],
    ['Blog List Section', 'Keep reading: related articles and recovery instructions'],
    ['CTA Form Section', 'Consultation request'], FOOT]
T['kids_service'] = [NAV,
    ['Hero Header Section', '{S}: friendly headline for parents with a happy child photo, book button'],
    ['Content Section', '{S} explained: what it is and why it matters for kids'],
    ['How It Works Section', 'What happens at the visit, explained in kid-friendly steps'],
    ['Benefits Section', 'How the team keeps it gentle and fun'],
    ['Content Section', 'Tips for parents before and after the visit'],
    ['FAQ Section', 'Questions parents ask about {S}'],
    ['CTA Form Section', 'Book a visit for your child'], FOOT]
T['treatment'] = [NAV,
    ['Hero Header Section', '{S}: headline on the natural-looking result, book a consultation'],
    ['Content Section', '{S} explained: what it is'],
    ['Benefits Section', 'What it improves and how long results last'],
    ['Features List Section', 'Options and brands offered'],
    ['How It Works Section', 'Consultation, treatment, aftercare, follow-up'],
    ['Gallery Section', 'Before and after results'],
    ['About Section', 'The injector or provider and their training'],
    ['Pricing Section', 'Price per treatment and the membership saving'],
    ['Reviews Section', 'Client reviews'],
    ['FAQ Section', 'Pain, downtime, results, safety'],
    ['CTA Form Section', 'Book a {S} consultation'], FOOT]

# ---- patients -----------------------------------------------------------------------
T['patients_hub'] = [NAV,
    ['Header Section', 'Everything you need before your visit'],
    ['Features List Section', 'Resource cards: first visit, insurance and financing, forms, FAQ'],
    ['How It Works Section', 'Your first visit at a glance'],
    ['CTA Section', 'Book your first visit'], FOOT]
T['new_patients'] = [NAV,
    ['Header Section', 'Welcome, new patients: headline and the new-patient offer'],
    ['How It Works Section', 'Your first visit: health history, imaging, exam, treatment discussion, questions'],
    ['Content Section', 'What to bring and how to prepare'],
    ['Pricing Section', 'Insurance accepted, new-patient special and financing'],
    ['Features List Section', 'New patient forms to fill in before the visit'],
    ['Reviews Section', 'What new patients say'],
    ['FAQ Section', 'First visit length, cost, bringing children'],
    ['CTA Form Section', 'Book your first visit'], FOOT]
T['financing'] = [NAV,
    ['Header Section', 'Insurance and financing, explained plainly'],
    ['Content Section', 'Insurance: plans accepted and the claims filed for you'],
    ['Logo List Section', 'Insurance carriers accepted'],
    ['Pricing Section', 'Financing partners with terms (CareCredit, Proceed, Cherry)'],
    ['Pricing Section', 'In-house savings plan for patients without insurance'],
    ['How It Works Section', 'How to apply for financing in three steps'],
    ['FAQ Section', 'Payment methods, written quotes, out-of-network'],
    ['CTA Form Section', 'Get a written estimate'], FOOT]
T['membership'] = [NAV,
    ['Header Section', 'Savings plan: care without insurance'],
    ['Pricing Section', 'Plan price and what it includes (exams, cleanings, X-rays, discounts)'],
    ['How It Works Section', 'Enroll, use it the same day, save all year'],
    ['Content Section', 'Terms and exclusions'],
    ['FAQ Section', 'Who it is for, renewal, family plans'],
    ['CTA Section', 'Join the plan'], FOOT]
T['forms'] = [NAV,
    ['Header Section', 'Patient forms'],
    ['Features List Section', 'Downloadable or online forms: registration, medical history, consent'],
    ['Content Section', 'Fill them in before your visit to save time'],
    ['CTA Section', 'Questions? Call the office'], FOOT]
T['faq'] = [NAV,
    ['Header Section', 'Frequently asked questions'],
    ['FAQ Section', 'Questions grouped by theme: visits, treatment, cost, insurance'],
    ['Contact Section', 'Still have a question? Call or message the office'], FOOT]
T['instructions'] = [NAV,
    ['Header Section', 'Pre-op and post-op instructions'],
    ['Features List Section', 'Instructions per procedure (implants, extractions, bone grafts, sedation)'],
    ['How It Works Section', 'Recovery timeline: first 24 hours, first week, follow-up'],
    ['Content Section', 'When to call the office right away'],
    ['CTA Section', 'Call the office with any concern'], FOOT]
T['anesthesia'] = [NAV,
    ['Header Section', 'Anesthesia and sedation'],
    ['Content Section', 'How anesthesia is chosen for each procedure'],
    ['Features List Section', 'Options: local, nitrous, IV sedation, general anesthesia'],
    ['Content Section', 'Safety, monitoring and the surgeon training'],
    ['How It Works Section', 'Preparing for surgery: fasting, escort, what to wear'],
    ['FAQ Section', 'Safety, cost, recovery'],
    ['CTA Section', 'Book a consultation'], FOOT]
T['implant_cost'] = [NAV,
    ['Hero Header Section', 'What dental implants cost: clear pricing headline and a free consultation'],
    ['Pricing Section', 'Price tiers (single implant, implant denture, full arch) and what each fee includes'],
    ['Features List Section', 'What changes the cost: number of teeth, bone grafting, materials, sedation'],
    ['Comparison Section', 'Lifetime cost of implants vs dentures and bridges'],
    ['Pricing Section', 'Financing partners and monthly payment examples'],
    ['How It Works Section', 'How the consultation turns into a written quote'],
    ['Testimonial Section', 'Patients on whether it was worth it'],
    ['FAQ Section', 'Insurance, hidden fees, second opinions'],
    ['CTA Form Section', 'Request a callback or a free quote'], FOOT]

# ---- results, referrals, locations, utility ------------------------------------------------
T['results_hub'] = [NAV,
    ['Header Section', 'Real results from real patients'],
    ['Gallery Section', 'Featured before and after cases, linking to the full gallery'],
    ['Testimonial Section', 'Video patient stories'],
    ['Reviews Section', 'Review widget with rating'],
    ['CTA Section', 'Start your own result'], FOOT]
T['gallery'] = [NAV,
    ['Header Section', 'Smile gallery: real patients, no stock photos'],
    ['Gallery Section', 'Before and after cases filterable by treatment'],
    ['Content Section', 'What a before and after can and cannot tell you'],
    ['Testimonial Section', 'Stories behind featured cases'],
    ['CTA Form Section', 'Book a consultation'], FOOT]
T['reviews'] = [NAV,
    ['Header Section', 'What patients say'],
    ['Stats Section', 'Average rating and number of reviews'],
    ['Testimonial Section', 'Video patient stories with names and treatments'],
    ['Reviews Section', 'Live review widget'],
    ['CTA Form Section', 'Book your visit'], FOOT]
T['videos'] = [NAV,
    ['Header Section', 'Video library'],
    ['Video Section', 'Patient stories and treatment explainers, grouped by topic'],
    ['CTA Section', 'Book a consultation'], FOOT]
T['referring'] = [NAV,
    ['Header Section', 'For referring doctors'],
    ['Features List Section', 'What the practice handles for your patients'],
    ['How It Works Section', 'How to refer, and how the patient comes back to you'],
    ['CTA Form Section', 'Online referral form with file upload'],
    ['Content Section', 'Study club and continuing education'],
    ['Locations Section', 'Offices and direct line for doctors'], FOOT]
T['locations_hub'] = [NAV,
    ['Header Section', 'Our locations'],
    ['Locations Section', 'Map with every office and a card per location (address, hours, phone), linking to its page'],
    ['CTA Section', 'Book at the office nearest you'], FOOT]
T['city'] = [NAV,
    ['Hero Header Section', '{S}: local headline, office photo, book and call buttons for this office'],
    ['Features List Section', 'Services at this office, each linking to its {City} service page'],
    ['Team Section', 'Doctors and team at this location'],
    ['Benefits Section', 'Why {City} patients choose this office'],
    ['Testimonial Section', 'Reviews from {City} patients'],
    ['Locations Section', 'Address, map, parking, hours and nearby areas served'],
    ['FAQ Section', 'Local questions: parking, insurance, hours'],
    ['CTA Form Section', 'Book at the {City} office'], FOOT]
T['city_service'] = [NAV,
    ['Hero Header Section', '{S}: headline for this treatment in this city, local result photo, book button'],
    ['Benefits Section', 'Benefits of the treatment'],
    ['Benefits Section', 'Why {City} residents choose this office'],
    ['How It Works Section', 'The treatment process step by step'],
    ['Pricing Section', 'Cost in {City}, insurance and financing'],
    ['Gallery Section', 'Before and after cases'],
    ['About Section', 'The doctor at this location'],
    ['Testimonial Section', 'Reviews from local patients'],
    ['FAQ Section', 'Questions about the treatment'],
    ['CTA Form Section', 'Book at the {City} office'], FOOT]
T['city_team'] = [NAV, ['Header Section', 'The {City} team'], ['Team Section', 'Doctors and staff at this office'], ['CTA Section', 'Book at the {City} office'], FOOT]
T['city_contact'] = [NAV, ['Header Section', 'Visit the {City} office'], ['Locations Section', 'Map, address, directions, parking and hours'], ['CTA Form Section', 'Contact form for this office'], ['Contact Section', 'Phone, email and social links'], FOOT]
T['clone'] = [['Note', 'Same pages and sections as the [City] branch, rewritten for this city: local headline, team, reviews, map and FAQ']]
T['blog'] = [NAV,
    ['Header Section', 'Blog: dental health articles'],
    ['Blog List Section', 'Featured article, then posts filterable by category'],
    ['CTA Section', 'Book a visit'], FOOT]
T['blog_post'] = [NAV,
    ['Header Section', 'Post title, category, date and "medically reviewed by" byline'],
    ['Content Section', 'Table of contents and the article'],
    ['FAQ Section', 'Questions related to the topic'],
    ['Blog List Section', 'Related articles'],
    ['CTA Form Section', 'Book a consultation about this topic'], FOOT]
T['offers'] = [NAV,
    ['Header Section', 'Current special offers'],
    ['Pricing Section', 'Offer cards: new patient special, whitening, Invisalign, implant consultation'],
    ['Content Section', 'Offer terms and expiry'],
    ['CTA Form Section', 'Claim an offer'], FOOT]
T['contact'] = [NAV,
    ['Header Section', 'Contact us'],
    ['Contact Section', 'Call, text, email, directions and social links'],
    ['CTA Form Section', 'Contact form'],
    ['Locations Section', 'One card per office with map and hours'], FOOT]
T['book'] = [NAV,
    ['Header Section', 'Book an appointment'],
    ['Contact Section', 'Ways to book: online, by phone, or a virtual consultation'],
    ['CTA Form Section', 'Booking form with reason for visit and preferred time'],
    ['How It Works Section', 'What happens after you book'],
    ['Locations Section', 'Office hours'], FOOT]
T['ads'] = [NAV,
    ['Hero Header Section', 'Offer headline with the lead form in the hero (see the Relume "Sitemap" reference for the full offer pages)'],
    ['Features List Section', 'Three reasons to claim the offer'],
    ['Pricing Section', 'Offer price vs regular price'],
    ['Testimonial Section', 'Reviews from patients who had this treatment'],
    ['FAQ Section', 'Offer terms and eligibility'],
    ['CTA Form Section', 'Claim the offer'], FOOT]
T['thankyou'] = [NAV,
    ['Hero Header Section', 'Thank you: we will call you shortly to confirm'],
    ['How It Works Section', 'What happens next: confirmation call, reminder, visit'],
    ['Locations Section', 'Office address, phone and hours'], FOOT]
T['legal'] = [NAV, ['Header Section', 'Policy title and last updated date'], ['Content Section', 'Policy text'], FOOT]


def flow_for(name, specialty):
    """Pick the section flow for a page by its name and the specialty."""
    n = name.lower()
    if n == 'home':
        return 'home_' + specialty
    if '[city 2]' in n: return 'clone'
    if n == '[city] location': return 'city'
    if n.startswith('[city] team'): return 'city_team'
    if n.startswith('[city] contact'): return 'city_contact'
    if n.startswith('[city]'): return 'city_service'
    table = [
        (r'^about$', 'about'), (r'meet the doctor', 'doctor'), (r'our team', 'team'), (r'office tour', 'office'),
        (r'technology', 'technology'), (r'careers', 'careers'),
        (r'^(services|procedures|treatments|other services)$', 'services_hub'),
        (r'^(general & preventive|cosmetic|restorative|cosmetic dentistry)$', 'category'),
        (r'all-on-x|teeth in a day', 'allonx'), (r'implant cost', 'implant_cost'), (r'implant faq', 'faq'),
        (r'^dental implants$|single|multiple|implant-supported', 'implants'),
        (r'veneers|whitening|smile makeover|invisalign', 'cosmetic'),
        (r'anesthesia', 'anesthesia'), (r"children's", 'kids_service'),
        (r'emergency', 'kids_service' if specialty == 'pediatric' else 'emergency'),
        (r'sedation', 'kids_service' if specialty == 'pediatric' else 'sedation'),
        (r'bone grafting|wisdom|jaw|trauma|pathology|tmj|sleep apnea|oral surgery|extractions|failing|facial cosmetic|facial surgery', 'surgery'),
        (r'botox|fillers|skin|morpheus|weight loss', 'treatment'),
        (r'^patients$|for parents', 'patients_hub'), (r'new patients|first visit', 'new_patients'),
        (r'insurance|^financing$', 'financing'), (r'membership|savings plan', 'membership'), (r'forms', 'forms'),
        (r'^faq$', 'faq'), (r'instructions', 'instructions'), (r'anesthesia', 'anesthesia'),
        (r'^results$', 'results_hub'), (r'gallery', 'gallery'), (r'reviews|patient stories', 'reviews'), (r'video library', 'videos'),
        (r'referring|refer a patient', 'referring'), (r'^locations$', 'locations_hub'),
        (r'^blog$|dental library', 'blog'), (r'blog post', 'blog_post'), (r'special offers', 'offers'),
        (r'^contact$', 'contact'), (r'book appointment', 'book'), (r'ads landing', 'ads'), (r'thank you', 'thankyou'),
        (r'privacy', 'legal'), (r'membership', 'membership'),
    ]
    for rx, key in table:
        if re.search(rx, n):
            return key
    return 'kids_service' if specialty == 'pediatric' else 'service'


CITY_TITLE = {'general': 'Dentist', 'implant': 'Dental Implant Center', 'oms': 'Oral Surgeon', 'pediatric': 'Pediatric Dentist', 'medspa': 'Med Spa'}


def subject(name, key, spec):
    """The {S} text for a page: its name, trimmed of site-structure words."""
    s = re.sub(r'\s*\(.*?\)', '', name).replace('[City] ', '')
    if key == 'city':
        return CITY_TITLE[spec] + ' in {City}'
    if key == 'city_service':
        return s + ' in {City}'
    if key == 'doctor':
        return 'Dr. [Name]'
    if key == 'services_hub':
        return {'Procedures': 'procedures', 'Treatments': 'treatments'}.get(name, 'services')
    return s


def main():
    groups = {'General & Family Dentistry': 'general', 'Implant & Full-Arch (Prosthodontics)': 'implant',
              'Oral & Maxillofacial Surgery': 'oms', 'Pediatric Dentistry': 'pediatric', 'Med Spa & Facial Aesthetics': 'medspa'}
    maps, cur = [], None
    for line in open(os.path.join(HERE, 'specialty-sitemaps.txt'), encoding='utf-8').read().splitlines():
        a, b, c, d = (line.split('|') + ['', '', '', ''])[:4]
        if a == '#':
            cur = {'title': b, 'n': int(c), 'sites': d, 'spec': groups[b], 'pages': [[0, 'Home', '/', '', 'home_' + groups[b], 'Home']]}
            maps.append(cur)
            continue
        depth = int(a)
        if b == 'More':          # "More" is a menu grouping, not a page: lift its children one level
            cur['_more'] = True
            continue
        if cur.get('_more') and depth >= 2:
            depth -= 1
        elif depth == 1:
            cur['_more'] = False
        key = flow_for(b, cur['spec'])
        cur['pages'].append([depth, b, c, d, key, subject(b, key, cur['spec'])])
    for m in maps:
        m.pop('_more', None)
    used = sorted({p[4] for m in maps for p in m['pages']})
    missing = [k for k in used if k not in T]
    assert not missing, missing
    out = {'flows': {k: T[k] for k in used}, 'sitemaps': maps}
    json.dump(out, open(os.path.join(HERE, 'detailed-sitemaps.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    for m in maps:
        secs = sum(len(T[p[4]]) for p in m['pages'])
        print(f"{m['title']}: {len(m['pages'])} pages, {secs} section cards")
    for m in maps:
        print('\n' + m['title'])
        for p in m['pages']:
            print('  ' * p[0] + f"{p[1]}  -> {p[4]}  [{p[5]}]")


if __name__ == '__main__':
    main()
