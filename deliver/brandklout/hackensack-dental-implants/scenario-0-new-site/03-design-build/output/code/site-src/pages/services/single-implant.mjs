/* /services/single-implant. Copy: the live page (scrape/pages/services-single-implant.md; lists, the
   comparison table and the FAQ links placed from mirror/raw-html/services/single-implant.html), placed and
   folded, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24); the jump-to-section menu (the chapters replace it); "The work speaks through the patients who
   wear it." (a tab caption of the old doctor panel, left out of MESKIN as on /services/all-on-x); the
   Overview / Credentials / Recognition tab labels; the bare "Schedule Your Consultation" buttons; "Key
   Features:" above each lender's list (the list says it); the footer address, hours and languages blocks.
   Changed: nothing. No phone number, practice name or review count needed changing. The specialist
   chapter is MESKIN and the lenders are LENDER_COPY (both word for word the same as this page). The
   timeline's own lead-in ("Every case is a little different...") sits in the intro, before the stages,
   where the live page had it. */
import { page, hero, statement, checks, index, specialist, path, films, timeline, compare, financing, faq, consult, p, ul } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/single-implant', 'Single Tooth Implants']];

export default page({
  path: '/services/single-implant',
  crumbs,
  seo: {
    title: 'Single Tooth Implant in Hackensack, NJ | Hackensack Center',
    description: 'Single tooth implant in Hackensack, NJ from prosthodontist Dr. Alan Meskin. Replace one missing tooth, root and crown.',
    image: 'single-implant-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'One Missing Tooth',
      title: 'Single Tooth Implants in Hackensack, NJ',
      lead: 'The most natural, permanent way to replace one missing or failing tooth, without touching the healthy teeth beside it. Designed and placed by a prosthodontist so it blends right in.',
      image: { src: 'single-implant-hero.webp', w: 1200, h: 1200, alt: 'A dental implant, its abutment and its crown (model)' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is a Single Tooth Implant?',
      lead: 'A single tooth implant replaces one missing tooth from the root up.',
      body: p(
        'A small titanium post takes the place of the root, a connector called an abutment sits on top, and a custom crown finishes it off. Together they look, feel, and work like a natural tooth.',
        'What makes it different from a bridge is important. An implant stands on its own. It does not lean on the teeth next to it, which means those healthy teeth are left completely alone. A bridge, by contrast, only works by grinding down the two teeth on either side of the gap to anchor it.',
      ),
      more: p('Because the post sits in the bone the way a real root did, it also keeps the jawbone stimulated and healthy. You care for it exactly like a natural tooth. Brush it, floss it, and it can last for many years.'),
      drawing: 'single',
    }),
    checks({
      name: 'What It Fixes',
      tagline: 'One Tooth, Solved',
      title: 'What a Single Tooth Implant Can Fix',
      intro: p('Losing or damaging a single tooth affects more than one spot in your mouth. Left alone, the gap changes your bite and the bone beneath it. A single implant solves the whole problem at the source.'),
      items: ['A tooth lost to decay', 'A tooth knocked out by injury', 'A cracked tooth beyond saving', 'A failed root canal', 'A tooth too broken to hold a filling or crown', 'A missing tooth causing others to shift'],
      image: { src: 'single-implant-fix.webp', w: 1100, h: 900, alt: 'A single implant and its crown between two natural teeth (model)' },
    }),
    index({
      name: 'Who It Is For',
      tagline: 'Ideal Candidates',
      title: 'Who is a Good Candidate for a Single Tooth Implant?',
      intro: p('Most adults missing a tooth, or about to lose one, are candidates for a single implant. A few things need to be in place for treatment to succeed, and we check all of them at your consultation.'),
      items: [
        {
          title: 'Healthy neighboring teeth and enough room in the gap',
          body: p('This is the part that is unique to replacing a single tooth. The implant has to sit in the gap without crowding the teeth on either side, and those neighbors need to be healthy in their own right.') + ul([
            'Enough space in the gap, generally a few millimeters of clearance from each neighboring tooth',
            'Neighboring teeth that are healthy and stable on their own roots',
            'If teeth have drifted or tipped into the gap over time, the space may need to be reopened first',
          ]),
        },
        { title: 'Enough healthy bone at the site', body: p('The implant fuses directly to the jawbone, so there has to be enough bone in that specific spot to hold it securely. Bone naturally begins to shrink the moment a tooth is lost, and the longer the gap has been there, the more it recedes. Your cone beam scan measures the height and width of bone available, and if there is not quite enough, a small, focused graft can rebuild the site before or at the time of placement. This is very routine for a single implant and adds only a little to the overall timeline.') },
        { title: 'Healthy gums', body: p('Because the implant emerges through the gum, the gum tissue around it needs to be free of active infection. Gum disease is one of the most common reasons a tooth is lost in the first place, and if it is still present it can spread to the tissue around a new implant and stop it from fusing. If we find any active gum disease, we treat and control it first, which protects both the implant and the rest of your teeth.') },
        { title: 'A stable, balanced bite', body: p('A single crown has to fit into your existing bite so that it takes a fair share of the load and no more. If your bite is uneven, or if you clench or grind your teeth at night, an implant crown can be placed under more force than it should carry. We check for this during planning and, where needed, adjust the crown or provide a nightguard so your new tooth is protected for the long term.') },
        { title: 'Good general health, ideally a non-smoker', body: p('As with any minor surgery, your body needs to be able to heal well. Most healthy adults qualify, and well-controlled conditions such as managed diabetes are usually fine, though anything that affects healing is something we plan around. Smoking is the one habit we ask you to pause, because it slows healing and meaningfully raises the risk of implant failure, both while the implant fuses and for years afterward.') },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Choose Dr. Meskin to Replace a Tooth',
    }),
    path({
      title: 'Your Treatment Journey',
      intro: p('A single tooth implant is carried out in clear stages, so you always know what comes next. From first consultation to final crown, most cases take a few months, with most of that time spent letting the implant heal.'),
      steps: [
        {
          title: 'Consultation and 3D Planning',
          body: p('Your first visit is about understanding your mouth and confirming an implant is the right move before anything else happens. Dr. Meskin reviews your history, examines the gap and the teeth around it, and takes a 3D cone beam scan so the whole case is planned against your exact anatomy. Because this visit covers a lot, here is what it includes:'),
          more: ul([
            'Assessing the gap, your bite, and the health of the neighboring teeth',
            'A 3D scan that measures the bone and locates the nerves and sinuses to avoid',
            'Flagging anything needed first, such as removing a failing tooth or a small graft',
            'A firm written estimate, a timeline, and a conversation about sedation if you want it',
          ]),
        },
        { title: 'Removing the Tooth and Preparing the Site', body: p('This step only applies if the tooth is still in place or the site needs building up. If a failing tooth has to come out, we remove it as gently as possible and, in many cases, place a small bone graft into the socket at the same time to preserve the bone for the implant. Where a tooth has been missing for a while and the bone has already shrunk, a graft rebuilds the site first. If your bone is already healthy and the gap is ready, we skip straight to placement.') },
        { title: 'Placing the Implant', body: p('Placement is a focused, minor procedure, often done in under an hour and comfortable enough that most people are surprised afterward. We make sure you are numb and relaxed, with sedation if you chose it, then set the titanium post into the jawbone in the exact position from your plan through a small opening in the gum. A healing cap is usually added on top to shape the gum for a natural crown margin. If the gap shows when you smile, we fit a temporary tooth so you never leave with a visible space.') },
        { title: 'Healing and Osseointegration', body: p('This is the quiet stretch that does most of the work. Over the next few months the implant fuses with your jawbone, a process called osseointegration, which is what gives the finished tooth its strength and permanence. There is little to notice day to day. You stay on normal foods, chewing on the other side near the site, and we see you for a quick check or two to confirm healing is on track.') },
        { title: 'Fitting Your Final Crown', body: p('Once the implant has fully fused, you come back for the part that makes it look like it was always there. We take a detailed impression and craft a crown matched to the shade and shape of the teeth beside it, then secure it to the implant, usually with a small screw through the top that we cover with tooth-colored filling so it is invisible. The finished tooth looks, feels, and works like the one you lost, and Dr. Meskin continues to care for it long term.') },
      ],
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear from patients who replaced a tooth and stopped thinking about it, in their own words.',
    }),
    timeline({
      name: 'Recovery',
      tagline: 'Recovery',
      title: 'What to Expect From Recovery',
      intro: p(
        'Recovery from a single implant is usually mild. Most people have a little soreness or swelling for a day or two, easily managed with over-the-counter care, and are back to their normal routine quickly. The longer part is quiet and hands-off: the post needs a few months to fuse with the bone before the final crown goes on. During that time you simply protect the area and eat a little more carefully.',
        'Every case is a little different, but most single implants follow a similar path from placement to final crown. Here is a general picture of what to expect.',
      ),
      subtitle: 'A Typical Single Implant Timeline',
      stages: [
        { when: 'Day 0', text: 'Implant placed. Mild soreness or swelling is normal.' },
        { when: 'Days 1 to 3', text: 'Most people return to work and normal activity.' },
        { when: 'Days 4 to 7', text: 'Any soreness settles. Eat carefully around the site.' },
        { when: 'Weeks 2 to 4', text: 'Gum tissue heals over the implant.' },
        { when: 'Months 1 to 3', text: 'The post fuses with the bone.' },
        { when: 'Months 3 to 6', text: 'Abutment and custom crown placed. Your tooth is complete.' },
      ],
    }),
    compare({
      tagline: 'Implant or Bridge',
      title: 'Single Tooth Implant vs a Dental Bridge',
      intro: p('For years, a bridge was the standard way to replace one missing tooth. An implant does the same job without the biggest drawback of a bridge, which is grinding down the healthy teeth on either side. Here is how the two compare, point by point.'),
      columns: ['Single Tooth Implant', 'Dental Bridge'],
      rows: [
        ['Healthy teeth', 'Stands on its own. The teeth on either side are never touched.', 'The two neighboring teeth must be ground down to hold the bridge, even if they are healthy.'],
        ['Jawbone health', 'The post acts like a tooth root and preserves the bone where the tooth was lost.', 'Does nothing for the bone under the gap, which continues to shrink over time.'],
        ['Stability and function', 'Fixed in the jaw, with biting strength close to a natural tooth.', 'Solid, but relies on the strength of the teeth it is cemented to.'],
        ['Appearance', 'The crown emerges from the gum like a real tooth, matched to blend in.', 'Looks good, but the false tooth rests on the gum rather than growing from it.'],
        ['Cleaning', 'Brush and floss like a normal tooth.', 'You have to clean underneath the false tooth with special floss or picks.'],
        ['Longevity', 'Designed to last for many years, often for life with good care.', 'Typically needs replacing every 10 to 15 years, and the ground-down teeth stay altered for good.'],
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
        ['How much does a single tooth implant cost in Hackensack?', 'It depends on your case, including whether the old tooth needs removing or the site needs a graft. After your 3D scan you receive a clear written estimate with no surprises, plus financing that can bring it down to a monthly payment.'],
        ['Is an implant better than a bridge?', 'For most people, yes, because an implant leaves the neighboring teeth untouched and keeps the jawbone healthy, while a bridge grinds down two healthy teeth to anchor it. A bridge can still make sense if those neighboring teeth already need crowns, and Dr. Meskin will tell you honestly which fits your situation.'],
        ['Does getting a single implant hurt?', 'Most patients find it more comfortable than they expected, often easier than the extraction that sometimes comes first. It is done with local anesthetic, <a href="/services/sedation">sedation</a> is available, and any soreness afterward is usually mild.'],
        ['How long does the whole process take?', 'Usually a few months from start to finish. The post placement is quick, but the implant needs three to six months to fuse with the bone before the final crown is placed.'],
        ['Can I get the implant and tooth the same day?', 'Sometimes. In certain cases the implant can be placed the day the old tooth is removed, and a temporary can be fitted. Whether that is right for you depends on the bone and the site, which the scan will show.'],
        ['Will the crown match my other teeth?', 'That is the whole point of seeing a prosthodontist. Your crown is designed in <a href="/technology">our lab</a> to match the shade and shape of the teeth around it, so it blends in rather than stands out.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how natural replacing one tooth can look. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
