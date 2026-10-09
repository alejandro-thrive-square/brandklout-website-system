/* /services/smile-makeovers. Copy: the live page (scrape/pages/services-smile-makeovers.md; the three
   "Smile Makeovers, Explained" boxes, their bold-led lists and the seven "Can Fix" / "Can Include" items
   checked in mirror/raw-html/services/smile-makeovers.html), placed and folded, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24), the jump-to-section menu (the chapters replace it), the bare "Schedule Your Consultation",
   "View All Testimonials" and "Request an appointment" buttons, "Key Features:", the doctor block's tab
   labels and the address / hours / languages footer. The specialist block is MESKIN (word for word the
   same as this page; its "Credentials" and "Recognition" sub-headings and the eyebrow "The work speaks
   through the patients who wear it." are not carried). "Smile Now, Pay Later" is LENDER_COPY (same).
   The live page's "Book A Consultation" button under "What a Smile Makeover Can Include" is the cards
   chapter's action. No fact changes: the page names no other practice and no second number.
   Left as the live page has it: the "Chips, Cracks, and Gaps" item never speaks of gaps (the next item,
   "Gaps Between Teeth", does), and the FAQ calls the preview a "3D Smile Test Drive" while the page
   calls it Digital Smile Design and Trial Smile. */
import { page, hero, statement, features, index, specialist, films, cards, path, financing, faq, consult, p, ul, BOOK } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/smile-makeovers', 'Smile Makeovers']];

export default page({
  path: '/services/smile-makeovers',
  crumbs,
  seo: {
    title: 'Smile Makeovers in Hackensack, NJ | Hackensack Center',
    description: 'Smile makeovers in Hackensack, NJ with prosthodontist Dr. Alan Meskin. Implants, crowns and veneers planned as one result.',
    image: 'smile-makeovers-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Cosmetic Dentistry',
      title: 'Smile Makeovers in Hackensack, NJ',
      lead: 'Design the smile you have always wanted, and see it before we ever begin. Dr. Meskin combines the artistry of cosmetic dentistry with the precision of a prosthodontist to create a look that fits your face and feels like you.',
      image: { src: 'smile-makeovers-hero.webp', w: 1200, h: 1200, alt: 'Porcelain veneer shades in a guide, one lifted out' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is a Smile Makeover?',
      lead: 'A smile makeover is a personalized plan that combines several cosmetic treatments to transform how your smile looks.',
      body: p(
        'Rather than fixing one tooth in isolation, it improves the color, shape, spacing, and balance of your smile as a whole, so the final result looks intentional and natural.',
        'Your makeover might include veneers, teeth whitening, bonding, cosmetic crowns, or clear aligners. What makes it a makeover, and not a list of separate procedures, is that every element is designed together, around your face and your goals.',
        'The real difference is how it starts. Before any permanent work is done, Dr. Meskin designs your new smile and lets you preview it, so you can see, shape, and approve the result first. Nothing is a surprise, because you helped design it.',
      ),
      drawing: 'smile',
    }),
    features({
      name: 'Explained',
      tagline: 'At a Glance',
      title: 'Smile Makeovers, Explained',
      image: { src: 'smile-makeovers-preview.webp', w: 2400, h: 1000, alt: 'A smile design traced over a row of teeth' },
      items: [
        {
          title: 'The Benefits of a Smile Makeover',
          text: p('A well-planned smile makeover changes more than the way your teeth look. Patients notice a mix of visible and less visible benefits, from the first reveal and for years afterward:') + ul([
            '<strong>A natural, coherent smile.</strong> Color, shape, length, and gum line all in balance, so nothing looks off or "done."',
            '<strong>Designed around your face.</strong> Teeth proportioned to your age, lips, and features, not a template.',
            '<strong>Renewed confidence.</strong> The habit of covering your mouth in photos and conversation quietly disappears.',
            '<strong>A single coordinated plan.</strong> Multiple treatments sequenced together for one cohesive result, rather than a patchwork.',
          ]),
        },
        {
          title: 'Who a Smile Makeover Is For',
          text: p('Almost anyone with healthy teeth and gums can benefit from a smile makeover, so this is less about medical eligibility than about whether the treatment fits your goal. You are likely a strong fit if any of these describe you.') + ul([
            'You dislike your smile in photos or catch yourself hiding it in conversation',
            'Your teeth are stained, chipped, worn, or uneven',
            'You have gaps, or teeth that look too short or too long',
            'You show more gum than you would like when you smile',
          ]),
        },
        {
          title: 'Preview Before You Commit',
          text: p(
            'The one question that stops most people from a smile makeover is whether it will end up looking natural. The answer is: not if you see it first.',
            'Cosmetic dentistry now uses two tools that let you preview your new smile before anything permanent happens.',
          ) + ul([
            '<strong>Digital Smile Design.</strong> Software overlays a proposed new smile onto photos and video of your face, so tooth size, shape, proportion, and the gum line are evaluated together, including how the smile moves with your lip and speech.',
            '<strong>Trial Smile.</strong> A tooth-colored composite mockup placed directly over your natural teeth, no drilling required. You wear it in the mirror, take it home, and only when you love it do we move to anything permanent.',
          ]),
        },
      ],
    }),
    index({
      name: 'What It Fixes',
      tagline: 'What It Fixes',
      title: 'What a Smile Makeover Can Fix',
      intro: p('Small things can hold a smile back. A little discoloration, a chip, a gap, teeth that have worn unevenly over the years. On their own each seems minor, but together they are often why someone stops smiling freely. A makeover addresses them as a whole. Here is what it sets right.'),
      items: [
        { title: 'Stains and Discoloration', body: p('Yellowing, dullness, or stains that no toothpaste will lift, whether from coffee, wine, tobacco, age, or old fillings darkening over time. Professional whitening handles most surface and deeper staining, and it is usually the first step in any makeover plan because natural teeth can be whitened but porcelain veneers cannot. For stains that whitening will not lift, such as tetracycline discoloration or heavily fluorosed teeth, veneers or bonding cover the tooth entirely.') },
        { title: 'Chips, Cracks, and Gaps', body: p('Chipped edges, hairline cracks, or teeth that have worn down over the years, often from grinding. Composite bonding rebuilds small chips in a single visit. Larger chips, visible cracks, or teeth that have lost real length are better rebuilt with porcelain veneers or crowns, which restore the strength as well as the look. If grinding is the cause, we plan a nightguard alongside the cosmetic work so it does not happen again to the new teeth.') },
        { title: 'Gaps Between Teeth', body: p('Small gaps that feel too visible, uneven spacing, or a single wider gap in the front. Bonding closes small gaps quickly and affordably. Porcelain veneers close wider gaps or several at once with a more polished result. When the gap is caused by teeth that have drifted, clear aligner orthodontics is sometimes the better first step, since aligning first often means less veneer coverage later.') },
        { title: 'Uneven, Worn, or Misshapen Teeth', body: p('Teeth that look shorter than they should, that end unevenly, that are slightly crooked, or that have odd shapes. Reshaping the enamel handles small edge irregularities. Bonding or veneers rebuild teeth that have lost length or shape. Where crowding is the underlying cause, we consider whether short-course clear aligners could reset the arch before any restorative work.') },
        { title: 'A Gummy Smile or an Uneven Gum Line', body: p('When your smile shows more gum than you would like, or when the gum line is uneven from tooth to tooth so some teeth look shorter than their neighbors. Gum contouring reshapes the gum with a soft-tissue laser, so more of the tooth shows and the smile line becomes even. Often combined with veneers so the tooth length and gum line are designed together.') },
        { title: 'Crooked or Crowded Teeth', body: p('Mild crowding, rotated teeth, or a smile that has shifted with age. Clear aligners such as Invisalign are usually the least invasive fix. In adults with time constraints, veneers can also visually correct mild misalignment, though for anything beyond mild we recommend aligning first.') },
        { title: 'Old Crowns and Fillings That No Longer Match', body: p('Older crowns with dark margins near the gum, front fillings that have darkened, or restorations that no longer match the teeth around them. Replacing them with newer materials, matched by a prosthodontist and finished in the on-site lab, is often what a smile makeover turns out to actually mean for patients whose natural teeth are otherwise fine.') },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Choose Dr. Meskin for Their Smile Makeover',
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear from patients who stopped hiding their smile and started showing it off, in their own words.',
    }),
    cards({
      name: 'The Options',
      tagline: 'The Treatments',
      title: 'What a Smile Makeover Can Include',
      intro: p('Your smile makeover is built from the treatments your case actually needs, in a sequence that makes sense. Here are the components Dr. Meskin most often combines.'),
      items: [
        { title: 'Professional Teeth Whitening', text: p('The starting point for most makeovers. Natural teeth can be whitened but veneers and crowns cannot, which is why whitening always comes first. Available as in-office whitening, take-home trays, or both, chosen to reach the shade your restorations will be matched to.') },
        { title: 'Composite Bonding', text: p('Tooth-colored resin applied directly to the tooth and shaped by hand to repair chips, close small gaps, smooth uneven edges, or lengthen a short tooth. Done in one visit, no drilling in most cases, and often the most affordable way to make a noticeable change.') },
        { title: 'Porcelain Veneers', text: p('Thin porcelain shells bonded to the front of the teeth to change shape, color, length, or spacing all at once. The most versatile cosmetic option, and the one most people picture when they hear "smile makeover." Custom-designed to match the rest of your face.') },
        { title: 'Dental Crowns', text: p('Full-coverage restorations used when a tooth is heavily damaged, cracked, or has a large old filling that needs replacing. In a makeover, crowns are often placed alongside veneers so the whole smile blends together.') },
        { title: 'Complete Smile Design', text: p('For a full transformation, several treatments are combined into one coordinated plan, designed around your facial proportions for a cohesive, natural result.') },
        { title: 'Clear Aligners', text: p('When teeth need straightening before or as part of a makeover, clear aligners can quietly correct alignment to set the foundation for the final look.') },
        { title: 'Gum Contouring', text: p('For a gummy smile or an uneven gum line, gentle reshaping balances the frame around your teeth, so the whole smile looks even.') },
      ],
      action: BOOK,
    }),
    path({
      tagline: 'The Process',
      title: 'Your Treatment Journey',
      intro: p('A smile makeover is delivered in clear, planned stages, so you always know where you are and what comes next. Most cases run from a few weeks for a simple plan to a few months for a comprehensive one, including preview and refinement time. Not every step applies to every case, and Dr. Meskin will tell you which ones yours needs.'),
      steps: [
        {
          title: 'Consultation and Goals Conversation',
          body: p('Your first visit is about understanding what you want your smile to look like, not about selling you veneers. Dr. Meskin examines your teeth, gums, and bite, listens to what has been bothering you, and looks at any reference photos you have brought. Because this visit sets the whole plan, it covers a lot:') + ul([
            'A clinical exam of your teeth, gums, and bite',
            'Photos and video of your smile in motion, including how it moves when you speak',
            'A discussion of your goals, reference photos, and what a natural version of your best smile could look like',
            'An honest conversation about which treatments will make a real difference and which will not',
            'A written plan, a firm estimate, and a timeline before you commit to anything',
          ]),
        },
        {
          title: 'Digital Smile Design',
          body: p('Between visits, Dr. Meskin designs your new smile digitally. Software overlays a proposed version of your teeth onto photos and video of your face, so tooth size, shape, proportion, and the gum line are all evaluated together rather than tooth by tooth. This is where the details that make a smile look natural on your specific face get worked out: how long the teeth should be for your age, how much they should show when you speak, how they should relate to the shape of your lips. You come back to review the design, and nothing is committed to until you approve.'),
        },
        {
          title: 'Trial Smile, the Preview You Can Wear',
          body: p(
            'Once the digital design is approved, we build a physical version. A tooth-colored composite mockup is placed directly over your natural teeth, no drilling required, so you can see and wear the proposed smile in the mirror, in photos, in conversation. This step is what eliminates the "will I like it" fear, because you live in the new smile for a short time before anything permanent happens.',
            'If anything about the length, shape, shade, or overall feel is off, we adjust the design and try again. Only when you are certain do we move to permanent work.',
          ),
        },
        {
          title: 'Treatment',
          body: p('With the design locked in, the actual treatments happen in the sequence set out in your plan. Whitening comes first if it is part of the case, so any restorations can be matched to your final shade. Gum contouring, if needed, happens before veneers so the tooth length is designed to the new gum line. Bonding, veneers, and crowns are placed in the order that makes sense for your case, with temporaries fitted if any tooth needs prep between visits.'),
        },
        {
          title: 'Reveal, Bite Balance, and Follow-Up',
          body: p(
            'The final visit is where the whole smile comes together. Dr. Meskin checks the fit of every restoration, adjusts the bite so the load spreads evenly across your teeth, and polishes the finished result. You leave with the smile you designed together, and we see you back for check-ins to make sure it stays comfortable and looking good.',
            'For patients whose plan included whitening, we agree on a top-up schedule so your natural teeth stay matched to your restorations over time.',
          ),
        },
      ],
    }),
    financing({
      title: 'Smile Now, Pay Later',
      lenders: LENDER_COPY,
      action: { label: 'Request An Appointment', href: '#consultation' },
    }),
    faq({
      items: [
        ['How much does a smile makeover cost in Hackensack?', 'It depends on which treatments your makeover includes, since every plan is designed individually. After your consultation you receive a clear written estimate, plus financing that can spread it into manageable payments.'],
        ['Can I really see my new smile before treatment?', 'Yes, and it is one of the best parts. With a 3D Smile Test Drive, you can preview and try on your future smile before any permanent work begins, and adjust the design until you love it.'],
        ['Will my smile look natural or fake?', 'Natural is the whole point. As a prosthodontist, Dr. Meskin designs your smile around your face and features, matching shade, shape, and proportion, so it enhances your look rather than announcing itself.'],
        ['How long does a smile makeover take?', 'It depends on the treatments involved. Whitening and bonding can be done in a visit or two, while veneers usually take a few visits. Your timeline is mapped out at your consultation.'],
        ['Does a smile makeover hurt?', 'Most cosmetic treatments are gentle, with little to no discomfort. For anything more involved, local anesthetic and sedation options keep you comfortable.'],
        ['How long will my results last?', 'With good care, veneers and crowns can last many years, and whitening can be maintained with occasional touch-ups. Dr. Meskin will explain what to expect for your specific plan.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any benefits up front.'],
      ],
    }),
    consult({
      text: 'Book a consultation and start designing the smile you have always wanted. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
