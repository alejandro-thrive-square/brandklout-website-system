"""Fetch sample client pages per page type and write their section outlines.

For every specialty group and page type, pick up to three sites that publish that
type, fetch one page each, and record the headings (h1-h3) in document order with
markers for the components that define a section: forms, FAQs, galleries, reviews,
maps, video, sliders. Header, nav and footer are stripped first.

    python outline-pages.py            -> outlines.json + outlines.txt in this folder
"""
import json, os, re, sys, urllib.request, html as H
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'}

GROUP = {
    'general': ['arvadadentalcenter.com', 'grandmissiondentistry.com', 'legacydentalpasadena.com', 'livewelldentalva.com', 'marveldentaldds.com', 'masonparkdental.com'],
    'implant': ['drnahlah.com', 'westlaimplants.com', 'arvadadentalimplants.com', 'ifadentistry.com'],
    'oms': ['stonedentalimplantcenter.com', 'stonesurgicalarts.com'],
    'pediatric': ['masonparkpediatricdental.com'],
    'medspa': ['westlaketxmedspa.com'],
}
HOSTS = {'stonesurgicalarts.com': 'dfwsurgicalarts.com', 'ifadentistry.com': 'www.ifadentistry.com', 'masonparkdental.com': 'www.masonparkdental.com'}

# page type -> regex on the path; first site page that matches is the sample
TYPES = [
    ('Home', r'^/$'),
    ('About', r'^/about(-us|-our-practice)?$'),
    ('Meet the Doctor', r'meet-(the-)?dr|meet-the-doctor|^/dr-|about-dr|/team/dr|about-anna|meet-our-doctors|our-doctors'),
    ('Team', r'(our|meet)-?(the-)?team$|^/team$'),
    ('Office Tour', r'office-tour|our-office|facility'),
    ('Technology', r'technology$'),
    ('Services Hub', r'^/(our-)?services$|^/dental-services$|^/treatments$|^/procedures$'),
    ('Service Category', r'^/(our-)?services/(cosmetic-dentistry|general-dentistry|restorative-dentistry|implant-dentistry)$|^/cosmetic-dentistry(-[a-z-]+)?$'),
    ('Dental Implants', r'^/(services/|dental-services-)?dental-implants?$|^/dental-implants$|services/dental-implant$|implant-dentistry$'),
    ('All-on-X', r'all-on-(x|4)(-dental)?(-implants)?$'),
    ('Invisalign', r'(services/|/)invisalign$|clear-aligners$'),
    ('Veneers', r'veneers?(-and-lumineers)?$|porcelain-dental-veneers$|dental-services-dental-veneers$'),
    ('Emergency', r'emergency-(dentistry|dentist|dental|pediatric-dentistry)$|dental-emergency$'),
    ('Sedation', r'sedation(-dentistry)?$'),
    ('Wisdom Teeth', r'wisdom-teeth(-removal)?$'),
    ('Jaw Surgery', r'jaw-surgery$|orthognathic'),
    ('Botox', r'/botox$'),
    ('New Patients', r'new-patients?(/first-visit-new-exam)?$|first-visit(-new-exam)?$|your-first-visit$'),
    ('Insurance & Financing', r'insurance-financing$|^/financ(e|ing)$|financing-[a-z-]+$|payment-options$'),
    ('Membership', r'saving-plan$|savings-plan$|membership$'),
    ('FAQ', r'^/faq(-page)?$|dental-implant-faq$'),
    ('Implant Cost', r'implant-costs?$|cost-of-dental-implants$'),
    ('Smile Gallery', r'smile-gallery$|before-after$|before-and-afters$|^/gallery$|^/results$'),
    ('Reviews', r'testimonials$|review-testimonials$|patient-stories$|patient-testimonials$'),
    ('Location Page', r'^/[a-z-]+-dentist$|^/burke/|^/mantua/|^/dentist-northwest'),
    ('Location Service', r'^/[a-z-]+-dentist/[a-z-]+$|^/mantua/[a-z-]+$'),
    ('Referring Doctors', r'referr'),
    ('Pre/Post-Op', r'pre-op|post-op'),
    ('Patient Forms', r'patient-forms$'),
    ('Blog', r'^/(blog|posts)$'),
    ('Special Offers', r'special-offers$'),
    ('Contact', r'^/contact(-us|s)?$'),
    ('Book', r'^/book$|^/appointment$|virtual-appointment'),
    ('Careers', r'careers$'),
]


def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25)
        return r.read().decode('utf-8', 'replace')
    except Exception:
        return ''


def outline(page):
    page = re.sub(r'(?is)<(script|style|noscript|svg|template)\b.*?</\1>', ' ', page)
    page = re.sub(r'(?is)<header\b.*?</header>|<nav\b.*?</nav>|<footer\b.*?</footer>', ' ', page)
    items = []
    pat = re.compile(r'(?is)<(h[1-3])\b[^>]*>(.*?)</\1>|<(form)\b|<iframe\b[^>]*src=["\']([^"\']+)|class=["\']([^"\']*(faq|accordion|gallery|before-after|testimonial|review|swiper|slider|splide|map|video|stat|counter|timeline|step|pricing)[^"\']*)["\']')
    last = None
    for m in pat.finditer(page):
        if m.group(1):
            t = H.unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))
            t = re.sub(r'\s+', ' ', t).strip()
            if t:
                items.append(f"{m.group(1).upper()} {t[:70]}")
        elif m.group(3):
            items.append('[form]')
        elif m.group(4):
            items.append('[iframe ' + (urlparse(m.group(4)).netloc or 'inline') + ']')
        elif m.group(6):
            tag = f"[{m.group(6).lower()}]"
            if tag != last:
                items.append(tag)
        last = items[-1] if items else None
    # collapse consecutive duplicates
    out = []
    for i in items:
        if not out or out[-1] != i:
            out.append(i)
    return out[:40]


def main():
    sm = json.load(open(os.path.join(HERE, 'sitemaps.json')))
    nc = json.load(open(os.path.join(HERE, 'navcrawl.json')))
    pages = {}
    for d, u in sm.items():
        if u:
            pages[d] = sorted({urlparse(re.sub(r'<!\[CDATA\[|\]\]>', '', x).strip()).path.rstrip('/') or '/' for x in u})
    for d, v in nc.items():
        pages[d] = v['pages']
    result = {}
    for g, doms in GROUP.items():
        for t, rx in TYPES:
            picks = []
            for d in doms:
                hit = next((p for p in pages.get(d, []) if not p.startswith('/es-') and re.search(rx, p)), None)
                if hit:
                    picks.append((d, hit))
                if len(picks) == 3:
                    break
            for d, p in picks:
                host = HOSTS.get(d, d)
                body = get(f'https://{host}{p}')
                if body:
                    result.setdefault(g, {}).setdefault(t, []).append({'url': f'{host}{p}', 'outline': outline(body)})
            print(g, t, len(picks), file=sys.stderr)
    json.dump(result, open(os.path.join(HERE, 'outlines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(HERE, 'outlines.txt'), 'w', encoding='utf-8') as f:
        for g, types in result.items():
            for t, samples in types.items():
                f.write(f'\n##### {g} / {t}\n')
                for s in samples:
                    f.write(f"-- {s['url']}\n   " + ' | '.join(s['outline']) + '\n')


if __name__ == '__main__':
    main()
