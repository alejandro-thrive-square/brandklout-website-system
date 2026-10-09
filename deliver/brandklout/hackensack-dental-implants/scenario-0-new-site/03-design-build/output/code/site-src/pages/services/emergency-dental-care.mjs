/* /services/emergency-dental-care. Copy: the live page (scrape/pages/services-emergency-dental-care.md;
   the six emergencies, the six service lists and the four prevention items checked in
   mirror/raw-html/services/emergency-dental-care.html), placed and folded, not rewritten.
   Left out: the jump-to-section menu (the chapters replace it), the bare "Schedule Your Consultation"
   button and the address / hours / languages footer. The live hero button "Request an Urgent
   Appointment" is kept as the hero's first action (it points at the consultation form).
   Dropped as broken copy: the last line under "What to Do Right Now", "These are airway and systemic
   concerns a hospital is equipped to manage. For everything else, a specialist is the faster path to
   real relief." Its "These" points at a list of hospital cases the live page does not print (only the
   FAQ "When should I go to the ER instead of a dentist?" names them), so under the six first-aid steps it
   read as if they were airway concerns. Restore it only with the missing lead-in from the client.
   The live page has no "Why Choose Dr. Meskin", patient films or "Smile Now, Pay Later" section.
   No fact changes: the page names no other practice and no second number. */
import { page, hero, statement, index, checks, cards, path, features, faq, consult, p, ul, CALL } from '../../lib/ui.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/emergency-dental-care', 'Emergency Dental Care']];

export default page({
  path: '/services/emergency-dental-care',
  crumbs,
  seo: {
    title: 'Emergency Dental Care in Hackensack, NJ | Hackensack Center',
    description: 'Emergency dental care in Hackensack, NJ. Hackensack Center for Dental Implants treats urgent tooth pain, broken teeth and failed implants.',
    image: 'emergency-dental-care-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Dental Emergencies',
      title: 'Emergency Dental Care in Hackensack, NJ',
      lead: 'Lost a crown, cracked a tooth, or have a failing implant that suddenly hurts? Dr. Meskin handles urgent restorative and implant problems quickly, so you are not left in pain or panic.',
      image: { src: 'emergency-dental-care-hero.webp', w: 1080, h: 1080, alt: 'A treatment room with an orange dental chair, ready for a patient' },
      actions: [{ label: 'Request an Urgent Appointment', href: '#consultation' }, CALL],
    }),
    statement({
      tagline: 'When It Is Urgent',
      title: 'What Counts as a Dental Emergency?',
      lead: 'A dental emergency is any problem that needs fast attention to save a tooth, stop bleeding, or relieve severe pain.',
      body: p(
        'These situations cannot wait for a routine appointment, because delay usually turns a small problem into a much bigger one, including permanent tooth loss, spreading infection, or damage that costs many times more to fix later.',
        'At Hackensack Center, we prioritize urgent problems and see them the same day whenever possible. Dr. Meskin is a prosthodontist, which matters here because most true dental emergencies involve broken teeth, failing crowns and bridges, loose or painful implants, or the kind of restorative work a specialist handles best.',
      ),
      more: p('If you have terrible tooth pain, a knocked-out tooth, a lost crown, a failing implant, or swelling, request an urgent appointment through the form and describe what happened. Our goal is to get you seen quickly, relieve your pain, and give you a clear plan for what comes next.'),
    }),
    index({
      name: 'What We Treat',
      tagline: 'What We Treat',
      title: 'Common Dental Emergencies We Treat in Hackensack',
      items: [
        { title: 'Severe Toothaches', body: p('Intense, throbbing tooth pain that gets in the way of eating, sleeping, or daily activities. Often a sign of infection, deep decay, or a cracked tooth. Needs immediate treatment to stop the pain and prevent it from getting worse.') },
        { title: 'Knocked-Out Teeth', body: p('Complete tooth loss from trauma or an accident. This is time-critical, because the tooth can often be saved if replanted within 30 to 60 minutes. Handle it by the crown only, keep it moist in milk or your own saliva, and get to us right away.') },
        { title: 'Broken or Chipped Teeth', body: p('Fractured, cracked, or badly chipped teeth from injury, biting hard objects, or grinding. Sharp edges can cut soft tissue and expose the sensitive inner tooth. Fast repair protects against infection and more damage.') },
        { title: 'Dental Abscesses', body: p('A painful, pus-filled infection at the root or in the gum. Left untreated, an abscess can cause facial swelling, fever, and serious systemic problems. Needs prompt drainage, antibiotics, and treatment of the underlying cause.') },
        { title: 'Lost Fillings or Crowns', body: p('Dental fillings or custom crowns that fall out leave tooth structure exposed and vulnerable to pain, sensitivity, and more damage. Fast replacement prevents the need for bigger (and more expensive) treatment later.') },
        { title: 'Oral Bleeding', body: p('Uncontrolled bleeding from gums, tongue, or other soft tissues that does not stop with pressure. May come from injury, surgery complications, or a hidden condition. Needs professional evaluation and care.') },
      ],
    }),
    checks({
      name: 'First Steps',
      tagline: 'First Steps',
      title: 'What to Do Right Now',
      intro: p(
        'While you arrange to be seen, a few simple steps can protect your tooth and ease the pain. The most important thing is not to panic, and not to try permanent fixes yourself. Never use household or super glue on a tooth or crown, and never force anything into place.',
        'Once you have done the relevant step below, request an urgent appointment so we can repair it properly.',
      ),
      items: [
        'Lost crown or filling: keep the piece if you can, avoid chewing on that side, and see us soon',
        'Broken or chipped tooth: rinse with warm water, save any fragments, use a cold compress for swelling',
        'Knocked-out tooth: handle it by the crown only, keep it in milk or saliva, and get seen within the hour',
        'Loose or painful implant: avoid chewing on it and have it assessed quickly to protect the bone',
        'Swelling or a gum abscess: rinse gently with warm salt water and be seen urgently, do not try to drain it',
        'Severe pain: an over-the-counter pain reliever can help until you are seen',
      ],
    }),
    cards({
      name: 'The Services',
      tagline: 'Emergency Services',
      title: 'Emergency Dental Services in Hackensack',
      columns: 3,
      items: [
        { title: 'Emergency Extractions', text: ul(['Same-day removal for severely damaged or infected teeth', 'Local numbing for full comfort', 'Gentle, experienced technique', 'Post-op instructions and pain management', 'Tooth replacement options discussed']) },
        { title: 'Root Canal Therapy', text: ul(['Relieves severe tooth pain from infection', 'Saves natural tooth from extraction', 'Removes infected pulp tissue', 'Modern techniques keep you comfortable', 'Same-day emergency appointments available']) },
        { title: 'Abscess Treatment', text: ul(['Drainage of painful dental abscesses', 'Antibiotic prescription to fight infection', 'Pain relief and swelling reduction', 'Follow-up care to prevent it from coming back', 'Treatment of the underlying cause']) },
        { title: 'Broken Tooth Repair', text: ul(['Emergency bonding for chipped teeth', 'Temporary or permanent crown placement', 'Smoothing of sharp, cutting edges', 'Protection of exposed tooth structure', 'Restoration of function and appearance']) },
        { title: 'Lost Restoration Replacement', text: ul(['Re-cementing of lost crowns or bridges', 'Temporary filling placement', 'Protection of vulnerable tooth structure', 'Prevention of more damage or decay', 'Permanent restoration options provided']) },
        { title: 'Trauma Management', text: ul(['Treatment of dental injuries from accidents', 'Tooth stabilization and splinting', 'Soft tissue laceration repair', 'Jaw injury evaluation', 'Specialist referral when needed']) },
      ],
    }),
    path({
      tagline: 'Your Visit',
      title: 'How Your Emergency Visit Works',
      intro: p('Emergency visits at Hackensack Center are focused: relieve the pain or bleeding first, figure out what actually happened, and stabilize the tooth so you leave in better shape than you arrived. Whether the fix is complete on the same day or requires a follow-up depends on what we find.'),
      steps: [
        { title: 'Relieve', body: p('Comfort comes first. Before anything else, we numb the area, control any bleeding, and get you out of pain. If you are anxious, we can talk through sedation options as well. Nothing else happens until you are comfortable.') },
        { title: 'Diagnose', body: p('Once you are settled, Dr. Meskin figures out what is going on. That usually includes an exam, targeted x-rays, and where needed a 3D scan to see below the gum. Because most emergencies are not just what they look like on the surface, this step is what separates a real fix from a temporary patch. A tooth that hurts might be cracked, infected, or bearing force it should not be. The diagnosis decides the treatment.') },
        { title: 'Stabilize or Repair', body: p('Where possible, we complete the repair the same day. Because we have an on-site lab, temporary crowns and same-day restorations are often finished before you leave. In cases where a proper fix takes more than one visit, such as an implant that needs to be removed and rebuilt, we stabilize the site, protect the tooth, and plan the definitive treatment in the following days.') },
        { title: 'What Happens Next', body: p('Before you leave, you receive clear aftercare instructions and a plan for anything that still needs to be done. Many emergency fixes are the first step of a longer treatment. A saved tooth may still need a root canal. A re-cemented crown may need to be remade. A stabilized implant may need a new restoration. We tell you exactly what is next and when.') },
      ],
    }),
    features({
      name: 'Prevention',
      tagline: 'Prevention',
      title: 'Preventing Dental Emergencies',
      intro: p('Many dental emergencies can be prevented with proper care, protective measures, and regular dental visits at our Hackensack, NJ practice.'),
      items: [
        { title: 'Maintain Excellent Oral Hygiene', text: 'Brush twice daily with fluoride toothpaste, floss every day, and keep up with regular professional cleanings and exams at Hackensack Center. Many emergencies, including abscesses, severe decay, and tooth fractures, come from untreated problems that could have been caught early.' },
        { title: 'Wear Protective Mouthguards', text: 'If you play contact sports, do activities with fall risk, or grind your teeth at night, wear a custom mouthguard. A professionally fitted sports guard or nightguard from Hackensack Center gives much better protection than a store-bought one.' },
        { title: 'Avoid Risky Habits', text: 'Do not use your teeth as tools to open packages, crack nuts, or hold objects. Avoid chewing ice, hard candy, and popcorn kernels. These habits put unnecessary stress on teeth and raise your emergency risk.' },
        { title: 'Address Problems Early', text: 'Do not ignore small dental issues hoping they will go away. A small cavity or minor sensitivity can quickly turn into a painful emergency. Schedule an appointment at the first sign of trouble.' },
      ],
    }),
    faq({
      items: [
        ['Do you offer same-day emergency appointments?', 'We make every effort to see urgent problems as quickly as possible. Request an appointment through the form and describe what happened, and we will arrange the soonest visit we can.'],
        ['My crown fell off. Is that an emergency?', 'It is urgent, even without pain, because the tooth underneath is now exposed and vulnerable. Keep the crown, avoid chewing on that side, and request an appointment soon so we can re-secure or remake it.'],
        ['I think my implant is loose. What should I do?', 'Have it assessed quickly. A loose or painful implant can worsen and cost you bone if left. Acting early often means more of the implant can be saved.'],
        ['What should I do with a knocked-out tooth?', 'Handle it by the crown, not the root, keep it moist in milk or your own saliva, and try to be seen within the hour, which gives it the best chance of being saved.'],
        ['When should I go to the ER instead of a dentist?', 'Go to the ER for trouble breathing or swallowing, swelling spreading toward your eye or neck, or bleeding that will not stop after 15 minutes of firm pressure. For most other dental emergencies, a dentist is the faster route to relief.'],
        ['Can I just glue my crown back on?', 'No. Household and super glues are toxic and can damage the tooth and make a proper repair harder. Keep the crown and let us re-secure it correctly.'],
        ['Do you offer financing for emergency treatment?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits.'],
      ],
    }),
    consult({
      text: 'If dental work has failed or you are in pain, request an urgent appointment and we will get you seen as quickly as we safely can. At Hackensack Center for Dental Implants, your comfort comes first.',
    }),
  ],
});
