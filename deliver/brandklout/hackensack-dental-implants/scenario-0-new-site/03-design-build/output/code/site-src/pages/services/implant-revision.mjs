/* /services/implant-revision. Copy: the live page (scrape/pages/services-implant-revision.md, lists and
   section order checked in mirror/raw-html/services/implant-revision.html), placed and folded, not
   rewritten. The "A second opinion costs you nothing..." paragraph and its six-line list sit in the live
   page's second section, so they belong to "Why Patients Seek a Second Opinion", not to "What Is".
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24), the jump-to-section menu (the chapters replace it), the bare "Schedule Your Consultation",
   "View All Testimonials" and "Request an appointment" buttons, "Key Features:", the doctor block's tab
   labels and the address / hours / languages footer. The specialist block is MESKIN (word for word the
   same as this page; its "Credentials" and "Recognition" sub-headings and the eyebrow "The work speaks
   through the patients who wear it." are not carried). "Smile Now, Pay Later" is LENDER_COPY (same).
   Kept: the live page's two inline links ("3D cone beam" to /technology, "new restoration" to
   /services/dental-implants). No fact changes: the page names no other practice and no second number. */
import { page, hero, statement, checks, index, specialist, films, path, financing, faq, consult, p, ul } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/implant-revision', 'Implant Revision']];

export default page({
  path: '/services/implant-revision',
  crumbs,
  seo: {
    title: 'Implant Revision in Hackensack, NJ | Hackensack Center',
    description: 'Implant revision in Hackensack, NJ for failing or painful dental implants. Dr. Alan Meskin diagnoses and rebuilds the result.',
    image: 'implant-revision-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Failing Implants',
      title: 'Implant Revision in Hackensack, NJ',
      lead: 'A failing, loose, or painful implant does not always mean starting over. If an implant placed elsewhere has let you down, Dr. Meskin can often diagnose it, save what can be saved, and rebuild what cannot.',
      image: { src: 'implant-revision-hero.webp', w: 1200, h: 1200, alt: 'A dental scan on a screen, a gloved hand pointing to it' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is Implant Revision and Why Expertise Matters',
      lead: 'Implant revision is the diagnosis and repair of an implant that is failing, loose, painful, or simply was not done right the first time.',
      body: p(
        'Sometimes that means treating an infection and saving the implant. Sometimes it means removing it, letting the site heal, and placing a new one. And sometimes it means redoing a crown, bridge, or full arch that never fit or looked the way it should.',
        'Revision is harder than the original procedure, not easier. The specialist has to work out why the first attempt failed, deal with any bone or gum damage left behind, and then rebuild in a way that lasts. That takes a level of training most general dentists do not have.',
      ),
      more: p('This is exactly the kind of case a prosthodontist is built for. Dr. Meskin spends his days on complex implant and full-mouth work, including the cases other offices would rather refer out than take on.'),
      drawing: 'revision',
    }),
    checks({
      name: 'Second Opinion',
      tagline: 'Second Opinions',
      title: 'Why Patients Seek a Second Opinion',
      intro: p(
        'Most people who come to us for revision are not first-time patients. They have already been through an implant somewhere else, and something is wrong. Maybe it hurts. Maybe it moves. Maybe the crown never matched, or the whole thing simply failed. Often they were told nothing more could be done, or were left unsure who to trust next.',
        'A second opinion costs you nothing but an hour, and it frequently changes the picture entirely. Many implants written off elsewhere turn out to be treatable once someone looks closely with the right tools.',
      ),
      items: [
        'Your implant is loose, painful, or feels wrong',
        'An infection or gum problem has developed around it',
        'The crown or bridge never fit or matched your other teeth',
        'A full-arch case does not look or function the way you were promised',
        'The implant failed completely and you were told it could not be redone',
        'You simply want an honest, specialist opinion before doing anything more',
      ],
      image: { src: 'implant-revision-opinion.webp', w: 1100, h: 900, alt: 'Implant parts, screws and crowns laid out in a steel tray' },
    }),
    index({
      name: 'What It Fixes',
      tagline: 'What It Fixes',
      title: 'What Implant Revision Can Fix',
      intro: p('A problem implant affects more than one tooth. It can hurt, harbor infection, damage the bone around it, and leave you afraid to chew on that side. Revision addresses the whole situation, not just the visible part. Here are the problems it solves most often.'),
      items: [
        { title: 'A Loose or Painful Implant', body: p('Movement or ongoing pain means something is wrong beneath the surface. Revision finds the cause and either stabilizes the implant or replaces it.') },
        { title: 'Infection Around an Implant', body: p('Peri-implantitis, the infection that attacks the gum and bone around an implant, is treated directly, protecting the bone before more is lost.') },
        { title: 'A Failed Implant', body: p('When an implant has failed completely, the site is cleaned, rebuilt if needed, and a new implant is placed on a solid foundation.') },
        { title: 'A Poor Crown, Bridge, or Arch', body: p('When the restoration on top never fit, matched, or functioned properly, Dr. Meskin redesigns and remakes it in our lab so it finally looks and works right.') },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Come to Dr. Meskin for a Revision',
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear the real stories of patients who were right where you are, in their own words.',
    }),
    path({
      tagline: 'The Process',
      title: 'How Dr. Meskin Approaches a Revision',
      intro: p('Every revision follows the same first step, a proper diagnosis, and then splits into different paths depending on what we find. Some cases stay non-surgical. Some involve removal, healing, and replacement. Dr. Meskin will tell you which one applies to you after the workup, with a clear plan and a firm estimate before you commit to anything.'),
      steps: [
        {
          title: 'Diagnostic Workup',
          body: p('Your first visit is where the real work happens. We review your history, examine the existing implant, and take a <a href="/technology">3D cone beam</a> scan to see what is going on around and beneath the site. This visit covers a lot:') + ul([
            'Clinical exam of the implant, gum, and surrounding teeth',
            'Full mouth photographs and diagnostic impressions',
            '3D scan to measure bone loss, evaluate the implant position, and check for infection',
            'Review of your bite and how it loads onto the implant',
            'Review of any existing records or x-rays from the original placement',
            'A written diagnosis and plan, with a firm estimate, before anything else happens',
          ]),
        },
        {
          title: 'Save or Replace Decision',
          body: p('Based on the workup, we tell you what the options are. Broadly, cases go one of three ways.') + ul([
            '<strong>Non-surgical revision.</strong> The implant is sound. The problem is on top of it or in the bite. Fixed by redesigning the restoration, adjusting the bite, or treating a soft-tissue issue.',
            '<strong>Save the implant surgically.</strong> The implant is still integrated but has infection or early bone loss around it. Treated with deep cleaning, sometimes surgery to clean the implant surface, and often a <a href="/services/dental-implants">new restoration</a>.',
            '<strong>Remove and rebuild.</strong> The implant cannot be saved. It is removed, the site is treated, and a new implant is planned when the site is ready.',
          ]),
        },
        {
          title: 'Treatment',
          body: p('The treatment stage depends on the path. Non-surgical revisions may be complete in one to two visits. Surgical save cases involve a small procedure and a healing period. Remove-and-rebuild cases involve removal, sometimes bone grafting, and eventually a new implant. All of it is done under local anesthetic, with sedation available if you want it.'),
        },
        {
          title: 'Healing and Osseointegration',
          body: p('If a new implant is placed, the healing period is where bone fuses with it. That takes a few months, and revision sites sometimes take a little longer than a first-time site because the surrounding bone has already been through one procedure. We see you back for a check or two to confirm healing is on track. Studies report second implants in previously failed sites succeed at around 88 to 93 percent when the underlying cause is diagnosed and corrected first.'),
        },
        {
          title: 'Final Restoration and Follow-Up',
          body: p('The final crown, bridge, or full-arch is made in the on-site lab, matched to the shade and shape of the teeth around it, and adjusted so the bite loads evenly across the site. From there, we see you back for check-ins to make sure the result stays healthy. Regular cleanings and follow-up are especially important for revision patients, because the goal is to make sure the cause that failed the first implant does not repeat.'),
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
        ['Can a failed or loose implant really be fixed?', 'Often, yes. Some struggling implants are saved by treating the infection or replacing a component. Others need to be removed, with a new implant placed after the site heals. The only way to know which applies to you is a 3D scan and an exam.'],
        ['I was told my implant could not be saved. Is that true?', 'Maybe, but it is worth a second opinion. Even implants that have failed completely can usually be redone after the site heals, sometimes with a bone graft. Being told no at one office does not always mean no everywhere.'],
        ['Why did my implant fail?', 'The common causes are infection around the implant, an implant that never fully fused with the bone, bone loss, too much bite pressure from grinding, or a placement that was not quite right. Part of revision is working out exactly which it was, so it does not happen again.'],
        ['Does implant revision hurt?', 'It is done with local anesthetic and sedation is available. Many revision steps, like treating an infection or replacing a component, are minor. Dr. Meskin will walk you through what your specific case involves.'],
        ['How much does implant revision cost?', 'It depends entirely on what needs to be done, from a simple component replacement to a full removal, graft, and new implant. After your scan you receive a clear written estimate, plus financing options.'],
        ['Will I be without a tooth during the process?', 'Usually not for long. Where a temporary is possible, one is provided so you are not left with a visible gap while the site heals.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'If an implant has let you down, book a consultation and get an honest, specialist opinion on what can be done. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
