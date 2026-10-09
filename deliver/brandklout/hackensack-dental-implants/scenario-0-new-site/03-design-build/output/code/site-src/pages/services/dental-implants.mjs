/* /services/dental-implants. Copy: the live page (scrape/pages/services-dental-implants.md; lists, bold
   lead-ins and the "at a glance" panes placed from mirror/raw-html/services/dental-implants.html),
   placed and folded, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24); the jump-to-section menu (the chapters replace it); "The work speaks through the patients who
   wear it." (a tab caption of the old doctor panel, left out of MESKIN as on /services/all-on-x); the
   Overview / Credentials / Recognition tab labels; the bare "Schedule Your Consultation" buttons; "Learn
   more about full-mouth rehabilitation" at the end of that card (the card itself now links there); the
   footer address, hours and languages blocks.
   Changed: a full stop added to the end of the process intro ("...to your final teeth"), which the live
   page left without one; "Smoking" and "Oral hygiene", run together in one paragraph on the live page
   ("...ideally for good.Oral hygiene..."), are set as two paragraphs. No phone number, practice name or
   review count needed changing. The specialist chapter is MESKIN (word for word the same as this page). */
import { page, hero, statement, features, index, specialist, split, cards, path, films, timeline, faq, consult, p, ul, BOOK } from '../../lib/ui.mjs';
import { MESKIN } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/dental-implants', 'Dental Implants']];

export default page({
  path: '/services/dental-implants',
  crumbs,
  seo: {
    title: 'Dental Implants in Hackensack, NJ | Hackensack Center',
    description: 'Dental implants in Hackensack, NJ from prosthodontist Dr. Alan Meskin. Replace one tooth or a full arch, planned in 3D and built in our on-site lab.',
    image: 'dental-implants-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Tooth Replacement',
      title: 'Dental Implants in Hackensack, NJ',
      lead: 'A permanent, natural-feeling way to replace missing or failing teeth. Planned in 3D, placed by a specialist, and designed to last for decades.',
      image: { src: 'dental-implants-hero.webp', w: 1080, h: 1080, alt: 'A patient and a dentist looking at his 3D scan on a monitor in a treatment room' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Are Dental Implants?',
      lead: 'A dental implant is a permanent replacement for a missing or failing tooth, built from the root up rather than resting on your gums or the teeth beside it. It replaces the whole tooth, not just the part you see.',
      body: p(
        'Every implant has three parts. A small titanium post takes the place of the tooth root and is set into the jawbone. An abutment connects to that post and rises through the gum. A custom crown sits on top and looks and works like a natural tooth. Because the post fuses with your jawbone through a process called osseointegration, the implant stays firmly in place while you eat, speak, and smile.',
        'Dental implants are used to replace anything from a single tooth to an entire arch, and they are the only tooth replacement that preserves the jawbone underneath. That is why, when the situation allows for them, they are considered the gold standard.',
      ),
      drawing: 'single',
    }),
    features({
      name: 'At a Glance',
      tagline: 'The Essentials',
      title: 'Dental Implants at a Glance',
      items: [
        {
          title: 'What Dental Implants Give You Back',
          text: p('Dental implants are the only tooth replacement that behaves like the real thing, which is why they are considered the gold standard. What patients notice, from day one and years later:') + ul([
            '<strong>Feel like natural teeth.</strong> Fixed in place, so nothing shifts or comes out.',
            '<strong>Preserve your jawbone.</strong> The post replaces the root and stops the bone from shrinking.',
            '<strong>Full biting strength.</strong> Eat what you want, chew on either side without thinking about it.',
            '<strong>Designed to last.</strong> Decades for the crown, often a lifetime for the post.',
          ]),
        },
        {
          title: 'What They Are Made Of',
          text: p('The implant post is titanium in almost every case, chosen because bone bonds to it naturally and it has decades of clinical research behind it. Zirconia is a newer, metal-free alternative that some patients prefer for aesthetic or biocompatibility reasons.') + ul([
            '<strong>Titanium.</strong> The standard. Lightweight, biocompatible, extensively researched.',
            '<strong>Zirconia.</strong> A tooth-colored ceramic option, useful in visible sites or for patients who prefer metal-free.',
            '<strong>The crown on top</strong> is usually porcelain or zirconia, matched to the shade and shape of your other teeth.',
          ]),
        },
        {
          title: 'How Long They Last',
          text: p("Well-placed and well-maintained dental implants are designed to last for decades, and the post itself often lasts a lifetime. The crown on top is a wear part, like anything you use every day, and may need replacement or maintenance over the years. What extends an implant's life most is not the material, it is good daily brushing and flossing, regular check-ups, and the skill of the specialist who placed it."),
        },
        {
          title: 'Are They Safe?',
          text: p(
            'Yes. Dental implants have been in wide clinical use for over 40 years, with success rates around 95 percent when placed by a trained specialist, according to major long-term studies.',
            'The surgery itself is a routine, focused procedure done under local anesthetic, with sedation available for patients who want it. As with any minor surgery, healing depends on general health and habits like smoking, which is why the consultation covers your full history before we plan anything.',
          ),
        },
      ],
    }),
    index({
      name: 'Who It Is For',
      tagline: 'Ideal Candidates',
      title: 'Who Can Have Dental Implants?',
      intro: p('Most healthy adults are candidates for dental implants, and many people who were told no elsewhere still qualify here with the right preparation. Five things get checked at your consultation, each with a straightforward path forward if it needs work. A 3D scan gives us a definite answer.'),
      items: [
        { title: 'Adult with a fully developed jaw', body: p('Implants are for adults, because the jaw has to have finished growing before a permanent post goes into it. Placing an implant in a jaw that is still developing can push a tooth out of position later or leave the implant misaligned. There is no upper age limit. Patients in their 70s, 80s, and 90s receive implants regularly and heal well, since what matters far more than age is general health, the quality of the bone, and how well you look after your mouth.') },
        {
          title: 'Enough bone at the implant site, or a plan to rebuild it',
          body: p('An implant fuses directly to your jawbone, so there has to be enough healthy bone in that spot to hold it. Bone begins to shrink the moment a tooth is lost, and the longer a gap sits empty, the more it recedes. This is one of the top reasons patients are told "no implants" by another office, and it is often not the whole story.'),
          more: ul([
            'Your 3D scan measures the exact height and width of bone available at each planned site.',
            'Small deficits are treated with focused grafting, sometimes done at the same visit as placement.',
            'Larger deficits are rebuilt with a graft before implants go in, adding a few months to the plan.',
            'Angled implant designs like All-on-4 can work with limited bone in the back of the jaw, sometimes avoiding grafting altogether.',
          ]) + p('If you have been told your bone is not enough, it is worth a second look with a proper scan.'),
        },
        {
          title: 'Healthy gums, with any active disease treated first',
          body: p('Gum disease is the leading cause of tooth loss in adults, and it does not go away on its own. Because an implant sits in the same bone that gum disease attacks, any active infection has to be under control before implants can be placed. Signs of active disease include gums that bleed easily, receding gum lines, deep pockets around the teeth, and bone loss visible on x-rays.'),
          more: p('The important part: a history of gum disease does not disqualify you. Even patients with significant past bone loss can go on to have successful implants once the infection is treated with deep cleanings, antibiotics, or periodontal procedures, and once ongoing maintenance is in place. What matters is that the disease is controlled and stays controlled.'),
        },
        {
          title: 'General health that supports healing',
          body: p('Implant placement is a routine, focused surgery, and healing depends on the same things any other surgery does. Most healthy adults qualify, including patients with well-managed chronic conditions.') + ul([
            '<strong>Well-controlled diabetes</strong> is usually fine. Uncontrolled diabetes with unstable blood sugar meaningfully raises the risk of implant failure and needs to be brought under control first.',
            '<strong>Certain medications</strong> can affect bone healing, including some osteoporosis drugs and long-term steroids. We review your full medication list at consultation.',
            '<strong>Autoimmune conditions and treatments</strong> are planned around case by case, sometimes in coordination with your physician.',
            '<strong>Radiation to the jaw or head and neck</strong> in your medical history is a case-by-case conversation, since it changes how bone heals.',
          ]),
        },
        {
          title: 'Willing to quit smoking, and committed to daily oral hygiene',
          body: p('Two lifestyle factors affect implant success more than almost anything else. <strong>Smoking</strong> narrows the small blood vessels in the gum, slows the fusion of the implant to the bone, and meaningfully raises the risk of failure both during healing and for years afterward. We ask you to stop before surgery, through the whole healing period, and ideally for good.'),
          more: p('<strong>Oral hygiene</strong> is what protects implants long term. An implant does not decay, but the gum and bone around it can become infected if plaque and tartar are allowed to build up, a condition called peri-implantitis. Brushing, flossing, and regular professional cleanings are what turn a well-placed implant into one that lasts for decades.'),
        },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why a Prosthodontist for Your Dental Implants',
    }),
    split({
      name: 'Comfort',
      tagline: 'Sedation',
      title: 'Comfort First: Sedation That Takes the Fear Out',
      body: p("Many of our implant patients tell us they put this off for years because they were afraid it would hurt. It does not have to. Whether you're getting a single implant, a bridge, or a full arch, we offer a full range of sedation, up to IV sedation, so you stay relaxed and comfortable from the first moment to the last. People often say the hardest part was working up the nerve to come in, and that the day itself was far calmer than anything they had built up in their head."),
      image: { src: 'dental-implants-split1.webp', w: 900, h: 1080, alt: 'A treatment room at the practice, the chair reclined under the light' },
      action: { label: 'Explore Our Sedation Options', href: '/services/sedation', kind: 'link' },
    }),
    cards({
      name: 'The Options',
      tagline: 'The Options',
      title: 'Types of Dental Implants',
      intro: p('Dental implants cover everything from replacing one tooth to rebuilding a whole mouth. Which option is right for you depends on how many teeth you are missing and the state of the ones around them.'),
      items: [
        { title: 'Single Tooth Implant', text: p('One implant replaces one missing tooth, without touching the teeth on either side. The most conservative option when you are missing a single tooth.'), href: '/services/single-implant' },
        { title: 'Implant Bridge', text: p('Two implants can support a bridge of three or four teeth in a row, replacing a span without grinding down healthy neighboring teeth. The efficient choice when you are missing several teeth together.'), href: '/services/implant-bridges' },
        { title: 'All-on-X / Full-Arch Implants', text: p('Four to six implants support a fixed set of teeth that replaces an entire upper or lower arch. Used when most or all of the teeth in an arch are missing or failing.'), href: '/services/all-on-x' },
        { title: 'Full-Mouth Rehabilitation', text: p('A phased plan that combines several implant and restorative treatments to rebuild the whole mouth. For patients whose issues have stacked up beyond a single treatment.'), href: '/services/full-mouth-rehabilitation' },
      ],
      sub: [
        { title: 'Snap-In Overdenture', text: 'A removable denture that clips onto implants for far more hold than a traditional denture. Useful for some full-arch cases where a fixed set is not the right fit.' },
      ],
      action: BOOK,
    }),
    path({
      tagline: 'The Process',
      title: 'How Dental Implants Are Done',
      intro: p('Every implant treatment follows four clear stages, from your first evaluation to your final teeth.'),
      steps: [
        {
          title: 'Initial Consultation and Diagnostic Tests',
          body: p('Your first visit gives Dr. Meskin the information needed to plan treatment safely and accurately. We review your health history, examine your teeth and gums, and use 3D imaging to map the implant site.') + ul([
            'A complete examination of your teeth, gums, bite, and missing-tooth site',
            'A 3D cone beam scan to evaluate bone, nerves, and sinuses',
            'Photographs or impressions to plan the appearance of your final teeth',
            'A discussion of your goals, comfort options, and medical history',
            'A clear treatment plan, timeline, and cost estimate',
          ]),
        },
        {
          title: 'Implant Placement',
          body: p('Once the site is ready, the implant is placed into the jawbone using the position established during 3D planning. Local anesthetic keeps the procedure comfortable, and sedation is available when appropriate.') + ul([
            'Any required extraction, bone graft, or gum treatment is completed before or during placement.',
            'The implant is guided into the planned position through a small opening in the gum.',
            'A healing cap or temporary tooth may be provided, depending on the location and treatment plan.',
          ]),
        },
        { title: 'Healing', body: p('During the next few months, the implant bonds with the jawbone in a process called osseointegration. This creates a stable foundation for the final tooth. Most patients return to normal routines quickly while following simple instructions for diet, cleaning, and follow-up visits.') },
        { title: 'Final Restoration', body: p('After the implant has fully healed, we capture a detailed impression and create the final crown, bridge, or full-arch restoration. Dr. Meskin checks the fit, bite, shape, and shade so the finished teeth feel comfortable and look natural.') },
      ],
    }),
    films({
      tagline: 'Patient Stories',
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    timeline({
      name: 'Recovery',
      tagline: 'Recovery',
      title: 'The Recovery Timeline',
      intro: p('Recovery from dental implant surgery is usually milder than most people expect, and it happens in two layers. The visible part, the healing you notice around your gum, wraps up in about two weeks. The invisible part, where the implant fuses with the bone underneath, takes a few months and is what makes the finished tooth permanent. Understanding both layers is what makes the timeline make sense.'),
      subtitle: 'A Typical Implant Recovery Timeline',
      stages: [
        { when: 'Day 0', text: 'Placement. Minor soreness, soft foods, rest for the day.' },
        { when: 'Days 1 to 3', text: 'Peak swelling and soreness. Soft foods only. Usually milder than expected.' },
        { when: 'Days 4 to 7', text: 'Swelling drops off. Most people return to work.' },
        { when: 'Weeks 2 to 4', text: 'Stitches dissolve and gums heal. Still on a soft diet.' },
        { when: 'Months 1 to 3', text: 'The bone fuses to your implants. Keep protecting them with softer foods.' },
        { when: 'Months 3 to 6', text: 'Your final crown or teeth are placed. Back to a normal diet.' },
      ],
    }),
    faq({
      items: [
        ['Am I too old for dental implants?', 'No. Age itself is not a barrier. Patients in their 70s, 80s, and beyond receive implants every year and heal well, provided general health supports it. What matters is your overall health and the quality of your bone, both of which are checked at your consultation.'],
        ['Do dental implants hurt?', 'Most patients are surprised how comfortable it is. Placement is done under local anesthetic, and sedation is available for anyone who feels anxious. Any soreness afterward is usually managed with simple over-the-counter care.'],
        ['How long does the implant process take?', 'From placement to your final tooth is usually a few months, because the implant needs time to fuse with the bone. Appointments themselves are short. Most of the timeline is quiet healing, not chair time.'],
        ['How much do dental implants cost?', p('Cost depends on the type of case, from a single implant to a full-arch reconstruction. After your 3D scan you receive a clear written estimate with no surprises, plus financing options that spread the cost into monthly payments.', '<a href="/cost-of-dental-implants">Full cost breakdown →</a>')],
        ['What if I do not have enough bone?', 'You may still qualify. Focused bone grafts can rebuild sites where the bone has shrunk, and angled implant designs like All-on-4 are built to work with limited bone. A 3D scan is the only way to know for certain, and many patients who were told no elsewhere still qualify here.'],
        ['How long do dental implants last?', 'With good hygiene and regular check-ups, the implant itself can last for decades, often for life. The crown on top is durable and can be maintained or replaced over the years if needed.'],
        ['Do you offer financing?', 'Yes. We will find a way. We try every avenue, and our dedicated team of treatment coordinators will help you find a plan that fits. We work with Cherry, HFD, Proceed, and CareCredit, and we verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how different implant care can feel. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
