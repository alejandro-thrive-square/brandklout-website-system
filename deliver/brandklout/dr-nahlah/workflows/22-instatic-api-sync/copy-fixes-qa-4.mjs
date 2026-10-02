/**
 * copy-fixes-qa-4.mjs — the three C04 items audit-qa-fixes.cjs still found after
 * copy-fixes-qa-2: two descriptions that live only in seo-head.js (their OG
 * overrides had no description, so the static head fell back to the site default)
 * and the /thank-you title.
 */
const DC_OLD = 'Ten everyday dental complaints, what each usually turns out to be, and what is done about it: loose dentures, bleeding gums, cracked teeth, gummy smile, toothache and more.'
const DC_NEW = 'Ten everyday dental complaints, what each usually turns out to be and what is done about it: loose dentures, bleeding gums, cracked teeth, toothache and more.'
const ISD_OLD = 'Traditional dentures restore about 20% of natural function, implant-supported dentures about 60%, and a fixed full arch over 98%. All three compared honestly, drawbacks included.'
const ISD_NEW = 'Traditional dentures restore about 20% of natural function, implant dentures about 60% and a fixed full arch over 98%. All three compared, drawbacks included.'
export const RULES = [
  { from: DC_OLD, to: DC_NEW, note: `description /dental-conditions (${DC_OLD.length} -> ${DC_NEW.length})` },
  { from: ISD_OLD, to: ISD_NEW, note: `description /implant-supported-dentures (${ISD_OLD.length} -> ${ISD_NEW.length})` },
  { from: 'Thank You | Dr. Nahlah Implants & Prosthodontics | McLean, VA', to: 'Thank You | Dr. Nahlah Implants & Prosthodontics', note: 'title /thank-you (61 -> 48)' },
]
export const OG_ADD = {
  'dental-conditions': { description: DC_NEW },
  'implant-supported-dentures': { description: ISD_NEW },
}
if (DC_NEW.length > 160 || ISD_NEW.length > 160) throw new Error('description over 160')
