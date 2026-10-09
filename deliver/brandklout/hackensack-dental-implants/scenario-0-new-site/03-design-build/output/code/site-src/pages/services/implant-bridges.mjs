/* /services/implant-bridges. Copy: the live page (scrape/pages/services-implant-bridges.md; lists, the
   types grid, the comparison table and the FAQ link placed from mirror/raw-html/services/implant-bridges.html),
   placed and folded, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24); the jump-to-section menu (the chapters replace it); "The work speaks through the patients who
   wear it." (a tab caption of the old doctor panel, left out of MESKIN as on /services/all-on-x); the
   Overview / Credentials / Recognition tab labels; the bare "Schedule Your Consultation" buttons; "Key
   Features:" above each lender's list (the list says it); the footer address, hours and languages blocks.
   Changed: nothing. No phone number, practice name or review count needed changing. The specialist
   chapter is MESKIN and the lenders are LENDER_COPY (both word for word the same as this page). The
   timeline's own lead-in ("Every case is a little different...") sits in the intro, before the stages,
   where the live page had it.
   Kept as the live page has it, for the practice to confirm: the last treatment step is headed "Fitting
   Your Final Crown" although it describes fitting the bridge (the heading was carried over from the single
   implant page). */
import { page, hero, statement, checks, index, specialist, path, films, timeline, cards, compare, financing, faq, consult, p, ul, BOOK } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/implant-bridges', 'Implant Bridges']];

export default page({
  path: '/services/implant-bridges',
  crumbs,
  seo: {
    title: 'Implant Bridges in Hackensack, NJ | Hackensack Center',
    description: 'Implant bridges in Hackensack, NJ replace several missing teeth without a denture. Planned by Dr. Alan Meskin.',
    image: 'implant-bridges-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Several Missing Teeth',
      title: 'Implant Bridges in Hackensack, NJ',
      lead: 'Missing several teeth in a row? An implant-supported bridge replaces them with fixed, natural-looking teeth, using just a couple of implants and without grinding down the healthy teeth beside the gap.',
      image: { src: 'implant-bridges-hero.webp', w: 1200, h: 1200, alt: 'An implant bridge: joined crowns over two implants (model)' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is an Implant Bridge?',
      lead: 'An implant bridge replaces two or more missing teeth in a row using implants instead of grinding down the healthy teeth next to the gap.',
      body: p(
        'In most cases, two implants anchor a bridge of three or four teeth, so the whole span is held firmly in the jaw rather than resting on the neighbors.',
        'Each implant is a small titanium post that fuses with your jawbone and takes the place of a tooth root. On top of them sits a single fixed bridge, custom-made to look and function like your natural teeth. Nothing clips in and nothing rests on your gums.',
      ),
      more: p('An implant bridge sits between two other options. It is more efficient than placing one implant per missing tooth, and healthier than a traditional bridge that has to lean on the neighboring teeth. For patients missing several teeth in a row, it is usually the best balance of the two.'),
      drawing: 'bridge',
    }),
    checks({
      name: 'The Benefits',
      tagline: 'The Benefits',
      title: 'The Benefits of an Implant Bridge',
      intro: p('Replacing missing teeth with an implant bridge is not only about closing the gap. It restores what a bridge sitting on the gum or a traditional bridge on the neighbors cannot.'),
      items: ['Healthy teeth left untouched', 'Preserves your jawbone', 'Bite strength close to natural teeth', 'Fixed, never removed', 'Natural, seamless look', 'Long-lasting, often for life'],
      image: { src: 'implant-bridges-benefits.webp', w: 1100, h: 900, alt: 'A bridge of three teeth held by two implants in the jaw (model)' },
    }),
    index({
      name: 'Who It Is For',
      tagline: 'Ideal Candidates',
      title: 'Who Is a Good Candidate for an Implant Bridge?',
      intro: p('Most adults missing two or more teeth in a row are good candidates for an implant bridge. A few things specific to a multi-tooth span matter, and we check all of them at your consultation. A 3D scan gives us a definite answer.'),
      items: [
        { title: 'Two or more missing teeth in a row', body: p('An implant bridge is designed for a span, not a single gap. It works best when you are missing two, three, or four teeth in a row, held by two implants at either end of the span. Longer spans, or gaps at the very back of the mouth, may need a third implant for extra support. If you are missing just one tooth, a single implant is usually the better call, and we will tell you honestly which fits your situation.') },
        {
          title: 'Enough healthy bone at both implant sites',
          body: p('Because a bridge is anchored at both ends, there has to be enough bone in both spots to hold each implant securely. This is often where a multi-tooth case gets more interesting than a single one, since the gap has usually been there long enough for the bone to start shrinking.') + ul([
            'Your 3D scan measures bone height and width at each planned implant site',
            'If bone is thin in one or both spots, a small graft can rebuild it before or during placement',
            'Angled placement can sometimes work around limited bone without a graft',
            'We plan around the nerves and sinuses so placement stays safe and precise',
          ]),
        },
        { title: 'Healthy gums', body: p('Because the implants and the bridge margin all sit against the gum, the tissue around them needs to be free of active infection. Gum disease is one of the most common reasons multi-tooth loss happens in the first place, and if it is still active, it can spread to the tissue around the new implants and stop them from fusing. Any active gum disease is treated and controlled first, which protects both the bridge and the rest of your teeth.') },
        { title: 'A stable, balanced bite', body: p('A bridge that spans several teeth takes a real share of the load when you chew. If your bite is uneven, or if you clench or grind at night, that load can concentrate on the wrong point and stress the bridge over time. During planning, Dr. Meskin studies how your teeth come together and, where needed, adjusts the bridge or provides a nightguard so it is protected for the long term.') },
        { title: 'Good general health, ideally a non-smoker', body: p('Most healthy adults qualify. Well-controlled conditions such as managed diabetes are usually fine, and anything that affects healing is something we plan around. Smoking is the one habit we ask you to pause, because it slows healing and meaningfully raises the risk of implant failure, both while the implants fuse and for years afterward.') },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Choose Dr. Meskin for an Implant Bridge',
    }),
    path({
      title: 'Your Treatment Journey',
      intro: p('An implant bridge is completed in clear stages, from consultation to final placement. Most cases take a few months, mainly to allow the implants to heal. We’ll guide you through the steps your treatment requires.'),
      steps: [
        {
          title: 'Consultation and 3D Planning',
          body: p('Your first visit is about understanding your mouth and confirming an implant bridge is the right move before anything else happens. Dr. Meskin reviews your history, examines the span and the teeth around it, and takes a 3D cone beam scan so the whole case is planned against your exact anatomy. Because this visit covers a lot, here is what it includes:'),
          more: ul([
            'Assessing the span, your bite, and the health of the neighboring teeth',
            'A 3D scan that measures the bone at each planned implant site',
            'Deciding how many implants your span needs, usually two, sometimes three',
            'Flagging anything needed first, such as removing failing teeth or a small graft',
            'A firm written estimate, a timeline, and a conversation about sedation if you want it',
          ]),
        },
        {
          title: 'Removing Failing Teeth and Preparing the Sites',
          body: p('This step only applies if there are still teeth in the span that need to come out, or if the bone at the implant sites needs building up. Where the bone is already healthy and the span is ready, we skip straight to placement.') + ul([
            'Failing teeth are removed as gently as possible under local anesthetic',
            'A small graft often goes into the socket at the same time to preserve bone',
            'If the gap has been there a while, a focused graft rebuilds the site first',
            'Healing between this step and placement varies from immediate to a few months',
          ]),
        },
        {
          title: 'Placing the Implants',
          body: p(
            'Placement is a precise, guided procedure. Most patients find it easier than they expected, and we make sure you are numb and relaxed before we begin, with sedation if you chose it. Two implants are set into the jawbone at the ends of the span, in the exact positions from your plan, so the load of the future bridge is carried by strong anchor points at each end.',
            'Healing caps are usually fitted on top to shape the gum for a natural bridge margin. If the span shows when you smile, we provide a temporary bridge on the same day so you never leave with a visible gap.',
          ),
        },
        { title: 'Healing and Osseointegration', body: p('This is the quiet stretch that does most of the work. Over the next few months, the implants fuse with the jawbone, a process called osseointegration, which is what gives the finished bridge its strength and permanence. There is little to notice day to day. You stay on softer foods early on and gradually return to a normal diet, and we see you for a check or two to confirm healing is on track.') },
        {
          title: 'Fitting Your Final Crown',
          body: p('Once the implants are fully fused, you come back for the part that makes it look like it was always there. This is where the prosthodontic side of the work actually pays off, since the bridge has to blend into the teeth around it and share the bite evenly across two anchor points.'),
          more: ul([
            'A detailed impression is taken of both implants and the surrounding teeth',
            'Your bridge is crafted to match the shade, shape, and gum line of your other teeth',
            'It is secured to the implants, usually with hidden screws under tooth-colored filling',
            'Dr. Meskin fine-tunes the bite so the load is shared evenly across the span',
            'We continue to care for the result long term with regular check-ins',
          ]),
        },
      ],
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear from patients who rebuilt a whole section of their smile, in their own words.',
    }),
    timeline({
      name: 'Recovery',
      tagline: 'Recovery',
      title: 'What to Expect From Recovery',
      intro: p(
        'Recovery from an implant bridge is usually straightforward. Most people have some soreness or swelling for a couple of days, easily managed with over-the-counter care, and get back to their routine quickly. The longer part is quiet: the implants need a few months to fuse with the bone before the final bridge goes on. During that stretch you protect the area and stick to softer foods, often with a temporary in place so you are never left with a visible gap.',
        'Every case is a little different, but most implant bridges follow a similar path from placement to final bridge. Here is a general picture of what to expect.',
      ),
      subtitle: 'A Typical Implant Bridge Timeline',
      stages: [
        { when: 'Day 0', text: 'Implants placed, temporary fitted if needed. Some swelling is normal.' },
        { when: 'Days 1 to 3', text: 'Most people return to work and normal activity.' },
        { when: 'Days 4 to 7', text: 'Any soreness settles. Eat carefully around the site.' },
        { when: 'Weeks 2 to 4', text: 'Gum tissue heals over the implants.' },
        { when: 'Months 1 to 3', text: 'The implants fuse with the bone.' },
        { when: 'Months 3 to 6', text: 'Abutments and custom bridge placed. Your smile is complete.' },
      ],
    }),
    cards({
      name: 'The Options',
      tagline: 'The Options',
      title: 'Types of Implant Bridges',
      intro: p('The number of implants depends on how many teeth are missing and where the gap sits in your mouth. Dr. Meskin recommends the option that gives you the strongest, longest-lasting result for your case.'),
      items: [
        { title: 'Three-Unit Implant Bridge', text: p('The most common type. Two implants anchor a bridge of three teeth, with a false tooth in the middle. It is a strong, predictable solution for the most common gap, three missing teeth in a row.') },
        { title: 'Four-Unit Implant Bridge', text: p('Two implants can also support a slightly longer bridge of four teeth, with two false teeth in the middle. It is more efficient than placing an implant for every tooth and still gives you a solid, non-removable result.') },
        { title: 'Longer-Span Bridge', text: p('For longer gaps or spans that need extra support, a third implant is added in the middle. This spreads the load and is often used at the back of the mouth, where biting forces are highest.') },
        { title: 'Cantilever Implant Bridge', text: p('In select cases, a bridge can extend a false tooth beyond the last implant, useful when a gap sits at the very back of the mouth and a second implant is not possible. It is used carefully and only where the bite and bone allow it.') },
      ],
      sub: [
        { title: 'Front-of-Mouth Implant Bridge', text: "Bridges in the front of the mouth face different challenges: less biting force, but every millimeter of shade, shape, and gum line has to look right. As a prosthodontist, matching a front bridge to your face is Dr. Meskin's specialty." },
        { title: 'Back-of-Mouth Implant Bridge', text: 'Molars carry the most biting force in your mouth, so bridges here are built for strength. Implant placement and bridge material are chosen to hold up under years of real chewing.' },
      ],
      action: BOOK,
    }),
    compare({
      tagline: 'Implant or Traditional',
      title: 'Implant Bridge vs a Traditional Bridge',
      intro: p('For years, a traditional tooth-supported bridge was the standard way to replace several teeth in a row. An implant bridge does the same job without the biggest drawback of a traditional bridge, which is grinding down the healthy teeth on either side of the gap. Here is how the two compare, point by point.'),
      columns: ['Implant Bridge', 'Traditional Bridge'],
      rows: [
        ['Healthy teeth', 'Stands on its own implants. The teeth next to the gap are never touched.', 'The two neighboring teeth must be ground down to hold the bridge, even when healthy.'],
        ['Jawbone health', 'The implants act like tooth roots and preserve the bone across the span.', 'Does nothing for the bone under the gap, which continues to shrink over time.'],
        ['Stability and bite', 'Fixed in the jaw, with biting strength close to natural teeth.', 'Solid, but its strength depends on the two anchor teeth holding it up.'],
        ['Appearance', 'Emerges from the gum like natural teeth, matched to blend in.', 'Looks good, but the false teeth rest on the gum rather than growing from it.'],
        ['Cleaning', 'Cleaned with normal brushing and a special floss under the bridge.', 'Requires floss threaders or picks to clean under the false teeth every day.'],
        ['Longevity', 'Designed to last many years, often for life with proper care.', 'Typically needs replacing every 10 to 15 years, and the ground-down teeth stay altered for good.'],
        ['Cost', 'Higher upfront, better value over the long run.', 'Lower upfront, but repeat replacements and risk to the anchor teeth add up.'],
      ],
      action: { label: 'Find Out Which Option Fits You', href: '#consultation' },
    }),
    financing({
      title: 'Smile Now, Pay Later',
      lenders: LENDER_COPY,
      action: { label: 'Request An Appointment', href: '#consultation' },
    }),
    faq({
      items: [
        ['How much does an implant bridge cost in Hackensack?', 'It depends on how many teeth you are replacing, how many implants your case needs, and whether any grafting or extractions are involved. After your 3D scan you receive a clear written estimate with no surprises, plus financing that can bring it down to a monthly payment.'],
        ['How many implants do I need for a bridge?', 'Usually two, one at each end of the gap, to support a bridge of three or four teeth. Longer spans can call for a third implant. Your scan tells us exactly what your case needs.'],
        ['Is an implant bridge better than a traditional bridge?', 'For most people, yes. An implant bridge does not grind down the healthy teeth beside the gap, and it preserves the jawbone the way a traditional bridge cannot. A traditional bridge can still make sense if those neighboring teeth already need crowns, and Dr. Meskin will tell you honestly which fits your case.'],
        ['Does getting an implant bridge hurt?', 'Most patients find it more comfortable than expected. The implants are placed under local anesthetic, <a href="/services/sedation">sedation</a> is available, and any soreness afterward is usually mild.'],
        ['How long does the process take?', 'Usually a few months from start to finish. Placing the implants is quick, but they need three to six months to fuse with the bone before the final bridge is fitted.'],
        ['Will I have a gap while it heals?', 'Usually not. In most cases a temporary can be worn during the healing months, so you are not left with a visible space.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how naturally a whole section of your smile can be rebuilt. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
