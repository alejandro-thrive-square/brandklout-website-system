import json, sys

raw = open(sys.argv[1], encoding='utf-8').read()
posts = json.loads(raw.split('\nHIPAA')[0])
tsv = [l.split('\t') for l in open(sys.argv[2], encoding='utf-8').read().splitlines()]
pages = {r[1]: {'title': r[3], 'desc': r[5]} for r in tsv if r[0] == 'P'}

PAGE_TITLES = {
    'five-year-warranty': 'Five-Year Implant Warranty | Dr. Nahlah | McLean, VA',
    'video-library': 'Video Library | Implants & Prosthodontics | Dr. Nahlah',
    'terms-of-service-maclean': 'Terms of Service | McLean Office | Dr. Nahlah',
    'terms-of-service-alexandria': 'Terms of Service | Alexandria Office | Dr. Nahlah',
    'privacy-policy-maclean': 'Privacy Policy | McLean Office | Dr. Nahlah',
    'privacy-policy-alexandria': 'Privacy Policy | Alexandria Office | Dr. Nahlah',
    'posts': 'Journal | Implants and Prosthodontics | Dr. Nahlah',
    'terms-conditions': 'Terms of Service | Dr. Nahlah | McLean & Alexandria',
    'privacy-policy': 'Privacy Policy | Dr. Nahlah | McLean & Alexandria',
    'cosmetic-dentistry': 'Cosmetic Dentistry | Veneers & Whitening | McLean, VA',
    'about': 'Why Choose Us | Dr. Nahlah Prosthodontics | McLean, VA',
    'our-team': 'Meet the Team | Dr. Nahlah Prosthodontics | McLean, VA',
    'our-facility': 'Our Facility | Surgical Suites & In-House Lab | McLean, VA',
    'oral-surgery': 'Oral Surgery | Extractions & Bone Grafting | McLean, VA',
    'doctor-referral': 'For Referring Doctors | Implant Referrals | McLean, VA',
    'crowns-and-bridges': 'Crowns & Bridges | Reinforce At-Risk Teeth | McLean, VA',
}
PAGE_DESCS = {
    'video-library': 'Short films from the practice: implant planning, guided placement, the in-house lab, bone grafting, veneers and full arches, explained by Dr. Nahlah.',
    'emergency-dentistry': 'Toothache, abscess, or a knocked-out or broken tooth? Same-day space is made wherever possible, with sedation available. McLean and Alexandria, VA.',
    'contact': 'Two Northern Virginia offices: Tysons Corner in McLean and Old Town Alexandria. Choose an office to request a consultation, or call.',
    'about': 'A board-certified prosthodontist, 7,000+ full-mouth implants, six surgical suites and an in-house digital lab. Free second opinions, same-day emergencies.',
    'teeth-whitening': 'Professional in-office whitening that lifts internal stains as well as surface ones, in about an hour, with no abrasive step and a shade chosen with you.',
    'patient-center': 'Your first appointment in eight steps, from a welcome and an office tour to the consultation, digital X-rays, examination and cleaning. Sedation available.',
    'financing': 'Cash, check, credit card, most dental PPO plans, and three financing partners, including no-collateral loans up to $60,000 over terms of up to 96 months.',
    'doctor-referral': 'Refer a patient for prosthodontic, implant or full-arch treatment: CBCT planning, guided surgery and an in-house digital lab in one Tysons Corner facility.',
    'dental-implant-faq': 'What an implant is, whether surgery hurts, how long recovery takes, what it costs and how long implants last: twelve questions answered before you book.',
    'crowns-and-bridges': 'A damaged tooth is not automatically a lost one. Porcelain and ceramic crowns and bridges, designed and milled in the practice’s own digital lab.',
}
POST_TITLES = {
    'revolutionizing-dental-restoration-the-top-implant-techniques': 'Top Implant Techniques in Dental Restoration | Dr. Nahlah',
    'ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like': 'What a Full Mouth Implant Procedure Looks Like | Dr. Nahlah',
    'how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile': 'How Implant-Supported Dentures Benefit Your Smile',
    'dental-implants-everything-you-need-to-know': 'Dental Implants: Everything You Need to Know | Dr. Nahlah',
    'are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with': 'Which Dental Implant Procedure Is Right for You?',
    'have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants': 'Missing Several Teeth? Multiple Implants | Dr. Nahlah',
    'want-to-learn-how-to-take-care-of-your-dental-implants-here-is-how': 'How to Take Care of Your Dental Implants | Dr. Nahlah',
    'after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis': 'Signs of Peri-Implantitis After Implants | Dr. Nahlah',
    'considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should': 'Why Choose All-on-4 Dental Implants in McLean, VA',
    'do-i-need-a-full-mouth-dental-implant-consultation': 'Do I Need a Full Mouth Implant Consultation? | Dr. Nahlah',
    'are-there-side-effects-to-dental-implant-procedures': 'Side Effects of Dental Implant Procedures | Dr. Nahlah',
    'ready-to-learn-how-full-mouth-dental-implants-are-cost-effective': 'Are Full Mouth Dental Implants Cost-Effective?',
    'how-many-missing-teeth-can-dental-implants-replace': 'How Many Teeth Can Dental Implants Replace? | Dr. Nahlah',
    'unveiling-the-mystery-of-implant-dentistry-in-mclean-va': 'Implant Dentistry in McLean, VA, Explained | Dr. Nahlah',
    'complete-teeth-replacement-the-perks-of-dental-implants-explained': 'The Perks of Dental Implants, Explained | Dr. Nahlah',
    'should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va': 'From Dentures to All-on-4 Dental Implants | Dr. Nahlah',
    'can-anything-be-done-if-i-am-not-an-immediate-candidate-for-dental-implants': 'Not an Implant Candidate Yet? Your Options | Dr. Nahlah',
    'can-i-upgrade-my-smile-from-traditional-dentures-to-implant-supported-dentures': 'From Dentures to Implant-Supported Dentures | Dr. Nahlah',
    'can-i-have-a-customized-new-smile-with-full-mouth-dental-implants': 'A Custom Smile With Full Mouth Implants | Dr. Nahlah',
    'should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures': 'Sedation for Full Mouth Dental Implants | Dr. Nahlah',
    'porcelain-veneers-the-answers-to-your-questions': 'Porcelain Veneers: Your Questions Answered | Dr. Nahlah',
    'navigating-the-world-of-dental-implant-surgery-in-mclean-va': 'Dental Implant Surgery in McLean, VA | Dr. Nahlah',
    'revolutionize-your-smile-a-journey-through-whole-set-of-teeth-implants': 'A Full Set of Teeth on Implants, Explained | Dr. Nahlah',
    'are-dental-implants-worth-the-cost': 'Are Dental Implants Worth the Cost? | Dr. Nahlah',
    'implant-vs-implant-clearing-the-confusion-on-dental-implants': 'Implant vs Inplant: Clearing the Confusion | Dr. Nahlah',
    'navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth': 'Restoring Your Smile With Dental Implants | Dr. Nahlah',
    'unraveling-the-complexities-complications-in-implant-dentistry': 'Complications in Implant Dentistry | Dr. Nahlah',
    'revolutionize-your-smile-with-dental-implants-in-mclean-va': 'Dental Implants in McLean, VA: A New Smile | Dr. Nahlah',
    'discover-the-promising-world-of-teeth-implants-in-mclean-va': 'The Promise of Teeth Implants in McLean, VA | Dr. Nahlah',
    'integrating-treatment-dental-practices-into-your-dental-implant-procedure': 'Dental Treatment Before Your Implants | Dr. Nahlah',
    'deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va': 'A Guide to Implant Dentistry in McLean, VA | Dr. Nahlah',
    'uncover-the-lifespan-how-long-can-a-dental-implant-last': 'How Long Can a Dental Implant Last? | Dr. Nahlah',
    'uncovering-the-mystery-the-in-depth-guide-to-dental-implants': 'The In-Depth Guide to Dental Implants | Dr. Nahlah',
    'your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution': 'Dental Implants: The Best Tooth Replacement | Dr. Nahlah',
    'unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option': 'The Benefits of Dental Implants | Dr. Nahlah',
    'revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va': 'The Basics of Tooth Implants in McLean, VA | Dr. Nahlah',
    'longevity-of-dental-implants-causes-and-fixes-for-damages': 'Dental Implant Damage: Causes and Fixes | Dr. Nahlah',
    'are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va': 'Why Replace Missing Teeth With Implants? | Dr. Nahlah',
    'exploring-your-options-for-replacing-a-missing-tooth-the-advantage-of-dental-implants': 'Replacing a Missing Tooth: Why Implants Win | Dr. Nahlah',
    'navigating-the-world-of-dental-implants-an-experts-guide': 'Dental Implants: An Expert’s Guide | Dr. Nahlah',
    'discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va': 'Snap-On Dentures in McLean, VA | Dr. Nahlah',
    'exploring-the-world-of-dental-implants-placements-in-mclean-va': 'Dental Implant Placement in McLean, VA | Dr. Nahlah',
}
POST_DESCS = {
    'considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should': 'The benefits of All-on-4 dental implants in McLean, VA. Trust Dr. Esam Nahlah at Dental Group of Tysons for a custom-made, durable smile.',
    'ready-to-learn-how-full-mouth-dental-implants-are-cost-effective': 'The benefits of implant dentistry: enhance your appearance and chew with confidence again with tooth implant solutions. Book a consultation today!',
    'should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va': 'Upgrade from traditional dentures to All-on-4 dental implants in McLean, VA. Contact Dr. Esam Nahlah at Dental Group of Tysons for an appointment.',
}
OG_ADD = {
    'five-year-warranty': {
        'title': 'Five-Year Implant Warranty | Dr. Nahlah | McLean, VA',
        'description': 'Any implant, cosmetic or All-on-4 part that fails within five years is replaced free of charge, as long as you keep a cleaning every six months.',
    },
    'hipaa-disclosure': {
        'title': 'HIPAA Disclosure | Dr. Nahlah Implants & Prosthodontics',
        'description': 'Notice of Privacy Practices for the McLean and Alexandria offices: how your health information may be used and shared, and your rights under HIPAA.',
    },
    'our-team': {
        'title': 'Meet the Team | Dr. Nahlah Prosthodontics | McLean, VA',
        'description': 'The five people behind the treatment: office manager, digital lab designer, treatment coordinator, dental assistant and hygienist, across both Virginia offices.',
    },
}

rules, bad = [], []
for s, t in PAGE_TITLES.items():
    old = pages[s]['title']
    if len(t) > 60: bad.append(f'page title {s} {len(t)}')
    rules.append({'from': old, 'to': t, 'note': f'title /{s} ({len(old)} -> {len(t)})'})
for s, d in PAGE_DESCS.items():
    old = pages[s]['desc']
    if not 50 <= len(d) <= 160: bad.append(f'page desc {s} {len(d)}')
    rules.append({'from': old, 'to': d, 'note': f'description /{s} ({len(old)} -> {len(d)})'})
SAME_AS_HEADLINE = []
for s, t in POST_TITLES.items():
    old = posts[s]['seoTitle']
    if len(t) > 60: bad.append(f'post title {s} {len(t)}')
    if old == posts[s]['title']:
        # the SEO title IS the headline: change only the seoTitle field and seo-head's "t", never the H1/og/schema headline
        SAME_AS_HEADLINE.append(s)
        rules.append({'from': old, 'to': t, 'note': f'seoTitle /posts/{s[:40]} ({len(old)} -> {len(t)})', 'onlySeoTitle': True})
        rules.append({'from': '"t":' + json.dumps(old, ensure_ascii=False), 'to': '"t":' + json.dumps(t, ensure_ascii=False), 'note': f'seo-head t /posts/{s[:40]}', 'onlyAsset': True})
        continue
    rules.append({'from': old, 'to': t, 'note': f'title /posts/{s[:40]} ({len(old)} -> {len(t)})'})
for s, d in POST_DESCS.items():
    old = posts[s]['desc']
    if not 50 <= len(d) <= 160: bad.append(f'post desc {s} {len(d)}')
    rules.append({'from': old, 'to': d, 'note': f'description /posts/{s[:40]} ({len(old)} -> {len(d)})'})
for s, o in OG_ADD.items():
    if len(o['title']) > 60 or len(o['description']) > 160: bad.append(f'og {s}')
rules.append({'from': 'Each answers its own enquiries', 'to': 'Each answers its own inquiries', 'note': 'US spelling: enquiries', 'optional': True})
long_posts = [s for s, v in posts.items() if len(v['seoTitle']) > 60 and s not in POST_TITLES]
if long_posts: bad.append(f'posts still over 60: {long_posts}')
if bad:
    print('\n'.join(bad)); sys.exit(1)

js = ['/**', ' * copy-fixes-qa-2.mjs — QA 2026-09-28 C04: titles over 60 characters, descriptions over 160,',
      ' * and the pages that fell back to the home page\'s description. GENERATED by gen_map2.py from the',
      ' * live values of 2026-10-02 (each FROM is the full current string). H1 headlines are not touched:',
      ' * only the <title>/og/description strings change.', ' */',
      'const RAW = ' + json.dumps(rules, ensure_ascii=False, indent=1),
      "export const RULES = RAW.map(({ onlySeoTitle, onlyAsset, ...r }) => onlySeoTitle ? { ...r, only: (s, w, k) => s === 'post' && k === 'seoTitle' } : onlyAsset ? { ...r, only: (s) => s === 'asset' } : r)",
      'export const OG_ADD = ' + json.dumps(OG_ADD, ensure_ascii=False, indent=1), '']
open(sys.argv[3], 'w', encoding='utf-8', newline='\n').write('\n'.join(js))
print(f'{len(rules)} rules written')
