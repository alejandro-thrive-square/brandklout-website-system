/**
 * The flagship treatment collection. One entry becomes one service page.
 *
 * WHY TWELVE AND NOT THIRTY. The fee tables on treatments.html list about
 * thirty line items. Twelve of them are procedures people search for by name
 * and arrive at cold; the rest (anaesthesia by the quarter hour, a second
 * lesion, a package of three) are line items on a bill, not destinations. A
 * page per line item would put a hundred words of filler under a heading and
 * ask both patients and Google to treat it as an answer. Everything not listed
 * here stays a row on the hub, which keeps its full fee table.
 *
 * > [!IMPORTANT]
 * > **CLINICAL REVIEW IS OUTSTANDING ON EVERY ENTRY.** The procedure
 * > descriptions are standard, textbook accounts of what each operation is and
 * > who it generally suits. They are not Dr. Stone's protocol. Every `facts`
 * > row (anaesthesia, time off work, when results settle) and every recovery
 * > figure in `steps` is a conventional range and must be confirmed or
 * > corrected by Dr. Stone before launch. `reviewNote` on each entry says what
 * > specifically needs checking. Fees are the practice's own, carried across
 * > from the hub's tables, and were not invented here.
 *
 * > [!IMPORTANT]
 * > No em dashes anywhere in this file (SYSTEM_RULES.md "Copy Standards").
 * > Ranges use `&ndash;`. `node check-copy.mjs` gates the built output.
 *
 * Field notes:
 *   intro        leading paragraphs, before the first subheading
 *   sections     { heading, body: [ paragraph | [bullet, bullet] ] }
 *   facts        the sticky panel. Fee first, then whatever the patient asks.
 *   bandImage    quiet band between the clinical detail and the day-by-day
 *   journeyImage sits above the three steps
 *   related      three cards. href points at a sibling page where one exists,
 *                otherwise at the hub anchor.
 */

export const CATEGORIES = {
  face: { label: 'Face', anchor: 'face', short: 'face' },
  neck: { label: 'Neck &amp; Jawline', anchor: 'neck', short: 'neck' },
  skin: { label: 'Skin', anchor: 'skin', short: 'skin' },
  nonsurgical: { label: 'Non-Surgical', anchor: 'non-surgical', short: 'non-surgical' },
}

/* Shared closing line for the fact panel where financing is relevant. */
const FINANCE =
  'Financing runs through <a class="text-style-link" href="https://apply.sunbit.com/StoneSurgicalArts" rel="noopener">Sunbit</a>, and membership credit can be applied to a surgical fee. See <a class="text-style-link" href="memberships.html">Memberships</a>.'

const CONSULT_FAQ = {
  q: 'What happens at the consultation?',
  a: 'You and Dr. Stone go through your concerns and your goals, she takes a medical history and assesses your general health, and photographs and measurements are taken so the plan is drawn against your own anatomy. You leave knowing whether this is the right procedure for you, and if it is not, which one is.',
}

export const TREATMENTS = [
  /* ======================================================================
     FACE
     ====================================================================== */
  {
    slug: 'face-and-neck-lift',
    name: 'Face &amp; Neck Lift',
    category: 'face',
    cardPrice: '$18,000',
    reviewNote:
      'Confirm operating time, whether Dr. Stone uses deep plane or SMAS technique, drain policy, and the two-week return-to-work figure.',
    heroSub:
      'The full procedure, face and neck addressed together, because the two age as one structure and lifting only half of it shows.',
    intro: [
      'A face lift is not about pulling skin tight. Skin is the last layer, and treating it as the problem is how a face ends up looking operated on rather than rested. The work happens underneath, in the layer of muscle and fascia that has descended, and the skin is redraped over the result rather than dragged into position.',
      'Face and neck are quoted and performed together here. Lifting the face and leaving the neck produces a mismatch that most patients notice within a year, and the neck is the harder half of the operation, which is the half this practice is known for.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'This is the right operation when there is genuine descent and genuine skin excess, rather than early laxity that a suture suspension could still hold. It tends to be patients in their fifties and sixties, and younger patients who have lost a large amount of weight.',
          [
            'Jowling along the jaw, where the jawline has lost its edge',
            'Deep folds running from the nose to the corners of the mouth',
            'Loose skin in the neck that does not retract when you lift your chin',
            'A previous lift that has relaxed and needs revising',
          ],
          'If your skin still has good tone and the problem is muscle rather than excess, Dr. Stone will tell you that and point you at <a class="text-style-link" href="myellevate-neck-lift.html">MyEllevate&reg;</a> instead. Being talked out of the bigger operation is a normal outcome of a consultation here.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'The lift restores position. It does not change the quality of the skin on top of it, or reopen an eye that has hooded, so two things are commonly planned alongside it:',
          [
            '<a class="text-style-link" href="blepharoplasty.html">Blepharoplasty</a>, because a lifted face with tired eyes reads as tired.',
            '<a class="text-style-link" href="laser-resurfacing.html">Laser resurfacing</a>, for the texture and pigment a lift cannot reach. Often staged rather than done the same day.',
          ],
          'Both are decided at the consultation, on your anatomy, and neither is sold as a package beforehand.',
        ],
      },
      {
        heading: 'Why it matters who operates',
        body: [
          'The facial nerve branches run through the plane this operation works in. Knowing where they are on a diagram is not the same as knowing where they are in a particular face, at a particular depth, under tension. Dr. Stone trained in oral and maxillofacial surgery across three Level 1 trauma centres, rebuilding this anatomy after it had been broken, which is the least forgiving way to learn it.',
          'She plans and performs every case herself. The surgeon who assesses you is the surgeon who operates on you and the surgeon you see at every follow-up.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$18,000' },
      { label: 'Anaesthesia', value: 'General' },
      { label: 'In theatre', value: 'Four to six hours' },
      { label: 'Back to work', value: 'Two to three weeks' },
      { label: 'Results settle', value: 'Six to twelve months' },
    ],
    bandImage: {
      file: 'gen-or-light.webp',
      alt: 'A surgical light angled over a draped operating table in a quiet, warm-toned theatre',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-room.webp',
      alt: 'A recovery room corner with an armchair, a folded throw and daylight through a sheer curtain',
    },
    steps: [
      {
        title: 'In theatre',
        text: 'Four to six hours under general anaesthetic, depending on what is being combined. You are monitored afterwards and go home the same day with a responsible adult, or stay overnight if that is the safer plan for you.',
      },
      {
        title: 'The first fortnight',
        text: 'Swelling and bruising peak around day three and fall away quickly after that. Sutures come out in stages across the first two weeks. Most people are presentable to people who are not looking for it at around two weeks.',
      },
      {
        title: 'Settling',
        text: 'The result keeps refining for six to twelve months as swelling resolves and scars mature. Follow-ups are with Dr. Stone, not with a nurse you have not met.',
      },
    ],
    faqs: [
      {
        q: 'Where do the scars go, and will people see them?',
        a: 'They follow the natural creases in front of the ear, around the earlobe and back into the hairline behind it. They are placed where the anatomy hides them and they mature over months from pink to pale. Scar care starts as soon as the wounds are closed and is part of your plan, not an afterthought.',
      },
      {
        q: 'How long will it last?',
        a: 'A well-executed lift resets the clock rather than stopping it. Most patients look substantially better than their unoperated baseline for a decade or more, and you continue to age normally from the new starting point. Skin quality, weight stability, sun exposure and genetics all move that figure, and Dr. Stone will give you a realistic number for your face rather than an average.',
      },
      {
        q: 'Will I look like a different person?',
        a: 'No, and if a result looks like a different person then something has gone wrong with the planning. The aim is that people register that you look well rather than that you look altered. That is a matter of how much tension is placed on which layer, and it is decided in the operating theatre rather than promised beforehand.',
      },
      {
        q: 'Can I have just the neck?',
        a: 'Yes. The <a class="text-style-link" href="neck-lift.html">neck lift</a> is quoted separately at $11,000, and for the right anatomy <a class="text-style-link" href="myellevate-neck-lift.html">MyEllevate&reg;</a> at $6,000 achieves a great deal with no external incision. Which of the three you need is the substance of the consultation.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$18,000 for the face and neck together. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Neck lift',
        href: 'neck-lift.html',
        text: 'The neck on its own, with muscle repair and skin removal, where the face has aged more slowly than the jawline.',
        price: '$11,000',
      },
      {
        name: 'Brow &amp; forehead lift',
        href: 'brow-lift.html',
        text: 'Opens the upper third. Frequently the difference between a rested face and a rested lower face.',
        price: '$5,000&ndash;7,000',
      },
      {
        name: 'Blepharoplasty',
        href: 'blepharoplasty.html',
        text: 'Upper or lower eyelid. The eyes are what people look at, and a lift does not reach them.',
        price: '$3,400',
      },
    ],
  },

  {
    slug: 'brow-lift',
    name: 'Brow &amp; Forehead Lift',
    category: 'face',
    cardPrice: '$5,000&ndash;7,000',
    reviewNote:
      'Confirm which technique is offered (endoscopic, temporal, direct) as that changes scar position and the copy above, plus the ten-day return-to-work figure.',
    heroSub:
      'The upper third of the face, opened back up. Often the reason a face reads as tired when nothing else about it has changed.',
    intro: [
      'The forehead and brows descend before almost anything else, and they do it slowly enough that most people never identify them as the problem. What they notice is that they look cross, or tired, or that eye makeup has stopped sitting where it used to.',
      'A brow lift repositions the brow and releases the muscles that pull it down. It is a smaller operation than most people expect and it changes expression more than any other procedure on this list.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The test is simple and you can do it in front of a mirror: lift the skin at the tail of the brow with a fingertip. If that single millimetre opens the eye and softens the expression, this is your operation rather than an eyelid one.',
          [
            'Brows that sit low or have flattened out at the tail',
            'A heavy, hooded look through the upper lid that lifting the brow relieves',
            'Deep horizontal lines that no longer soften when the face is at rest',
            'A permanently stern or tired expression that does not match your mood',
          ],
          'Where the heaviness is skin on the eyelid itself rather than a descended brow, <a class="text-style-link" href="blepharoplasty.html">blepharoplasty</a> is the correct answer and a brow lift would over-open the eye. Getting that distinction right is most of the consultation.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'The upper third is rarely operated on alone:',
          [
            '<a class="text-style-link" href="blepharoplasty.html">Upper blepharoplasty</a>, where both the brow and the lid skin are contributing. Planned together so neither is overdone.',
            'Neuromodulators afterwards, to keep the muscles that pulled the brow down from doing it again. See <a class="text-style-link" href="injectables.html">injectables</a>.',
          ],
          'The order matters. The brow is lifted first, then the lid is assessed against its new position, because doing it the other way round removes skin the brow was going to give back.',
        ],
      },
      {
        heading: 'Why proportion decides it',
        body: [
          'There is a height at which a brow looks alert and a height at which it looks startled, and the distance between the two is a few millimetres. It is also different for every face, and different between men and women, where a flatter, lower brow is usually the goal rather than an arched one.',
          'This is why the planning is drawn on your own measurements rather than applied from a template. A brow lift that is technically clean and two millimetres too high is a bad result.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$5,000&ndash;7,000' },
      { label: 'Anaesthesia', value: 'Sedation or general' },
      { label: 'In theatre', value: 'One to two hours' },
      { label: 'Back to work', value: 'Around ten days' },
      { label: 'Results settle', value: 'Three to six months' },
    ],
    bandImage: {
      file: 'gen-planning.webp',
      alt: 'A carved stone fragment on a plinth in a quiet, daylit room',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-daylight.webp',
      alt: 'A quiet daylit recovery corner with a linen chair, a side table and a glass of water',
    },
    steps: [
      {
        title: 'In theatre',
        text: 'One to two hours. Sedation is enough for most cases; general anaesthetic where it is combined with a larger procedure. You go home the same day with someone to drive you.',
      },
      {
        title: 'The first week',
        text: 'Swelling settles downward into the eyelids for the first few days, which is expected and passes. Numbness across the scalp is normal early on. Most people are back at a desk at around ten days.',
      },
      {
        title: 'Settling',
        text: 'The brow drops slightly from its immediate post-operative position over the first weeks, which is planned for. The final height is what you see at three to six months.',
      },
    ],
    faqs: [
      {
        q: 'Will I look permanently surprised?',
        a: 'That is the classic bad brow lift and it comes from over-elevating the medial brow, the end nearest the nose. The modern approach lifts the tail rather than the middle and releases the muscles that depress the brow, which opens the eye without raising the whole forehead. It is a planning decision, made against your measurements, before anything is touched.',
      },
      {
        q: 'Where are the incisions?',
        a: 'That depends on the technique chosen for your anatomy and hairline, and it is settled at the consultation rather than assumed here. In every version they sit within or behind the hairline where the anatomy conceals them.',
      },
      {
        q: 'Could I just use Botox instead?',
        a: 'For a small amount of tail elevation, sometimes yes, and it is a reasonable place to start if you are not ready for surgery. A neuromodulator relaxes the muscles pulling the brow down and can buy a millimetre or two. It cannot reposition a brow that has genuinely descended, and it needs repeating three or four times a year.',
      },
      {
        q: 'Will it help my hooded eyelids?',
        a: 'Often substantially, because a good deal of what people call hooding is brow sitting on lid. Whether you also need eyelid skin removed is judged with the brow held in its intended new position, not with it where it is today.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$5,000 to $7,000 depending on technique and whether it is combined. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Blepharoplasty',
        href: 'blepharoplasty.html',
        text: 'Upper or lower eyelid. Planned together with the brow, because each changes what the other needs.',
        price: '$3,400',
      },
      {
        name: 'Face &amp; neck lift',
        href: 'face-and-neck-lift.html',
        text: 'The lower two thirds. A brow lift addresses the third that a face lift does not reach.',
        price: '$18,000',
      },
      {
        name: 'Injectables',
        href: 'injectables.html',
        text: 'Neuromodulators to hold the result, or to test the idea before committing to surgery.',
        price: 'From $12 per unit',
      },
    ],
  },

  {
    slug: 'blepharoplasty',
    name: 'Blepharoplasty',
    category: 'face',
    cardPrice: '$3,400',
    reviewNote:
      'Confirm whether upper and lower are quoted together at $3,400 or separately, whether fat repositioning is standard on lowers, and the seven-day suture removal timing.',
    heroSub:
      'Eyelid surgery, upper or lower. The smallest operation on this list and, for most faces, the one that changes the most.',
    intro: [
      'People look at eyes. It is the first thing a face is read by, and it is where fatigue registers whether or not you are tired. Eyelid surgery removes or repositions the tissue that has made the eye look smaller and heavier than it is.',
      'It is a short operation with a quick recovery and a very high satisfaction rate, which is why it is often the first procedure someone has and frequently the only one they need.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'Upper and lower lids are different problems and they are assessed separately, though both are commonly done in one sitting.',
          [
            '<strong>Upper lid:</strong> skin that folds over the crease, sits on the lashes, or in marked cases begins to interfere with the outer field of vision',
            '<strong>Lower lid:</strong> bags and puffiness that are present from the moment you wake, rather than after a bad night',
            'Hollowing beneath the eye that makes the cheek and lid read as two separate structures',
            'Makeup that will no longer sit on the upper lid because there is nowhere flat for it to go',
          ],
          'Where the real problem is a descended brow resting on the lid, the answer is a <a class="text-style-link" href="brow-lift.html">brow lift</a>, and removing lid skin instead would be the wrong operation done well. Dr. Stone will hold your brow in position at the consultation and show you the difference.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'Eyelid surgery addresses structure. It does not change the quality of the skin around it:',
          [
            '<a class="text-style-link" href="brow-lift.html">Brow lift</a>, where both are contributing to the same heaviness.',
            '<a class="text-style-link" href="laser-resurfacing.html">Laser resurfacing</a> of the lid skin, for the fine crepe that surgery cannot tighten.',
            '<a class="text-style-link" href="face-and-neck-lift.html">Face and neck lift</a>, where the eyes are being brought in line with a larger plan.',
          ],
        ],
      },
      {
        heading: 'The part that is easy to get wrong',
        body: [
          'Lower lids punish over-resection. Take too much skin or too much fat and the lid pulls away from the eye, which is difficult to correct and immediately obvious. Modern technique is therefore conservative and increasingly about repositioning fat into the hollow beneath rather than removing it.',
          'Dr. Stone trained in oral and maxillofacial surgery across three Level 1 trauma centres, which is where the orbit and the tissues around it are reconstructed after injury. It is a demanding way to learn an anatomy that leaves very little room for error.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$3,400' },
      { label: 'Quoted', value: 'Upper and lower together' },
      { label: 'Anaesthesia', value: 'Local with sedation' },
      { label: 'Back to work', value: 'Seven to ten days' },
      { label: 'Results settle', value: 'Two to three months' },
    ],
    bandImage: {
      file: 'gen-suture-tray.webp',
      alt: 'A needle holder and fine suture laid out on folded linen',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-daylight.webp',
      alt: 'A quiet daylit recovery corner with a linen chair, a side table and a glass of water',
    },
    steps: [
      {
        title: 'In the chair',
        text: 'One to two hours under local anaesthetic with sedation, depending on whether both upper and lower lids are being done. You go home the same day with someone to drive you.',
      },
      {
        title: 'The first week',
        text: 'Bruising is the main event and it is worst around days two and three. Cold compresses and sleeping propped up shorten it considerably. Fine sutures come out at around a week.',
      },
      {
        title: 'Settling',
        text: 'Most people are comfortable in company at ten days and in photographs at three weeks. The last of the swelling in the lid resolves over two to three months.',
      },
    ],
    faqs: [
      {
        q: 'Will the scars show?',
        a: 'On the upper lid the incision sits in the natural crease and disappears into it once healed. On the lower lid it is placed just beneath the lash line, or inside the lid entirely where only fat is being addressed, in which case there is no external scar at all.',
      },
      {
        q: 'How long does it last?',
        a: 'Upper eyelid surgery is generally a once in a lifetime operation for most patients. Lower lids are similarly durable. You continue to age, but the tissue that was removed does not come back.',
      },
      {
        q: 'Will my insurance cover it?',
        a: 'Occasionally, for upper lids only, and only where the excess skin is documented to obstruct the visual field. That requires formal visual field testing and photographs. The practice can tell you whether it is worth pursuing, but it is a question for your insurer and most cases are cosmetic.',
      },
      {
        q: 'Can filler or laser do this instead?',
        a: 'They address different things. Filler can soften a hollow under the eye and laser can improve the texture of thin lid skin, and for early changes either may be enough. Neither removes excess skin or repositions herniated fat, which is what makes a lid look heavy.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$3,400, with upper and lower quoted together. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Brow &amp; forehead lift',
        href: 'brow-lift.html',
        text: 'The other half of the upper third. Assessed with the brow held in position, before any lid skin is marked.',
        price: '$5,000&ndash;7,000',
      },
      {
        name: 'Laser resurfacing',
        href: 'laser-resurfacing.html',
        text: 'For the fine crepe on lid skin that surgery cannot tighten.',
        price: '$2,800',
      },
      {
        name: 'Face &amp; neck lift',
        href: 'face-and-neck-lift.html',
        text: 'Where the eyes are one part of a larger plan rather than the whole of it.',
        price: '$18,000',
      },
    ],
  },

  {
    slug: 'cheek-and-chin-implants',
    name: 'Cheek &amp; Chin Implants',
    category: 'face',
    cardPrice: 'From $5,000',
    reviewNote:
      'Confirm implant materials used (silicone, Medpor, custom PEEK), whether cheek implants are placed intraorally as stated, and whether custom planning from a CT scan is offered.',
    heroSub:
      'Structure, restored where the bone never provided it or where time has taken it. Planned to the skeleton, placed through the mouth, and reversible.',
    intro: [
      'Some faces have not lost volume. They were built with less projection through the cheekbone or the chin, and no amount of filler placed in the soft tissue above will substitute for the platform that is missing underneath.',
      'An implant addresses the skeleton directly. It is a permanent, precisely shaped augmentation that sits on the bone, and because it is a solid object in a fixed position it does not migrate, dissolve or need topping up.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The clearest candidates are people who have been offered filler repeatedly and have never been satisfied with it, because the deficiency they are trying to correct is structural.',
          [
            'A flat or hollow midface where the cheekbone gives no definition in profile',
            'A chin that sits back from the rest of the face, which makes the nose read as larger and the neck as shorter',
            'Facial balance that photographs poorly in profile despite everything looking reasonable head on',
            'Volume loss that filler improves for a few months at a time and never actually solves',
          ],
          'A recessed chin is worth singling out. It is one of the most under-diagnosed features in facial aesthetics, and correcting it changes the apparent size of the nose and the definition of the jawline without touching either.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'Implants set the frame. What sits on top of it is frequently addressed in the same plan:',
          [
            '<a class="text-style-link" href="jawline-implant.html">Jawline implant</a>, where projection is needed along the whole mandibular border rather than at the chin alone.',
            '<a class="text-style-link" href="buccal-fat-reduction.html">Buccal fat pad reduction</a>, for definition through the mid-face once the cheekbone has a platform.',
            'Facial liposuction under the chin, where a stronger chin reveals fullness that was previously camouflaged.',
          ],
        ],
      },
      {
        heading: 'Planned to your bone, and reversible',
        body: [
          'Implants are sized and shaped against your own skeletal measurements rather than selected from a small range of stock sizes and hoped for. That planning is the difference between an implant that reads as your own bone and one that reads as an implant.',
          'They are also removable. That is a genuine and underrated advantage over anything permanent that cannot be undone: if it is ever not right, it comes out, and the anatomy returns to where it started.',
          'Dr. Stone trained in oral and maxillofacial surgery across three Level 1 trauma centres. Placing hardware on facial bone through the mouth is the core of that specialty rather than an addition to it.',
        ],
      },
    ],
    facts: [
      { label: 'Cheek implants', value: '$5,500' },
      { label: 'Chin implants', value: '$5,000' },
      { label: 'Anaesthesia', value: 'Sedation or general' },
      { label: 'Back to work', value: 'Seven to ten days' },
      { label: 'Results settle', value: 'Six to eight weeks' },
    ],
    bandImage: {
      file: 'gen-implant-forms.webp',
      alt: 'Brass calipers resting on a technical profile drawing on a pale stone counter',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-or-light.webp',
      alt: 'A surgical light angled over a draped operating table in a quiet, warm-toned theatre',
    },
    steps: [
      {
        title: 'In theatre',
        text: 'One to two hours, under sedation or general anaesthetic depending on what is combined. Access is through the mouth for both cheek and chin in most cases, so there is no external incision. Same day home.',
      },
      {
        title: 'The first fortnight',
        text: 'Swelling is the main feature and it is significant for the first week. A soft diet and careful oral hygiene for that period. Numbness of the lower lip after a chin implant is common early on and resolves.',
      },
      {
        title: 'Settling',
        text: 'The shape you will keep emerges as swelling resolves over six to eight weeks. The implant itself does not change after that.',
      },
    ],
    faqs: [
      {
        q: 'Can it be removed if I change my mind?',
        a: 'Yes, and that is one of the strongest arguments for an implant over the alternatives. It is a discrete object in a defined pocket. Removal is a smaller procedure than placement and the anatomy returns to its starting point.',
      },
      {
        q: 'Why not just use filler?',
        a: 'Filler sits in soft tissue and behaves like soft tissue. On a face that lacks skeletal projection it adds width and fullness rather than definition, which is why repeated syringes so often fail to produce the profile the patient wanted. An implant replaces missing structure with structure.',
      },
      {
        q: 'Will there be a scar on my face?',
        a: 'In most cases no. Cheek and chin implants are usually placed through an incision inside the mouth, which leaves nothing visible externally. Where an external approach under the chin is the better choice for a particular anatomy, that is discussed and agreed beforehand.',
      },
      {
        q: 'Do implants wear out or need replacing?',
        a: 'No. They are inert, they do not dissolve, and they do not have a service life. They are replaced only if you want a different result or, rarely, if there is a problem such as infection, which is uncommon and is discussed as part of consent.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `Cheek implants $5,500, chin implants $5,000. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Jawline implant',
        href: 'jawline-implant.html',
        text: 'Custom implant along the mandibular border, where the whole jaw needs projection rather than the chin alone.',
        price: '$10,000',
      },
      {
        name: 'Buccal fat pad reduction',
        href: 'buccal-fat-reduction.html',
        text: 'Definition through the mid-face. Frequently planned alongside a cheek implant, not instead of one.',
        price: '$2,800',
      },
      {
        name: 'Facial fat transfer',
        href: 'treatments.html#face',
        text: 'Your own fat, grafted where the loss is volume rather than structure.',
        price: 'At consultation',
      },
    ],
  },

  {
    slug: 'buccal-fat-reduction',
    name: 'Buccal Fat Pad Reduction',
    category: 'face',
    cardPrice: '$2,800',
    reviewNote:
      'Confirm the practice position on age limits and long-term hollowing risk, and whether Dr. Stone declines this in patients under a certain age or BMI.',
    heroSub:
      'Definition through the mid-face, by removing a discrete pad of fat through the mouth. Permanent, which is exactly why it is planned conservatively.',
    intro: [
      'The buccal fat pad is a defined structure sitting in the hollow of the cheek, separate from the fat immediately under the skin. In some faces it is large enough to blunt the line between cheekbone and jaw, producing fullness that has nothing to do with weight and does not respond to losing any.',
      'Reducing it is a short procedure through a small incision inside the mouth. There is no external scar and the recovery is measured in days.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The candidate is someone with genuine buccal fullness and good underlying bone structure, where removing the pad reveals a cheekbone that is already there.',
          [
            'Fullness in the hollow of the cheek that has persisted at every weight',
            'A mid-face that photographs wider than it appears in the mirror',
            'A cheekbone whose line is blunted rather than absent',
          ],
          'It is a poor choice for a thin face, an older face, or anyone whose fullness is skin and general soft tissue rather than the pad itself. Faces lose volume with age, and removing structural fat from a face that will thin anyway produces a gaunt, hollowed look a decade later that is very difficult to reverse.',
        ],
      },
      {
        heading: 'The honest caveat',
        body: [
          'This procedure is popular for reasons that have more to do with photography than with anatomy, and it is permanent. Fat that is removed does not return, and a face that reads as sculpted at thirty can read as drawn at forty-five.',
          'Dr. Stone declines this operation more often than she performs it, and will say so directly if your anatomy is not right for it. Where the fullness is soft tissue rather than the pad, or where the underlying structure is the actual deficiency, a <a class="text-style-link" href="cheek-and-chin-implants.html">cheek implant</a> or facial liposuction addresses the real problem and leaves you with more, not less, as you age.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'Removing fat reveals whatever structure is underneath, so it is frequently planned with something that improves that structure:',
          [
            '<a class="text-style-link" href="cheek-and-chin-implants.html">Cheek implants</a>, to give the definition a platform rather than relying on subtraction alone.',
            'Facial liposuction, where there is also fullness along the jaw and under the chin.',
          ],
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$2,800' },
      { label: 'Anaesthesia', value: 'Local with sedation' },
      { label: 'In the chair', value: 'Around forty-five minutes' },
      { label: 'Back to work', value: 'Three to five days' },
      { label: 'Results settle', value: 'Three to six months' },
    ],
    bandImage: {
      file: 'gen-procedure-room.webp',
      alt: 'A reclined procedure chair beside a window in a calm, ivory-toned treatment room',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-room.webp',
      alt: 'A recovery room corner with an armchair, a folded throw and daylight through a sheer curtain',
    },
    steps: [
      {
        title: 'In the chair',
        text: 'Around forty-five minutes under local anaesthetic with sedation. A small incision inside each cheek, the pad delivered and reduced, dissolving sutures. Home the same day.',
      },
      {
        title: 'The first week',
        text: 'Swelling makes the face look fuller rather than slimmer for the first week, which surprises people who were not warned. Soft diet and salt water rinses. Most are back at work in three to five days.',
      },
      {
        title: 'Settling',
        text: 'The contour emerges slowly and the final result is a three to six month proposition. Judging it at three weeks tells you very little.',
      },
    ],
    faqs: [
      {
        q: 'Will I look hollow when I am older?',
        a: 'That is the real risk of this operation and it is the reason for the conservative approach. Faces lose volume with age, and a pad removed in your twenties is not available in your fifties. The mitigation is careful patient selection and removing less than the maximum. If your face is likely to thin, Dr. Stone will tell you not to have it.',
      },
      {
        q: 'Is it permanent?',
        a: 'Yes. The buccal fat pad does not regenerate. This is the main reason it is planned conservatively: the operation can always be taken further at a later date, and it cannot be undone.',
      },
      {
        q: 'Will I have a scar?',
        a: 'Not externally. The incision is inside the mouth, closed with dissolving sutures, and heals within a couple of weeks.',
      },
      {
        q: 'Can I get the same effect without surgery?',
        a: 'Not from the buccal pad itself, which is too deep to be reached by anything topical or energy-based. If the fullness is superficial fat rather than the pad, other options exist, and establishing which one you have is the point of the assessment.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$2,800. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Cheek implants',
        href: 'cheek-and-chin-implants.html',
        text: 'Definition by adding structure rather than removing fat. Often the better answer, and often planned alongside.',
        price: '$5,500',
      },
      {
        name: 'Facial liposuction',
        href: 'treatments.html#face',
        text: 'Fullness under the chin and along the jaw, where the problem is not the buccal pad.',
        price: '$3,000',
      },
      {
        name: 'Surgical lip lift',
        href: 'lip-lift.html',
        text: 'The other permanent, small-scale change to the lower face.',
        price: '$3,500',
      },
    ],
  },

  {
    slug: 'lip-lift',
    name: 'Surgical Lip Lift',
    category: 'face',
    cardPrice: '$3,500',
    reviewNote:
      'Confirm technique (bullhorn, subnasal) and the millimetres typically removed, plus scar maturation timeline and whether it is offered to men.',
    heroSub:
      'Shortens the space between nose and lip and rolls the upper lip outward. A permanent alternative to filler, and a different result from it.',
    intro: [
      'The distance between the base of the nose and the top of the lip lengthens over a lifetime. As it does, the upper lip rolls inward and less of it shows, the teeth stop showing at rest, and the mouth reads as older regardless of how much volume is in the lip itself.',
      'A lip lift removes a small, precisely measured strip of skin beneath the nose. The lip moves up, rolls outward, and shows more of itself. It changes proportion, which is something no amount of filler can do.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The measurement that matters is the philtral height, and there is a range that reads as youthful for a given face. Beyond it, the mouth looks long whatever else is done.',
          [
            'A long space between the base of the nose and the lip',
            'An upper lip that has thinned and rolled inward with age',
            'No upper tooth showing when the mouth is at rest',
            'Repeated filler that has produced volume without ever producing shape',
          ],
          'That last one is the most common story. Filler adds bulk to a lip that is rolled inward, which pushes it forward rather than revealing it, and the result is a lip that is larger but no more visible. If that is your history, this is probably the operation you actually wanted.',
        ],
      },
      {
        heading: 'What it does not do',
        body: [
          'It does not add volume. A lip lift reveals lip that already exists by changing its position; it does not make a thin lip full. Where both shape and volume are wanted, a modest amount of filler after the lift has healed does the second job, and much less of it is needed once the proportion is right.',
          'It also leaves a scar. The incision sits in the crease at the base of the nose where the anatomy hides it, and it matures to be difficult to find, but it is a permanent scar on the face and anyone who tells you otherwise is selling something.',
        ],
      },
      {
        heading: 'Millimetres decide it',
        body: [
          'The amount of skin removed is measured in single millimetres and there is no margin for approximation. Too little and nothing has changed; too much and the mouth cannot close comfortably and the result is unmistakably surgical.',
          'The marking is done against your own measurements, at rest and in animation, and it is checked before anything is cut. This is a small operation in which the planning is most of the work.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$3,500' },
      { label: 'Anaesthesia', value: 'Local, with sedation if preferred' },
      { label: 'In the chair', value: 'Around an hour' },
      { label: 'Back to work', value: 'Five to seven days' },
      { label: 'Scar matures', value: 'Six to twelve months' },
    ],
    bandImage: {
      file: 'gen-instruments-warm.webp',
      alt: 'Fine surgical instruments laid out in a row on a warm ivory cloth',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-procedure-room.webp',
      alt: 'A reclined procedure chair beside a window in a calm, ivory-toned treatment room',
    },
    steps: [
      {
        title: 'In the chair',
        text: 'About an hour under local anaesthetic, with sedation if you would prefer it. The marking is checked, the strip of skin removed and the wound closed in layers with very fine sutures.',
      },
      {
        title: 'The first week',
        text: 'Swelling of the upper lip is pronounced for several days and looks like far too much has been done. It is not. Sutures come out at around five to seven days.',
      },
      {
        title: 'The scar',
        text: 'Pink and visible for the first couple of months, then fading steadily. Scar care starts as soon as the sutures are out and continues for months, because that is what determines how well it disappears.',
      },
    ],
    faqs: [
      {
        q: 'How visible is the scar, honestly?',
        a: 'It sits in the crease where the nose meets the lip, which is one of the best hiding places on the face. In most patients it matures to a fine pale line that is hard to see at conversational distance. It is permanent, it is on your face, and how it heals depends on your skin, your genetics and how diligently you do the scar care.',
      },
      {
        q: 'Is it better than lip filler?',
        a: 'It is different, not better. Filler adds volume and is reversible and temporary. A lip lift changes proportion and is permanent. If your complaint is that your lips are thin, filler is the answer. If your complaint is that your mouth looks long and your upper lip has disappeared, filler will not fix it and this will.',
      },
      {
        q: 'Can I still have filler afterwards?',
        a: 'Yes, once healed, and most patients need considerably less of it than they were having before. The lift makes the lip visible; filler then adjusts volume within a shape that is already right.',
      },
      {
        q: 'Will it change my smile?',
        a: 'It should show slightly more upper tooth at rest, which is the point. Your smile itself is produced by muscle that is not disturbed, so the animation stays yours.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$3,500. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Injectables',
        href: 'injectables.html',
        text: 'Dermal filler for volume, once the proportion is right. Usually far less is needed after a lift.',
        price: 'From $800 per syringe',
      },
      {
        name: 'Buccal fat pad reduction',
        href: 'buccal-fat-reduction.html',
        text: 'The other small permanent change to the lower face.',
        price: '$2,800',
      },
      {
        name: 'Cheek &amp; chin implants',
        href: 'cheek-and-chin-implants.html',
        text: 'Where the proportion problem is skeletal rather than in the soft tissue.',
        price: 'From $5,000',
      },
    ],
  },

  /* ======================================================================
     NECK & JAWLINE
     ====================================================================== */
  {
    slug: 'neck-lift',
    name: 'Neck Lift',
    category: 'neck',
    cardPrice: '$11,000',
    reviewNote:
      'Confirm whether platysmaplasty is routine, drain policy, and the two-week return-to-work figure. Check the ten-year longevity claim carried over from the practice MyEllevate page.',
    heroSub:
      'The full surgical procedure, with muscle repair and skin removal, for a neck that has gone past what a suture can hold.',
    intro: [
      'The neck is where age shows first and hides least. It is also the practice signature: Dr. Stone is known online as <span class="text-color-accent">@drjawline</span>, and the neck is the work she is sought out for.',
      'A neck lift addresses all three of the things that go wrong at once. The platysma, the sheet of muscle that gives the neck its shape, is repaired where it has separated. Fat is contoured where it has accumulated. Skin that is genuinely in excess is removed rather than redraped over the problem.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'This is the operation when there is real skin excess. The test is whether the skin retracts when you lift your chin: if it does, a suspension procedure may still be enough, and if it hangs, it needs removing.',
          [
            'Loose skin that does not take up when the chin is raised',
            'Vertical banding down the front of the neck, visible at rest as well as when speaking',
            'A jawline that has lost its border entirely rather than softened',
            'Significant weight loss that has left the neck with more skin than it needs',
          ],
          'Where the skin still has tone and the problem is muscle laxity, <a class="text-style-link" href="myellevate-neck-lift.html">MyEllevate&reg;</a> achieves a great deal at $6,000 with no external incision and a far shorter recovery. Dr. Stone will recommend the smaller operation where it will do the job.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'A neck that has aged this far rarely has a face that has not:',
          [
            '<a class="text-style-link" href="face-and-neck-lift.html">Face and neck lift</a>, quoted together at $18,000, where the jowl and the neck are one continuous problem.',
            '<a class="text-style-link" href="jawline-implant.html">Jawline implant</a>, where the mandible itself lacks the projection to give the neck an angle to sit against.',
            'Submental liposuction, where fullness under the chin is fat as well as muscle.',
          ],
          'Which of these you need is decided on your anatomy at the consultation, not assembled into a package beforehand.',
        ],
      },
      {
        heading: 'Why it matters who operates',
        body: [
          'The marginal mandibular nerve runs exactly where this operation works, and it is the nerve that moves the lower lip. A surgeon has to know that anatomy in three dimensions, in a particular neck, under tension, rather than as a diagram.',
          'Dr. Stone trained in oral and maxillofacial surgery across three Level 1 trauma centres. She spent her residency rebuilding this anatomy after it had been broken, which is the background she brings to an elective neck.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$11,000' },
      { label: 'With the face', value: '$18,000' },
      { label: 'Anaesthesia', value: 'General or deep sedation' },
      { label: 'Back to work', value: 'Two weeks' },
      { label: 'Results settle', value: 'Three to six months' },
    ],
    bandImage: {
      file: 'gen-surgical-suite.webp',
      alt: 'A quiet operating suite with an empty table, instrument trolley and warm indirect light',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-room.webp',
      alt: 'A recovery room corner with an armchair, a folded throw and daylight through a sheer curtain',
    },
    steps: [
      {
        title: 'In theatre',
        text: 'Two to four hours, under general anaesthetic or deep sedation. A responsible adult brings you, waits, and drives you home. You do not drive yourself for this one.',
      },
      {
        title: 'The first fortnight',
        text: 'A support garment, swelling and tightness, and bruising that peaks around day three. Sutures come out in stages over two weeks. Most people are back at a desk at two weeks and comfortable in company shortly after.',
      },
      {
        title: 'Settling',
        text: 'The contour refines for three to six months as swelling resolves and the tissues soften. Follow-ups are with Dr. Stone, not with a nurse you have not met.',
      },
    ],
    faqs: [
      {
        q: 'How is this different from MyEllevate?',
        a: '<a class="text-style-link" href="myellevate-neck-lift.html">MyEllevate&reg;</a> suspends the platysma with a suture and removes nothing, so there is no external incision and the recovery is days rather than weeks. A neck lift removes skin and repairs muscle directly. The first is for laxity, the second for excess, and which you have is an anatomical fact rather than a preference.',
      },
      {
        q: 'Where do the scars go?',
        a: 'A small incision under the chin, and incisions around and behind the ears following the natural creases. They are placed where the anatomy conceals them and they mature over months from pink to pale.',
      },
      {
        q: 'How long does it last?',
        a: 'The practice puts a full surgical neck lift at up to ten years, against about five for MyEllevate&reg;. The muscle repair is durable; what changes is that your neck keeps ageing around it. Skin quality, weight stability and genetics all move that number.',
      },
      {
        q: 'Will I need a drain?',
        a: 'Sometimes, for the first day or two, depending on how much work the neck needed. If one is used it is removed at your first post-operative visit and it is a great deal less unpleasant than it sounds.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$11,000 for the neck alone, or $18,000 combined with the face. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'MyEllevate&reg; neck lift',
        href: 'myellevate-neck-lift.html',
        text: 'Suture suspension, no external incision, recovery in days. The right answer where the skin still has tone.',
        price: '$6,000',
      },
      {
        name: 'Jawline implant',
        href: 'jawline-implant.html',
        text: 'Custom implant along the mandibular border, where the jaw needs projection rather than lifting.',
        price: '$10,000',
      },
      {
        name: 'Face &amp; neck lift',
        href: 'face-and-neck-lift.html',
        text: 'Both together, where the jowl and the neck are one continuous problem.',
        price: '$18,000',
      },
    ],
  },

  {
    slug: 'myellevate-neck-lift',
    name: 'MyEllevate&reg; Neck Lift',
    category: 'neck',
    cardPrice: '$6,000',
    reviewNote:
      'Content carried over from the original treatment-detail page, which was built against the practice archive. The five-year longevity figure and the drive-yourself-home statement are the practice own, from its archived MyEllevate page.',
    heroSub:
      'Definition through the jaw and neck, achieved with a suture rather than a scar, and a recovery measured in days, not weeks.',
    intro: [
      'Most people who come in about their neck are not asking for a facelift. They want the line under the chin back, the one that makes a jaw look like a jaw, and they cannot take three weeks off to get it.',
      'MyEllevate is the procedure that sits in that gap. A light-guided suture is passed beneath the skin and used to suspend the platysma, the sheet of muscle that gives the neck its shape. Because the suture does the lifting, there is <strong>no external incision</strong>, and because nothing is cut away, the result is a repositioning of what you already have rather than a removal.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'It works best where the skin still has reasonable tone and the problem is laxity in the muscle rather than a genuine excess of skin. In practice that tends to mean patients in their late thirties to their fifties, and patients of any age who have lost weight and been left with a slack neck.',
          [
            'Blunting of the angle between the chin and the neck',
            'Vertical banding down the front of the neck when speaking',
            'A jawline that has softened without much loose skin',
            'A wish to avoid the recovery, and the scars, of a full neck lift',
          ],
          'Where there is real skin excess, Dr. Stone will say so and recommend the <a class="text-style-link" href="neck-lift.html">surgical neck lift</a> instead. Being told a procedure is not right for you is a normal outcome of a consultation here.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'The neck rarely ages alone. Two combinations come up constantly:',
          [
            '<strong>FaceTite</strong>: radiofrequency tightening of the overlying skin, done in the same visit. Priced together at $7,800.',
            '<strong>Submental liposuction</strong>: where fullness under the chin is fat rather than muscle.',
          ],
          'Both are decided at the consultation, on your anatomy, not sold as a package beforehand.',
        ],
      },
      {
        heading: 'Why it matters who holds the suture',
        body: [
          'The platysma sits over structures, the marginal mandibular nerve among them, that a surgeon has to know in three dimensions to work around safely. Dr. Stone trained in oral and maxillofacial surgery across three Level 1 trauma centres, which is to say she spent her residency rebuilding exactly this anatomy after it had been broken. That is the background she brings to an elective neck.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$6,000' },
      { label: 'With FaceTite', value: '$7,800' },
      { label: 'Anaesthesia', value: 'Local with sedation' },
      { label: 'Back to work', value: 'Around a week' },
      { label: 'Results settle', value: '6 to 12 weeks' },
    ],
    bandImage: {
      file: 'gen-iclight-wand.webp',
      alt: 'An illuminated surgical light wand over folded linen in a darkened treatment room',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-recovery-room.webp',
      alt: 'A recovery room corner with an armchair, a folded throw and daylight through a sheer curtain',
    },
    steps: [
      {
        title: 'In the chair',
        text: 'Around ninety minutes under local anaesthetic with sedation. You are comfortable and you go home the same day, with someone to drive you.',
      },
      {
        title: 'The first week',
        text: 'A support garment, some swelling and tightness, and very little pain in most cases. Most people are back at a desk inside a week.',
      },
      {
        title: 'Settling',
        text: 'The contour keeps refining for two to three months as swelling resolves. Follow-ups are with Dr. Stone, not with a nurse you have not met.',
      },
    ],
    faqs: [
      {
        q: 'Will there be a visible scar?',
        a: 'There is no external incision along the neck. The suture is passed through small entry points, typically under the chin and behind the ears, which settle to be very difficult to find.',
      },
      {
        q: 'How long does it last?',
        a: 'The practice puts MyEllevate&reg; at around <strong>five years</strong>, against up to ten for a full surgical neck lift. The suspension itself is permanent; what changes is that your neck keeps ageing around it. Skin quality, weight stability and genetics all move that number, and Dr. Stone will give you a realistic figure for your neck rather than the average.',
      },
      {
        q: 'Can I drive myself home afterwards?',
        a: 'Yes. Because MyEllevate&reg; needs only local anaesthetic, you can drive yourself home and resume most activities straight away. That is the practical difference between this and a <a class="text-style-link" href="neck-lift.html">neck lift</a>, which is done under sedation and requires a responsible adult to bring you, wait, and drive you home.',
      },
      CONSULT_FAQ,
      {
        q: 'Is this the same as a thread lift?',
        a: 'No. A thread lift places barbed threads in the soft tissue and dissolves over months. MyEllevate places a permanent suture around the platysma itself, under direct light guidance, and it is a surgical procedure performed by a surgeon.',
      },
      {
        q: 'Can I have it if I have already had a facelift?',
        a: 'Often, yes: it is a common way to refresh a neck without repeating a larger operation. Bring the operative details of the previous surgery to your consultation if you have them.',
      },
      {
        q: 'What does it cost, and can I finance it?',
        a: `$6,000 on its own, or $7,800 combined with FaceTite for the neck. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Neck lift',
        href: 'neck-lift.html',
        text: 'The full surgical procedure, with muscle repair and skin removal, where laxity has gone past what a suture can hold.',
        price: '$11,000',
      },
      {
        name: 'Submentoplasty',
        href: 'treatments.html#neck',
        text: 'Contouring under the chin, fat or muscle or both, for a neck that is heavy rather than slack.',
        price: '$3,500&ndash;6,500',
      },
      {
        name: 'Jawline implant',
        href: 'jawline-implant.html',
        text: 'Custom implant along the mandibular border, where the jaw needs projection rather than lifting.',
        price: '$10,000',
      },
    ],
  },

  {
    slug: 'jawline-implant',
    name: 'Jawline Implant',
    category: 'neck',
    cardPrice: '$10,000',
    reviewNote:
      'Confirm whether implants are custom-milled from a CT scan or selected from stock, the material used, and whether this is offered as a single custom piece or paired components.',
    heroSub:
      'A custom implant along the mandibular border, for a jaw that needs projection rather than lifting. Planned to your bone and reversible.',
    intro: [
      'Lifting a neck gives you back the angle between the chin and the throat. It cannot give you a jaw that the skeleton never built. Where the mandible itself lacks width or definition, no amount of suspension, liposuction or skin tightening will produce an edge, because there is nothing underneath for the soft tissue to drape over.',
      'A jawline implant addresses the bone directly. It is a solid, precisely shaped augmentation placed along the mandibular border, and it creates the border the face is missing.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The clearest sign is a patient who is lean, has very little under the chin to remove, and still has no jawline. Subtraction has nothing to work with; the deficiency is structural.',
          [
            'A jaw that reads as soft or rounded in profile at any weight',
            'A face that has been told it needs liposuction under the chin when there is barely any fat there',
            'Asymmetry along the mandible that has been present since childhood',
            'A wish for definition that filler along the jaw has never convincingly produced',
          ],
          'This is the operation for the patient who has done everything else and still does not have a jawline. Dr. Stone is known online as <span class="text-color-accent">@drjawline</span>, and this is a good part of the reason.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          'The implant provides the frame; the soft tissue over it is a separate question:',
          [
            '<a class="text-style-link" href="myellevate-neck-lift.html">MyEllevate&reg;</a> or a <a class="text-style-link" href="neck-lift.html">neck lift</a>, where there is laxity as well as a deficient border.',
            '<a class="text-style-link" href="cheek-and-chin-implants.html">Chin implant</a>, where projection is needed at the front as well as along the sides. Frequently the same custom piece.',
            'Submental liposuction, where a small amount of fat is blurring an edge the implant will create.',
          ],
        ],
      },
      {
        heading: 'Custom, and reversible',
        body: [
          'A jawline implant is planned against your own skeletal anatomy rather than chosen from a handful of stock shapes. That is what separates a jaw that reads as yours from one that reads as hardware.',
          'It is also removable. If it is ever not right, it comes out and the anatomy returns to where it started, which is a genuine advantage over permanent changes that cannot be undone.',
          'Placing hardware on facial bone through the mouth is the centre of oral and maxillofacial surgery rather than an extension of it. Dr. Stone trained in that specialty across three Level 1 trauma centres.',
        ],
      },
    ],
    facts: [
      { label: 'Fee', value: '$10,000' },
      { label: 'Anaesthesia', value: 'General' },
      { label: 'In theatre', value: 'Two to three hours' },
      { label: 'Back to work', value: 'Ten to fourteen days' },
      { label: 'Results settle', value: 'Two to three months' },
    ],
    bandImage: {
      file: 'gen-contour-gauges.webp',
      alt: 'Machined contour gauges and a brass protractor on a technical drawing',
    },
    journeyTitle: 'What the day actually looks like.',
    journeyImage: {
      file: 'gen-or-light.webp',
      alt: 'A surgical light angled over a draped operating table in a quiet, warm-toned theatre',
    },
    steps: [
      {
        title: 'In theatre',
        text: 'Two to three hours under general anaesthetic. Access is through the mouth, so there is no external incision. You go home the same day with a responsible adult.',
      },
      {
        title: 'The first fortnight',
        text: 'Swelling is substantial for the first week and it is the part patients find hardest, because the jaw looks wider rather than sharper. Soft diet, careful oral hygiene, and most people are back at work at ten to fourteen days.',
      },
      {
        title: 'Settling',
        text: 'The definition emerges as swelling resolves over two to three months. Numbness of the lower lip and chin is common early and resolves as the nerve recovers.',
      },
    ],
    faqs: [
      {
        q: 'Why not jawline filler?',
        a: 'Filler is soft, it sits above the bone rather than replacing it, and on a jaw that lacks skeletal projection it tends to add width and heaviness rather than an edge. It also needs repeating indefinitely. An implant provides a hard border because a hard border is what is missing.',
      },
      {
        q: 'Can it be taken out?',
        a: 'Yes. It sits in a defined pocket and removal is a smaller procedure than placement. The anatomy returns to its starting point, which is not true of most permanent facial surgery.',
      },
      {
        q: 'Will it be obvious that I have had something done?',
        a: 'A well planned implant reads as bone, because it is doing the job bone would have done. The risk of an obvious result comes from oversizing, which is a planning decision made against your measurements before anything is ordered or placed.',
      },
      {
        q: 'Is there a scar?',
        a: 'Not on the face. The implant is placed through incisions inside the mouth, closed with dissolving sutures.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$10,000. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Cheek &amp; chin implants',
        href: 'cheek-and-chin-implants.html',
        text: 'Projection at the chin and the midface. Frequently planned as one custom piece with the jawline.',
        price: 'From $5,000',
      },
      {
        name: 'MyEllevate&reg; neck lift',
        href: 'myellevate-neck-lift.html',
        text: 'Suspension for the soft tissue, where laxity is blurring an edge the implant will build.',
        price: '$6,000',
      },
      {
        name: 'FaceTite',
        href: 'treatments.html#neck',
        text: 'Radiofrequency skin tightening, per area, where the skin over the new border needs to shrink to it.',
        price: '$3,000',
      },
    ],
  },

  /* ======================================================================
     SKIN
     ====================================================================== */
  {
    slug: 'laser-resurfacing',
    name: 'Laser Resurfacing',
    category: 'skin',
    cardPrice: 'From $2,000',
    reviewNote:
      'Confirm the specific laser platforms in use, whether the $2,800 full face is fractional or fully ablative, and the CO2 downtime figure. Confirm the practice position on treating darker Fitzpatrick skin types.',
    heroSub:
      'Texture, fine lines and pigment in one treatment. The only thing on this list that changes the surface of the skin rather than what is underneath it.',
    intro: [
      'Surgery repositions. Injectables fill and relax. Neither does anything about the actual quality of the skin: the fine crepe, the sun damage, the pigment, the texture that makes a face look weathered even when its structure is good.',
      'Resurfacing removes a controlled depth of damaged skin and lets it heal from below with new collagen. It is the treatment that makes a good surgical result look genuinely refreshed rather than merely lifted.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'Anyone whose complaint is about the surface rather than the shape. It is also the standard companion to facial surgery, staged rather than done the same day.',
          [
            'Fine lines around the mouth and eyes that do not respond to injectables',
            'Sun damage, freckling and uneven pigment across the cheeks and forehead',
            'Rough or crepey texture, particularly on thin eyelid and perioral skin',
            'Acne scarring and enlarged pores',
          ],
          'Depth is chosen against your skin and your tolerance for downtime, and it is the single decision that determines both the result and the recovery. There is no version of this that produces a dramatic change with no downtime, and anyone offering one is describing a different treatment.',
        ],
      },
      {
        heading: 'The two depths',
        body: [
          'The practice prices these separately because they are genuinely different propositions:',
          [
            '<strong>Laser resurfacing, full face, $2,800.</strong> Texture, fine lines and pigment addressed in one treatment, with a recovery most people can plan around a long weekend and a quiet week.',
            '<strong>CO<sub>2</sub> laser, $2,000.</strong> The deeper option. Real downtime and real change, for skin where the damage has gone past what a lighter treatment will reach.',
          ],
          'Which one you need is a clinical judgement about your skin, not a budget decision, and the cheaper of the two is the more aggressive.',
        ],
      },
      {
        heading: 'What it will not do',
        body: [
          'Resurfacing does not lift. It tightens modestly through new collagen, and that is worth having, but a jowl is a jowl and no laser will reposition it. Where the complaint is descent, the honest answer is <a class="text-style-link" href="face-and-neck-lift.html">surgery</a>, and resurfacing afterwards.',
          'It also has to be respected in darker skin, where the risk of post-inflammatory pigment change is real and the settings and aftercare are different. That assessment happens before anything is booked.',
        ],
      },
    ],
    facts: [
      { label: 'Full face', value: '$2,800' },
      { label: 'CO<sub>2</sub> laser', value: '$2,000' },
      { label: 'Anaesthesia', value: 'Topical, or sedation if deep' },
      { label: 'Social downtime', value: 'Five to ten days' },
      { label: 'Results settle', value: 'Three to six months' },
    ],
    bandImage: {
      file: 'ssa-treatment-room.webp',
      alt: 'The treatment room at Stone Surgical Arts with the practice laser platform',
    },
    journeyTitle: 'What the week actually looks like.',
    journeyImage: {
      file: 'gen-skincare-shelf.webp',
      alt: 'Unbranded skincare bottles and a folded cloth on a pale stone shelf',
    },
    steps: [
      {
        title: 'The appointment',
        text: 'Numbing cream for around an hour beforehand, then thirty to sixty minutes of treatment depending on the area and the depth. Deeper CO2 treatments are done with sedation.',
      },
      {
        title: 'The first week',
        text: 'The skin is red, hot and swollen, then peels. This is the treatment working and it is not optional. Five to ten days of social downtime depending on depth, with a strict regime of occlusive ointment and absolutely no sun.',
      },
      {
        title: 'Settling',
        text: 'Pinkness fades over several weeks. Collagen remodelling continues for three to six months, so the skin keeps improving well after it looks healed. Daily sun protection from then on is what protects the result.',
      },
    ],
    faqs: [
      {
        q: 'How much downtime, really?',
        a: 'Five to ten days where you would not want to be seen, depending on the depth chosen. Lighter fractional treatments sit at the short end, CO2 at the long end. Anyone who tells you a resurfacing treatment that genuinely changes your skin has no downtime is describing a facial.',
      },
      {
        q: 'How many treatments will I need?',
        a: 'Lighter resurfacing is usually a course of two or three spaced weeks apart. A deeper CO2 treatment is frequently a single event with results that last years. Which route suits you is decided against your skin and your calendar.',
      },
      {
        q: 'Is it safe for darker skin?',
        a: 'It requires more care. Darker skin types carry a real risk of post-inflammatory hyperpigmentation, which is manageable with the right settings, appropriate pre-treatment and disciplined aftercare, but it changes the plan. This is assessed honestly before anything is booked rather than discovered afterwards.',
      },
      {
        q: 'Can I have it at the same time as surgery?',
        a: 'Usually it is staged rather than combined, because both the skin and the surgical result need to heal without competing. The sequence is planned as part of your overall timeline.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `Full face resurfacing $2,800, CO<sub>2</sub> laser $2,000. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Morpheus8',
        href: 'morpheus8.html',
        text: 'Microneedling with radiofrequency. Works deeper with less surface downtime, and treats laxity as well as texture.',
        price: '$1,000',
      },
      {
        name: 'Chemical peel',
        href: 'treatments.html#skin',
        text: 'A lighter, cheaper route to brightness and mild texture, with depth chosen on the day.',
        price: 'From $150',
      },
      {
        name: 'Microneedling + PRP',
        href: 'treatments.html#skin',
        text: 'Regenerative resurfacing using your own platelets, sold in courses of three.',
        price: '$750',
      },
    ],
  },

  {
    slug: 'morpheus8',
    name: 'Morpheus8',
    category: 'skin',
    cardPrice: 'From $1,000',
    reviewNote:
      'Confirm needle depths used, whether the body is treated as well as the face, numbing protocol, and that the package of three at $2,800 is current.',
    heroSub:
      'Microneedling with radiofrequency delivered under the skin. Treats laxity as well as texture, with far less surface downtime than a laser.',
    intro: [
      'Microneedling works by injuring the skin in a controlled way so it rebuilds. Morpheus8 does the same thing but delivers radiofrequency energy from the tips of the needles, at a set depth, so the heating happens in the layer where collagen is made rather than at the surface.',
      'That combination is why it sits between skincare and surgery. It tightens as well as resurfaces, and because the energy is delivered below the surface, the skin on top recovers in days rather than a week.',
    ],
    sections: [
      {
        heading: 'Who it suits',
        body: [
          'The patient who wants meaningful tightening, has some early laxity, and cannot take the downtime that resurfacing or surgery demands.',
          [
            'Early softening along the jawline that is not yet a surgical problem',
            'Texture, large pores and acne scarring',
            'Crepiness under the eyes and around the mouth',
            'Skin that needs both tightening and resurfacing, in a schedule that allows neither to be dramatic',
          ],
          'It is honest about its limits. Morpheus8 will not lift a jowl or replace a <a class="text-style-link" href="myellevate-neck-lift.html">neck suspension</a>. Where the problem is descent rather than skin quality, it is a treatment that costs you money and time and leaves the actual complaint untouched.',
        ],
      },
      {
        heading: 'Sold as a course, for a reason',
        body: [
          'The practice prices a single session at $1,000 and a package of three at $2,800, and the package is not a discount tactic. Collagen remodelling is cumulative, and one session produces a fraction of the change that three spaced a month apart will.',
          'Expect to judge the result four to six months after starting, not after the first appointment.',
        ],
      },
      {
        heading: 'Often combined with',
        body: [
          [
            'PRP, using your own platelets, applied after the needling to support healing. Priced at $750 with microneedling, or $2,100 for three.',
            '<a class="text-style-link" href="injectables.html">Neuromodulators</a>, which relax the muscle pulling on skin that Morpheus8 is trying to tighten.',
            '<a class="text-style-link" href="laser-resurfacing.html">Laser resurfacing</a>, where pigment and sun damage need addressing at the surface as well.',
          ],
        ],
      },
    ],
    facts: [
      { label: 'Single session', value: '$1,000' },
      { label: 'Package of three', value: '$2,800' },
      { label: 'Anaesthesia', value: 'Topical numbing' },
      { label: 'Social downtime', value: 'Two to four days' },
      { label: 'Results settle', value: 'Three to six months' },
    ],
    bandImage: {
      file: 'gen-laser-device.webp',
      alt: 'An aesthetic device handpiece resting in its cradle on a pale stone counter',
    },
    journeyTitle: 'What the week actually looks like.',
    journeyImage: {
      file: 'gen-skincare-shelf.webp',
      alt: 'Unbranded skincare bottles and a folded cloth on a pale stone shelf',
    },
    steps: [
      {
        title: 'The appointment',
        text: 'Numbing cream for around forty-five minutes, then thirty to sixty minutes of treatment. Depths are set by area, deeper along the jaw and shallower under the eyes.',
      },
      {
        title: 'The first few days',
        text: 'Redness and a sandpaper texture with a grid pattern that fades over two to four days. Mild swelling on the first evening. Makeup is usually fine at forty-eight hours.',
      },
      {
        title: 'The course',
        text: 'Three sessions a month apart. Tightening builds gradually and continues for three to six months after the final session, which is when the result should be judged.',
      },
    ],
    faqs: [
      {
        q: 'How is this different from ordinary microneedling?',
        a: 'Ordinary microneedling injures the skin mechanically and works mainly at the surface. Morpheus8 adds radiofrequency heating delivered from the needle tips at a controlled depth, which is what produces the tightening. The practice offers both: <a class="text-style-link" href="treatments.html#skin">microneedling</a> at $380 and SkinPen at $300 per session.',
      },
      {
        q: 'Does it hurt?',
        a: 'It is uncomfortable rather than painful, and topical numbing handles most of it. The deeper settings along the jawline are the ones people notice. It is over in under an hour.',
      },
      {
        q: 'Will it replace a facelift?',
        a: 'No, and it is worth being direct about that. It tightens skin; it does not reposition tissue that has descended. If a jowl is your complaint, this will disappoint you and <a class="text-style-link" href="face-and-neck-lift.html">surgery</a> is the honest answer.',
      },
      {
        q: 'How long do the results last?',
        a: 'The collagen you build is yours and it persists, but you continue to age. Most patients maintain with a single session once or twice a year after completing the initial course.',
      },
      CONSULT_FAQ,
      {
        q: 'What does it cost, and can I finance it?',
        a: `$1,000 for a single session, $2,800 for a package of three. ${FINANCE}`,
      },
    ],
    related: [
      {
        name: 'Laser resurfacing',
        href: 'laser-resurfacing.html',
        text: 'Works at the surface, on pigment and sun damage that radiofrequency does not address.',
        price: '$2,800',
      },
      {
        name: 'Microneedling + PRP',
        href: 'treatments.html#skin',
        text: 'Your own platelets applied after needling. Sold in courses of three.',
        price: '$750',
      },
      {
        name: 'HydraFacial MD&reg;',
        href: 'treatments.html#skin',
        text: 'Maintenance between courses, with no downtime at all.',
        price: 'From $189',
      },
    ],
  },

  /* ======================================================================
     NON-SURGICAL
     ====================================================================== */
  {
    slug: 'injectables',
    name: 'Injectables',
    category: 'nonsurgical',
    cardPrice: 'From $12 per unit',
    reviewNote:
      'Confirm Brooke surname and credentials for the injector attribution, which products are stocked, and the practice policy on reversal agents being kept on site.',
    heroSub:
      'Neuromodulators and filler, placed by the practice nurse injector, with Dr. Stone available for anything structural.',
    intro: [
      'Injectables do two entirely different jobs that get spoken about as one. Neuromodulators relax the muscles that fold the skin. Fillers replace volume that has been lost or was never there. Confusing the two is how people end up with a face that is smooth and heavy at the same time.',
      'Both are placed here by Brooke, the practice nurse injector. Anything structural, or any case that needs a surgical eye, is seen by Dr. Stone.',
    ],
    sections: [
      {
        heading: 'Neuromodulators',
        body: [
          'Botox, Jeuveau and Dysport all relax muscle. They are dosed and priced per unit, and the units are not interchangeable between brands, which is why comparing the unit price between them is meaningless.',
          [
            '<strong>Botox&reg;</strong> and <strong>Jeuveau&reg;</strong>, $12 per unit',
            '<strong>Dysport&reg;</strong>, $6 per unit, dosed differently, so compare the treatment rather than the unit',
            '<strong>With Dr. Stone</strong>, for structural or corrective cases, quoted on assessment',
          ],
          'They work on lines produced by movement. A line that is present when your face is completely still is an etched line, and it needs resurfacing or filler rather than a neuromodulator.',
        ],
      },
      {
        heading: 'Fillers',
        body: [
          'Filler replaces volume. Where it is placed matters far more than how much of it is used, and the common failure of this treatment is chasing a hollow with more product until the face is heavy.',
          [
            '<strong>Dermal filler</strong>, $800 per syringe. The eight point lift, up to eight syringes, is $6,000.',
            '<strong>Sculptra&reg;</strong>, $900 per session, or $2,500 for three and $3,400 for four. A collagen stimulator rather than a filler: it builds volume gradually over months rather than placing it on the day.',
          ],
          'Where the deficiency is skeletal rather than soft tissue, filler is the wrong tool and will keep being the wrong tool however many syringes are used. That is what <a class="text-style-link" href="cheek-and-chin-implants.html">implants</a> are for, and Dr. Stone will tell you if that is what you are actually looking at.',
        ],
      },
      {
        heading: 'Where injectables stop',
        body: [
          'This is a surgical practice, and the most useful thing it can tell you about injectables is when they have run out of road. Filler cannot lift a jowl, cannot shorten a long upper lip, and cannot build a jawline that the mandible does not support.',
          'If the honest answer to your concern is a <a class="text-style-link" href="lip-lift.html">lip lift</a>, a <a class="text-style-link" href="myellevate-neck-lift.html">neck suspension</a> or an <a class="text-style-link" href="jawline-implant.html">implant</a>, you will be told that here rather than sold another syringe.',
        ],
      },
    ],
    facts: [
      { label: 'Botox&reg; / Jeuveau&reg;', value: '$12 per unit' },
      { label: 'Dysport&reg;', value: '$6 per unit' },
      { label: 'Dermal filler', value: '$800 per syringe' },
      { label: 'Sculptra&reg;', value: 'From $900' },
      { label: 'Downtime', value: 'None to minimal' },
    ],
    bandImage: {
      file: 'gen-injectables.webp',
      alt: 'Vials and syringes arranged on a clean tray in warm, soft light',
    },
    journeyTitle: 'What the appointment actually looks like.',
    journeyImage: {
      file: 'ssa-consult-room.webp',
      alt: 'A consultation room at Stone Surgical Arts with an armchair and daylight through tall blinds',
    },
    steps: [
      {
        title: 'The assessment',
        text: 'Your face is looked at in movement and at rest before anything is drawn up, because that is what determines whether the answer is a neuromodulator, a filler, or neither.',
      },
      {
        title: 'The appointment',
        text: 'Fifteen to forty-five minutes depending on what is being treated. Topical numbing or a dental block for lips. You can drive yourself home and go back to work.',
      },
      {
        title: 'Settling',
        text: 'Neuromodulators begin working at three to five days and are fully in at two weeks, which is when any adjustment is made. Filler settles over two weeks. Sculptra builds over several months.',
      },
    ],
    faqs: [
      {
        q: 'Who actually injects me?',
        a: 'Brooke, the practice nurse injector, for routine treatment. Dr. Stone takes structural cases, corrective work and anything where a surgical assessment changes the plan. You are told which before you book, not on the day.',
      },
      {
        q: 'Why is Dysport cheaper per unit?',
        a: 'Because a Dysport unit is not equivalent to a Botox unit and the dosing is different. Comparing per unit prices between brands tells you nothing useful. Ask what the treatment costs for your face, which is the number that matters.',
      },
      {
        q: 'Can filler be dissolved if I do not like it?',
        a: 'Hyaluronic acid fillers can be dissolved with an enzyme, which is one of their genuine advantages. Sculptra cannot: it stimulates your own collagen over months and is not reversible, which is why it is dosed conservatively across sessions.',
      },
      {
        q: 'How often will I need it repeated?',
        a: 'Neuromodulators every three to four months. Hyaluronic acid filler generally lasts six to eighteen months depending on the product and the area. Sculptra is built over a course and then maintained annually.',
      },
      CONSULT_FAQ,
      {
        q: 'Is there a membership that makes this cheaper?',
        a: 'Yes. The practice runs a membership that banks credit toward treatment, including injectables, and unspent credit can be applied to a surgical fee. See <a class="text-style-link" href="memberships.html">Memberships</a>.',
      },
    ],
    related: [
      {
        name: 'Morpheus8',
        href: 'morpheus8.html',
        text: 'For the skin quality that injectables do not touch. Frequently planned alongside.',
        price: '$1,000',
      },
      {
        name: 'Surgical lip lift',
        href: 'lip-lift.html',
        text: 'Where repeated lip filler has produced volume without ever producing shape.',
        price: '$3,500',
      },
      {
        name: 'Cheek &amp; chin implants',
        href: 'cheek-and-chin-implants.html',
        text: 'Where the deficiency is skeletal and filler has never quite answered it.',
        price: 'From $5,000',
      },
    ],
  },
]
