/* /services/full-mouth-rehabilitation. Copy: the live page (scrape/pages/services-full-mouth-rehabilitation.md;
   the three "Understanding" panes, lists, bold lead-ins and the components grid placed from
   mirror/raw-html/services/full-mouth-rehabilitation.html), placed and folded, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24); the jump-to-section menu (the chapters replace it); "The work speaks through the patients who
   wear it." (a tab caption of the old doctor panel, left out of MESKIN as on /services/all-on-x); the
   Overview / Credentials / Recognition tab labels; the bare "Schedule Your Consultation" buttons; "Key
   Features:" above each lender's list (the list says it); the footer address, hours and languages blocks.
   Changed: the live "Dental Crowns" card linked to /services/single-implant, which is not about crowns, so
   that card carries no link here (the bridge, implant and All-on-X cards keep theirs). No phone number,
   practice name or review count needed changing. The specialist chapter is MESKIN and the lenders are
   LENDER_COPY (both word for word the same as this page). Order is the live page's, except that the
   closing "Experience Exceptional Dental Care" paragraph (before financing on the live page) is the
   consultation chapter at the end, as on every treatment page. */
import { page, hero, statement, index, specialist, films, cards, path, timeline, financing, faq, consult, p, ul, BOOK } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/full-mouth-rehabilitation', 'Full-Mouth Rehabilitation']];

export default page({
  path: '/services/full-mouth-rehabilitation',
  crumbs,
  seo: {
    title: 'Full-Mouth Restoration in Hackensack, NJ | Hackensack Center',
    description: 'Full-mouth restoration in Hackensack, NJ at Hackensack Center for Dental Implants. Rebuild every tooth with Dr. Alan Meskin.',
    image: 'full-mouth-rehabilitation-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Whole-Mouth Care',
      title: 'Full-Mouth Rehabilitation in Hackensack, NJ',
      lead: 'For a mouth that needs more than one repair. Dr. Meskin rebuilds worn, broken, and failing teeth into a healthy, comfortable, natural-looking smile, planned as one whole rather than a series of patches.',
      image: { src: 'full-mouth-rehabilitation-hero.webp', w: 1200, h: 1200, alt: 'A complete upper and lower set of new teeth (model)' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is Full-Mouth Rehabilitation?',
      lead: 'Full-mouth rehabilitation is a coordinated plan to rebuild the health, function, and appearance of most or all of your teeth in both jaws.',
      body: p(
        'It is not a single procedure. It is a full strategy that combines whichever treatments you actually need, whether implants, crowns, veneers, bridges, gum treatment, or bite correction, and sequences them in a logical order over months, not years.',
        'The point of doing it as one plan, rather than treatment by treatment, is that the pieces have to fit together. Your bite, your gums, the bone underneath, and the way the teeth meet all affect each other. Handling them separately, spread across different offices, is how patients end up with work that fails a few years later.',
      ),
      more: p('At Hackensack Center, your case is planned and delivered by Dr. Meskin, an NYU-trained prosthodontist whose specialty is exactly this: rebuilding a whole mouth so the result is stable, comfortable, and looks like teeth that belong to your face.'),
      image: { src: 'full-mouth-rehabilitation-statement.webp', w: 853, h: 768, alt: 'A technician lifting a printed jaw model out of a 3D printer' },
    }),
    index({
      name: 'Understanding',
      tagline: 'The Basics',
      title: 'Understanding Full-Mouth Rehabilitation',
      items: [
        {
          title: 'When Full-Mouth Rehab Is the Right Move',
          body: p('Full-mouth rehab is for people whose problems have stacked up beyond what a single treatment can solve. It is not for everyone with a few issues. You may be a good fit if any of these describe you:') + ul([
            'Your teeth are worn, cracked, or breaking down across the whole mouth',
            'You have multiple missing teeth combined with other issues',
            'Your bite feels off, or you get jaw pain and headaches from clenching',
            'You have years of crowns, fillings, and bridges that keep failing',
          ]),
        },
        {
          title: 'What Full-Mouth Rehab Restores',
          body: p('When it is done well, a rehabilitation gives you three things back at once, not just a nicer smile:') + ul([
            '<strong>Function.</strong> The ability to bite and chew comfortably on both sides again, without avoiding foods.',
            '<strong>Comfort.</strong> An even, balanced bite that stops the wear, the clenching pain, and the morning headaches.',
            '<strong>Appearance.</strong> Teeth designed around your face, shade, and proportion so nothing looks off.',
          ]),
        },
        {
          title: 'Why It Is Planned as One Case',
          body: p('Most people arrive with quotes from two or three offices for treatments handled separately. The problem with that approach is that the parts of your mouth all affect each other. Your bite depends on the height of your teeth. Your implants depend on healthy gums and enough bone. A crown made without accounting for the bite fails early.'),
          more: p('Planning the whole case together is what makes the parts fit and last. Every step is sequenced so it supports the next, gum health before implants, bone before restorations, bite before final teeth. That is what a prosthodontist is trained for and what a coordinated rehabilitation delivers.'),
        },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Choose Dr. Meskin for Full-Mouth Rehabilitation',
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    cards({
      name: 'The Components',
      tagline: 'The Components',
      title: 'What Your Rehabilitation Can Include',
      intro: p('Every full-mouth plan is built from the treatments your case actually needs, in an order that makes sense. Here are the components Dr. Meskin most often combines.'),
      items: [
        { title: 'Dental Crowns', text: p('Custom caps that cover and protect teeth that are cracked, worn, or heavily restored. In full-mouth cases, crowns often rebuild the height of teeth lost to years of grinding and reset your bite at the same time.') },
        { title: 'Dental Bridges', text: p('When several teeth in a row are missing, a bridge closes the span. In a rehab context, bridges are usually supported by implants rather than by grinding down healthy neighboring teeth.'), href: '/services/implant-bridges' },
        { title: 'Porcelain Veneers', text: p('Thin porcelain shells bonded to the front of teeth that are chipped, discolored, or uneven. Used where the underlying tooth is still sound and the goal is to restore appearance.') },
        { title: 'Single and Multi-Tooth Implants', text: p('Titanium posts that replace missing tooth roots, supporting a single crown or an implant bridge. Implants preserve the bone underneath and become the foundation for the finished restoration.'), href: '/services/dental-implants' },
        { title: 'All-on-X / Full-Arch Implants', text: p('When an entire arch needs replacing, four to six implants can support a full fixed set of teeth. Used in rehab cases where all the teeth in one or both jaws are failing.'), href: '/services/all-on-x' },
        { title: 'Bite Correction and Occlusal Therapy', text: p('Rebalancing the way your teeth come together, so the load is spread evenly across the arch. Ignoring the bite is why rehabilitation work fails early. Adjusting it is what makes it last.') },
        { title: 'Gum and Bone Preparation', text: p('Treating gum disease, building up bone where it has shrunk, and getting the foundation healthy before restorative work begins. The rest of the plan only holds up on healthy tissue.') },
        { title: 'Temporary Restorations', text: p('Custom temporaries you wear during the months between phases, so you never leave without teeth. They also let us test the shape, length, and bite before anything final is made.') },
      ],
      action: BOOK,
    }),
    path({
      title: 'Your Treatment Journey',
      intro: p('Full mouth rehabilitation is delivered in clear, sequenced phases, so you always know where you are and what comes next. Most cases run over a few months to about a year, depending on how much work is needed and how quickly your body heals between phases. Not every step applies to every patient, and Dr. Meskin will tell you which ones your case needs.'),
      steps: [
        {
          title: 'Full Workup and Diagnostics',
          body: p('Your first visit is a thorough evaluation, not a quick look. Dr. Meskin reviews your medical and dental history, examines every tooth, evaluates the health of the gum and bone, and studies how your teeth come together. Because full-mouth cases depend on getting the diagnostics right the first time, this visit covers a lot:') + ul([
            'A full clinical exam of teeth, gums, and existing restorations',
            'A 3D cone beam scan of both jaws and the bite',
            'Photographs and impressions to plan the final appearance',
            'A bite and TMJ assessment to see where the load is going wrong',
            'A conversation about your goals, your priorities, and your budget',
          ]),
        },
        {
          title: 'Master Plan and Phasing',
          body: p(
            'This is where the case is designed. Using everything from your workup, Dr. Meskin builds a master plan that lists every treatment needed and the order they will happen in. You leave this stage with a clear written plan, a phased timeline, and a firm estimate, with no surprises later.',
            'The plan is sequenced so each step sets up the next. Gum health before implants. Bone before restorations. Bite before final teeth. Skipping that sequence is why so many full-mouth cases done piecemeal fail early.',
          ),
        },
        {
          title: 'Foundation Phase',
          body: p('The foundation phase gets your mouth ready for the finished work. This is where the invisible but essential preparation happens, and it is usually the longest stretch of the plan because healing takes time.') + ul([
            'Removing failing teeth that cannot be saved',
            'Treating any active gum disease so the tissue is healthy',
            'Bone grafting where implant sites need building up',
            'Placing the implants that will anchor the restorations',
            'Fitting temporary teeth so you are never without a smile',
          ]),
        },
        {
          title: 'Restorative Phase',
          body: p(
            'Once your foundation has healed, the restorative phase rebuilds what you can see. Crowns, veneers, bridges, and implant restorations are placed in the sequence set out in your plan. Because they are built together, they fit together: shade, shape, height, and margin all coordinated from the start rather than one dentist at a time trying to match another.',
            'Temporary restorations are usually worn through this phase so we can test the look and the bite before anything permanent is finalized.',
          ),
        },
        {
          title: 'Finishing, Bite Balance, and Long-Term Care',
          body: p(
            'The final phase is where the whole result is fine-tuned. Dr. Meskin adjusts the bite so the load is spread evenly across the arches, checks that the finished teeth meet exactly as they should, and provides a nightguard if grinding is part of the picture.',
            'From there, the plan shifts into long-term care. Regular check-ins, professional cleanings, and small adjustments over time are what turn a rebuilt mouth into one that keeps working for decades.',
          ),
        },
      ],
    }),
    timeline({
      name: 'The Timeline',
      tagline: 'The Timeline',
      title: 'The Rehabilitation Timeline',
      intro: p('A full-mouth rehabilitation is not one appointment and a recovery period. It is a phased plan carried out over months, with quiet stretches of healing between the moments when actual work happens. The heaviest days are the ones with surgery, whether extractions, grafts, or implant placement, and those are usually milder than most people expect. Between phases, life is close to normal, with a softer diet at points to protect what is healing underneath.'),
      subtitle: 'A Typical Rehabilitation Timeline',
      stages: [
        { when: 'Consultation', text: 'A single visit, no recovery involved.' },
        { when: 'Foundation phase', text: '3 to 6 months, most of it quiet healing.' },
        { when: 'Restorative phase', text: 'Several weeks to a few months, depending on how much is being restored.' },
        { when: 'Finishing and bite balance', text: 'Final adjustments across one or two visits.' },
        { when: 'Ongoing care', text: 'Check-ins every few months and cleanings twice a year.' },
      ],
    }),
    financing({
      title: 'Smile Now, Pay Later',
      lenders: LENDER_COPY,
      action: { label: 'Request An Appointment', href: '#consultation' },
    }),
    faq({
      items: [
        ['How much does full-mouth rehabilitation cost in Hackensack?', 'It depends entirely on what your mouth needs, since every plan is different. After a full assessment you receive a clear written estimate that lays out each phase, plus financing that can spread it into manageable payments.'],
        ['How long does the whole process take?', 'Usually several months, and sometimes up to a year or more for complex cases. The biggest factor is whether implants are involved, since they need time to heal. Your plan comes with a clear timeline up front.'],
        ['Will I be without teeth during treatment?', 'No. Provisional teeth keep you eating, speaking, and smiling throughout the process, and they also let you preview your new bite before anything is made permanent.'],
        ['Why see a prosthodontist for a full-mouth rehabilitation?', "This is the core of what a prosthodontist does. Coordinating crowns, implants, bite correction, and appearance into one plan that lasts takes years of specialty training beyond general dentistry. It is Dr. Meskin's daily work."],
        ['Can you fix my bite as part of this?', 'Yes. Correcting a bite that has collapsed or worn down is often central to a rehabilitation, and it is what protects your new teeth from wearing out early.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'If your whole mouth needs attention, book a consultation and see how a coordinated plan can turn it around. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
