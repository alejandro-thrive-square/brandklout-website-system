/**
 * sedation-copy-map.mjs — the copy changes for the 2026-09-28 sedation correction
 * (Asana "Update Website": no IV sedation, no anaesthesiologist; nitrous oxide and
 * oral sedation only). Shared by push-sedation-copy.mjs (the live site) and
 * 04-design/.tmp/retarget-sedation-copy.mjs (the local package), so the two
 * cannot drift.
 */

/* ── SUBSTRING replacements, longest first ─────────────────────────────────
   Applied to every string reachable from a node's props, a post's cells, a
   code asset's content, an OG override and a media alt. Every FROM was copied
   from the live dump (.tmp/sedation-live-dump.tsv), not from the package. */
export const SUB = [
  // ads landing pages (all-on-4 + thank-you, and the ChatGPT clone)
  ['It is done under sedation: nitrous oxide, oral or IV, the last two administered by a medical anesthesiologist. Most patients have no memory of the appointment.',
    'It is done under local anesthetic with sedation, nitrous oxide or oral, whichever suits you, so you stay relaxed throughout.'],
  ['Nitrous oxide, oral or IV sedation. Oral and IV are administered by a medical anesthesiologist, and transport is arranged both ways.',
    'Nitrous oxide or oral sedation, chosen with you at the consultation. After oral sedation, someone needs to drive you both ways.'],
  ['Guided placement from your cone-beam scan, a fixed provisional arch the same day, sedation with a medical anesthesiologist, and a laboratory',
    'Guided placement from your cone-beam scan, a fixed provisional arch the same day, nitrous oxide or oral sedation, and a laboratory'],
  // ads landing pages (dental implants + thank-you)
  ['Nitrous oxide, oral or IV sedation, the last two administered by a medical anesthesiologist.',
    'Nitrous oxide or oral sedation, whichever suits you.'],
  ['with nitrous oxide, oral or IV sedation available, so you should not feel it.',
    'with nitrous oxide or oral sedation available, so you should not feel it.'],
  ['Most patients have no memory of the appointment and are back to normal within a week.',
    'Most patients are back to normal within a week.'],
  // /all-on-4 (page + its FAQ schema)
  ['Nitrous oxide, oral sedation and IV sedation. Oral and IV are administered by a medical anaesthesiologist and need transport arranged both ways.',
    'Nitrous oxide and oral sedation, both given here by the practice’s own team. After oral sedation you need someone to drive you both ways. The practice does not offer IV sedation.'],
  ['Four posts in a single visit, under nitrous, oral or IV sedation.',
    'Four posts in a single visit, under local anaesthetic with nitrous or oral sedation.'],
  // /dental-implants, /dental-implant-faq (pages + schema)
  ['IV-sedation certified, with an anaesthesiologist for oral and IV cases.',
    'Nitrous oxide or oral sedation, whichever suits you.'],
  ['under sedation. Most patients have no memory of the appointment.',
    'under sedation, so you stay relaxed throughout.'],
  ['You feel nothing during it, and most patients have no memory of the appointment.',
    'You feel nothing during it, and you stay relaxed throughout.'],
  ['You will feel no pain, and most patients have no memory of the appointment at all.',
    'You will feel no pain, and you stay relaxed throughout.'],
  ['You feel nothing during it, and most patients have no memory of the appointment at all.', // schema twin
    'You feel nothing during it, and you stay relaxed throughout.'],
  ['You will feel no pain and may sleep lightly through it. Most patients have no memory of the appointment or the procedure.',
    'You will feel no pain, and you stay relaxed throughout.'],
  ['a fixed provisional arch fitted the same day. Most patients have no memory of the appointment.', // all-on-4 ads, hero card
    'a fixed provisional arch fitted the same day. You stay relaxed under sedation throughout.'],
  // home
  ['IV sedation certified, so a full-arch case is done in one sitting.',
    'Nitrous oxide or oral sedation in the chair, so a full-arch case is done in one sitting.'],
  ['Nitrous, oral and IV sedation, with a medical anaesthesiologist for longer surgical cases.',
    'Nitrous oxide or oral sedation, so a long surgical case passes calmly.'],
  ['A patient under IV sedation during a long surgical case',
    'A patient resting in the chair under sedation during a long surgical case'],
  // cross-links into /sedation-dentistry
  ['Nitrous, oral and IV, and why it is a credential here.',
    'Nitrous oxide and oral sedation, and how each one feels.'],
  ['Nitrous, oral and IV, and who is credentialed to give them.',
    'Nitrous oxide and oral sedation, and how to choose between them.'],
  // /oral-surgery
  ['Nitrous, oral or IV sedation, whichever suits you',
    'Nitrous oxide or oral sedation, whichever suits you'],
  ['IV sedation has to be arranged. It is worth asking for at the consultation, not on the day.',
    'Oral sedation has to be planned ahead. It is worth asking for at the consultation, not on the day.'],
  // /sedation-dentistry
  ['Sedation is what turns hours of full-arch surgery into something you do not remember,',
    'Sedation is what turns hours of full-arch surgery into something you can sit through calmly,'],
  ['Taken before the appointment, under the supervision of a medical anaesthesiologist. Transport both ways needs arranging in advance.',
    'A prescribed sedative taken before the appointment. You stay awake, deeply relaxed. Transport both ways needs arranging in advance.'],
  ['For severe dental anxiety and long surgical cases. Most patients have no memory of the appointment at all. Transport both ways is required.',
    'Used on every procedure, with or without sedation. It numbs the area being treated; sedation is what keeps you calm.'],
  /* One pair, not two: a TO must never contain its own FROM, or every re-run
     appends the denial again (the first draft did exactly that). */
  ['Not in the general-anaesthetic sense. Under IV sedation most patients drift and have no memory of the procedure afterwards; you remain responsive throughout. Nitrous is lighter still: you stay awake and simply stop minding.',
    'No. Nitrous oxide and oral sedation both leave you awake and responsive. Oral sedation is the deeper of the two: you feel drowsy and relaxed, and some patients remember little of the appointment afterwards. Nitrous is lighter still: you stay awake and simply stop minding. The practice does not offer IV sedation or general anaesthesia.'],
  ['After oral or IV sedation, no:', 'After oral sedation, no:'],
  ['Oral and IV sedation are administered by a medical anaesthesiologist, depending on the extent of treatment and your personal health.',
    'Dr. Nahlah’s own clinical team, here in the office. Which of the two suits you depends on the extent of treatment and your personal health, and is settled at the consultation.'],
  ['Oral and IV sedation are administered by a medical anaesthesiologist.',
    'Both are given here by the practice’s own team. The practice does not offer IV sedation or general anaesthesia.'],
  ['Three levels, chosen to the case and to you.', 'Two kinds of sedation, chosen to the case and to you.'],
  ['Sedation is a credential, not a service line.', 'Kept to what is safe in a dental chair.'],
  // /sedation-dentistry head (seo-head.js, OG store) and schema
  ['Sedation Dentistry | Nitrous, Oral & IV | McLean, VA', 'Sedation Dentistry | Nitrous & Oral Sedation | McLean, VA'],
  ['Nitrous, oral and IV sedation for implant and full-arch surgery, with hospital privileges at a Level 1 trauma centre and a medical anaesthesiologist.',
    'Nitrous oxide and oral sedation for implant and full-arch surgery, with hospital privileges at a Level 1 trauma centre.'],
  ['Nitrous, oral and IV sedation for implant and full-arch surgery.',
    'Nitrous oxide and oral sedation for implant and full-arch surgery.'],
  ['Hours of full-arch surgery, turned into something you do not remember.',
    'Hours of full-arch surgery, sat through calmly.'],
  // blog posts migrated from the old site
  ['The patient comes in that morning, Anesthesiologist put them to sleep then Dr. Nahlah',
    'The patient comes in that morning, is made comfortable with local anesthetic and sedation, then Dr. Nahlah'],
  ['These sedatives can range from mild inducers to help patients relax, to more potent substances that can induce deep sleep.',
    'Here that means nitrous oxide, which relaxes patients within minutes, or an oral sedative taken before the appointment.'],
].sort((a, b) => b[0].length - a[0].length)
for (const [from, to] of SUB) if (to.includes(from)) throw new Error(`not idempotent: "${from.slice(0, 60)}"`)

/* ── WHOLE-STRING replacements ─────────────────────────────────────────────
   Short labels that would be unsafe as substrings ("IV sedation" is inside a
   dozen longer sentences). Matched only when they are the entire text. */
export const WHOLE = new Map([
  ['Nitrous, oral or IV', 'Nitrous or oral'], // /oral-surgery hero stat
  ['Nitrous, oral and IV sedation', 'Nitrous oxide and oral sedation'], // /our-facility caption
  ['The three sedation options', 'The two sedation options'], // /oral-surgery link
  ['The three options', 'See the options'], // /sedation-dentistry hero button (a `label` prop)
  // /sedation-dentistry hero stats: [figure, label] x3
  ['IV certified', '2 options'],
  ['Sedation certificate held', 'Nitrous oxide and oral'],
  ['Anaesthesiologist', 'BLS & ACLS'],
  ['Present for oral and IV cases', 'Provider certified'],
  ['3 levels', 'Awake'],
  ['Nitrous, oral and IV', 'Relaxed and responsive throughout'],
  // /sedation-dentistry third option card: IV sedation -> local anaesthetic
  ['Strongest', 'Always'],
  ['IV sedation', 'Local anaesthetic'],
])
/* Whole-string swaps are scoped to the pages they were read on, so a stray
   "IV sedation" label anywhere else fails the audit instead of being renamed. */
export const WHOLE_PAGES = new Set(['oral-surgery', 'our-facility', 'sedation-dentistry'])
