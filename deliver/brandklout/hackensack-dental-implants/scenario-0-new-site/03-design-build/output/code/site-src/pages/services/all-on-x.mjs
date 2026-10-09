/* /services/all-on-x. Copy: the live page (scrape/pages/services-all-on-x.md), placed and folded,
   not rewritten. Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the
   office's: BugHerd #10, #24) and the jump-to-section menu (the chapters replace it). */
import { page, hero, statement, checks, index, specialist, path, films, timeline, cards, compare, financing, faq, consult, p, ul, BOOK, CALL } from '../../lib/ui.mjs';
import { MESKIN, LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/all-on-x', 'All-on-X']];

export default page({
  path: '/services/all-on-x',
  crumbs,
  seo: {
    title: 'All-on-X Implants in Hackensack, NJ | Hackensack Center',
    description: 'All-on-X dental implants in Hackensack, NJ. Dr. Alan Meskin replaces a full arch on four to six implants.',
    image: 'allonx-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Full-Arch Implants',
      title: 'All-on-X in Hackensack, NJ',
      lead: 'A fixed, full set of teeth for people who are done living with failing teeth or loose dentures. Planned in 3D, placed by a specialist, and in most cases fitted the same day.',
      image: { src: 'allonx-hero.webp', w: 1000, h: 1250, alt: 'Daniel, a full-arch patient of the practice, smiling after treatment' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is All-on-X?',
      lead: 'All-on-X replaces a full arch of teeth, upper, lower, or both, using four to six implants to hold a complete set of fixed teeth in place.',
      body: p(
        'The name covers the whole family of full-arch options, so whether your case calls for four implants or six, it falls under the same approach.',
        'What sets it apart from dentures is simple. Nothing comes out. The teeth are anchored to the implants, so they stay put while you eat, talk, and laugh. No adhesives, no slipping, nothing to take out at night.',
        'For most of our patients, the timeline is the part they did not expect. Because we plan everything in 3D beforehand and have our own lab on site, most people leave on the day of surgery with a fixed set of temporary teeth. You are never sent home without a smile.',
      ),
      drawing: 'arch',
    }),
    checks({
      name: 'What It Fixes',
      tagline: 'The Whole Picture',
      title: 'What All-on-X Can Fix',
      intro: p('Missing and failing teeth change how you eat, speak, and feel around other people. All-on-X is built to address the whole picture, not just the gaps. Here is what it solves most often.'),
      items: ['Failing or broken teeth', 'Loose, slipping dentures', 'Trouble eating the foods you like', 'Years of patched-up dental work', 'Missing most or all of an arch', 'Ongoing pain or infection'],
      image: { src: 'allonx-fix.webp', w: 1100, h: 900, alt: 'A full-arch implant restoration on a model of the jaw' },
    }),
    index({
      name: 'Who It Is For',
      tagline: 'Ideal Candidates',
      title: 'Who All-on-X Works For',
      intro: p('All-on-X is designed for people who have already lost, or are about to lose, most of the teeth in an arch. If you see yourself in any of the reasons below, you are likely a candidate. If you are not sure, come in and Dr. Meskin will give you a straight answer at your consultation.'),
      items: [
        { title: 'Most of your teeth are failing.', body: p('Advanced gum disease, deep decay across several teeth, or old crowns and bridges that keep breaking down all lead to the same place: an arch of teeth where each one has a poor outlook. When your mouth reaches that point, putting more crowns or bridges on teeth that are already failing buys months, not years, and each new failure puts pressure on the teeth next to it. All-on-X clears the arch and rebuilds it as one connected set of teeth in a single planned treatment.') },
        { title: 'Done with your denture.', body: p('A full denture rests on your gums and moves around. Over time the jawbone underneath keeps shrinking, the fit gets looser, and the range of foods you can chew narrows. Adhesives are a workaround, not a fix. All-on-X anchors your teeth into your jawbone with four to six implants, so they do not shift, do not need adhesive, and do not come out at night.') },
        { title: 'Years of dental repairs that keep failing.', body: p('Root canals redone, crowns remade, bridges replaced, partials adjusted again and again. All of it adds up in cost and time, and the teeth themselves keep getting weaker. Full-arch treatment ends the cycle by replacing the failing teeth with implants that do not decay and do not need root canals. Many of our patients spent years and tens of thousands of dollars on repairs before choosing to fix the whole arch at once.') },
        { title: 'Protecting your face shape.', body: p('Your teeth stimulate the bone they sit in. When teeth come out and are not replaced with implants, that bone slowly melts away. The lower part of your face starts to collapse, your chin rotates forward, and your lips lose their support.'), more: p('Traditional dentures actually speed the process up because they press on the gum without giving the bone the pressure it needs to stay strong. Implants give the bone what it needs, and the four-to-six implant pattern used in All-on-X protects the shape of your jaw across the whole arch.') },
        { title: 'Told you cannot have implants.', body: p('Not enough bone is the most common reason people are turned away from implants at a general dental office. A specialist looking at the same 3D scan often sees more options:') + ul(['Placing implants at an angle to make use of the bone you have at the front of your mouth', 'Adding a small amount of bone only where it is truly needed', 'Lifting the sinus so implants can go in your upper back jaw', 'In the most severe upper-jaw cases, longer implants that anchor into your cheekbone']) },
      ],
    }),
    specialist({
      ...MESKIN,
      title: 'Why Patients Choose Dr. Meskin for Full-Arch Care',
    }),
    path({
      title: 'Your Treatment Journey',
      intro: p('All-on-X is a staged surgical and prosthetic case, typically three to six months from the first consultation to the final restoration, with fixed provisional teeth in the mouth for almost the entire interval. The stages below are the same for every case; the specifics change based on your anatomy and the diagnostic findings.'),
      steps: [
        {
          title: 'Consultation and full workup',
          body: p('Your first visit is a real diagnostic appointment. Dr. Meskin examines your remaining teeth and gums, reviews your medical history in detail (some medications and health conditions affect implant healing), and takes a 3D scan of both jaws. The scan is not a formality. It is where your treatment is actually planned.'),
          more: p('It shows:') + ul(['Exactly where the nerve runs in your lower jaw, so implants can be placed safely around it', 'Where your sinuses sit in your upper jaw, so we can plan around them and often avoid needing a sinus lift', 'How dense your bone is in each spot, which tells us whether your temporary teeth can go in the same day as surgery', 'The shape of your jawbone, so we can plan a comfortable, natural fit', 'How the ideal position of your new teeth lines up with the bone we have to anchor them']) + p('At the end of the visit, Dr. Meskin walks you through the findings and gives you a written plan. It includes the number of implants, the type of temporary and final teeth, the timeline, and the total cost.'),
        },
        {
          title: 'Designing your new teeth and the surgical guide',
          body: p('Before your surgery is scheduled, your case is designed in detail. Your new teeth are drawn first, shaped around your face, lip line, smile, and bite. Then the implants are positioned virtually against your 3D scan to support those teeth perfectly.'),
          more: p('That order matters. Some offices do it in reverse: they place implants wherever the bone is easiest, then try to build teeth to fit. The smile that comes out of that approach is a compromise. Doing it teeth-first is the difference between an average result and one that fits your face.', 'From that plan, a surgical guide is made. On surgery day, the guide fits over your gum and controls exactly where each implant goes. Placing implants without a guide in a full-arch case invites problems:') + ul(['Angles that force the teeth into positions you cannot clean easily', 'Teeth that sit against your gum in ways that trap food and cause irritation', 'Extra parts and adapters that add cost and weaken the final result']) + p('Your fixed temporary teeth are made ahead of time too, ready to attach the same day your implants are placed.'),
        },
        {
          title: 'Surgery day',
          body: p('Surgery happens in one appointment. In that visit:') + ul(['Any remaining failing teeth in the arch are removed', 'The gum and bone are prepared using the surgical guide', 'Four to six implants are placed in the planned positions', 'Any bone grafting needed at a specific site is done at the same time']),
          more: p('Whether your temporary teeth are attached the same day depends on how firmly the implants sit in the bone the moment they go in. When they are solid enough, small connectors are attached, your temporary teeth are secured onto them, and the implants are linked so they share the pressure evenly during healing. If one implant is not quite firm enough for that same-day attachment, we cover it while it heals and you wear a temporary removable set until the final teeth go on. That decision is made during surgery based on what we see, not committed to in advance.', 'Sedation is available up to IV sedation, so you are comfortable throughout. Most patients tell us the day was much easier than they had feared, and they leave with fixed teeth and clear instructions for the next few days on eating, cleaning, and pain relief.'),
        },
        {
          title: 'Healing',
          body: p('Over the next three to six months, your implants fuse to your jawbone in a process called osseointegration. This is what turns them from placed screws into permanent tooth roots. During this healing time, your temporary teeth are doing more than filling the space.'),
          more: p('The way they are shaped where they meet your gum guides how your gums heal around each implant, so by the time your final teeth are made, your gum line is already the right shape to frame them.', 'You wear the temporary teeth normally, eat soft food for the first two weeks, then gradually return to a regular diet, avoiding anything hard or sticky on the temporaries until the finals go on. Check-in visits are short and let Dr. Meskin confirm your implants are integrating well and adjust the temporaries as your gums settle. Most patients are back to their normal day within a week of surgery.'),
        },
        {
          title: 'Your final teeth',
          body: p('Once your implants are fully fused, the temporary teeth come off and your final teeth are made in our on-site lab. Impressions and photos are taken, and the shape, color, length, and how the teeth support your lips are refined right in the chair before your finals are completed.'),
          more: p('You have a choice of materials, and Dr. Meskin will walk you through which is better for your situation. Neither is better in every case:') + ul(['Solid zirconia. The strongest and most stain-resistant option, keeps its polish for years, well-suited to heavy chewers.', 'Reinforced acrylic teeth on a titanium bar frame. More forgiving under heavy bite pressure, easier to repair in the office, and often the better choice when the teeth in your opposite jaw are still natural.']) + p('Your final teeth are attached with tiny screws, not glued in place. That means Dr. Meskin can remove them for deep cleaning and check-ups without damaging anything, and there is no leftover cement below your gum line to cause problems later. Your bite is balanced across the whole arch so the pressure is shared evenly.'),
        },
      ],
    }),
    films({
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    timeline({
      name: 'Recovery',
      tagline: 'Recovery',
      title: 'What to Expect From Recovery',
      intro: p('Recovery from All-on-X is steadier than most people fear. The first few days bring some swelling and soreness, which most patients manage with over-the-counter care and describe as milder than they expected. The larger part of recovery is quiet: your implants need a few months to fuse with the bone, so you stay on softer foods to protect them while that happens. Follow the aftercare and keep your check-ins, and the process is predictable.'),
      subtitle: 'A Typical All-on-X Recovery Timeline',
      stages: [
        { when: 'Day 0' },
        { when: 'Days 1 to 3', text: 'Peak swelling and soreness. Soft foods only. Usually milder than expected.' },
        { when: 'Days 4 to 7', text: 'Swelling drops off. Most people return to work.' },
        { when: 'Weeks 2 to 4', text: 'Stitches dissolve and gums heal. Still on a soft diet.' },
        { when: 'Months 1 to 3', text: 'The bone fuses to your implants. Keep protecting them with softer foods.' },
        { when: 'Months 3 to 6', text: 'Final zirconia teeth placed. Back to a normal diet.' },
      ],
      after: p('Every recovery is a little different, but with careful planning and structured aftercare, most patients follow a similar path. Here is a general picture of what healing tends to look like, week by week.'),
    }),
    cards({
      name: 'The Options',
      tagline: 'Types of Full-Arch Implants',
      title: 'Types of Full-Arch Implants We Offer',
      intro: p('Full-arch care is not one-size-fits-all. Depending on your jaw, your bone, and your goals, Dr. Meskin will recommend the option that fits you best. Here are the main approaches.'),
      items: [
        { title: 'All-on-4', text: p('The classic full-arch solution. Four implants, angled for maximum grip in the available bone, support a complete fixed set of teeth. It often works even when bone is limited, which is why so many patients qualify without extra grafting.') },
        { title: 'All-on-6', text: p('For patients with more bone or who want extra support, six implants spread the load further. It can mean added stability and is often used for the upper jaw, where bone tends to be softer.') },
        { title: 'Fixed Zirconia Bridge', text: p('Your final teeth, made from solid zirconia. It is stronger, more natural-looking, and more stain-resistant than the acrylic most offices use, and it is designed to last for years.') },
        { title: 'Same-Day Fixed Temporaries', text: p('The fixed set you leave with on surgery day. Not a denture you take out, but teeth anchored to your new implants while everything heals, so you are never without a smile.') },
      ],
      sub: [
        { title: 'Upper Arch All-on-X', text: 'Restoring the top arch has its own challenges, softer bone and the sinuses nearby. Our 3D planning maps around both so placement is precise and secure.' },
        { title: 'Lower Arch All-on-X', text: 'The lower jaw is usually denser, which often makes it an ideal candidate for a fixed full arch, sometimes with a very smooth path to same-day teeth.' },
        { title: 'Snap-In Overdenture', text: 'The removable alternative. It clips onto implants for far more hold than a traditional denture, but comes out for cleaning. A good fit for some, though most of our patients prefer a fixed set.' },
        { title: 'Full-Mouth (Both Arches)', text: 'For patients who need both the upper and lower restored, we rebuild the entire smile together, planned as one so the bite, look, and function all line up.' },
      ],
      action: BOOK,
    }),
    compare({
      tagline: 'Fixed or Removable',
      title: 'All-on-X vs a Traditional Denture',
      intro: p('A removable denture is the most economical way to replace a full arch, but it comes with real trade-offs for your health, comfort, and appearance. Here is how fixed All-on-X teeth compare, point by point.'),
      columns: ['All-on-X (Fixed Teeth)', 'Removable Denture'],
      rows: [
        ['Retention', 'Anchored to implants in the jaw, so they never slip or move.', 'Rests on the gums and can slip or shift, especially when eating or speaking.'],
        ['Stability', 'Stable enough to bite and chew almost like natural teeth.', 'Less stable, so chewing and speaking can be difficult.'],
        ['Comfort', 'No pressure on the gums, no sore spots, no adhesive.', 'Can rub and irritate the gums, and often needs adhesive to stay put.'],
        ['Jawbone Health', 'Implants act like tooth roots and preserve the jawbone and facial support.', 'Bone keeps shrinking underneath, which changes your bite and ages the face over time.'],
        ['Appearance', 'Designed around your face for a natural look.', 'Can look bulky or artificial and may shift when you smile or talk.'],
        ['Durability', 'Built to last for years, often for life with proper care.', 'Wears out and needs relines or remakes every few years.'],
        ['Cost', 'Higher upfront, but better value over the long run.', 'Lower upfront, though repeat repairs and remakes add up.'],
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
        ['How much does All-on-X cost in Hackensack?', 'It depends on your case, whether it is one arch or both, and what needs to happen before the implants go in. After your 3D scan you get a clear written estimate with no surprises, plus financing that can bring it down to a monthly payment.'],
        ['Does All-on-X hurt?', 'Most patients are surprised by how comfortable it is. The procedure is done with sedation, and the soreness afterward is usually managed with simple over-the-counter care.'],
        ['Will I really leave with teeth the same day?', 'In most cases, yes. You go home with a fixed set of temporary teeth on the day of surgery, then receive your final zirconia set once you have healed.'],
        ['I was told I do not have enough bone. Can I still get All-on-X?', 'Often yes. All-on-4 is designed to work with limited bone, and modern 3D planning solves cases that would have been turned away years ago. A scan is the only way to know for sure.'],
        ['How long until I can eat normally?', 'You are on softer foods while your implants fuse, usually a few months. Once your final teeth are placed, you can get back to a normal diet.'],
        ['Why see a prosthodontist for All-on-X?', 'A prosthodontist trains for years specifically in replacing and restoring teeth. For full-arch work, where both function and appearance matter, that specialization means a more predictable, natural-looking result.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how different full-arch care can feel. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
