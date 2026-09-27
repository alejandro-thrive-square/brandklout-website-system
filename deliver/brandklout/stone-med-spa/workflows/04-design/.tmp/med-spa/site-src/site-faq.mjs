// THE GENERAL QUESTIONS. BugHerd #26, 2026-09-22, on the bottom of /team:
// "Missing a FAQ section at the bottom", with the questions below, verbatim and
// in the client's order ("How much do medical spa treatments cost?" was listed
// three times; it appears once). The answers are ours and follow the rest of
// the site: providers, not Dr. Stone; no prices except the client's own $149
// membership; downtime figures from treatments-data.mjs.
//
// Rendered by build-site.mjs wherever a page body carries {{SITE_FAQ}} — the
// home page and /team — and mirrored into the home page's FAQPage schema only,
// so one URL owns the rich result.
export const SITE_FAQ = [
  [
    "What is the difference between a day spa and a medical spa?",
    "A day spa is about relaxation, with treatments like massages and basic facials. A medical spa offers treatments that change the skin itself, such as injectables, microneedling and chemical peels, and they're provided by licensed medical providers after a medical assessment.",
  ],
  [
    "Who will be performing my treatments?",
    "Brooke, our nurse practitioner injector, does every injection. Abby, our medical aesthetician and senior laser technician, looks after facials and skin treatments. You'll know who is treating you before your appointment.",
  ],
  [
    "Are medical spa treatments safe?",
    "The treatments we offer are well established and, in trained hands, carry a low risk of side effects. We check your medical history first, go through the risks of your treatment at your consultation, and tell you if something isn't right for you.",
  ],
  [
    "What should I expect during my initial consultation?",
    "We'll ask what you'd like to change, go through your medical history and look at your skin. You'll leave with a written plan and a quote. Your first consultation can be in person or by video, and whether you start that day is up to you.",
  ],
  [
    "Do treatments like Botox or filler hurt?",
    "Most people describe a quick pinch. The needles are very fine, most fillers contain a local anesthetic, and we can apply numbing cream first if you'd like.",
  ],
  [
    "How long do the results of Botox and dermal fillers last?",
    "Botox usually lasts three to four months. Dermal fillers last six to eighteen months, depending on the product and where it's placed.",
  ],
  [
    "Is there any downtime after a procedure?",
    "Often none. You can go straight back to your day after Botox, a HydraFacial or dermaplaning. Fillers can leave some swelling or bruising for a few days, and Morpheus8 and deeper peels need a few days more. Each treatment's page lists its downtime.",
  ],
  [
    "How much do medical spa treatments cost?",
    "It depends on the treatment and how much you need, so we quote at your consultation, before anything is done. Our membership is $149 a month and includes a monthly facial and 10% off treatments, and financing is available through Cherry and CareCredit.",
  ],
];
