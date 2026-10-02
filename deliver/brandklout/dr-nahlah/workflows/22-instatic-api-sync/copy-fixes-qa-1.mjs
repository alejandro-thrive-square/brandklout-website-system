/**
 * copy-fixes-qa-1.mjs — QA 2026-09-28, the copy items that need no client decision:
 * US spelling, one form per name, one phone format, and five page-copy errors.
 * Applied by push-copy-fixes.mjs to every store. Every FROM was copied from
 * dump-copy-stores.mjs output (.tmp/copy-dump.tsv, 2026-10-02), not from the report.
 *
 * NOT here, waiting on CS (handoff decisions): the practice name "&" vs "and",
 * "Dental Group of Tysons" in 14 posts, the legal pages' entity/state/SMS scope,
 * the McLean phone, "Six people sat down on camera".
 */
export const RULES = [
  // ── US spelling (QA AI-02 + the hand check). Sentence case and lower case. ──
  { from: 'Practising', to: 'Practicing', word: true, note: 'US spelling: Practising' },
  { from: 'practising', to: 'practicing', word: true, note: 'US spelling: practising' },
  { from: 'practised', to: 'practiced', word: true, note: 'US spelling: practised' },
  { from: 'anaesthetic', to: 'anesthetic', word: true, note: 'US spelling: anaesthetic' },
  { from: 'anaesthesia', to: 'anesthesia', word: true, note: 'US spelling: anaesthesia' },
  { from: /(?<![\w/-])Colour(?![\w])/g, to: 'Color', note: 'US spelling: Colour (Colour-matched)' },
  { from: 'colour', to: 'color', word: true, note: 'US spelling: colour' },
  { from: 'colouring', to: 'coloring', word: true, note: 'US spelling: colouring' },
  { from: 'Discoloured', to: 'Discolored', word: true, note: 'US spelling: Discoloured' },
  { from: 'discoloured', to: 'discolored', word: true, note: 'US spelling: discoloured' },
  { from: 'discolouration', to: 'discoloration', word: true, note: 'US spelling: discolouration' },
  { from: 'millimetre', to: 'millimeter', word: true, note: 'US spelling: millimetre' },
  { from: 'moulded', to: 'molded', word: true, note: 'US spelling: moulded' },
  { from: 'programme', to: 'program', word: true, note: 'US spelling: programme' },

  // ── one form per name (QA C12) ──
  { from: 'Jones Branch Dr.', to: 'Jones Branch Drive', note: 'street: Jones Branch Dr. -> Drive' },
  { from: /(?<![\w-])Duke St(?!reet|\w)/g, to: 'Duke Street', note: 'street: Duke St -> Street' },
  { from: 'Dr. Nahlah, Esam', to: 'Dr. Esam Nahlah', note: 'doctor: Nahlah, Esam' },
  { from: 'Dr. Nahlah Esam', to: 'Dr. Esam Nahlah', note: 'doctor: Nahlah Esam' },
  { from: "Dr Nahlahs' office", to: 'Dr. Nahlah’s office', note: "possessive: Dr Nahlahs'" },
  // All-on-4: the site's form. Longest variants first; slugs (all-on-4-…, all-on-four-…) are excluded by `word`.
  { from: 'All-On-4®', to: 'All-on-4', word: true, note: 'brand: All-On-4®' },
  { from: 'All-on-4®', to: 'All-on-4', word: true, note: 'brand: All-on-4®' },
  { from: 'All-On-4', to: 'All-on-4', word: true, note: 'brand: All-On-4' },
  { from: 'all-On-4', to: 'All-on-4', word: true, note: 'brand: all-On-4' },
  { from: 'All On 4', to: 'All-on-4', word: true, note: 'brand: All On 4', optional: true },
  { from: 'All-On-Four', to: 'All-on-4', word: true, note: 'brand: All-On-Four' },
  { from: 'All-on-Four', to: 'All-on-4', word: true, note: 'brand: All-on-Four' },
  { from: 'All On Four', to: 'All-on-4', word: true, note: 'brand: All On Four' },
  { from: 'All on Four', to: 'All-on-4', word: true, note: 'brand: All on Four' },
  { from: 'All on four', to: 'All-on-4', word: true, note: 'brand: All on four' },
  { from: 'all on four', to: 'All-on-4', word: true, note: 'brand: all on four' },

  // ── financing partners' numbers in the site's format (QA C11) ──
  { from: '1-800-677-0718', to: '(800) 677-0718', word: true, note: 'phone format: 1-800-677-0718' },
  { from: '844-272-7587', to: '(844) 272-7587', word: true, note: 'phone format: 844-272-7587' },
  { from: '888-596-3157', to: '(888) 596-3157', word: true, note: 'phone format: 888-596-3157' },

  // ── page copy (QA AI-02, confirmed live) ──
  { from: 'The two people always ask.', to: 'The questions people always ask.', note: '/veneers FAQ heading: four questions follow' },
  { from: 'which makes a remake days rather than a month', to: 'which makes a remake a matter of days rather than a month', note: '/doctor-referral missing verb' },
  // the sentence is three nodes: "Strict sterilization protocols, and a " <strong>custom level of sedation</strong> ", which matters …"
  { from: 'Strict sterilization protocols, and a ', to: 'Sterilization protocols are strict, and you get a ', note: '/emergency-dentistry sentence fragment', only: (s, w) => w === 'emergency-dentistry' || s === 'asset' },
  { from: 'Get in contact with our doctors, Dr. Esam Nahlah, and our exceptional team', to: 'Get in contact with Dr. Esam Nahlah and our exceptional team', note: 'posts: "our doctors," one doctor named (a)' },
  { from: 'Get in contact with our doctors, Dr. Esam Nahlah and our exceptional team', to: 'Get in contact with Dr. Esam Nahlah and our exceptional team', note: 'posts: "our doctors," one doctor named (b)' },
  { from: 'Get in contact with our doctors, Dr. Nahlah and our exceptional team', to: 'Get in contact with Dr. Nahlah and our exceptional team', note: 'posts: "our doctors," one doctor named (c)', optional: true },
]
