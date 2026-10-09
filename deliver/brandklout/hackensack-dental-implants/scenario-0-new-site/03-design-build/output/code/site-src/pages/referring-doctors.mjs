/* /referring-doctors. Copy: the live page (scrape/pages/referring-doctors.md; the form and the PDF link
   read from mirror/raw-html/referring-doctors.html), placed, not rewritten.
   Placed: "Two Easy Ways to Refer" is the path, its two steps the live page's "Step 1: Fill Out Patient
   Form" and "Step 2"; Step 2 ends on the live page's "Dental Referral Form PDF" link, served from
   https://cdn.prod.website-files.com/6a1f4de5739bab24f074660f/6a71314bf88c41e60d89533c_Hackensack%20Center%20Referral%20Form.pdf (the live file: "Hackensack Center Referral Form.pdf" on the Webflow CDN);
   the hero's first button is the same PDF under the same label (the live hero had no button).
   2026-10-09 (later): Step 1's form is placed in the closing chapter (consult with REFERRAL_FORM, embed
   kind ghl-referral); "Refer a Patient" is the live page's title tag. The PDF links to the live file on
   the Webflow CDN until Instatic can serve a PDF (upload-media.mjs carries no .pdf type). Was: NOT PLACED: Step 1's form, the live page's GoHighLevel form "Form 2" (widget/form/
   SHs2QaddefZy9lixAea9, inline, data-height 757). ui.mjs has no component for it (consult() carries only
   the consultation survey), so Step 1's sentence has no form under it until an embed for that form is
   added. The page ends with the consultation survey (README), which is the patient's form, not the
   referral form.
   A short page: the live page carries about 100 words, so it has one scroll-driven chapter (path).
   Left out: the form's own header ("Dr. Alan Meskin, DMD", "163 Main Street, Suite A Hackensack, NJ
   07601", the logo), which belongs to the form; "Reimagine your dental experience" and the footer's
   address, hours and languages blocks.
   Fact change: "Partner with Saline Oral Facial & Dental Implant Surgery" in the hero names another
   practice (the live page came from its template) and is "Partner with Hackensack Center for Dental
   Implants". Not carried, and wrong on the live page: "DMD" (Dr. Meskin is a DDS) and "Suite A" (Suite
   A1). No phone number or review count needed changing. */
import { page, hero, path, consult, p, CALL } from '../lib/ui.mjs';
import { REFERRAL_FORM } from '../lib/site.mjs';

const crumbs = [['/about', 'About'], ['/referring-doctors', 'Referring Doctors']];

export default page({
  path: '/referring-doctors',
  crumbs,
  seo: {
    title: 'Refer a Patient in Hackensack, NJ | Hackensack Center for Dental Implants',
    description: 'Refer your patients to Hackensack Center for Dental Implants in Hackensack, NJ. Dr. Alan Meskin handles complex implant and full-mouth cases and returns patients to your care.',
    image: 'referring-doctors-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'For Dentists',
      title: 'Referring Doctors',
      lead: 'Join us in providing exceptional care for your patients. Partner with Hackensack Center for Dental Implants for an efficient and compassionate approach to oral surgery. Your trust is valued here, and your patients are always treated like our own.',
      image: { src: 'referring-doctors-hero.webp', w: 632, h: 632, alt: 'Dr. Alan Meskin and a colleague at the practice' },
      actions: [{ label: 'Dental Referral Form PDF', href: 'https://cdn.prod.website-files.com/6a1f4de5739bab24f074660f/6a71314bf88c41e60d89533c_Hackensack%20Center%20Referral%20Form.pdf' }, CALL],
    }),
    path({
      name: 'How To Refer',
      tagline: 'Referrals',
      title: 'Two Easy Ways to Refer',
      steps: [
        { title: 'Step 1: Fill Out Patient Form', body: p('Please complete the patient information section so our office may contact the patient to schedule an appointment.') },
        { title: 'Step 2', body: p('Click the link below to print and complete the referral form. Give the completed form to the patient to bring to their appointment.', '<a href="https://cdn.prod.website-files.com/6a1f4de5739bab24f074660f/6a71314bf88c41e60d89533c_Hackensack%20Center%20Referral%20Form.pdf" target="_blank" rel="noopener">Dental Referral Form PDF</a>') },
      ],
    }),
    consult({
      name: 'The Referral',
      tagline: 'Step 1: Fill Out Patient Form',
      title: 'Refer a Patient',
      text: 'Please complete the patient information section so our office may contact the patient to schedule an appointment.',
      reasons: false,
      cardTitle: 'Patient information',
      snippet: REFERRAL_FORM,
      embedKey: 'ghl-referral',
    }),
  ],
});
