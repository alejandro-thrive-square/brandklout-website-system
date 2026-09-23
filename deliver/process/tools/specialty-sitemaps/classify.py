import json,re,collections
from urllib.parse import urlparse
SP=__file__.rsplit('/',1)[0] if '/' in __file__ else '.'
sm=json.load(open(SP+'/sitemaps.json')); nc=json.load(open(SP+'/navcrawl.json'))
sites={}
for d,u in sm.items():
    if u: sites[d]=[urlparse(re.sub(r'<!\[CDATA\[|\]\]>','',x)).path.rstrip('/') or '/' for x in u]
for d,v in nc.items(): sites[d]=v['pages']
GROUP={'general':['arvadadentalcenter.com','grandmissiondentistry.com','legacydentalpasadena.com','livewelldentalva.com','marveldentaldds.com','masonparkdental.com'],
 'implant':['drnahlah.com','westlaimplants.com','arvadadentalimplants.com','ifadentistry.com'],
 'oms':['stonedentalimplantcenter.com','stonesurgicalarts.com'],
 'pediatric':['masonparkpediatricdental.com'],'medspa':['westlaketxmedspa.com']}
RULES=[ # (type, regex on path)
 ('Home',r'^/$'),('About',r'^/about(-us|-our-practice)?$|/about$'),('Meet the Doctor',r'meet-(the-)?dr|meet-the-doctor|/dr-|about-dr|our-doctors|/team/dr|about-anna|meet-our-doctors'),
 ('Team',r'(our|meet)-?(the-)?team|/team$'),('Office Tour / Facility',r'office(-tour)?|facility|our-office'),('Technology',r'technology|3d-imaging|cerec|robotic'),
 ('Careers',r'careers'),('Contact',r'contact'),('Book / Appointment',r'appointment|/book$|virtual-(consult|appointment)'),
 ('New Patients / First Visit',r'new-patient|first-visit|your-first-visit'),('Insurance & Financing',r'financ|insurance|payment'),('Membership / Savings Plan',r'membership|saving-plan|savings-plan'),
 ('Patient Forms',r'forms'),('Pre/Post-Op Instructions',r'pre-op|post-op|instructions'),('FAQ',r'faq'),('Special Offers',r'special-offers|offer'),
 ('Smile Gallery / Before-After',r'gallery|before-after|before-and-after|results'),('Testimonials / Reviews',r'testimonial|patient-stories|review'),
 ('Blog',r'^/(blog|posts|post|about-our-practice-articles)$|blogs-news'),('Services Hub',r'^/(our-)?services$|^/dental-services$|^/treatments$'),
 ('Referrals',r'referr|refer-a|doctor-referral|patient-referrals'),('Emergency',r'emergenc'),('Dental Implants',r'implant'),('All-on-X / Full Arch',r'all-on|full-mouth|full-arch|teeth-in-one|new-smile-in-one|same-day-implant'),
 ('Dentures',r'denture'),('Bone Grafting / Sinus Lift',r'bone-graft|sinus'),('Cosmetic Dentistry',r'cosmetic'),('Veneers',r'veneer|lumineer'),
 ('Teeth Whitening',r'whiten'),('Invisalign / Orthodontics',r'invisalign|aligner|braces|orthodont'),('Smile Makeover',r'makeover'),
 ('General / Preventive',r'general-dentistry|prevent|cleaning|exam|hygiene'),('Restorative',r'restorative|crown|bridge|filling|root-canal|inlay'),
 ('Oral Surgery / Extractions',r'oral-surgery|extraction|wisdom'),('Sedation',r'sedation|nitrous'),('Periodontics / Gum',r'gum|perio|scaling|lanap'),
 ('TMJ / Sleep Apnea',r'tmj|sleep-apn'),('Jaw / Facial Surgery',r'jaw|maxillofacial|orthognathic|facial-trauma|pathology'),('Facial Cosmetic Surgery',r'blepharo|rhinoplast|neck-lift|face-and-neck|liposuction|facial-implant|chin'),
 ('Injectables / Skin',r'botox|filler|peel|laser-resurfacing|morpheus|skin|acne'),('Weight Loss',r'weight|glp|lipotropic'),('Pediatric',r'pediatric|children|kids|sealant|fluoride'),
 ('Location Pages',r'^/(areas-we-serve/|[a-z-]+-dentist(/|$)|burke/|mantua/|contact-(alexandria|maclean))|dentist-northwest'),('Spanish Version',r'^/es-'),
 ('Legal',r'privacy|terms|cookie|accessibility|sms-terms'),
]
def classify_all(p):
    return [t for t,r in RULES if re.search(r,p)]
def classify(p):
    a=classify_all(p); return a[0] if a else None
def is_post(p):
    s=p.strip('/').split('/')[-1]; return len(s.split('-'))>=6 and not re.search(r'^(dental-services|services|our-services)',p.strip('/'))
res={}
for g,doms in GROUP.items():
    cov=collections.defaultdict(set)
    for d in doms:
        for p in sites.get(d,[]):
            if p.startswith('/es-') and p!='/es-mx': continue
            if is_post(p) and classify(p) not in ('Location Pages',): continue
            for t in classify_all(p): cov[t].add(d)
    res[g]={t:len(v) for t,v in sorted(cov.items(),key=lambda x:-len(x[1]))}
    print(f'\n== {g} ({len(doms)} sites)'); print('  '+', '.join(f'{t} {n}/{len(doms)}' for t,n in res[g].items()))
json.dump(res,open(SP+'/coverage.json','w'),indent=1)
